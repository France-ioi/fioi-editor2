'use strict';
module.exports = function (m) {

m.directive('fioiEditor2Buffer', bufferDirective);
function bufferDirective () {
   return {
      restrict: 'E',
      scope: {},
      template: require('./buffer.jade'),
      controllerAs: 'vm',
      bindToController: true,
      require: '^fioiEditor2',
      replace: true,
      controller: BufferController,
      link: function (scope, iElement, iAttrs, controller) {
      }
   };
}

BufferController.$inject = [];
function BufferController () {
   this.languageOptions = [
      {name: "C"},
      {name: "C++"},
      {name: "Pascal"},
      {name: "OCaml"},
      {name: "Java"},
      {name: "JavaScool"},
      {name: "Python"}
   ];
   this.language = this.languageOptions[0];
}

};