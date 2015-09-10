'use strict';
module.exports = function (m) {

m.factory('FioiEditor2Audio', AudioFactory);
AudioFactory.$inject = ['FioiEditor2Config', '$location', '$rootScope', '$q'];
function AudioFactory (config, $location, $rootScope, $q) {

   var service = {
      error: null
   };
   var workerPath = config.rootUri + "/audio-worker.min.js";
   var state = {
      nextCallbackId: 1,
      source: null,
      recording: false
   };

   var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

   // Call prepareRecording to ensure that the page has obtained permission
   // to record audio from the user.  The user can delay replying indefinitely.
   service.prepareRecording = function (callback) {
      if (service.error)
         return callback(service.error);
      getUserMedia.call(navigator, {audio: true}, function (stream) {
         return callback(null, stream);
      }, function (err) {
         return callback("getUserMedia error: " + err);
      });
   };

   service.isRecording = function () {
      return state.recording;
   };

   // Start recording.  The stream argument must be obtained by calling
   // prepareRecording.
   service.startRecording = function (stream) {

      var audioContext = new AudioContext();
      var source = state.source = audioContext.createMediaStreamSource(stream);

      // Create a worker to hold and process the audio buffers.
      // The worker is reused across calls to startRecording.
      var worker = state.worker;
      if (!worker) {
         worker = state.worker = new Worker(workerPath);
         worker.onmessage = function (e) {
            var callbackId = e.data.callbackId;
            $rootScope.$emit(callbackId, e.data.result);
         };
         worker.postMessage({
            command: "init",
            config: {
               sampleRate: source.context.sampleRate
            }
         });
      }

      // Process the audio samples using a script function.
      var node = state.node = source.context.createScriptProcessor(4096, 2, 2);
      node.onaudioprocess = function (event) {
         // Discard samples unless recording.
         if (!state.recording)
            return;
         // Pass the buffer on to the worker.
         state.worker.postMessage({
            command: "record",
            buffer: [
               event.inputBuffer.getChannelData(0),
               event.inputBuffer.getChannelData(1)
            ]
         });
      };

      source.connect(node);
      node.connect(audioContext.destination);

      state.recording = true;
   };

   // Stop recording.  Returns a promise which will resolve to the
   // recording result.
   service.stopRecording = function () {
      return $q(function (resolve, reject) {
         state.recording = false;
         state.node.disconnect();
         state.node = null;
         state.source.disconnect();
         state.source = null;
         state.worker.postMessage({
            command: "finishRecording",
            callbackId: eventizeCallback(resolve)
         });
      });
   };

   service.combineRecordings = function (urls) {
      return $q(function (resolve, reject) {
         if (urls.length == 1)
            return resolve(urls[0]);
         state.worker.postMessage({
            command: "combineRecordings",
            recordings: urls,
            callbackId: eventizeCallback(resolve)
         });
      });
   };

   service.getPlayer = function (url) {
      var element = new Audio();
      element.src = url;
      return element;
   };

   service.clearRecordings = function () {
      return $q(function (resolve, reject) {
         state.worker.postMessage({
            command: "clearRecordings",
            callbackId: eventizeCallback(resolve)
         });
      });
   };

   service.getRecording = function (url) {
      return $q(function (resolve, reject) {
         state.worker.postMessage({
            command: "getRecording",
            recording: url,
            callbackId: eventizeCallback(resolve)
         });
      });
   };

   function eventizeCallback (callback) {
      var name = 'fioi-editor2_audio-callback_' + state.nextCallbackId;
      state.nextCallbackId += 1;
      var deregister = $rootScope.$on(name, function (event, arg) {
         deregister();
         callback(arg);
      });
      return name;
   }

   function brokenService (err) {
      service.error = err;
      return service;
   }

   // Feature checking

   if (!getUserMedia || !window.AudioContext){
      return brokenService('Audio recording is not supported by this browser');
   }

   if (!window.Worker) {
      return brokenService('Audio recording requires Web Worker support');
   }

   var proto = $location.protocol();
   if (proto === 'file') {
      // getUserMedia calls neither of its callbacks on Chrome when the code
      // is loaded from a file:// URL.
      return brokenService('Audio recording is not available on local URLs');
   }
   if (proto === 'http') {
      // getUserMedia is deprecated on insecure transports.
      console.log('Audio recording is deprecated on insecure transports');
   }

   return service;
}

};