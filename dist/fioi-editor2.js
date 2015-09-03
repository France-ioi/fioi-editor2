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
module.exports = "<div><div ui-ace=\"{onLoad: vm.aceLoaded}\"></div><div><span>Language du fichier :</span><select ng-model=\"vm.language\" ng-options=\"option as option.label for option in vm.languageOptions track by option.id\" ng-change=\"vm.languageChanged()\"></select></div></div>";

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
   var editor = null; // the ACE object
   var buffer = buffers.get(this.buffer);

   // Initialize controller data and reload it on 'loadState' event.
   loadState();
   var unhookers = [
      $rootScope.$on('fioi-editor2_loadState', loadState)
   ];
   this.cleanup = function () {
      _.each(unhookers, function (func) { func(); });
      buffer.pullFromControl();
      buffer.detachControl();
   };

   this.aceLoaded = function (editor_) {
      editor = editor_;

      // Get rid of the following Ace warning:
      // "Automatically scrolling cursor into view after selection change
      //  this will be disabled in the next version
      //  set editor.$blockScrolling = Infinity to disable this message"
      editor.$blockScrolling = Infinity;

      // Stop overriding Cmd/Ctrl-L. It's used to by browser to go to the
      // location bar, but ace wants to use it for go-to-line.
      editor.commands.removeCommand("gotoline");

      // Expose our API to the buffer service.
      buffer.attachControl({
         load: load,
         dump: dump,
         focus: focus,
         insertLines: insertLines,
         deleteLines: deleteLines,
         moveCursor: moveCursor,
         setSelection: setSelection
      });

      // Let the buffer set up the state once Ace is loaded.
      buffer.pushToControl();
      editor.focus();

      // Hook up events for recording.
      editor.session.doc.on("change", function (e) {
         if (e.action === 'insert') {
            buffer.logInsert(e.start.row, e.start.column, e.end.row, e.end.column, e.lines);
         } else {
            buffer.logDelete(e.start.row, e.start.column, e.end.row, e.end.column);
         }
      }, true);
      editor.selection.addEventListener("changeCursor", function () {
         if (editor.selection.isEmpty()) {
            var r = editor.selection.getRange();
            buffer.logCursor(r.start.row, r.start.column)
         }
      }, true);
      editor.selection.addEventListener("changeSelection", function () {
         var r = editor.selection.getRange();
         buffer.logSelect(r.start.row, r.start.column, r.end.row, r.end.column);
      }, true);
   };

   this.languageChanged = function () {
      buffer.pullFromControl();
      buffer.pushToControl();
      editor.focus();
   };

   function loadState () {
      load(buffer);
   }

   function load (buffer) {
      controller.languageOptions = buffer.getLanguages();
      controller.language = _.find(controller.languageOptions,
         function (language) { return language.id == buffer.language; });
      if (editor) {
         if (controller.language && typeof controller.language === 'object') {
            editor.session.setMode('ace/mode/' + controller.language.ace.mode);
         }
         editor.setValue(buffer.text);
         editor.selection.setRange(buffer.selection);
      }
   }

   function dump () {
      return {
         text: editor.getValue(),
         language: controller.language && controller.language.id,
         selection: editor.selection.getRange()
      };
   }

   function focus () {
      editor.focus();
   }
   function insertLines (r1, c1, r2, c2, lines) {
      var delta = {
         action: 'insert',
         start: {row: r1, column: c1},
         end: {row: r2, column: c2},
         lines: lines
      };
      editor.session.doc.applyDeltas([delta]);
   }
   function deleteLines (r1, c1, r2, c2) {
      var delta = {
         action: 'remove',
         start: {row: r1, column: c1},
         end: {row: r2, column: c2}
      };
      editor.session.doc.applyDeltas([delta]);
   }
   function moveCursor (r1, c1) {
      editor.selection.setRange({
         start: {row: r1, column: c1},
         end: {row: r1, column: c1}
      });
   }
   function setSelection (r1, c1, r2, c2) {
      editor.selection.setRange({start: {row: r1, column: c1}, end: {row: r2, column: c2}});
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
   var tabset = tabsets.find(config.tabset);
   var controller = this;

   this.addTab = function () {
      var tab = tabset.addTab();
      tab.addBuffer('');  // XXX this should be done by the tab based on its mode
      this.selectTab(tab);
   }.bind(this);

   this.closeTab = function (tab) {
      tabset.removeTab(tab.id);
   };

   this.selectTab = function (tab) {
      tabset.setActiveTab(tab.id);
   };

   // Initialize controller data and reload it on 'changed' event.
   loadState();
   var unhookers = [
      $rootScope.$on('fioi-editor2_loadState', loadState)
   ];
   this.cleanup = function () {
      _.each(unhookers, function (func) { func(); });
   };

   //
   // Private function
   //

   // Load state from the tabs service.
   function loadState () {
      tabset = tabsets.find(config.tabset);
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
require('./services/recorder')(m);
require('./services/tabsets')(m);
require('./services/tabs')(m);
require('./services/buffers')(m);
require('./directives/editor')(m);
require('./directives/buffer')(m);

});
},{"./directives/buffer":3,"./directives/editor":5,"./main.css":6,"./services/buffers":8,"./services/recorder":9,"./services/tabs":10,"./services/tabsets":11}],8:[function(require,module,exports){
'use strict';
module.exports = function (m) {

/**
This service maintains a set of buffers.
*/
m.factory('FioiEditor2Buffers', BuffersFactory);
BuffersFactory.$inject = ['FioiEditor2Recorder'];
function BuffersFactory (recorder) {

   var service = {};
   var buffers = {};

   service.add = function (recording_id) {
      var id = recorder.freshId('b', recording_id);
      var buffer = buffers[id] = new Buffer(id);
      recorder.register(id, buffer);
      return buffer;
   };

   service.remove = function (id) {
      var buffer = buffers[id];
      if (buffer) {
         delete buffers[id];
      }
   };

   service.get = function (id) {
      return buffers[id];
   };

   function Buffer (id) {
      this.id = id;
      this.text = '';
      this.selection = {start: {row: 0, column: 0}, end: {row: 0, column: 0}};
      this.languages = null; // inherit from tab
      this.language = null; // must be set explicitly
      this.control = null;
   }
   Buffer.prototype.dump = function () {
      return {
         text: this.text,
         language: this.language,
         selection: this.selection
      };
   };
   Buffer.prototype.load = function (dump) {
      this.update(dump);
      return this;
   };
   Buffer.prototype.update = function (attrs, quiet) {
      if ('tab' in attrs)
         this.tab = attrs.tab;
      if ('languages' in attrs)
         this.languages = attrs.languages;
      if ('text' in attrs)
         this.text = attrs.text;
      if ('language' in attrs)
         this.language = attrs.language;
      if ('selection' in attrs)
         this.selection = _.clone(attrs.selection);
      if (!quiet)
         this.pushToControl();
      return this;
   };
   Buffer.prototype.getLanguages = function () {
      if (this.languages)
         return this.languages;
      return this.tab.getLanguages();
   };
   Buffer.prototype.attachControl = function (control) {
      this.control = control;
      return this;
   };
   Buffer.prototype.detachControl = function () {
      this.control = null;
      return this;
   };
   Buffer.prototype.pushToControl = function () {
      if (this.control)
         this.control.load(this);
      return this;
   };
   Buffer.prototype.pullFromControl = function () {
      if (this.control)
         this.update(this.control.dump(), true);
      return this;
   };
   Buffer.prototype.recordEvent = function (e) {
      e.unshift(this.id);
      recorder.addEvent(e);
   };
   Buffer.prototype.logInsert = function (r1, c1, r2, c2, ls) {
      recorder.addEvent([this.id, 'i', r1, c1, r2, c2].concat(ls));
   };
   Buffer.prototype.logDelete = function (r1, c1, r2, c2) {
      recorder.addEvent([this.id, 'd', r1, c1, r2, c2]);
   };
   Buffer.prototype.logCursor = function (row, column) {
      recorder.addEvent([this.id, 'c', row, column]);
   };
   Buffer.prototype.logSelect = function (r1, c1, r2, c2) {
      recorder.addEvent([this.id, 's', r1, c1, r2, c2]);
   };
   Buffer.prototype.focus = function () {
      if (this.control)
         this.control.focus();
   };
   Buffer.prototype.replayEvent = function (e) {
      var control = this.control;
      if (!control) {
         // TODO: emulate the event...
         return;
      }
      switch (e[2]) {
         case 'c': control.moveCursor(e[3], e[4]); break;
         case 'i': control.insertLines(e[3], e[4], e[5], e[6], e.slice(7)); break;
         case 'd': control.deleteLines(e[3], e[4], e[5], e[6]); break;
         case 's': control.setSelection(e[3], e[4], e[5], e[6]); break;
         default: console.log('Buffer ignored event', e[2]);
      }
   };

   return service;
}

};
},{}],9:[function(require,module,exports){
'use strict';
module.exports = function (m) {

m.factory('FioiEditor2Recorder', RecorderFactory);
RecorderFactory.$inject = ['$interval', '$rootScope'];
function RecorderFactory ($interval, $rootScope) {
   var service = {};
   var state = {
      isRecording: false,
      isPlaying: false,
      isPaused: false,
      segments: undefined,
      events: undefined,
      startTime: undefined,
      timeOffset: undefined,
      currentFrameTime: undefined,
      playInterval: undefined, // angular $interval handler
      playOffset: undefined, // offset in ms (rel. to startTime) of the last event played
      playCursor: undefined, // index in recording of the next event to replay
      options: null, // object with the dumpState() and loadState(state) functions.
      nextFreshId: 1, // counter used to generate fresh ids
      renaming: {}, // play-time id --> record-time id
      targets: {} // record-time id --> object instance
   };

   // Start a new recording.
   service.record = function (options) {
      if (state.isPlaying || state.isRecording)
         return false;
      state.isPaused = false;
      state.options = options;
      state.isRecording = true;
      state.timeOffset = 0;
      state.startTime = Date.now();
      state.playOffset = 0;
      state.events = [[0, '', '0', state.options.dumpState()]];
      state.segments = [];
   };

   // Play the given recording.
   service.play = function (recording, options) {
      if (state.isRecording || state.isPlaying)
         return false;
      state.isPlaying = true;
      state.recording = recording;
      state.options = options;
      state.playCursor = 0;
      state.startTime = Date.now();
      state.playOffset = 0;
      state.playInterval = $interval(playTick, 20);
   };

   // Pause the current operation.
   service.pause = function () {
      if (state.isPaused)
         return false;
      if (state.isRecording) {
         var duration = Date.now() - state.startTime;
         state.timeOffset += duration;
         state.segments.push({
            duration: duration,
            events: state.events
         });
         state.events = undefined;
         state.startTime = undefined;
         state.isPaused = true;
         return true;
      }
      if (state.isPlaying) {
         $interval.cancel(state.playInterval);
         state.playInterval = null;
         state.isPaused = true;
         return true;
      }
      return false;
   };

   // Resume (unpause) the current operation.
   service.resume = function () {
      if (!state.isPaused)
         return false;
      if (state.isRecording) {
         state.isPaused = false;
         state.startTime = Date.now();
         state.events = [[0, '', '0', state.options.dumpState()]];
         return true;
      }
      if (state.isPlaying) {
         state.isPaused = false;
         // XXX this is not quite right, ideally we should set startTime in
         // the past to (now - playOffset) and leave playOffset unchanged,
         // so that playOffset remains relative to the start of the audio
         // recording.
         state.startTime = Date.now();
         state.playOffset = 0;
         state.playInterval = $interval(playTick, 20);
      }
   };

   service.stop = function () {
      if (state.isRecording) {
         if (!state.isPaused)
            service.pause();
         // Combine the segments.
         var duration = 0;
         var events = [];
         _.each(state.segments, function (segment) {
            duration += segment.duration;
            Array.prototype.push.apply(events, segment.events);
         });
         var result = {
            duration:  duration,
            events: events
         };
         // Clear the recorder state.
         state.isRecording = false;
         state.segments = undefined;
         state.options = null;
         return result;
      }
      if (state.isPlaying) {
         if (!state.isPaused)
            service.pause();
         state.events = undefined;
         state.options = null;
         return;
      }
      return false;
   };

   service.register = function (id, target) {
      // If the component is part of the recording we should have an entry
      // mapping its id to the corresponding id used in the recording.
      if (id in state.renaming) {
         id = state.renaming[id];
         state.targets[id] = target;
      }
   };

   service.addEvent = function (event) {
      if (!state.isRecording)
         return;

      // Use the same timestamp for all recorded events until the next repaint.
      if (typeof state.currentFrameTime !== 'number') {
         state.currentFrameTime = Math.floor(Date.now() - state.startTime);
         window.requestAnimationFrame(function () {
            state.currentFrameTime = undefined;
         });
      }

      var delta = state.currentFrameTime - state.playOffset;
      state.playOffset = state.currentFrameTime;
      event.unshift(delta);
      state.events.push(event);
   };

   service.freshId = function (prefix, recording_id) {
      var new_id = prefix.toString() + state.nextFreshId;
      state.nextFreshId += 1;
      if (typeof recording_id === 'string') {
         // Map the new id to the recording id provided.
         state.renaming[new_id] = recording_id;
      }
      return new_id;
   };

   function playTick () {
      var cursor = state.playCursor;
      var playUntil = Math.floor(Date.now() - state.startTime - state.playOffset);
      var timeElapsed = 0;
      var events = state.recording.events;
      while (cursor < events.length && timeElapsed <= playUntil) {
         var event = events[cursor];
         timeElapsed += event[0];
         var id = event[1];
         var op = event[2];
         try {
            // If we have an object registered as the event's target,
            // automatically pass the event to that object.  Objects
            // typically register when the a state dump is reloaded.
            if (id in state.targets)
               state.targets[id].replayEvent(event);
            // An empty target id ('') indicates a global event.
            if (id === '') {
               if (op === '0') {
                  // Global state reset.  Clear the targets registry.
                  state.targets = {};
                  state.options.loadState(event[3]);
                  $rootScope.$emit('fioi-editor2_loadState');
               }
            }
            // Pass all events to the handler in options, if given.
            if (typeof state.options.replayEvent === 'function')
               state.options.replayEvent(event);
            cursor += 1;
         } catch (ex) {
            console.log('An exception occurred!', ex);
            state.exception = ex;
            service.pause();
            break;
         }
      }
      state.playOffset += timeElapsed;
      state.playCursor = cursor;
      if (cursor == events.length) {
         $interval.cancel(state.playInterval);
         state.playInterval = null;
         service.stop();
      }
   }

   return service;
}

};

},{}],10:[function(require,module,exports){
'use strict';
module.exports = function (m) {

/**
This service acts as storage for sets of tabs, where each
tab holds a sequence of 1 or 2 text buffers.

The service can dump/load its state to/from a JSON object.

*/
m.factory('FioiEditor2Tabs', TabsServiceFactory);
TabsServiceFactory.$inject = ['$rootScope', 'FioiEditor2Buffers', 'FioiEditor2Recorder'];
function TabsServiceFactory ($rootScope, buffers, recorder) {

   var service = {};
   var tabs = {};

   service.add = function (recording_id) {
      var id = recorder.freshId('t', recording_id);
      var tab = tabs[id] = new Tab(id);
      recorder.register(id, tab);
      return tab;
   };

   service.remove = function (id) {
      var tab = tabs[id];
      tab.clear();
      delete tabs[id];
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
      return this;
   }
   Tab.prototype.addBuffer = function (id) {
      var buffer = buffers.add(id).update({
         tab: this,
         language: this.getDefaultLanguage()
      });
      this.buffers.push(buffer.id);
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
            return [id, buffer.dump()];
         })
      };
   };
   Tab.prototype.load = function (dump) {
      this.title = dump.title;
      _.each(dump.buffers, function (buffer_dump) {
         this.addBuffer(buffer_dump[0]).load(buffer_dump[1]);
      }.bind(this));
      return this;
   };

   Tab.prototype.clear = function () {
      this.title = null;
      _.each(this.buffers, function (id) {
         buffers.remove(id);
      });
      this.buffers = [];
   };
   Tab.prototype.replayEvent = function (event) {
      console.log('unhandled Tab event', event);
   };

   return service;
}

};
},{}],11:[function(require,module,exports){
'use strict';
module.exports = function (m) {

/**
This service stores tabsets.
*/
m.factory('FioiEditor2Tabsets', TabsetsServiceFactory);
TabsetsServiceFactory.$inject = ['$rootScope', 'FioiEditor2Tabs', 'FioiEditor2Recorder'];
function TabsetsServiceFactory ($rootScope, tabs, recorder) {

   var service = {};
   var tabsets = {};

   service.add = function (recording_id) {
      var id = recorder.freshId('ts', recording_id);
      var tabset = tabsets[id] = new Tabset(id);
      recorder.register(id, tabset);
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
      if ('languages' in attrs)
         this.languages = attrs.languages;
      if ('defaultLanguage' in attrs)
         this.defaultLanguage = attrs.defaultLanguage;
      if ('activeTabId' in attrs)
         this.activeTabId = activeTabId;
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
      return tab;
   };
   Tabset.prototype.removeTab = function (id) {
      _.pull(this.tabIds, id);
      delete this.tabs[id];
   };
   Tabset.prototype.clear = function () {
      _.each(this.tabIds, function (id) {
         tabs.remove(id);
      });
      this.tabs = {};
      this.tabIds = [];
      this.activeTabId = null;
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
      this.activeTab = dump.activeTabId;
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
},{}]},{},[7])


//# sourceMappingURL=fioi-editor2.js.map
