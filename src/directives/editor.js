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

The API includes function to:
- start and stop the recording mode
- retrieve the last recorded sequence of timestamped events
- …

*/
m.directive('fioiEditor2', editorDirective);
function editorDirective () {
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
         scope.$on('$destroy', function () {
            scope.vm.cleanup();
         });
      }
   };
}

EditorController.$inject = ['FioiEditor2Signals', 'FioiEditor2Tabsets']
function EditorController (signals, tabsets) {

   var config = this.fioiEditor2();
   var tabset = tabsets.find(config.tabset);
   var controller = this;

   this.addTab = function () {
      var tab = tabset.addTab();
      tab.addBuffer('');  // XXX this should be done by the tab based on its mode
      this.selectTab(tab);
   }.bind(this);

   this.closeTab = function (tab) {
      tabset.removeTab(tab.id);
   };

   this.selectTab = function (tab) {
      tabset.update({activeTabId: tab.id});
   };

   // Initialize controller data and reload it on 'changed' event.
   update();
   var unhookers = [
      signals.on('update', update)
   ];
   this.cleanup = function () {
      _.each(unhookers, function (func) { func(); });
   };

   //
   // Private function
   //

   // Update state from the tabs service.
   function update () {
      tabset = tabsets.find(config.tabset);
      controller.tabs = tabset.getTabs();
      controller.tab = tabset.getActiveTab();
   }

}

};