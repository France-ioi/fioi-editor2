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

The directive supplies its API object to the parent controller in a variable
named 'api' when evaluating the directive's on-init attribute.

The API includes function to:
- start and stop the recording mode
- retrieve the last recorded sequence of timestamped events
- …

*/
m.directive('fioiEditor2', editorDirective);
function editorDirective () {
   return {
      restrict: 'E',
      scope: {
         groupId: '@',
         onInit: '&'
      },
      template: require('./editor.jade'),
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
  this.tabs = [{name: 'Code1'}, {name: 'Code2'}, {name: 'Code3'}];
}

};