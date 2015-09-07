'use strict';
module.exports = function (m) {

m.factory('FioiEditor2Registry', RegistryFactory);
RegistryFactory.$inject = [];
function RegistryFactory () {
   var service = {};
   var state = {
      targets: {} // record-time id --> object instance
   };

   // Generate a fresh id for a component.  If an old_id is passed,
   // that id is returned (after verifying that there is no component
   // already registered with the same id).
   service.freshId = function (prefix, old_id) {
      if (typeof old_id === 'string') {
         if (old_id in state.targets)
            throw ("conflict on id " + old_id);
         return old_id;
      }
      var nextFreshId = 1;
      while (true) {
         var new_id = prefix.toString() + nextFreshId;
         if (!(new_id in state.targets))
            return new_id;
         nextFreshId += 1;
      }
   };

   // Clear the targets registry.
   service.clear = function () {
      state.targets = {};
   };

   // Register a component as a target to be used during playback.
   service.register = function (id, target) {
      console.log('register', id, target);
      state.targets[id] = target;
   };

   // Retrieve a playback target by id.
   service.getTarget = function (id) {
      return state.targets[id];
   };

   // Obtain the playback-time id associated with a given recording-time id.
   service.getPlayId = function (recording_id) {
      return recording_id;
   };

   return service;
}

};