module.exports = function (m) {
'use strict';

m.factory('FioiEditor2Recorder', RecorderFactory);
RecorderFactory.$inject = ['$q', '$interval', '$sce', 'FioiEditor2Audio'];
function RecorderFactory ($q, $interval, $sce, audio) {
   var service = {};
   var state = {
      options: null, // object with the dumpState() and loadState(state) functions.
      isRecording: false, // Is recording in progress?
      isPaused: false,  // Is recording paused?
      segments: undefined, // Array of previously recorded segments.
      events: undefined, // Array of events recorded as part of the current segment.
      startTime: undefined, // Clock time of the start of recording (adjusted to pretend all segments were recorded with no pauses).
      timeOffset: undefined, // Timestamp (relative time in ms) of the start of the segment currently being recorded.
      currentFrameTime: undefined, // Timestamp (relative time in ms) of the current frame.
      lastEventTime: undefined // Timestamp (relative time in ms) of the last recorded event.
   };

   // Start a new recording.
   service.record = function (options) {
      return $q(function (resolve, reject) {
         if (state.isRecording)
            return reject('an operation is already in progress');
         audio.clearRecordings();
         audio.prepareRecording(function (err, stream) {
            if (err)
               return reject(err);
            state.audioStream = stream;
            afterAudio();
         });
         function afterAudio () {
            state.isPaused = false;
            state.options = options;
            state.isRecording = true;
            state.timeOffset = 0;
            state.startTime = Date.now();
            state.lastEventTime = 0;
            state.events = [[0, '', '0', state.options.dumpState()]];
            state.segments = [];
            if (state.audioStream) {
               audio.startRecording(state.audioStream).then(resolve, reject);
            } else {
               resolve({});
            }
         }
      });
   };

   // Pause recording, completing a segment.
   service.pause = function () {
      return $q(function (resolve, reject) {
         if (!state.isRecording)
            reject('no operation to pause');
         if (state.isPaused)
            return reject('not paused');
         // Add a null event at the end of the stream to avoid stopping the
         // sound track prematurely.
         service.addEvent(['', '']);
         var duration = Date.now() - state.startTime;
         var segment = {
            duration: duration,
            events: state.events
         };
         state.events = undefined;
         state.timeOffset += duration;
         state.startTime = undefined;
         state.isPaused = true;
         if (!state.audioStream)
            return afterAudio();
         audio.stopRecording().then(function (result) {
            segment.audioUrl = result.url;
            segment.safeAudioUrl = $sce.trustAsResourceUrl(result.url);
            afterAudio();
         }, function (err) {
            // TODO: reload the initial state of the dropped segment.
            reject(err);
         });
         function afterAudio () {
            state.segments.push(segment);
            resolve(segment);
         }
      });
   };

   // Resume recording, starting a new segment.
   service.resume = function () {
      return $q(function (resolve, reject) {
         if (!state.isRecording)
            reject('not recording');
         if (!state.isPaused)
            reject('not paused');
         state.isPaused = false;
         state.startTime = Date.now();
         state.events = [[0, '', '0', state.options.dumpState()]];
         if (state.audioStream) {
            audio.startRecording(state.audioStream).then(resolve, reject);
         } else {
            resolve();
         }
      });
   };

   // Stop recording.  Segments are joined and the returned promise is resolved
   // with the completed recording.
   service.stop = function (encodingOptions) {
      return $q(function (resolve, reject) {
         if (!state.isRecording)
            reject('not recording');
         // TODO: set a 'isStopping' flag so that recording cannot be resumed
         // while we are asynchronously waiting on audio operations.
         if (!state.isPaused) {
            return service.pause().then(function () {
               afterPaused();
            }, function (err) {
               reject(err);
            });
         } else {
            return afterPaused();
         }
         function afterPaused () {
            // TODO: build an object that contains all the recorded
            // state and audio samples, with a method to complete the
            // recording while adjusting the audio encoding options.
            // Combine the segments.
            var duration = 0;
            var events = [];
            var audioUrls = [];
            _.each(state.segments, function (segment) {
               duration += segment.duration;
               Array.prototype.push.apply(events, segment.events);
               audioUrls.push(segment.audioUrl);
            });
            var result = {
               duration:  duration,
               events: events
            };
            if (state.audioStream) {
               audio.combineRecordings(audioUrls, encodingOptions).then(afterCombineRecordings, reject);
            } else {
               afterCombineRecordings();
            }
            function afterCombineRecordings (combinedAudio) {
               if (combinedAudio) {
                  var audioUrl = URL.createObjectURL(combinedAudio.wav);
                  result.audioBlob = combinedAudio.wav;
                  result.audioEncoding = combinedAudio.encoding;
                  result.audioUrl = audioUrl;
                  result.safeAudioUrl = $sce.trustAsResourceUrl(audioUrl);
               }
               // Clear the recorder state.
               audio.clearRecordings();
               state.isRecording = false;
               state.isPaused = false;
               state.segments = undefined;
               state.options = null;
               resolve(result);
            }
         }
      });
   };

   service.addEvent = function (event) {
      if (!state.isRecording)
         return;

      // Use the same timestamp for all recorded events until the next repaint.
      if (typeof state.currentFrameTime !== 'number') {
         state.currentFrameTime = Math.floor(Date.now() - state.startTime);
         window.requestAnimationFrame(function () {
            state.currentFrameTime = undefined;
         });
      }

      var delta = state.currentFrameTime - state.lastEventTime;
      state.lastEventTime = state.currentFrameTime;
      event.unshift(delta);
      state.events.push(event);
   };

   return service;
}

};
