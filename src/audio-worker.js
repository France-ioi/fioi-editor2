/*
  This file is based on https://github.com/Khan/MultiRecorderJS,
  itself based on https://github.com/mattdiamond/Recorderjs

  This is the Web Worker that processes messages from audio.js.
  This worker is responsible for building up buffers from an audio stream,
  turning those into WAV file URLs when requested.
  This worker can also paste together multiple WAV files (identified by their
  URL) and return a new WAV file URL.
  This work is done inside a worker to avoid blocking the main browser loop
  during encoding.

*/

// List of chunks for the current recording. Each chunk is a Float32Array.
var chunksL = [];
var chunksR = [];

// Configured sample rate, stored in the WAV files produced.
var recordingSampleRate;

// Map each WAV file URL to its samples, in order to assemble a new file
// from multiple recordings.
var recordings = {};

this.onmessage = function(e) {
  switch (e.data.command) {
    case "init":
      init(e.data.config);
      break;
    case "record":
      record(e.data.buffer);
      break;
    case "finishRecording":
      var url = finishRecording();
      sendMessage(e, {url: url});
      break;
    case "combineRecordings":
      var result = combineRecordings(e.data.recordings);
      sendMessage(e, result);
      break;
    case "getRecording":
      var recording = recordings[e.data.recording];
      sendMessage(e, recording && recording.wav);
      break;
    case "clearRecordings":
      clearRecordings();
      sendMessage(e, {});
      break;
  }
};

function init (config) {
  recordingSampleRate = config.sampleRate;
}

// Add a chunk to the current recording.
function record (input) {
  chunksL.push(input[0]);
  chunksR.push(input[1]);
}

function clearRecordings () {
  for (var url in recordings) {
    var recording = recordings[url];
    if ('url' in recording)
      URL.revokeObjectURL(recording.url);
  }
  recordings = {};
}

function finishRecording () {
    var samplesL = combineChunks(chunksL);
    chunksL = [];
    var samplesR = combineChunks(chunksR);
    chunksR = [];
    var channels = [samplesL, samplesR];
    var encodingOptions = {numChannels: 1, sampleSize: 1, sampleRate: recordingSampleRate};
    var wav = encodeWav(channels, encodingOptions);
    var url = URL.createObjectURL(wav);
    recordings[url] = {wav: wav, url: url, channels: channels};
    return url;
}

function combineRecordings (urls) {
  // Combine the interleaved samples from the listed recordings.
  var chunksL = [], chunksR = [];
  for (var i = 0; i < urls.length; i += 1) {
    var url = urls[i];
    if (url in recordings) {
      var recording = recordings[url];
      chunksL.push(recording.channels[0]);
      chunksR.push(recording.channels[1]);
    }
  }
  var samplesL = combineChunks(chunksL);
  var samplesR = combineChunks(chunksR);
  var channels = [samplesL, samplesR];
  var encodingOptions = {numChannels: 1, sampleSize: 1, sampleRate: recordingSampleRate};
  var wav = encodeWav(channels, encodingOptions);
  return {wav: wav, encoding: encodingOptions};
}

function averageSamples (channels) {
  var samplesL = channels[0];
  var samplesR = channels[1];
  if (samplesL.length != samplesR.length)
    throw "cannot average samples of different length";
  var inputLength = samplesL.length;
  var result = new Float32Array(inputLength);
  var index = 0;
  var inputIndex = 0;
  while (inputIndex < inputLength) {
    result[index++] = (samplesL[inputIndex] + samplesR[inputIndex]) / 2;
    inputIndex++;
  }
  return result;
}

function interleaveSamples (channels) {
  var samplesL = channels[0];
  var samplesR = channels[1];
  if (samplesL.length != samplesR.length)
    throw "cannot interleave samples of different length";
  var inputLength = samplesL.length;
  var result = new Float32Array(inputLength * 2);
  var index = 0;
  var inputIndex = 0;
  while (inputIndex < inputLength) {
    result[index++] = samplesL[inputIndex];
    result[index++] = samplesR[inputIndex];
    inputIndex++;
  }
  return result;
}

function combineChunks (chunks) {
  var totalLength = 0;
  for (var i = 0; i < chunks.length; i++)
    totalLength += chunks[i].length;
  var result = new Float32Array(totalLength);
  var offset = 0;
  for (i = 0; i < chunks.length; i++) {
    result.set(chunks[i], offset);
    offset += chunks[i].length;
  }
  return result;
}

function sendMessage (e, result) {
  this.postMessage({callbackId: e.data.callbackId, result: result});
}

function floatTo16BitPCM (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 2) {
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function floatTo8BitPCM (output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 1) {
    var s = (Math.max(-1, Math.min(1, input[i])) + 1.0) / 2;
    output.setInt8(offset, s * 0xFF, true);
  }
}

function writeString (view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function FIR (coeffs) {
  this.coeffs = coeffs;
  this.nCoeffs = coeffs.length;
  this.registers = new Float32Array(this.nCoeffs);
  this.iTopReg = this.nCoeffs - 1;
}
FIR.prototype.sampleIn = function (sample) {
  var i = this.iTopReg;
  i += 1;
  if (i >= this.nCoeffs)
    i = 0;
  this.registers[i] = sample;
  this.iTopReg = i;
};
FIR.prototype.sampleOut = function () {
  var sample = 0.0, iCoeff = 0;
  for (var iReg = this.iTopReg; iReg >= 0; iReg--)
    sample += this.coeffs[iCoeff++] * this.registers[iReg];
  for (iReg = this.nCoeffs - 1; iReg > this.iTopReg; iReg--)
    sample += this.coeffs[iCoeff++] * this.registers[iReg];
  return sample;
};

var FIR_48k_8k = [0.028593547515597933, 0.03670747252586807, -0.003425102001388845, -0.05953402135953233, -0.060917024563134026, 0.03697894250548, 0.19858060022396978, 0.32301558515313944, 0.32301558515313944, 0.19858060022396978, 0.03697894250548, -0.060917024563134026, -0.05953402135953233, -0.003425102001388845, 0.03670747252586807, 0.028593547515597933];
var FIR_48k_16k = [0.025988926951079665, -0.013257585857849584, -0.01828825082150171, 0.04308749505022258, -0.03213590725580088, -0.02054974978239911, 0.08284966957828693, -0.09349946285437129, -0.02176391714488415, 0.5475687821372176, 0.5475687821372176, -0.02176391714488415, -0.09349946285437129, 0.08284966957828693, -0.02054974978239911, -0.03213590725580088, 0.04308749505022258, -0.01828825082150171, -0.013257585857849584, 0.025988926951079665];

function downsample6x (samples) {
  return downsample(samples, new FIR(FIR_48k_8k), 6);
}

function downsample3x (samples) {
  return downsample(samples, new FIR(FIR_48k_16k), 3);
}

function downsample (samples, fir, stride) {
  var nTaps = FIR_48k_8k.length;
  var iSampleIn = 0;
  for (var i = 0; i < nTaps * 2; i++)
    fir.sampleIn(samples[iSampleIn++]);
  var iSampleOut = 0;
  var samplesOut = new Float32Array(samples.length / stride);
  var nth = 0;
  while (iSampleIn < samples.length) {
    if (nth === 0)
      samplesOut[iSampleOut++] = fir.sampleOut();
    if (++nth == stride) nth = 0;
    fir.sampleIn(samples[iSampleIn++]);
  }
  while (iSampleOut < samplesOut.length) {
    samplesOut[iSampleOut++] = fir.sampleOut();
    fir.sampleIn(0);
  }
  return samplesOut;
}

function encodeWav (channels, options) {
  var samples = options.numChannels == 2 ? interleaveSamples(channels) : averageSamples(channels);

  // 48ksps => downsample to 8ksps and output 16-bit samples
  if (recordingSampleRate == 48000) {
    samples = downsample6x(samples);
    options.sampleRate = 8000;
    options.sampleSize = 2;
  }

  var blockAlignment = options.numChannels * options.sampleSize;
  var dataByteCount = samples.length * blockAlignment;
  var buffer = new ArrayBuffer(44 + dataByteCount);
  var view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, "RIFF");
  /* file length */
  view.setUint32(4, buffer.byteLength - 8, true);

  /* RIFF type */
  writeString(view, 8, "WAVE");
  /* format chunk identifier */
  writeString(view, 12, "fmt ");
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count (mono) */
  view.setUint16(22, options.numChannels, true);
  /* sample rate */
  view.setUint32(24, options.sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, options.sampleRate * blockAlignment, true);
  /* block alignment */
  view.setUint16(32, blockAlignment, true);
  /* bits per sample */
  view.setUint16(34, options.sampleSize * 8, true);
  /* data chunk identifier */
  writeString(view, 36, "data");
  /* data chunk length */
  view.setUint32(40, dataByteCount, true);

  switch (options.sampleSize) {
    case 1: floatTo8BitPCM(view, 44, samples); break;
    case 2: floatTo16BitPCM(view, 44, samples); break;
  }

  return new Blob([buffer], {type: "audio/wav"});
}
