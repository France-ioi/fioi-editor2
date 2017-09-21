import _ from 'lodash';
import bufferTemplate from './buffer.jade!';

(function ($) {
    $.each(['show', 'hide'], function(i, ev) {
        var el = $.fn[ev];
        $.fn[ev] = function() {
            var t = this;
            setTimeout(function() { t.trigger(ev); }, 0);
            return el.apply(this, arguments);
        };
    });
})(jQuery);

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
            $("#editor").off('show', scope.vm.reloadBlockly);
            scope.vm.cleanup();
         });
         scope.vm.update(iElement);
         function update() {
            scope.$apply(function () {
               scope.vm.update();
            });
         }

        $("#editor").on('show', scope.vm.reloadBlockly);
      }
   };
}

BufferController.$inject = ['FioiEditor2Signals', 'FioiEditor2Buffers', '$rootScope', '$i18next'];
function BufferController (signals, buffers, $rootScope, $i18next) {

   var controller = this;
   var domElement = null;
   var buffer = null;

   var aceEditor = null; // the ACE object
   var aceOnLoad = null;

   var description = '';

   var readOnly = false;

   var isAce = false;
   var isBlockly = false;
   var wrongBlockly = false;

   var hasPython = false;
   var hasJavascript = false;

   var blocklyHelper = null;
   var blocklyLoading = null;
   var blocklyLoaded = false;
   var newLang = '';
   var fullscreenEvents = false;

   this.update = function (iElement) {
      this.cleanup();
      if(typeof iElement !== "undefined") {
         controller.domElement = iElement[0];
      }
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

      if (aceOnLoad && buffer) {
        aceOnLoad();
        aceOnLoad = null;
      }
   };

   this.languageChanged = function () {
      if (controller.language.id == buffer.language) { return; }

      var oldLanguage = _.find(controller.languageOptions,
           function (language) { return language.id == buffer.language; });

      if (controller.language['blockly']) {
        controller.newLang = controller.language.id;
        $(controller.domElement).find("#langChangeModal #modalMsg").text(' '+$i18next.t('editor_change_msg_blockly_scratch'));
        $(controller.domElement).find("#langChangeModal").modal("show");
        controller.language = oldLanguage;
      }

      if (controller.isAce && ('blockly' in controller.language) && (aceEditor.getValue() != '')) {
        controller.newLang = controller.language.id;
        $(controller.domElement).find("#langChangeModal #modalMsg").text(' '+$i18next.t('editor_change_msg_blockly'));
        $(controller.domElement).find("#langChangeModal").modal("show");
        controller.language = oldLanguage;
      } else if (controller.isBlockly && !('blockly' in controller.language)) {
        controller.newLang = controller.language.id;
        $(controller.domElement).find("#langChangeModal #modalMsg").text(' '+$i18next.t('editor_change_msg_normal'));
        $(controller.domElement).find("#langChangeModal").modal("show");
        controller.language = oldLanguage;
      } else {
        changeLanguage(controller.language.id, false);
      }
   }

   this.langConfirm = function () {
      $(controller.domElement).find("#langChangeModal").modal("hide");
      changeLanguage(controller.newLang, true);
   }

   this.blocklyToTab = function () {
      if (!controller.isBlockly) return;
      var newTab = buffer.tab.tabset.addTab()
      
      newTab.getBuffer().update({
        text: controller.blocklyHelper.getCode('python'),
        language: controller.language.blockly.dstlang
      });
   }

   this.blocklyToJsTab = function () {
      if (!controller.isBlockly) return;
      var newTab = buffer.tab.tabset.addTab()
      
      newTab.getBuffer().update({
        text: controller.blocklyHelper.getCode('javascript'),
        language: 'java'
      });
   }

   function changeLanguage (lang, wipesrc) {
      buffer.pullFromControl();
      if (wipesrc) {
        buffer.text = '';
      }
      buffer.language = lang;
      buffer.pushToControl();
   };

   function loadBlockly () {
    if (!controller.blocklyLoading && controller.isBlockly) { // && ($("#editor").css('display') != 'none')) {
      if(controller.blocklyLoading) { return; }
      controller.blocklyLoading = setTimeout(function () {
        window.getBlocklyXML = controller.getBlocklyXML;
        window.getBlocklyPNG = controller.getBlocklyPNG;

        if(!controller.blocklyLoading) { return; }

        if(!$('#blocklyDiv').length) {
          console.log('blocklyDiv not ready yet.');
          return;
        }

        // Add CSS fix for Blockly and Scratch
        if(!$('#fioiEditor2BlocklyStyle').length) {
          $('head').append('<style id="fioiEditor2BlocklyStyle"></style>');
          if(controller.language.id == 'blockly') {
            $('#fioiEditor2BlocklyStyle').text('.blocklyWidgetDiv { position: fixed !important; }');
          } else if(controller.language.id == 'scratch') {
            $('#fioiEditor2BlocklyStyle').text('.blocklyWidgetDiv { margin-top: -20px; }');
          }
        }

        controller.blocklyHelper.mainContext = {"nbRobots": 1};
        controller.blocklyHelper.prevWidth = 0;
        var blocklyOpts = {
           divId: "blocklyDiv",
           readOnly: controller.readOnly,
           startingBlockName: "Programme du robot",
           noHiddenCheck: true
           };
        controller.blocklyHelper.load($rootScope.sLocale, true, 1, blocklyOpts);
        controller.blocklyHelper.updateSize();
        Blockly.WidgetDiv.DIV = $(".blocklyWidgetDiv").clone().appendTo("#blocklyDiv")[0];
        Blockly.Tooltip.DIV = $(".blocklyTooltipDiv").clone().appendTo("#blocklyDiv")[0];
        setTimeout(function() {
           if (!controller.blocklyLoading) { return; }
           if (buffer && buffer.text && !controller.blocklyLoaded) {
             controller.blocklyHelper.programs[controller.blocklyHelper.player].blockly = buffer.text;
             controller.blocklyHelper.loadPrograms();
           }
           controller.blocklyLoaded = true;
           Blockly.clipboardXml_ = window.blocklyClipboard;
           Blockly.clipboardSource_ = controller.blocklyHelper.workspace;
        }, 100);
      }, 0);
    } 
   }

   function unloadBlockly () {
      if (controller.blocklyLoading) {
        if (controller.blocklyLoading !== true) {
          clearTimeout(controller.blocklyLoading);
        }
        window.blocklyClipboard = Blockly.clipboardXml_;
        $(".blocklyWidgetDiv").hide();
        $(".blocklyTooltipDiv").hide();
        if(controller.blocklyHelper.workspace) {
          controller.blocklyHelper.workspace.dispose();
        }
        $("#blocklyDiv").html("");
        controller.blocklyLoading = false;
      }
      controller.blocklyLoaded = false;
   }

   this.updateBlockly = function () {
     if (controller.blocklyLoading) {
      if ($("#editor").css('display') == 'none') {
        unloadBlockly();
      } else {
        $(".blocklyToolboxDiv").show();
      }
     } else {
       if ($("#editor").css('display') != 'none')
          loadBlockly();
     }
   }

   this.reloadBlockly = function () {
     if(controller.blocklyHelper && controller.blocklyHelper.workspace) {
         buffer.pullFromControl();
     }
     unloadBlockly();
     loadBlockly();
   }

   this.switchBlocklyMode = function () {
      $rootScope.$broadcast('fioi-editor2.requireSave');
      window.blocklySwitcher.switchMode();
   }

   this.getBlocklyXML = function () {
      var blocklyXml = controller.blocklyLoaded ? Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(controller.blocklyHelper.workspace)) : buffer.text;
      console.log(blocklyXml.replace(/'/g, "&#39;"));
      alert($i18next.t('editor_getblocklyxml'));
   }

   this.getBlocklyPNG = function () {
      var svgBbox = $('#blocklyDiv svg')[0].getBoundingClientRect();
      var blocksBbox = $('#blocklyDiv svg > .blocklyWorkspace > .blocklyBlockCanvas')[0].getBoundingClientRect();
      var svg = $('#blocklyDiv svg').clone();
      svg.find('.blocklyFlyout, .blocklyMainBackground, .blocklyTrash, .blocklyBubbleCanvas, .blocklyScrollbarVertical, .blocklyScrollbarHorizontal, .blocklyScrollbarBackground').remove();
      var options = {
         backgroundColor: '#FFFFFF',
         top: blocksBbox.top - svgBbox.top - 4,
         left: blocksBbox.left - svgBbox.left - 4,
         width: blocksBbox.width + 8,
         height: blocksBbox.height + 8
        };
      require(['save-svg-as-png'], function (ssap) {
         ssap.saveSvgAsPng(svg[0], 'blockly.png', options);
         svg.remove();
      });
   }

   function updateFullscreen () {
      var curFullscreen = (document.fullscreenElement || document.msFullscreenElement || document.mozFullScreen || document.webkitIsFullScreen) && true;
      if (controller.isAce) {
        if (curFullscreen) {
          $(controller.domElement).parents(".fioi-editor2_1-buffers").find(".ace_editor").css('width', $(window).width() + 'px');
          $(controller.domElement).parents(".fioi-editor2_2-buffers").find(".ace_editor").css('width', $(window).width()/2 + 'px');
          $(controller.domElement).find(".ace_editor").css('height', ($(window).height() - 50) + 'px');
        } else {
          $(controller.domElement).parents(".fioi-editor2_1-buffers").find(".ace_editor").css('width', '762px');
          $(controller.domElement).parents(".fioi-editor2_2-buffers").find(".ace_editor").css('width', '379px');
          $(controller.domElement).find(".ace_editor").css('height', '350px');
        }
      } else if (controller.isBlockly) {
        if (curFullscreen) {
          $("#blocklyEditor #blocklyContainer").css('height', ($(window).height() - 60) + 'px');
          if (controller.language.id == 'scratch') {
            $('#fioiEditor2BlocklyStyle').text('');
          }
        } else {
          $("#blocklyEditor #blocklyContainer").css('height', '600px');
          if (controller.language.id == 'scratch') {
            $('#fioiEditor2BlocklyStyle').text('.blocklyWidgetDiv { margin-top: -20px; }');
          }
        }
        if (controller.blocklyLoading) {
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

      if(controller.isBlockly && controller.language.id != window.blocklySwitcher.mode) {
         controller.wrongBlockly = true;
         controller.isBlockly = false;
      } else {
         controller.wrongBlockly = false;
      }

      controller.hasPython = !!(_.find(controller.languageOptions,
         function (language) { return language.id == 'python'; }));
      controller.hasJavascript = !!(_.find(controller.languageOptions,
         function (language) { return language.id == 'javascript'; }));

      if(!controller.blocklyHelper) {
         controller.blocklyHelper = getBlocklyHelper();
//         controller.blocklyHelper.startingBlock = false;
      }

      // taskSettings is a global variable (for now)
      if(typeof taskSettings !== 'undefined' && typeof taskSettings.blocklyOpts !== 'undefined') {
         Object.keys(taskSettings.blocklyOpts).forEach(function(key, idx) {
            controller.blocklyHelper[key] = taskSettings.blocklyOpts[key];
            });
      }

      if (controller.isAce) {
        if (controller.blocklyLoading)
          unloadBlockly();
        aceOnLoad = function () {
          if (buffer == null) {
            var abcdef = 5;
            abcdef = 6;
          }
          if (aceEditor) {
            if (controller.language && typeof controller.language === 'object') {
              aceEditor.session.setMode('ace/mode/' + controller.language.ace.mode);
            }
            aceEditor.setValue(buffer.text);
            if(buffer.selection) {
               aceEditor.selection.setRange(buffer.selection);
            }
            aceEditor.setReadOnly(controller.readOnly);
        }};
        if (aceEditor && buffer) {
          aceOnLoad();
          aceOnLoad = null
        }
      }
      updateFullscreen();
   }

   function dump () {
      if (controller.isAce) {
         return {
            text: aceEditor.getValue(),
            language: controller.language && controller.language.id,
            selection: aceEditor.selection.getRange()
         };
      } else if (controller.isBlockly) {
         if(!controller.blocklyLoaded) {
            return {
               isBlockly: true,
               language: controller.language && controller.language.id,
               selection: (0, 0, 0, 0)
            };
         }

         var blocklyXml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(controller.blocklyHelper.workspace));
         var blocklyPython = '# blocklyXml: ' + blocklyXml + '\n\n' + controller.blocklyHelper.getCode(controller.language.blockly.dstlang);

         window.blocklyClipboard = Blockly.clipboardXml_;

         return {
            text: blocklyXml,
            isBlockly: true,
            blocklySource: blocklyPython,
            language: controller.language && controller.language.id,
            selection: (0, 0, 0, 0)
         };
      } else if (controller.wrongBlockly) {
        return {
           isBlockly: true,
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
