import _ from 'lodash';
import bufferTemplate from './buffer.jade!';

bufferDirective.$inject = ['FioiEditor2Signals'];
export function bufferDirective (signals) {
   return {
      restrict: 'E',
      scope: {
         buffer: '@',
         onInit: '&'
      },
      template: bufferTemplate({}),
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
            $("#choose-view").off('click', scope.vm.updateBlockly);
            scope.vm.cleanup();
         });
         scope.vm.update();
         function update() {
            scope.$apply(function () {
               scope.vm.update();
            });
         }

        $("#choose-view").on('click', scope.vm.updateBlockly);
      }
   };
}

BufferController.$inject = ['FioiEditor2Signals', 'FioiEditor2Buffers'];
function BufferController (signals, buffers) {

   var controller = this;
   var buffer = null;
   var aceEditor = null; // the ACE object

   var description = '';

   var readOnly = false;

   var isAce = false;
   var isBlockly = false;

   var blocklyLoading = false;
   var blocklyLoaded = false;
   var newLang = '';
   var fullscreenEvents = false;

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
      unloadBlockly();
      if (controller.fullscreenEvents) {
        document.removeEventListener("fullscreenchange", updateFullscreen);
        document.removeEventListener("webkitfullscreenchange", updateFullscreen);
        document.removeEventListener("mozfullscreenchange", updateFullscreen);
        document.removeEventListener("MSFullscreenChange", updateFullscreen);
        controller.fullscreenEvents = false;
      }
   };

   this.aceLoaded = function (aceEditor_) {
      // We get this event before update() is called from the link function.
      aceEditor = aceEditor_;

      // Get rid of the following Ace warning:
      // "Automatically scrolling cursor into view after selection change
      //  this will be disabled in the next version
      //  set aceEditor.$blockScrolling = Infinity to disable this message"
      aceEditor.$blockScrolling = Infinity;

      // Stop overriding Cmd/Ctrl-L. It's used to by browser to go to the
      // location bar, but ace wants to use it for go-to-line.
      aceEditor.commands.removeCommand("gotoline");

      // Set up read-only mode
      aceEditor.setReadOnly(controller.readOnly);

      // Hook up events for recording.
      aceEditor.session.doc.on("change", function (e) {
         if (e.action === 'insert') {
            buffer.logInsert(e.start.row, e.start.column, e.end.row, e.end.column, e.lines);
         } else {
            buffer.logDelete(e.start.row, e.start.column, e.end.row, e.end.column);
         }
      }, true);
      aceEditor.selection.addEventListener("changeCursor", function () {
         if (aceEditor.selection.isEmpty()) {
            var r = aceEditor.selection.getRange();
            buffer.logCursor(r.start.row, r.start.column);
         }
      }, true);
      aceEditor.selection.addEventListener("changeSelection", function () {
         var r = aceEditor.selection.getRange();
         buffer.logSelect(r.start.row, r.start.column, r.end.row, r.end.column);
      }, true);
   };

   this.languageChanged = function () {
      if (controller.isAce && ('blockly' in controller.language) && (aceEditor.getValue() != '')) {
        controller.newLang = controller.language.id;
        $("#langChangeModal #modalMsg").text(" Changer vers le mode Blockly effacera votre code actuel !");
        $("#langChangeModal").modal("show");
        controller.language = _.find(controller.languageOptions,
           function (language) { return language.id == buffer.language; });
      } else if (controller.isBlockly && !('blockly' in controller.language)) {
        controller.newLang = controller.language.id;
        $("#langChangeModal #modalMsg").text(" Changer vers le mode normal effacera vos blocs actuels !");
        $("#langChangeModal").modal("show");
        controller.language = _.find(controller.languageOptions,
           function (language) { return language.id == buffer.language; });
      } else {
        changeLanguage(controller.language.id, false);
      }
   }

   this.langConfirm = function () {
      $("#langChangeModal").modal("hide");
      changeLanguage(controller.newLang, true);
   }

   this.blocklyToTab = function () {
      if (!controller.isBlockly) return;
      var newTab = buffer.tab.tabset.addTab()
      
      newTab.getBuffer().update({
        text: Blockly.Python.workspaceToCode(blocklyHelper.workspace),
        language: controller.language.blockly.dstlang
      });
   }

   this.blocklyToJsTab = function () {
      if (!controller.isBlockly) return;
      var newTab = buffer.tab.tabset.addTab()
      
      newTab.getBuffer().update({
        text: Blockly.JavaScript.workspaceToCode(blocklyHelper.workspace),
        language: 'java'
      });
   }

   function changeLanguage (lang, wipesrc) {
      controller.language = _.find(controller.languageOptions,
         function (language) { return language.id == lang; });

      buffer.pullFromControl();
      if (wipesrc) {
        buffer.text = '';
      }
      buffer.pushToControl();
   };

   function loadBlockly () {
    if (!blocklyLoading && controller.isBlockly && ($("#editor").css('display') != 'none')) {
      blocklyLoading = true;
      require(['blockly-lib'], function () {
        blocklyHelper.mainContext = {"nbRobots": 1};
        blocklyHelper.prevWidth = 0;
        setTimeout(function() {
           blocklyHelper.load("fr", "blocklyDiv", true, controller.readOnly);
           blocklyHelper.updateSize();
           Blockly.Blocks.ONE_BASED_INDEXING = true;
           Blockly.Python.ONE_BASED_INDEXING = true;
           Blockly.WidgetDiv.DIV = $(".blocklyWidgetDiv").clone().appendTo("#blocklyDiv")[0];
           Blockly.Tooltip.DIV = $(".blocklyTooltipDiv").clone().appendTo("#blocklyDiv")[0];
           $(".blocklyToolboxDiv").appendTo("#blocklyDiv");
        }, 50);
        setTimeout(function() {
           if (blocklyLoading) {
             if (buffer && buffer.text && !blocklyLoaded) {
               Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(buffer.text), blocklyHelper.workspace);
             }
             blocklyLoaded = true;
             Blockly.clipboardXml_ = window.blocklyClipboard;
             Blockly.clipboardSource_ = blocklyHelper.workspace;
           }
        }, 100);
      });
    } 
   }

   function unloadBlockly () {
      if (blocklyLoading) {
        window.blocklyClipboard = Blockly.clipboardXml_;
        $(".blocklyWidgetDiv").hide();
        $(".blocklyTooltipDiv").hide();
        blocklyHelper.workspace.dispose();
        $("#blocklyDiv").html("");
        blocklyLoading = false;
      }
      blocklyLoaded = false;
   }

   this.updateBlockly = function () {
     setTimeout(function() {
       if (blocklyLoading) {
        if ($("#editor").css('display') == 'none') {
          unloadBlockly();
        } else {
          $(".blocklyToolboxDiv").show();
        }
       } else {
         if ($("#editor").css('display') != 'none')
            loadBlockly();
       }
     }, 0);
   }

   function updateFullscreen () {
      var curFullscreen = (document.fullscreenElement ||  document.msFullscreenElement || document.mozFullScreen || document.webkitIsFullScreen) && true;
      if (controller.isAce) {
        if (curFullscreen) {
          $(".fioi-editor2_1-buffers .ace_editor").css('width', $(window).width() + 'px');
          $(".fioi-editor2_1-buffers .ace_editor").css('height', ($(window).height() - 50) + 'px');
        } else {
          $(document.body).css('width', '762px');
          $(".fioi-editor2_1-buffers .ace_editor").css('width', '762px');
          $(".fioi-editor2_1-buffers .ace_editor").css('height', '350px');
        }
      } else if (controller.isBlockly) {
        if (curFullscreen) {
          $("#blocklyEditor #blocklyContainer").css('height', ($(window).height() - 60) + 'px');
        } else {
          $("#blocklyEditor #blocklyContainer").css('height', '600px');
        }
        if (blocklyLoading) {
          buffer.pullFromControl();
          unloadBlockly();
        }
        loadBlockly();
      }
   }

   function load () {
      if (!controller.fullscreenEvents) {
        document.addEventListener("fullscreenchange", updateFullscreen);
        document.addEventListener("webkitfullscreenchange", updateFullscreen);
        document.addEventListener("mozfullscreenchange", updateFullscreen);
        document.addEventListener("MSFullscreenChange", updateFullscreen);
        controller.fullscreenEvents = true;
      }

      controller.description = buffer.description;
      controller.readOnly = buffer.readOnly;
      controller.languageOptions = buffer.getLanguages();
      controller.showLanguageSelector = controller.languageOptions.length > 1;
      controller.language = _.find(controller.languageOptions,
         function (language) { return language.id == buffer.language; });

      controller.isAce = !('blockly' in controller.language);
      controller.isBlockly = ('blockly' in controller.language);

      if (controller.isAce) {
        if (blocklyLoading)
          unloadBlockly();
        setTimeout(function () {
        if (aceEditor) {
         if (controller.language && typeof controller.language === 'object') {
            aceEditor.session.setMode('ace/mode/' + controller.language.ace.mode);
         }
         aceEditor.setValue(buffer.text);
         aceEditor.selection.setRange(buffer.selection);
         aceEditor.setReadOnly(controller.readOnly);
        }}, 100);
      }
      setTimeout(function () { updateFullscreen(); }, 10);
   }

   function dump () {
    if (controller.isAce) {
      return {
         text: aceEditor.getValue(),
         language: controller.language && controller.language.id,
         selection: aceEditor.selection.getRange()
      };
    } else if (controller.isBlockly) {
      var blocklyXml = blocklyLoaded ? Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(blocklyHelper.workspace)) : buffer.text;
      var blocklyPython = '# blocklyXml: ' + blocklyXml + '\n\n' + Blockly.Python.workspaceToCode(blocklyHelper.workspace);

      window.blocklyClipboard = Blockly.clipboardXml_;
      
      return {
         text: blocklyXml,
         isBlockly: true,
         blocklySource: blocklyPython,
         language: controller.language && controller.language.id,
         selection: (0, 0, 0, 0)
      };
    }
   }

   function focus () {
      if(aceEditor && controller.isAce) {
         aceEditor.focus();
      }
   }
   function insertLines (r1, c1, r2, c2, lines) {
      var delta = {
         action: 'insert',
         start: {row: r1, column: c1},
         end: {row: r2, column: c2},
         lines: lines
      };
      aceEditor.session.doc.applyDeltas([delta]);
   }
   function deleteLines (r1, c1, r2, c2) {
      var delta = {
         action: 'remove',
         start: {row: r1, column: c1},
         end: {row: r2, column: c2}
      };
      aceEditor.session.doc.applyDeltas([delta]);
   }
   function moveCursor (r1, c1) {
      aceEditor.selection.setRange({
         start: {row: r1, column: c1},
         end: {row: r1, column: c1}
      });
   }
   function setSelection (r1, c1, r2, c2) {
      aceEditor.selection.setRange({start: {row: r1, column: c1}, end: {row: r2, column: c2}});
   }

}
