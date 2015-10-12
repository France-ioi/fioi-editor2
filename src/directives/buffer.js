module.exports = function (m) {
'use strict';

m.directive('fioiEditor2Buffer', bufferDirective);
bufferDirective.$inject = ['FioiEditor2Signals'];
function bufferDirective (signals) {
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
