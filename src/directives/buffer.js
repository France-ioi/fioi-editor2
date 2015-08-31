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

   // Exposer our API to the buffer service.
   buffer.attachControl({
      load: load,
      dump: dump
   });
   this.cleanup = function () {
      buffer.pullFromControl();
      buffer.detachControl();
   }.bind(this);

   // Let the buffer set up the state once Ace is loaded.
   this.aceLoaded = function (editor_) {
      editor = editor_;
      buffer.pushToControl();
      editor.focus();
   };

   this.languageChanged = function () {
      buffer.pullFromControl();
      buffer.pushToControl();
      editor.focus();
   };

   function load (buffer) {
      controller.languageOptions = buffer.getLanguages();
      controller.language = _.find(controller.languageOptions,
         function (language) { return language.id == buffer.language; });
      if (controller.language && typeof controller.language === 'object') {
         editor.session.setMode('ace/mode/' + controller.language.ace.mode);
      }
      editor.setValue(buffer.text);
      editor.selection.setRange(buffer.selection);
   }

   function dump () {
      return {
         text: editor.getValue(),
         language: controller.language && controller.language.id,
         selection: editor.selection.getRange()
      };
   }

}

};