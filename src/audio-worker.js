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
var sampleRate;

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
      var url = combineRecordings(e.data.recordings);
      sendMessage(e, {url: url});
      break;
    case "clearRecordings":
      clearAll();
      break;
  }
};

function init (config) {
  sampleRate = config.sampleRate;
}

// Add a chunk to the current recording.
function record (input) {
  chunksL.push(input[0]);
  chunksR.push(input[1]);
}

function clearRecordings () {
  for (var url in recordings) {
    var recording = recordings[url];
    if ('wav' in recording)
      URL.revokeObjectURL(recording.wav);
  }
  recordings = {};
}

function finishRecording () {
    var samplesL = combineChunks(chunksL);
    chunksL = [];
    var samplesR = combineChunks(chunksR);
    chunksR = [];
    var samples = interleaveSamples(samplesL, samplesR);
    var wav = buildStereoWavBlob(samples);
    var url = URL.createObjectURL(wav);
    recordings[url] = {wav: wav, samples: samples};
    return url;
}

function combineRecordings (urls) {
  // Combine the interleaved samples from the listed recordings.
  var chunks = [];
  for (var i = 0; i < urls.length; i += 1) {
    var url = urls[i];
    console.log('fragment', url);
    if (url in recordings) {
      var recording = recordings[url];
      console.log('found', recording.samples.length, 'samples');
      chunks.push(recording.samples);
    } else {
      console.log('not found');
    }
  }
  var samples = combineChunks(chunks);
  var wav = buildStereoWavBlob(samples);
  var url = URL.createObjectURL(wav);
  // Add the wav to recordings, so that it can be cleaned up by clearAll.
  recordings[url] = {wav: wav};
  return url;
}

function interleaveSamples (samplesL, samplesR) {
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

function writeString (view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function buildStereoWavBlob (samples) {
  var buffer = new ArrayBuffer(44 + samples.length * 2);
  var view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, "RIFF");
  /* file length */
  view.setUint32(4, 32 + samples.length * 2, true);

  /* RIFF type */
  writeString(view, 8, "WAVE");
  /* format chunk identifier */
  writeString(view, 12, "fmt ");
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 2, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 4, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, "data");

  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return new Blob([buffer], {type: "audio/wav"});
}
