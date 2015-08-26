require(['angular'], function (angular) {

angular.module('fioi-editor2', [])
   .service('FioiEditor2Storage', StorageService)
   .directive('fioiEditor2', editorDirective)
   .directive('fioiEditor2Buffer', bufferDirective);

/**
This service acts as storage for named groups of sets of named tabs, where each
tab holds a sequence of text buffers.

The service can dump/load a group's state to/from a JSON object.

*/
function StorageService () {
   var service = {};

   service.addGroup = function (name) {

   };
   service.getGroupTabs = function () {

   };
   service.getTabBuffers = function () {

   };

   return service;
}

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
function editorDirective () {
   return {
      restrict: 'E',
      scope: {
         groupId: '@',
         onInit: '&'
      },
      templateUrl: 'fioi-editor2/editor.html',
      controllerAs: 'vm',
      bindToController: true,
      replace: true,
      controller: EditorController,
      link: function (scope, iElement, iAttrs, controller) {
      }
   };
}

EditorController.$inject = ['FioiEditor2Storage']
function EditorController (storage) {
   var api = {};
   api.placeholder = function () {
      alert('placeholder');
   };
   if (typeof this.onInit === 'function')
      this.onInit({api: api});
}

function bufferDirective () {
   return {
      restrict: 'E',
      scope: {},
      templateUrl: 'fioi-editor2/buffer.html',
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
}

});