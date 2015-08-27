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

BufferController.$inject = ['FioiEditor2Buffers'];
function BufferController (buffers) {

   var controller = this;
   var buffer = buffers.get(this.buffer);

   // Bind the buffer service to the directive's API.
   var api = {};
   buffer.bind(api);

   controller.cleanup = function () {
      buffer.unbind(api);
   };

   controller.setLanguage = function (language) {
      // TODO
   };

   controller.languageOptions = buffers.languages;
   controller.language = buffer.language;
   controller.text = buffer.text;
}

};