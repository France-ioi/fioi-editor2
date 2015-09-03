'use strict';
module.exports = function (m) {

/**
This service stores tabsets.
*/
m.factory('FioiEditor2Tabsets', TabsetsServiceFactory);
TabsetsServiceFactory.$inject = ['FioiEditor2Signals', 'FioiEditor2Tabs', 'FioiEditor2Recorder'];
function TabsetsServiceFactory (signals, tabs, recorder) {

   var service = {};
   var tabsets = {};

   service.add = function (recording_id) {
      var id = recorder.freshId('ts', recording_id);
      var tabset = tabsets[id] = new Tabset(id);
      recorder.register(id, tabset);
      signals.emitUpdate();
      return tabset;
   };

   service.get = function (id) {
      return tabsets[id];
   };

   service.find = function (name) {
      return _.find(tabsets, function (tabset, id) {
         return tabset.name === name;
      });
   };

   service.clear = function () {
      _.each(tabsets, function (tabset) {
         tabset.clear();
      });
      tabsets = {};
      signals.emitUpdate();
      return this;
   };

   service.dump = function () {
      return _.mapValues(tabsets, function (tabset, id) { return tabset.dump(); });
   };

   service.load = function (state) {
      this.clear();
      _.each(state, function (tabset_dump, tabset_id) {
         service.add(tabset_id).load(tabset_dump);
      });
      signals.emitUpdate();
      return this;
   };

   function Tabset (id) {
      this.id = id;
      this.buffersPerTab = 1;
      this.titlePrefix = 'Tab';
      this.languages = [{id: 'text', label: "Text", ext: 'txt'}];
      this.defaultLanguage = 'text';
      this.tabs = {};
      this.tabIds = [];
      this.activeTabId = null;
   }
   Tabset.prototype.update = function (attrs) {
      if ('name' in attrs)
         this.name = attrs.name;
      if ('titlePrefix' in attrs)
         this.titlePrefix = attrs.titlePrefix;
      if ('languages' in attrs)
         this.languages = attrs.languages;
      if ('defaultLanguage' in attrs)
         this.defaultLanguage = attrs.defaultLanguage;
      if ('activeTabId' in attrs)
         this.activeTabId = attrs.activeTabId;
      signals.emitUpdate();
      return this;
   }
   Tabset.prototype.addTab = function (id) {
      var tab = tabs.add(id).update({
         tabset: this,
         title: this._unusedTabTitle()
      });
      id = tab.id;
      this.tabs[id] = tab;
      this.tabIds.push(id);
      if (this.activeTabId == null)
         this.activeTabId = id;
      signals.emitUpdate();
      return tab;
   };
   Tabset.prototype.removeTab = function (id) {
      var i = _.indexOf(this.tabIds, id);
      if (i === -1)
         return;
      this.tabIds.splice(i, 1);
      delete this.tabs[id];
      if (this.activeTabId === id) {
         if (i == this.tabIds.length)
            i -= 1;
         if (i !== -1) {
            this.activeTabId = this.tabIds[i];
         } else {
            this.activeTabId = null;
         }
      }
      signals.emitUpdate();
   };
   Tabset.prototype.clear = function () {
      _.each(this.tabIds, function (id) {
         tabs.remove(id);
      });
      this.tabs = {};
      this.tabIds = [];
      this.activeTabId = null;
      signals.emitUpdate();
   };
   Tabset.prototype.dump = function () {
      var tabs = this.tabs;
      var obj = {
         tabs: _.map(this.tabIds, function (id) { return [id, tabs[id].dump()]; }),
         activeTab: this.activeTabId
      };
      if (this.name)
         obj.name = this.name;
      return obj;
   };
   Tabset.prototype.load = function (dump) {
      if (dump.name)
         this.name = dump.name;
      _.each(dump.tabs, function (tab_dump) {
         this.addTab(tab_dump[0]).load(tab_dump[1]);
      }.bind(this));
      this.activeTabId = dump.activeTabId;
      signals.emitUpdate();
      return this;
   };
   Tabset.prototype.getTabs = function () {
      var tabs = this.tabs;
      return _.map(this.tabIds, function (id) { return tabs[id]; });
   };
   Tabset.prototype.getActiveTab = function () {
      return this.activeTabId && this.tabs[this.activeTabId];
   };
   Tabset.prototype.getLanguages = function () {
      return this.languages;
   };
   Tabset.prototype.getDefaultLanguage = function () {
      return this.defaultLanguage;
   };
   Tabset.prototype.focus = function () {
      var tab = this.getActiveTab();
      if (tab) tab.focus();
   };
   Tabset.prototype.replayEvent = function (event) {
      console.log('unhandled Tabset event', event);
   };
   Tabset.prototype._unusedTabTitle = function () {
      var num = 1;
      var titles = {};
      _.each(this.tabs, function (tab, id) { titles[tab.title] = true; });
      while (true) {
         var newTitle = this.titlePrefix + num;
         if (!(newTitle in titles))
            return newTitle;
         num += 1;
      }
   };

   return service;
}

};