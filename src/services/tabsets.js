'use strict';
module.exports = function (m) {

/**
This service stores named tabsets.
*/
m.factory('FioiEditor2Tabsets', TabsetsServiceFactory);
TabsetsServiceFactory.$inject = ['$rootScope', 'FioiEditor2Tabs'];
function TabsetsServiceFactory ($rootScope, tabs) {

   var service = {};
   var tabsets = {};

   service.add = function (name, options) {
      if (name in tabsets)
         return null;
      name = name.toString();
      options.mode = options.mode || 'sources';
      options.titlePrefix = (options.titlePrefix || 'Tab').toString();
      var tabset = tabsets[name] = new Tabset(name, options);
      return tabset;
   };

   service.get = function (name) {
      return tabsets[name];
   };

   service.dump = function () {
      return _.map(tabsets, function (tabset) { return tabset.dump(); });
   };

   function Tabset (name, options) {
      this.name = name;
      this.options = options;
      this.tabs = {};
      this.tabNames = [];
      this.activeTabName = null;
   }
   Tabset.prototype.addTab = function (options) {
      options = _.clone(options) || {};
      var name = this._unusedTabTitle();
      if (!('title' in options))
         options.title = this._unusedTabTitle();
      var tab = tabs.add(options);
      tab.tabset = this;
      var name = tab.name;
      this.tabs[name] = tab;
      this.tabNames.push(name);
      if (this.activeTabName == null)
         this.activeTabName = name;
      this._emit('changed');
      return tab;
   };
   Tabset.prototype.removeTab = function (name) {
      _.pull(this.tabNames, name);
      delete this.tabs[name];
      this._emit('changed');
   };
   Tabset.prototype.dump = function () {
      return {
         tabs: _.map(this.tabs, function (tab) { return tab.dump(); })
      };
   };
   Tabset.prototype.getTabs = function () {
      var tabs = this.tabs;
      return _.map(this.tabNames, function (name) { return tabs[name]; });
   };
   Tabset.prototype.setActiveTab = function (name) {
      if (name in this.tabs) {
         this.activeTabName = name;
         this._emit('changed');
      }
   };
   Tabset.prototype.getActiveTab = function () {
      return this.activeTabName && this.tabs[this.activeTabName];
   };
   Tabset.prototype.getLanguages = function () {
      if (this.options.languages)
         return this.options.languages;
      return [{id: 'text', label: "Text", ext: 'txt'}];
   };
   Tabset.prototype._emit = function (name) {
      $rootScope.$emit('fioi-editor2_tabset-'+this.name+'_'+name);
   };
   Tabset.prototype._unusedTabTitle = function () {
      var num = 1;
      var titles = {};
      _.each(this.tabs, function (tab, name) { titles[tab.title] = true; });
      while (true) {
         var newTitle = this.options.titlePrefix + num;
         if (!(newTitle in titles))
            return newTitle;
         num += 1;
      }
   }

   return service;
}

};