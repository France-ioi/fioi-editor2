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

EditorController.$inject = ['FioiEditor2Tabs']
function EditorController (tabs) {

   var controller = this;
   var newTabPrefix = 'Code';
   var nextTabId = 1;

   var api = {};
   api.placeholder = function () {
      alert('placeholder');
   };
   api.trigger = function (event) {
      if (event === 'tabs-changed')
         return load();
      console.log('event', event);
   };

   this.addTab = function () {
      var tab_name = freshTabName();
      var tab = tabs.add(tab_name);
      tab.addBuffer('');
      this.selectTab(tab);
   }.bind(this);

   controller.selectTab = function (tab) {
      controller.tab = tab;
   };

   // Initialize controller data from service.
   load();

   // Bind the editor component to the storage service.
   tabs.bind(api);

   // Pass the editor component's API to the enclosing controller.
   if (typeof this.onInit === 'function')
      this.onInit({api: api});

   //
   // Private function
   //

   // Load state from the tabs service.
   function load () {
      controller.tabs = tabs.list();
      if (!controller.tab)
         controller.tab = controller.tabs[0];
   }

   // Generate a fresh tab name.
   function freshTabName () {
      var tabsByName = {};
      while (true) {
         var name = newTabPrefix + nextTabId;
         if (!tabs.exists(name))
            return name;
         nextTabId += 1;
      }
   }

}

};