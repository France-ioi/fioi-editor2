'use strict';
module.exports = function (m) {

/**
This service acts as storage for sets of named tabs, where each
tab holds a sequence of 1 or 2 text buffers.

The service can dump/load its state to/from a JSON object.

*/
m.factory('FioiEditor2Tabs', TabsServiceFactory);
TabsServiceFactory.$inject = ['FioiEditor2Buffers'];
function TabsServiceFactory (buffers) {

   var service = {};
   var tabs = {};
   var orderedTabs = [];
   var boundEditor = null;

   function Tab (name) {
      this.name = name;
      this.buffers = [];
   }
   Tab.prototype.addBuffer = function (text) {
      var buf_name = buffers.add(text);
      this.buffers.push(buf_name);
      trigger('buffers-changed', this.name);
   };

   service.bind = function (api) {
      boundEditor = api;
   };

   service.unbind = function (api) {
      if (boundEditor == api)
         boundEditor = null;
   };

   service.add = function (name) {
      if (name in tabs)
         return null;
      var tab = tabs[name] = new Tab(name);
      orderedTabs.push(tab);
      trigger('tabs-changed');
      return tab;
   };

   service.remove = function (name) {
      var tab = tabs[name];
      _.pull(orderedTabs, tab);
      delete tabs[name];
      trigger('tabs-changed');
   };

   service.list =  function () {
      return _.clone(orderedTabs);
   };

   service.exists = function (name) {
      return name in tabs;
   };

   service.dump = function () {
      return {tabs: tabs};
   };

   function trigger (event) {
      if (boundEditor)
         boundEditor.trigger(event);
   }

   return service;
}

};