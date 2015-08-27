'use strict';
module.exports = function (m) {

/**
This service acts as storage for sets of named tabs, where each
tab holds a sequence of 1 or 2 text buffers.

The service can dump/load its state to/from a JSON object.

*/
m.factory('FioiEditor2Storage', StorageServiceFactory);
function StorageServiceFactory () {

   var service = {};
   var tabs = {};

   service.addTab = function (name) {
      tabs[name] = {
         buffers: []
      };
   };

   service.removeTab = function (name) {
      delete tabs[name];
   };

   service.addBuffer = function (tab_name, text) {
      tabs[tab_name].buffers.push({text: text || ''});
   };

   service.dump = function () {
      return {tabs: tabs};
   };

   return service;
}

};