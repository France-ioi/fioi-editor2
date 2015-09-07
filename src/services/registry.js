'use strict';
module.exports = function (m) {

m.factory('FioiEditor2Registry', RegistryFactory);
RegistryFactory.$inject = [];
function RegistryFactory () {
   var service = {};
   var state = {
      nextFreshId: 1, // counter used to generate fresh ids
      renaming: {}, // play-time id --> record-time id
      targets: {} // record-time id --> object instance
   };

   // Generate a fresh id for a component, optionally associating
   // the new id with an id stored in a recording.
   service.freshId = function (prefix, recording_id) {
      var new_id = prefix.toString() + state.nextFreshId;
      state.nextFreshId += 1;
      if (typeof recording_id === 'string') {
         // Map the new id to the recording id provided.
         state.renaming[new_id] = recording_id;
      }
      return new_id;
   };

   // Clear the targets registry.
   service.clear = function () {
      state.targets = {};
   };

   // Register a component to be used during playback.
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

   service.getTarget = function (recording_id) {
      return state.targets[recording_id];
   };

   // Obtain the playback-time id associated with a given recording-time id.
   service.getPlayId = function (recording_id) {
      // Retr
      var target = state.targets[recording_id];
      return target && target.id;
   };

   return service;
}

};