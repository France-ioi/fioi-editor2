(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function (css, customDocument) {
  var doc = customDocument || document;
  if (doc.createStyleSheet) {
    var sheet = doc.createStyleSheet()
    sheet.cssText = css;
    return sheet.ownerNode;
  } else {
    var head = doc.getElementsByTagName('head')[0],
        style = doc.createElement('style');

    style.type = 'text/css';

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(doc.createTextNode(css));
    }

    head.appendChild(style);
    return style;
  }
};

module.exports.byUrl = function(url) {
  if (document.createStyleSheet) {
    return document.createStyleSheet(url).ownerNode;
  } else {
    var head = document.getElementsByTagName('head')[0],
        link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = url;

    head.appendChild(link);
    return link;
  }
};

},{}],2:[function(require,module,exports){
module.exports = "<div><div ui-ace=\"{onLoad: vm.aceLoaded, mode: \'c_cpp\'}\"></div><div><span>Language du fichier :</span><select ng-model=\"vm.language\" ng-options=\"option.id as option.label for option in vm.languageOptions track by option.id\" ng-change=\"vm.setLanguage(option)\"></select></div></div>";

},{}],3:[function(require,module,exports){
'use strict';
module.exports = function (m) {

m.directive('fioiEditor2Buffer', bufferDirective);
function bufferDirective () {
   return {
      restrict: 'E',
      scope: {
         buffer: '@',
         onInit: '&'
      },
      template: require('./buffer.jade'),
      controllerAs: 'vm',
      bindToController: true,
      require: '^fioiEditor2',
      replace: true,
      controller: BufferController,
      link: function (scope, iElement, iAttrs, editorController) {
         scope.$on('$destroy', function () {
            scope.vm.cleanup();
         });
      }
   };
}

BufferController.$inject = ['$rootScope', 'FioiEditor2Buffers'];
function BufferController ($rootScope, buffers) {

   var controller = this;
   var buffer = buffers.get(this.buffer);
   var editor = null; // the ACE object

   // Load from service and hook up events.
   onBufferChanged();
   var eventMap = {
      changed: onBufferChanged
   };
   var unhookers = _.map(eventMap, function (func, name) {
      return $rootScope.$on('fioi-editor2_buffer-'+buffer.name+'_'+name, func);
   });
   this.cleanup = function () {
      _.each(unhookers, function (func) { func(); });
      buffer.update({
         text: editor.getValue(),
         language: this.language && this.language.id,
         selection: editor.selection.getRange()
      });
   }.bind(this);

   this.aceLoaded = function (editor_) {
      window.editor = editor_;
      editor = editor_;
      editor.setValue(buffer.text);
      editor.selection.setRange(buffer.selection);
      editor.focus();
   };

   function onBufferChanged () {
      controller.languageOptions = buffer.getLanguages();
      controller.language = _.find(controller.languageOptions,
         function (language) { return language.id == buffer.language; });
      controller.text = buffer.text;
   }

}

};
},{"./buffer.jade":2}],4:[function(require,module,exports){
module.exports = "<div class=\"fioi-editor2\"><ul class=\"fioi-editor2_tabs\"><li ng-click=\"vm.addTab()\" class=\"fioi-editor2_new-tab\">+</li><li ng-repeat=\"tab in vm.tabs track by tab.name\" ng-class=\"{\'active\':tab===vm.tab}\" ng-click=\"vm.selectTab(tab)\" class=\"fioi-editor2_tab\"><span class=\"fioi-editor2_tab-title\">{{tab.title}}</span><span ng-click=\"vm.closeTab(tab)\" class=\"fioi-editor2_close-tab\">×</span></li></ul><div class=\"fioi-editor2_buffers\"><div ng-repeat=\"buffer in vm.tab.buffers track by buffer\"><fioi-editor2-buffer buffer=\"{{::buffer}}\"></fioi-editor2-buffer></div></div></div>";

},{}],5:[function(require,module,exports){
'use strict';
module.exports = function (m) {

/**
This directive inserts the editor component.

Each instance of the editor component is bound to a named group in the
storage service.

The user can select one of the tabs maintained by the storage service,
add a new tab, remove a tab, and rename a tab.

When a tab is selected, the editor uses a buffer directive to display the
sequence of buffers held in the tab side-by-side.

The directive supplies its API object to the parent controller in a variable
named 'api' when evaluating the directive's on-init attribute.

The API includes function to:
- start and stop the recording mode
- retrieve the last recorded sequence of timestamped events
- …

*/
m.directive('fioiEditor2', editorDirective);
function editorDirective () {
   return {
      restrict: 'A',
      scope: {
         fioiEditor2: '&'
      },
      template: require('./editor.jade'),
      controllerAs: 'vm',
      bindToController: true,
      replace: true,
      controller: EditorController,
      link: function (scope, iElement, iAttrs, controller) {
         scope.$on('$destroy', function () {
            scope.vm.cleanup();
         });
      }
   };
}

EditorController.$inject = ['$rootScope', 'FioiEditor2Tabsets']
function EditorController ($rootScope, tabsets) {

   var config = this.fioiEditor2();
   var tabset = tabsets.get(config.tabset);
   var controller = this;

   var api = {};
   api.placeholder = function () {
      alert('placeholder');
   };
   api.trigger = function (event) {
      if (event === 'tabs-changed')
         return load();
   };

   this.addTab = function () {
      var tab = tabset.addTab();
      tab.addBuffer('');  // XXX this should be done by the tab based on its mode
      this.selectTab(tab);
   }.bind(this);

   this.closeTab = function (tab) {
      tabset.removeTab(tab.name);
   };

   this.selectTab = function (tab) {
      tabset.setActiveTab(tab.name);
   };

   // Initialize controller data and reload it on 'changed' event.
   onTabsetChanged();
   var unhookers = [
      $rootScope.$on('fioi-editor2_tabset-'+config.tabset+'_changed', onTabsetChanged)
   ];
   this.cleanup = function () {
      _.each(unhookers, function (func) { func(); });
   };

   // Pass the editor component's API to the enclosing controller.
   if (typeof this.onInit === 'function')
      this.onInit({api: api});

   //
   // Private function
   //

   // Load state from the tabs service.
   function onTabsetChanged () {
      controller.tabs = tabset.getTabs();
      controller.tab = tabset.getActiveTab();
   }

}

};
},{"./editor.jade":4}],6:[function(require,module,exports){
var css = ".fioi-editor2 {\n   width: 762px;\n}\n\nul.fioi-editor2_tabs {\n   font: bold 11px Verdana, Arial, sans-serif;\n   list-style-type: none;\n   padding-bottom: 24px;\n   border-bottom: 1px solid #CCCCCC;\n   margin: 0;\n}\n\nul.fioi-editor2_tabs > li {\n   float: left;\n   height: 21px;\n   line-height: 21px;\n   padding: 0 7px;\n   background-color: #E0F3DB;\n   margin: 2px 2px 0 2px;\n   border: 1px solid #CCCCCC;\n   cursor: pointer;\n}\n\nul.fioi-editor2_tabs > li.active {\n   border-bottom: 1px solid #fff;\n   background-color: #FFFFFF;\n}\n\nul.fioi-editor2_tabs > li:hover .fioi-editor2_tab-title {\n   text-decoration: underline;\n}\n\n.fioi-editor2_close-tab {\n   padding: 0px 2px;\n   margin-left: 2px;\n   border-radius: 3px;\n}\n\n.fioi-editor2_close-tab:hover {\n   background-color: #D8D8D8;\n}\n\n.fioi-editor2_buffers {\n   width: 100%;\n}\n\n.fioi-editor2_buffers textarea {\n   width: 756px;\n   height: auto;\n   text-align: left;\n   border: 1px solid #CCCCCC;\n   border-top: none;\n}\n\n.fioi-editor2_buffers .ace_editor {\n   width: 760px;\n   height: 350px; /* 14px * 25 lines */\n   border: 1px solid #CCCCCC;\n   border-top: none;\n}\n\n/*\n#sourcesEditor {\n   width:762px;\n}\n\n#testsEditor {\n   width:762px;\n}\n\n.CodeMirror {\n  text-align: left;\n  border: 1px solid #CCCCCC;\n  border-top: none;\n}\n\n.CodeMirror.basic {\n  border-top: 1px solid #CCCCCC;\n}\n\n.tooltip {\n   display:none;\n}\n*/"; (require("./../node_modules/cssify"))(css); module.exports = css;
},{"./../node_modules/cssify":1}],7:[function(require,module,exports){
'use strict';
define(['angular', 'lodash', 'angular-ui-ace'], function (angular, _) {

require('./main.css');

var m = angular.module('fioi-editor2', ['ui.ace']);
require('./services/tabsets')(m);
require('./services/tabs')(m);
require('./services/buffers')(m);
require('./directives/editor')(m);
require('./directives/buffer')(m);

});
},{"./directives/buffer":3,"./directives/editor":5,"./main.css":6,"./services/buffers":8,"./services/tabs":9,"./services/tabsets":10}],8:[function(require,module,exports){
'use strict';
module.exports = function (m) {

/**
This service maintains a set of named buffers.
*/
m.factory('FioiEditor2Buffers', BuffersFactory);
BuffersFactory.$inject = ['$rootScope'];
function BuffersFactory ($rootScope) {

   var service = {};
   var buffers = {};
   var nextId = 1;

   function Buffer (name, text, options) {
      this.options = options || {};
      this.name = name;
      this.text = (text || "").toString();
      this.selection = {start: {row: 0, column: 0}, end: {row: 0, column: 0}};
      this.language = this.options.language || 'text';
   }
   Buffer.prototype.update = function (attrs) {
      if ('text' in attrs)
         this.text = attrs.text;
      if ('language' in attrs)
         this.language = attrs.language;
      if ('selection' in attrs)
         this.selection = _.clone(attrs.selection);
      this._emit('changed');
   };
   Buffer.prototype.getLanguages = function () {
      if (this.options.languages)
         return this.options.languages;
      return this.tab.getLanguages();
   };
   Buffer.prototype._emit = function (name) {
      $rootScope.$emit('fioi-editor2_buffer-'+this.name+'_'+name);
   };

   service.add = function (text, options) {
      var name = 'b' + nextId;
      nextId += 1;
      var buffer = buffers[name] = new Buffer(name, text, options);
      return buffer;
   };

   service.remove = function (name) {
      var buffer = buffers[name];
      if (buffer) {
         delete buffers[name];
      }
   };

   service.get = function (name) {
      return buffers[name];
   };

   return service;
}

};
},{}],9:[function(require,module,exports){
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
      options = _.clone(options) || {};
      if (!('language' in options))
         options.language = this.options.language;
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
   Tab.prototype._emit = function (name) {
      $rootScope.$emit('fioi-editor2_tab-'+this.name+'_'+name);
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
},{}],10:[function(require,module,exports){
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
},{}]},{},[7])


//# sourceMappingURL=fioi-editor2.js.map
