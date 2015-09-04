'use strict';
module.exports = function (m) {

m.factory('FioiEditor2Recorder', RecorderFactory);
RecorderFactory.$inject = ['$interval', 'FioiEditor2Signals'];
function RecorderFactory ($interval, signals) {
   var service = {};
   var state = {
      isRecording: false,
      isPlaying: false,
      isPaused: false,
      segments: undefined,
      events: undefined,
      startTime: undefined,
      timeOffset: undefined,
      currentFrameTime: undefined,
      playInterval: undefined, // angular $interval handler
      playOffset: undefined, // offset in ms (rel. to startTime) of the last event played
      playCursor: undefined, // index in recording of the next event to replay
      options: null, // object with the dumpState() and loadState(state) functions.
      nextFreshId: 1, // counter used to generate fresh ids
      renaming: {}, // play-time id --> record-time id
      targets: {} // record-time id --> object instance
   };

   // Start a new recording.
   service.record = function (options) {
      if (state.isPlaying || state.isRecording)
         return false;
      state.isPaused = false;
      state.options = options;
      state.isRecording = true;
      state.timeOffset = 0;
      state.startTime = Date.now();
      state.playOffset = 0;
      state.events = [[0, '', '0', state.options.dumpState()]];
      state.segments = [];
   };

   // Play the given recording.
   service.play = function (recording, options) {
      if (state.isRecording || state.isPlaying)
         return false;
      state.isPlaying = true;
      state.recording = recording;
      state.options = options;
      state.playCursor = 0;
      state.startTime = Date.now();
      state.playOffset = 0;
      state.playInterval = $interval(playTick, 20);
   };

   // Pause the current operation.
   service.pause = function () {
      if (state.isPaused)
         return false;
      if (state.isRecording) {
         var duration = Date.now() - state.startTime;
         state.timeOffset += duration;
         state.segments.push({
            duration: duration,
            events: state.events
         });
         state.events = undefined;
         state.startTime = undefined;
         state.isPaused = true;
         return true;
      }
      if (state.isPlaying) {
         $interval.cancel(state.playInterval);
         state.playInterval = null;
         state.isPaused = true;
         return true;
      }
      return false;
   };

   // Resume (unpause) the current operation.
   service.resume = function () {
      if (!state.isPaused)
         return false;
      if (state.isRecording) {
         state.isPaused = false;
         state.startTime = Date.now();
         state.events = [[0, '', '0', state.options.dumpState()]];
         return true;
      }
      if (state.isPlaying) {
         state.isPaused = false;
         // XXX this is not quite right, ideally we should set startTime in
         // the past to (now - playOffset) and leave playOffset unchanged,
         // so that playOffset remains relative to the start of the audio
         // recording.
         state.startTime = Date.now();
         state.playOffset = 0;
         state.playInterval = $interval(playTick, 20);
      }
   };

   service.stop = function () {
      if (state.isRecording) {
         if (!state.isPaused)
            service.pause();
         // Combine the segments.
         var duration = 0;
         var events = [];
         _.each(state.segments, function (segment) {
            duration += segment.duration;
            Array.prototype.push.apply(events, segment.events);
         });
         var result = {
            duration:  duration,
            events: events
         };
         // Clear the recorder state.
         state.isRecording = false;
         state.segments = undefined;
         state.options = null;
         return result;
      }
      if (state.isPlaying) {
         if (!state.isPaused)
            service.pause();
         state.events = undefined;
         state.options = null;
         return;
      }
      return false;
   };

   service.register = function (id, target) {
      // If the component is part of the recording we should have an entry
      // mapping its id to the corresponding id used in the recording.
      if (id in state.renaming) {
         var rec_id = state.renaming[id];
         if (rec_id) {
            state.targets[rec_id] = target;
         }
      }
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

      var delta = state.currentFrameTime - state.playOffset;
      state.playOffset = state.currentFrameTime;
      event.unshift(delta);
      state.events.push(event);
   };

   service.freshId = function (prefix, recording_id) {
      var new_id = prefix.toString() + state.nextFreshId;
      state.nextFreshId += 1;
      if (typeof recording_id === 'string') {
         // Map the new id to the recording id provided.
         state.renaming[new_id] = recording_id;
      }
      return new_id;
   };

   service.getPlayId = function (recording_id) {
      var target = state.targets[recording_id];
      return target && target.id;
   };

   function playTick () {
      var cursor = state.playCursor;
      var playUntil = Math.floor(Date.now() - state.startTime - state.playOffset);
      var timeElapsed = 0;
      var events = state.recording.events;
      while (cursor < events.length && timeElapsed <= playUntil) {
         var event = events[cursor];
         timeElapsed += event[0];
         var id = event[1];
         var op = event[2];
         try {
            // An empty target id ('') indicates a global event.
            // Handle these events before passing them to targets and to the
            // replayEvent options, so that the '0' event is able to reload
            // the initial state (and set up the targets mapping) first.
            if (id === '') {
               if (op === '0') {
                  // Global state reset.  Clear the targets registry.
                  state.targets = {};
                  state.options.loadState(event[3]);
                  signals.emitUpdate();
               }
            }
            // If we have an object registered as the event's target,
            // automatically pass the event to that object.  Objects
            // typically register when the a state dump is reloaded.
            if (id in state.targets)
               state.targets[id].replayEvent(event);
            // Pass all events to the handler in options, if given.
            if (typeof state.options.replayEvent === 'function')
               state.options.replayEvent(event);
            cursor += 1;
         } catch (ex) {
            console.log('An exception occurred!', ex);
            state.exception = ex;
            service.pause();
            break;
         }
      }
      state.playOffset += timeElapsed;
      state.playCursor = cursor;
      if (cursor == events.length) {
         $interval.cancel(state.playInterval);
         state.playInterval = null;
         service.stop();
      }
   }

   return service;
}

};
