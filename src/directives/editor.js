module.exports = function (m) {
'use strict';

/**
This directive inserts the editor component.

Each instance of the editor component is bound to a named group in the
storage service.

The user can select one of the tabs maintained by the storage service,
add a new tab, remove a tab, and rename a tab.

When a tab is selected, the editor uses a buffer directive to display the
sequence of buffers held in the tab side-by-side.

The API includes function to:
- start and stop the recording mode
- retrieve the last recorded sequence of timestamped events
- …

*/
m.directive('fioiEditor2', editorDirective);
editorDirective.$inject = ['FioiEditor2Signals'];
function editorDirective (signals) {
   return {
      restrict: 'A',
      scope: {
         fioiEditor2: '&'
      },
      template: require('./editor.jade'),
      controllerAs: 'vm',
      bindToController: true,
      replace: true,
      controller: EditorController,
      link: function (scope, iElement, iAttrs, controller) {
         // Bind update events to the controller's update() function.
         var unhookUpdate = signals.on('update', update);
         scope.$on('$destroy', function () {
            unhookUpdate();
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

EditorController.$inject = ['FioiEditor2Tabsets'];
function EditorController (tabsets) {

   var controller = this;
   var tabset = null;

   this.typeName = 'onglet';

   this.addTab = function () {
      var tab = tabset.addTab();
      this.selectTab(tab);
   }.bind(this);

   this.closeTab = function (tab, event) {
      tabset.removeTab(tab.id);
      // Prevent the click event from triggering selectTab for the removed tab.
      event.stopPropagation();
   };

   this.selectTab = function (tab) {
      tabset.update({activeTabId: tab.id});
   };

   // Update state from the tabs service.
   this.update = function () {
      var config = controller.fioiEditor2();
      var classes = controller.buffersClasses = {};
      controller.tabs = [];
      controller.tab = null;
      if (!config) {
         classes['fioi-editor2_error'] = true;
         return;
      }
      tabset = tabsets.find(config.tabset);
      if (!tabset) {
         classes['fioi-editor2_error'] = true;
         return;
      }
      this.typeName = tabset.typeName;
      this.readOnly = tabset.readOnly;
      this.bufferNames = tabset.bufferNames;
      controller.tabs = _.map(tabset.getTabs(), function (tab) {
         return {id: tab.id, title: tab.title};
      });
      if (controller.tabs.length === 0) {
         classes['fioi-editor2_empty'] = true;
         return;
      }
      var tab = tabset.getActiveTab();
      if (!tab) {
         classes['fioi-editor2_no-active-tab'] = true;
         return;
      }
      controller.tab = {
         id: tab.id,
         title: tab.title,
         buffers: tab.buffers
      };
      classes['fioi-editor2_'+tab.buffers.length+'-buffers'] = true;
   };

}

};
