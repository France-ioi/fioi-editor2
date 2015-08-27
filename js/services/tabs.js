'use strict';
module.exports = function (m) {

/**
This service acts as storage for sets of named tabs, where each
tab holds a sequence of 1 or 2 text buffers.

The service can dump/load its state to/from a JSON object.

*/
m.factory('FioiEditor2Tabs', TabsServiceFactory);
TabsServiceFactory.$inject = ['$rootScope', 'FioiEditor2Buffers'];
function TabsServiceFactory ($rootScope, buffers) {

   var service = {};
   var tabs = {};
   var nextId = 1;

   function Tab (name, options) {
      this.name = name;
      this.options = options || {};
      this.title = this.options.title || "Tab";
      this.buffers = [];
   }
   Tab.prototype.addBuffer = function (text, options) {
      var buffer = buffers.add(text, options);
      this.buffers.push(buffer.name);
      buffer.tab = this;
      return buffer;
   };
   Tab.prototype.getLanguages = function () {
      if (this.options.languages)
         return this.options.languages;
      return this.tabset.getLanguages();
   };

   service.add = function (options) {
      var name = 'b' + nextId;
      nextId += 1;
      var tab = tabs[name] = new Tab(name, options);
      return tab;
   };

   service.remove = function (name) {
      var tab = tabs[name];
      delete tabs[name];
   };

   service.get = function (name) {
      return tabs[name];
   };

   return service;
}

};