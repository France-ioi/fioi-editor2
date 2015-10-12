module.exports = function (m) {
'use strict';

/**
This service stores tabsets.
*/
m.factory('FioiEditor2Tabsets', TabsetsServiceFactory);
TabsetsServiceFactory.$inject = ['FioiEditor2Signals', 'FioiEditor2Tabs', 'FioiEditor2Recorder', 'FioiEditor2Registry'];
function TabsetsServiceFactory (signals, tabs, recorder, registry) {

   var service = {};
   var tabsets = {};

   service.add = function (recording_id) {
      var id = registry.freshId('ts', recording_id);
      var tabset = tabsets[id] = new Tabset(id);
      registry.register(id, tabset);
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
   Tabset.prototype.update = function (attrs, quiet) {
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
      if ('buffersPerTab' in attrs)
         this.buffersPerTab = attrs.buffersPerTab;
      if (!quiet) {
         recorder.addEvent([this.id, 'u', attrs]);
         signals.emitUpdate();
      }
      return this;
   };
   Tabset.prototype.addTab = function (id) {
      var tab = tabs.add(id).update({
         tabset: this,
         title: this._unusedTabTitle()
      });
      var new_id = tab.id;
      this.tabs[new_id] = tab;
      this.tabIds.push(new_id);
      // Skip default initialization if an id was provided, as we are
      // then in playback mode.
      if (!id) {
         this.activeTabId = new_id;
         recorder.addEvent([this.id, 'n', new_id]);
         for (var i = 0; i < this.buffersPerTab; i += 1)
            tab.addBuffer();
      }
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
         tabs: _.map(this.tabIds, function (id) { return {id: id, dump: tabs[id].dump()}; }),
         activeTabId: this.activeTabId
      };
      if (this.name)
         obj.name = this.name;
      return obj;
   };
   Tabset.prototype.load = function (dump) {
      if (dump.name)
         this.name = dump.name;
      _.each(dump.tabs, function (tab) {
         this.addTab(tab.id).load(tab.dump);
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
      switch (event[2]) {
      case 'u':
         this.update(event[3]);
         break;
      case 'n':
         var tab = this.addTab(event[3]);
         this.activeTabId = tab.id;
         break;
      default:
         console.log('unhandled Tabset event', event);
      }
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
