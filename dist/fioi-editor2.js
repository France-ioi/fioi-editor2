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
module.exports = "<div><div ui-ace=\"{onLoad: vm.aceLoaded}\" ng-readonly=\"vm.readOnly\"></div><div ng-if=\"vm.showLanguageSelector\"><span>Langage du fichier :</span><select ng-model=\"vm.language\" ng-options=\"option as option.label for option in vm.languageOptions track by option.id\" ng-change=\"vm.languageChanged()\"></select></div></div>";

},{}],3:[function(require,module,exports){
module.exports = function (m) {
'use strict';

m.directive('fioiEditor2Buffer', bufferDirective);
bufferDirective.$inject = ['FioiEditor2Signals'];
function bufferDirective (signals) {
   return {
      restrict: 'E',
      scope: {
         buffer: '@',
         onInit: '&',
         readOnly: '='
      },
      template: require('./buffer.jade'),
      controllerAs: 'vm',
      bindToController: true,
      require: '^fioiEditor2',
      replace: true,
      controller: BufferController,
      link: function (scope, iElement, iAttrs, editorController) {
         // Bind update events to the controller's update() function.
         var unhookUpdate = signals.on('update', update);
         scope.$on('$destroy', function () {
            unhookUpdate();
            scope.vm.cleanup();
         });
         scope.vm.update();
         function update() {
            scope.$apply(function () {
               scope.vm.update();
            });
         }
      }
   };
}

BufferController.$inject = ['FioiEditor2Signals', 'FioiEditor2Buffers'];
function BufferController (signals, buffers) {

   var controller = this;
   var buffer = null;
   var editor = null; // the ACE object

   this.update = function () {
      this.cleanup();
      buffer = buffers.get(this.buffer);
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
      buffer.pushToControl();
   };

   this.cleanup = function () {
      if (buffer) {
         buffer.pullFromControl();
         buffer.detachControl();
         buffer = null;
      }
   };

   this.aceLoaded = function (editor_) {
      // We get this event before update() is called from the link function.
      editor = editor_;

      // Get rid of the following Ace warning:
      // "Automatically scrolling cursor into view after selection change
      //  this will be disabled in the next version
      //  set editor.$blockScrolling = Infinity to disable this message"
      editor.$blockScrolling = Infinity;

      // Stop overriding Cmd/Ctrl-L. It's used to by browser to go to the
      // location bar, but ace wants to use it for go-to-line.
      editor.commands.removeCommand("gotoline");

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
            buffer.logCursor(r.start.row, r.start.column);
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

   function load () {
      controller.languageOptions = buffer.getLanguages();
      controller.showLanguageSelector = controller.languageOptions.length > 1;
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
module.exports = "<div class=\"fioi-editor2\"><ul class=\"fioi-editor2_tabs\"><li ng-click=\"vm.addTab()\" title=\"ajouter un {{vm.typeName}}\" class=\"fioi-editor2_new-tab\">+</li><li ng-repeat=\"tab in vm.tabs track by tab.id\" ng-class=\"{\'active\':tab.id===vm.tab.id}\" ng-click=\"vm.selectTab(tab)\" class=\"fioi-editor2_tab\"><span class=\"fioi-editor2_tab-title\">{{tab.title}}</span><span ng-click=\"vm.closeTab(tab, $event)\" class=\"fioi-editor2_close-tab\">×</span></li></ul><div ng-class=\"vm.buffersClasses\" class=\"fioi-editor2_buffers\"><div ng-if=\"!vm.tab.buffers\">no tabs</div><div ng-repeat=\"buffer in vm.tab.buffers track by buffer\"><div ng-if=\"vm.bufferNames\" class=\"fioi-editor2_buffer_title\">{{vm.bufferNames[$index]}}</div><fioi-editor2-buffer buffer=\"{{::buffer}}\"></fioi-editor2-buffer></div></div></div>";

},{}],5:[function(require,module,exports){
module.exports = function (m) {
'use strict';

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
editorDirective.$inject = ['FioiEditor2Signals'];
function editorDirective (signals) {
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
         // Bind update events to the controller's update() function.
         var unhookUpdate = signals.on('update', update);
         scope.$on('$destroy', function () {
            unhookUpdate();
         });
         scope.vm.update();
         function update() {
            scope.$apply(function () {
               scope.vm.update();
            });
         }
      }
   };
}

EditorController.$inject = ['FioiEditor2Tabsets'];
function EditorController (tabsets) {

   var controller = this;
   var tabset = null;

   this.typeName = 'onglet';

   this.addTab = function () {
      var tab = tabset.addTab();
      this.selectTab(tab);
   }.bind(this);

   this.closeTab = function (tab, event) {
      tabset.removeTab(tab.id);
      // Prevent the click event from triggering selectTab for the removed tab.
      event.stopPropagation();
   };

   this.selectTab = function (tab) {
      tabset.update({activeTabId: tab.id});
   };

   // Update state from the tabs service.
   this.update = function () {
      var config = controller.fioiEditor2();
      var classes = controller.buffersClasses = {};
      controller.tabs = [];
      controller.tab = null;
      if (!config) {
         classes['fioi-editor2_error'] = true;
         return;
      }
      tabset = tabsets.find(config.tabset);
      if (!tabset) {
         classes['fioi-editor2_error'] = true;
         return;
      }
      this.typeName = tabset.typeName;
      this.readOnly = tabset.readOnly;
      this.bufferNames = tabset.bufferNames;
      controller.tabs = _.map(tabset.getTabs(), function (tab) {
         return {id: tab.id, title: tab.title};
      });
      if (controller.tabs.length === 0) {
         classes['fioi-editor2_empty'] = true;
         return;
      }
      var tab = tabset.getActiveTab();
      if (!tab) {
         classes['fioi-editor2_no-active-tab'] = true;
         return;
      }
      controller.tab = {
         id: tab.id,
         title: tab.title,
         buffers: tab.buffers
      };
      classes['fioi-editor2_'+tab.buffers.length+'-buffers'] = true;
   };

}

};

},{"./editor.jade":4}],6:[function(require,module,exports){
var css = ".fioi-editor2 {\n   width: 762px;\n}\n\nul.fioi-editor2_tabs {\n   font: bold 11px Verdana, Arial, sans-serif;\n   list-style-type: none;\n   padding-bottom: 24px;\n   border-bottom: 1px solid #CCCCCC;\n   margin: 0;\n}\n\nul.fioi-editor2_tabs > li {\n   float: left;\n   height: 21px;\n   line-height: 21px;\n   padding: 0 7px;\n   background-color: #E0F3DB;\n   margin: 2px 2px 0 2px;\n   border: 1px solid #CCCCCC;\n   cursor: pointer;\n}\n\nul.fioi-editor2_tabs > li.active {\n   border-bottom: 1px solid #fff;\n   background-color: #FFFFFF;\n}\n\nul.fioi-editor2_tabs > li:hover .fioi-editor2_tab-title {\n   text-decoration: underline;\n}\n\n.fioi-editor2_close-tab {\n   padding: 0px 2px;\n   margin-left: 2px;\n   border-radius: 3px;\n}\n\n.fioi-editor2_close-tab:hover {\n   background-color: #D8D8D8;\n}\n\n.fioi-editor2_buffers {\n   width: 100%;\n   overflow: hidden;\n}\n\n.fioi-editor2_empty {\n   width: 762px;\n   border: 1px solid #CCCCCC;\n   border-top: none;\n   font-style: italic;\n   padding: 10px;\n   color: #888;\n}\n\n.fioi-editor2_buffers .ace_editor {\n   height: 350px; /* 14px * 25 lines */\n   border: 1px solid #CCCCCC;\n   border-top: none;\n}\n\n.fioi-editor2_1-buffers .ace_editor {\n   width: 762px;\n}\n.fioi-editor2_2-buffers .ace_editor {\n   width: 379px;\n}\n.fioi-editor2_2-buffers > div {\n  float: left;\n}\n\n.fioi-editor2_buffer_title {\n   font: bold 11px Verdana, Arial, sans-serif;\n   border: 1px solid #CCCCCC;\n   border-top: none;\n   line-height: 20px;\n   vertical-align: middle;\n   padding-left: 10px;\n}"; (require("./../node_modules/cssify"))(css); module.exports = css;
},{"./../node_modules/cssify":1}],7:[function(require,module,exports){
define(['module', 'angular', 'lodash', 'angular-ui-ace'], function (module, angular, _) {
'use strict';

require('./main.css');

var m = angular.module('fioi-editor2', ['ui.ace']);

m.factory('FioiEditor2Config', function () {
   var service = {};
   // Set rootUri to the directory containing the compiled fioi-editor2.js,
   // whose URI will be made available by require.js as module.uri.
   service.rootUri = module.uri.replace(/\/[^/]*$/, '');
   return service;
});

require('./services/signals')(m);
require('./services/registry')(m);
require('./services/audio')(m);
require('./services/recorder')(m);
require('./services/player')(m);
require('./services/tabsets')(m);
require('./services/tabs')(m);
require('./services/buffers')(m);
require('./directives/editor')(m);
require('./directives/buffer')(m);

});

},{"./directives/buffer":3,"./directives/editor":5,"./main.css":6,"./services/audio":8,"./services/buffers":9,"./services/player":10,"./services/recorder":11,"./services/registry":12,"./services/signals":13,"./services/tabs":14,"./services/tabsets":15}],8:[function(require,module,exports){
module.exports = function (m) {
'use strict';

m.factory('FioiEditor2Audio', AudioFactory);
AudioFactory.$inject = ['FioiEditor2Config', '$location', '$rootScope', '$q'];
function AudioFactory (config, $location, $rootScope, $q) {

   var service = {
      error: null
   };
   var workerPath = config.rootUri + "/audio-worker.js";
   var state = {
      nextCallbackId: 1,
      source: null,
      recording: false
   };

   var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

   // Call prepareRecording to ensure that the page has obtained permission
   // to record audio from the user.  The user can delay replying indefinitely.
   service.prepareRecording = function (callback) {
      if (service.error)
         return callback(service.error);
      getUserMedia.call(navigator, {audio: true}, function (stream) {
         return callback(null, stream);
      }, function (err) {
         return callback("getUserMedia error: " + err);
      });
   };

   service.isRecording = function () {
      return state.recording;
   };

   // Start recording.  The stream argument must be obtained by calling
   // prepareRecording.
   service.startRecording = function (stream) {
      return $q(function (resolve, reject) {

         var audioContext = new AudioContext();
         var source = state.source = audioContext.createMediaStreamSource(stream);

         // XXX Make the native sample rate available on the service.
         var sampleRate = source.context.sampleRate;

         // Create a worker to hold and process the audio buffers.
         // The worker is reused across calls to startRecording.
         state.worker ? afterWorkerLoaded() : spawnWorker(afterWorkerLoaded);

         function afterWorkerLoaded () {
            state.worker.onmessage = function (e) {
               var callbackId = e.data.callbackId;
               $rootScope.$emit(callbackId, e.data.result);
            };
            state.worker.postMessage({
               command: "init",
               config: {
                  sampleRate: sampleRate
               }
            });

            // Process the audio samples using a script function.
            var node = state.node = source.context.createScriptProcessor(4096, 2, 2);
            node.onaudioprocess = function (event) {
               // Discard samples unless recording.
               if (!state.recording)
                  return;
               // Pass the buffer on to the worker.
               state.worker.postMessage({
                  command: "record",
                  buffer: [
                     event.inputBuffer.getChannelData(0),
                     event.inputBuffer.getChannelData(1)
                  ]
               });
            };

            source.connect(node);
            node.connect(audioContext.destination);

            state.recording = true;
            resolve({sampleRate: sampleRate});
         }
      });
   };

   function spawnWorker (callback) {
      state.worker = new Worker(workerPath);
      state.worker.onmessage = function () {
         state.worker.onmessage = null;
         callback();
      };
   }

   // Stop recording.  Returns a promise which will resolve to the
   // recording result.
   service.stopRecording = function () {
      return $q(function (resolve, reject) {
         state.recording = false;
         state.node.disconnect();
         state.node = null;
         state.source.disconnect();
         state.source = null;
         state.worker.postMessage({
            command: "finishRecording",
            callbackId: eventizeCallback(resolve)
         });
      });
   };

   service.combineRecordings = function (urls, encodingOptions) {
      return $q(function (resolve, reject) {
         state.worker.postMessage({
            command: "combineRecordings",
            recordings: urls,
            options: encodingOptions,
            callbackId: eventizeCallback(resolve)
         });
      });
   };

   service.getPlayer = function (url) {
      var element = new Audio();
      element.src = url;
      return element;
   };

   service.clearRecordings = function () {
      return $q(function (resolve, reject) {
         if (!state.worker)
            return resolve();
         state.worker.postMessage({
            command: "clearRecordings",
            callbackId: eventizeCallback(resolve)
         });
      });
   };

   service.getRecording = function (url) {
      return $q(function (resolve, reject) {
         state.worker.postMessage({
            command: "getRecording",
            recording: url,
            callbackId: eventizeCallback(resolve)
         });
      });
   };

   function eventizeCallback (callback) {
      var name = 'fioi-editor2_audio-callback_' + state.nextCallbackId;
      state.nextCallbackId += 1;
      var deregister = $rootScope.$on(name, function (event, arg) {
         deregister();
         callback(arg);
      });
      return name;
   }

   function brokenService (err) {
      service.error = err;
      return service;
   }

   // Feature checking

   if (!getUserMedia || !window.AudioContext){
      return brokenService('Audio recording is not supported by this browser');
   }

   if (!window.Worker) {
      return brokenService('Audio recording requires Web Worker support');
   }

   var proto = $location.protocol();
   if (proto === 'file') {
      // getUserMedia calls neither of its callbacks on Chrome when the code
      // is loaded from a file:// URL.
      return brokenService('Audio recording is not available on local URLs');
   }
   if (proto === 'http') {
      // getUserMedia is deprecated on insecure transports.
      console.log('Audio recording is deprecated on insecure transports');
   }

   return service;
}

};

},{}],9:[function(require,module,exports){
module.exports = function (m) {
'use strict';

/**
This service maintains a set of buffers.
*/
m.factory('FioiEditor2Buffers', BuffersFactory);
BuffersFactory.$inject = ['FioiEditor2Recorder', 'FioiEditor2Registry'];
function BuffersFactory (recorder, registry) {

   var service = {};
   var buffers = {};

   service.add = function (recording_id) {
      var id = registry.freshId('b', recording_id);
      var buffer = buffers[id] = new Buffer(id);
      registry.register(id, buffer);
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
         this.text = attrs.text.toString();
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
         this.control.load();
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

},{}],10:[function(require,module,exports){
module.exports = function (m) {
'use strict';

m.factory('FioiEditor2Player', PlayerFactory);
PlayerFactory.$inject = ['$q', '$interval', '$sce', 'FioiEditor2Audio', 'FioiEditor2Registry', 'FioiEditor2Signals'];
function PlayerFactory ($q, $interval, $sce, audio, registry, signals) {
   var service = {};
   var state = {
      options: null, // object with the dumpState() and loadState(state) functions.
      recording: null,
      startTime: null,
      isPlaying: false,
      isPaused: false,
      playInterval: undefined, // angular $interval handler
      playOffset: undefined, // offset in ms (rel. to startTime) of the last event played
      playCursor: undefined // index in recording of the next event to replay
   };

   // Start playing back the given recording.
   service.start = function (recording, options) {
      return $q(function (resolve, reject) {
         if (state.isPlaying)
            return reject('playback is already in progress');
         state.options = options;
         state.recording = recording;
         state.startTime = Date.now();
         state.isPlaying = true;
         state.isPaused = false;
         state.playInterval = $interval(playTick, 20);
         state.playOffset = 0;
         state.playCursor = 0;
         if (recording.audioUrl) {
            state.audio = audio.getPlayer(recording.audioUrl);
            state.audio.play();
         }
         resolve();
      });
   };

   // Pause playback.
   service.pause = function () {
      return $q(function (resolve, reject) {
         if (!state.isPlaying)
            return reject('playback is not in progress');
         if (state.isPaused)
            return resolve();
         if (state.audio)
            state.audio.pause();
         $interval.cancel(state.playInterval);
         state.resumeState = state.options.dumpState();
         state.playInterval = null;
         state.isPaused = true;
         resolve();
      });
   };

   // Resume playback.
   service.resume = function () {
      return $q(function (resolve, reject) {
         if (!state.isPlaying)
            return reject('playback is not in progress');
         if (!state.isPaused)
            resolve();
         state.isPaused = false;
         registry.clear();
         state.options.loadState(state.resumeState);
         if (state.audio)
            state.audio.play();
         // Set a fake startTime such that state.playOffset keeps its meaning
         // as the current position (in milliseconds) in the recording.
         state.startTime = Date.now() - state.playOffset;
         state.playInterval = $interval(playTick, 20);
         return resolve();
      });
   };

   // Stop playback.
   service.stop = function () {
      return $q(function (resolve, reject) {
         // Pause before stopping.
         if (!state.isPaused) {
            return service.pause().then(afterPaused, reject);
         } else {
            return afterPaused();
         }
         function afterPaused () {
            state.isPlaying = false;
            state.isPaused = false;
            state.events = undefined;
            state.options = null;
            state.audio = null;
            resolve();
         }
      });
   };

   service.rewind = function () {
      // audio.currentTime = 0;
   }

   function playTick () {
      // Discard a tick event that was queued before playing was paused or stopped.
      if (!state.playInterval)
         return;
      var cursor = state.playCursor;
      var playUntil;
      if (state.audio) {
         playUntil = Math.floor(state.audio.currentTime * 1000) - state.playOffset;
      } else {
         playUntil = Math.floor(Date.now() - state.startTime - state.playOffset);
      }
      var timeElapsed = 0;
      var events = state.recording.events;
      while (cursor < events.length) {
         var event = events[cursor];
         if (timeElapsed + event[0] > playUntil)
            break;
         timeElapsed += event[0];
         var id = event[1];
         var op = event[2];
         try {
            // An empty target id ('') indicates a global event.
            // Handle these events before passing them to targets and to the
            // replayEvent options, so that the '0' event is able to reload
            // the initial state (and set up the targets mapping) first.
            if (id === '') {
               if (op === '0') {
                  // Global state reset.  Clear the targets registry.
                  registry.clear();
                  state.options.loadState(event[3]);
                  signals.emitUpdate();
               }
            }
            // If we have an object registered as the event's target,
            // automatically pass the event to that object.  Objects
            // typically register when the a state dump is reloaded.
            var target = registry.getTarget(id);
            if (target)
               target.replayEvent(event);
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
         signals.emit('done');
      }
   }

   return service;
}

};

},{}],11:[function(require,module,exports){
module.exports = function (m) {
'use strict';

m.factory('FioiEditor2Recorder', RecorderFactory);
RecorderFactory.$inject = ['$q', '$interval', '$sce', 'FioiEditor2Audio'];
function RecorderFactory ($q, $interval, $sce, audio) {
   var service = {};
   var state = {
      options: null, // object with the dumpState() and loadState(state) functions.
      isRecording: false, // Is recording in progress?
      isPaused: false,  // Is recording paused?
      segments: undefined, // Array of previously recorded segments.
      events: undefined, // Array of events recorded as part of the current segment.
      startTime: undefined, // Clock time of the start of recording (adjusted to pretend all segments were recorded with no pauses).
      timeOffset: undefined, // Timestamp (relative time in ms) of the start of the segment currently being recorded.
      currentFrameTime: undefined, // Timestamp (relative time in ms) of the current frame.
      lastEventTime: undefined // Timestamp (relative time in ms) of the last recorded event.
   };

   // Start a new recording.
   service.record = function (options) {
      return $q(function (resolve, reject) {
         if (state.isRecording)
            return reject('an operation is already in progress');
         audio.clearRecordings();
         audio.prepareRecording(function (err, stream) {
            if (err)
               return reject(err);
            state.audioStream = stream;
            afterAudio();
         });
         function afterAudio () {
            state.isPaused = false;
            state.options = options;
            state.isRecording = true;
            state.timeOffset = 0;
            state.startTime = Date.now();
            state.lastEventTime = 0;
            state.events = [[0, '', '0', state.options.dumpState()]];
            state.segments = [];
            if (state.audioStream) {
               audio.startRecording(state.audioStream).then(resolve, reject);
            } else {
               resolve({});
            }
         }
      });
   };

   // Pause recording, completing a segment.
   service.pause = function () {
      return $q(function (resolve, reject) {
         if (!state.isRecording)
            reject('no operation to pause');
         if (state.isPaused)
            return reject('not paused');
         // Add a null event at the end of the stream to avoid stopping the
         // sound track prematurely during replay.
         service.addEvent(['', '']);
         var duration = Date.now() - state.startTime;
         var segment = {
            duration: duration,
            events: state.events
         };
         state.events = undefined;
         state.timeOffset += duration;
         state.startTime = undefined;
         state.isPaused = true;
         if (!state.audioStream)
            return afterAudio();
         audio.stopRecording().then(function (result) {
            segment.audioUrl = result.url;
            segment.safeAudioUrl = $sce.trustAsResourceUrl(result.url);
            afterAudio();
         }, function (err) {
            // TODO: reload the initial state of the dropped segment.
            reject(err);
         });
         function afterAudio () {
            state.segments.push(segment);
            resolve(segment);
         }
      });
   };

   // Resume recording, starting a new segment.
   service.resume = function () {
      return $q(function (resolve, reject) {
         if (!state.isRecording)
            reject('not recording');
         if (!state.isPaused)
            reject('not paused');
         state.isPaused = false;
         state.startTime = Date.now();
         state.events = [[0, '', '0', state.options.dumpState()]];
         if (state.audioStream) {
            audio.startRecording(state.audioStream).then(resolve, reject);
         } else {
            resolve();
         }
      });
   };

   // Stop recording.  Segments are joined and the returned promise is resolved
   // with the completed recording.  Audio encoding is handled separately.
   service.stop = function (encodingOptions) {
      return $q(function (resolve, reject) {
         if (!state.isRecording)
            reject('not recording');
         // TODO: set a 'isStopping' flag so that recording cannot be resumed
         // while we are asynchronously waiting on audio operations.
         if (!state.isPaused) {
            return service.pause().then(function () {
               afterPaused();
            }, function (err) {
               reject(err);
            });
         } else {
            return afterPaused();
         }
         function afterPaused () {
            var duration = 0;
            var events = [];
            var audioUrls = [];
            _.each(state.segments, function (segment) {
               duration += segment.duration;
               Array.prototype.push.apply(events, segment.events);
               audioUrls.push(segment.audioUrl);
            });
            var result = {
               duration:  duration,
               events: events,
               audioUrls: audioUrls
            };
            state.isRecording = false;
            state.isPaused = false;
            state.segments = undefined;
            state.options = null;
            resolve(result);
         }
      });
   };

   service.finalize = function (recording, encodingOptions) {
      return $q(function (resolve, reject) {
         audio.combineRecordings(recording.audioUrls, encodingOptions).then(afterCombineRecordings, reject);
         function afterCombineRecordings (combinedAudio) {
            if (combinedAudio) {
               var audioUrl = URL.createObjectURL(combinedAudio.wav);
               recording.audioBlob = combinedAudio.wav;
               recording.audioEncoding = combinedAudio.encoding;
               recording.audioUrl = audioUrl;
               recording.safeAudioUrl = $sce.trustAsResourceUrl(audioUrl);
            }
            resolve(recording);
         }
      });
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

      var delta = state.currentFrameTime - state.lastEventTime;
      state.lastEventTime = state.currentFrameTime;
      event.unshift(delta);
      state.events.push(event);
   };

   return service;
}

};

},{}],12:[function(require,module,exports){
module.exports = function (m) {
'use strict';

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

},{}],13:[function(require,module,exports){
module.exports = function (m) {
'use strict';

m.factory('FioiEditor2Signals', SignalsFactory);
SignalsFactory.$inject = ['$rootScope'];
function SignalsFactory ($rootScope) {

   var prefix = 'fioi-editor2_';
   var service = {};
   var pending = {};
   var mustEmit = false;
   var willEmit = false;
   var defer = false;

   service.on = function (signal, handler) {
      return $rootScope.$on(prefix + signal, handler);
   };

   service.defer = function (flag) {
      defer = flag;
      if (mustEmit && !willEmit)
         doEmit();
   };

   service.emitUpdate = function () {
      this.emit('update');
   };

   service.emit = function (signal) {
      if (pending[signal])
         return;
      pending[signal] = true;
      mustEmit = true;
      if (defer || willEmit)
         return;
      willEmit = true;
      window.requestAnimationFrame(doEmit);
   };

   function doEmit () {
      var signals = pending;
      pending = {};
      mustEmit = false;
      willEmit = false;
      _.each(signals, function (flag, signal) {
         $rootScope.$emit(prefix + signal);
      });
   }

   return service;
}

};

},{}],14:[function(require,module,exports){
module.exports = function (m) {
'use strict';

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
   Tab.prototype.update = function (attrs, quiet) {
      if ('tabset' in attrs)
         this.tabset = attrs.tabset;
      if ('title' in attrs)
         this.title = attrs.title;
      if ('languages' in attrs)
         this.languages = attrs.languages;
      if ('defaultLanguage' in attrs)
         this.defaultLanguage = attrs.defaultLanguage;
      if (!quiet) {
         recorder.addEvent([this.id, 'u', attrs]);
         signals.emitUpdate();
      }
      return this;
   };
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
   };
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
         console.log('unhandled Tab event', event);
      }
   };

   return service;
}

};

},{}],15:[function(require,module,exports){
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
      if ('typeName' in attrs)
         this.typeName = attrs.typeName;
      if ('readOnly' in attrs)
         this.readOnly = attrs.readOnly;
      if ('bufferNames' in attrs)
         this.bufferNames = attrs.bufferNames;
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

},{}]},{},[7])


//# sourceMappingURL=fioi-editor2.js.map
