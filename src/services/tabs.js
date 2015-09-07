'use strict';
module.exports = function (m) {

/**
This service acts as storage for sets of tabs, where each
tab holds a sequence of 1 or 2 text buffers.

The service can dump/load its state to/from a JSON object.

*/
m.factory('FioiEditor2Tabs', TabsServiceFactory);
TabsServiceFactory.$inject = ['FioiEditor2Signals', 'FioiEditor2Buffers', 'FioiEditor2Recorder', 'FioiEditor2Registry'];
function TabsServiceFactory (signals, buffers, recorder, registry) {

   var service = {};
   var tabs = {};

   service.add = function (recording_id) {
      var id = registry.freshId('t', recording_id);
      var tab = tabs[id] = new Tab(id);
      registry.register(id, tab);
      signals.emitUpdate();
      return tab;
   };

   service.remove = function (id) {
      var tab = tabs[id];
      tab.clear();
      delete tabs[id];
      signals.emitUpdate();
   };

   service.get = function (id) {
      return tabs[id];
   };

   function Tab (id) {
      this.id = id;
      this.title = "Tab";
      this.buffers = [];
      this.languages = null; // inherit from tabset
      this.defaultLanguage = null;
   }
   Tab.prototype.update = function (attrs) {
      if ('tabset' in attrs)
         this.tabset = attrs.tabset;
      if ('title' in attrs)
         this.title = attrs.title;
      if ('languages' in attrs)
         this.languages = attrs.languages;
      if ('defaultLanguage' in attrs)
         this.defaultLanguage = attrs.defaultLanguage;
      signals.emitUpdate();
      return this;
   }
   Tab.prototype.addBuffer = function (id) {
      var buffer = buffers.add(id).update({
         tab: this,
         language: this.getDefaultLanguage()
      });
      this.buffers.push(buffer.id);
      recorder.addEvent([this.id, 'n', buffer.id]);
      signals.emitUpdate();
      return buffer;
   };
   Tab.prototype.getLanguages = function () {
      if (this.languages)
         return this.languages;
      return this.tabset.getLanguages();
   };
   Tab.prototype.getDefaultLanguage = function () {
      if (this.defaultLanguage)
         return this.defaultLanguage;
      return this.tabset.getDefaultLanguage();
   }
   Tab.prototype.getBuffer = function (i) {
      var buffer = this.buffers[i || 0];
      if (!buffer) return buffer;
      return buffers.get(buffer);
   };
   Tab.prototype.focus = function () {
      // TODO: have an active buffer?
      var buffer = this.getBuffer();
      if (buffer) buffer.focus();
   };
   Tab.prototype.dump = function () {
      return {
         title: this.title,
         buffers: _.map(this.buffers, function (id) {
            var buffer = buffers.get(id);
            buffer.pullFromControl();
            return {id: id, dump: buffer.dump()};
         })
      };
   };
   Tab.prototype.load = function (dump) {
      this.title = dump.title;
      _.each(dump.buffers, function (buffer) {
         this.addBuffer(buffer.id).load(buffer.dump);
      }.bind(this));
      signals.emitUpdate();
      return this;
   };

   Tab.prototype.clear = function () {
      this.title = null;
      _.each(this.buffers, function (id) {
         buffers.remove(id);
      });
      this.buffers = [];
      signals.emitUpdate();
   };
   Tab.prototype.replayEvent = function (event) {
      switch (event[2]) {
      case 'n':
         this.addBuffer(event[3]);
         break;
      default:
         console.log('unhandled Tabset event', event);
      }
   };

   return service;
}

};