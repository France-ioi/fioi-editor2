'use strict';
module.exports = function (m) {

m.factory('FioiEditor2Recorder', RecorderFactory);
RecorderFactory.$inject = ['$interval', '$rootScope'];
function RecorderFactory ($interval, $rootScope) {
   var service = {};
   var state = {
      recording: false,
      playing: false,
      paused: false,
      segments: undefined,
      events: undefined,
      startTime: undefined,
      timeOffset: undefined,
      currentFrameTime: undefined,
      lastEventTime: undefined,
      playInterval: undefined,
      playCursor: undefined,
      options: null,
      record: null,
      nextFreshId: 1,
      renaming: {},  // actual id --> recording id
      targets: {}  // recording id --> object instance
   };

   // Start a new recording.  Pass a dumper function which will be called
   // by the recorder when it needs to store the global state.
   service.record = function (options) {
      if (state.playing || state.recording)
         return false;
      state.paused = false;
      state.options = options;
      state.recording = true;
      state.timeOffset = 0;
      state.startTime = Date.now();
      state.lastEventTime = 0;
      state.events = [[0, '', '0', state.options.dumpState()]];
      state.segments = [];
   };

   service.play = function (record, options) {
      if (state.recording || state.playing)
         return false;
      state.playing = true;
      state.record = record;
      state.options = options;
      state.playCursor = 0;
      state.lastEventTime = 0;
      state.playInterval = $interval(playTick, 20);
   };

   service.pause = function () {
      if (state.paused)
         return false;
      if (state.recording) {
         var duration = Date.now() - state.startTime;
         state.timeOffset += duration;
         state.segments.push({
            duration: duration,
            events: state.events
         });
         state.events = undefined;
         state.startTime = undefined;
         state.paused = true;
         return true;
      }
      if (state.playing) {
         $interval.cancel(state.playInterval);
         state.playInterval = null;
         state.paused = true;
      }
      return false;
   };

   service.resume = function () {
      if (!state.paused)
         return false;
      if (state.recording) {
         state.paused = false;
         state.startTime = Date.now();
         state.events = [[0, '', '0', state.options.dumpState()]];
         return true;
      }
   };

   service.stop = function () {
      if (state.recording) {
         if (!state.paused)
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
         state.recording = false;
         state.segments = undefined;
         state.options = null;
         return result;
      }
      if (state.playing) {
         if (!state.paused)
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
         id = state.renaming[id];
         state.targets[id] = target;
      }
   };

   service.addEvent = function (event) {
      if (!state.recording)
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

   service.freshId = function (prefix, recording_id) {
      var new_id = prefix.toString() + state.nextFreshId;
      state.nextFreshId += 1;
      if (typeof recording_id === 'string') {
         // Map the new id to the recording id provided.
         state.renaming[new_id] = recording_id;
      }
      return new_id;
   };

   function playTick () {
      var cursor = state.playCursor;
      if (cursor == 0)
         state.startTime = Date.now();
      var tickUntil = Math.floor(Date.now() - state.startTime - state.lastEventTime);
      var relTime = 0;
      var events = state.record.events;
      while (cursor < events.length && relTime <= tickUntil) {
         var event = events[cursor];
         relTime += event[0];
         var id = event[1];
         var op = event[2];
         try {
            // If we have an object registered as the event's target,
            // automatically pass the event to that object.  Objects
            // typically register when the a state dump is reloaded.
            if (id in state.targets)
               state.targets[id].replayEvent(event);
            // An empty target id ('') indicates a global event.
            if (id === '') {
               if (op === '0') {
                  // Global state reset.  Clear the targets registry.
                  state.targets = {};
                  state.options.loadState(event[3]);
                  $rootScope.$emit('fioi-editor2_loadState');
               }
            }
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
      state.lastEventTime += relTime;
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
