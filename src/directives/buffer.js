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

BufferController.$inject = ['FioiEditor2Signals', 'FioiEditor2Buffers'];
function BufferController (signals, buffers) {

   var controller = this;
   var editor = null; // the ACE object
   var buffer = buffers.get(this.buffer);

   // Initialize controller data and reload it on 'update' event.
   update();
   var unhookers = [
      signals.on('update', update)
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

   function update () {
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