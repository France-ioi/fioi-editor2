import _ from 'lodash';
import editorTemplate from './editor.jade!';

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
editorDirective.$inject = ['FioiEditor2Signals'];
export function editorDirective (signals) {
   return {
      restrict: 'A',
      scope: {
         fioiEditor2: '&'
      },
      template: editorTemplate({}),
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
         scope.vm.update(iElement);
         function update() {
            scope.$apply(function () {
               scope.vm.update();
            });
         }
      }
   };
}

EditorController.$inject = ['FioiEditor2Tabsets', '$rootScope'];
function EditorController (tabsets, $rootScope) {

   var controller = this;
   var editor = null;
   var tabset = null;

   var browserFullscreen = false;
   this.ownFullscreen = false;
   var browserFullscreenAllowed = true;
   var fullscreenEvents = false;

   this.hasConcepts = false;

   this.addTab = function () {
      var tab = tabset.addTab();
      this.selectTab(tab);
      controller.updateFullscreenAllowed();
      $rootScope.$broadcast('fioi-editor2.requireSave');
   }.bind(this);

   this.closeTab = function (tab, event) {
      tabset.removeTab(tab.id);
      controller.updateFullscreenAllowed();
      // Prevent the click event from triggering selectTab for the removed tab.
      event.stopPropagation();
   };

   this.selectTab = function (tab) {
      tabset.update({activeTabId: tab.id});
      controller.updateFullscreenAllowed();
      $rootScope.$broadcast('fioi-editor2.requireSave');
   };

   this.updateFullscreenAllowed = function() {
      // Update whether the inner editor supports using browser fullscreen
      var newVal = !(tabset.getActiveTab().getBuffer().language == 'scratch');
      if(!newVal && browserFullscreenAllowed && browserFullscreen) {
         // We're in fullscreen and we're not allowed fullscreen anymore
         controller.toggleFullscreen();
      }
      browserFullscreenAllowed = newVal;
   };

   this.isFullscreen = function() {
      return browserFullscreen || this.ownFullscreen;
   };

   this.toggleFullscreen = function () {
      if(!browserFullscreenAllowed || controller.ownFullscreen) {
        controller.ownFullscreen = !controller.ownFullscreen;
        updateFullscreen();
        return;
      }
      if (!controller.fullscreenEvents) {
        document.addEventListener("fullscreenchange", updateFullscreen);
        document.addEventListener("webkitfullscreenchange", updateFullscreen);
        document.addEventListener("mozfullscreenchange", updateFullscreen);
        document.addEventListener("MSFullscreenChange", updateFullscreen);
        controller.fullscreenEvents = true;
      }
      if (browserFullscreen) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      } else {
        if (controller.editor.requestFullscreen) {
          controller.editor.requestFullscreen();
        } else if (controller.editor.mozRequestFullScreen) {
          controller.editor.mozRequestFullScreen();
        } else if (controller.editor.webkitRequestFullscreen) {
          controller.editor.webkitRequestFullscreen();
        }
      }

   };

   function updateFullscreen () {
      var curIsFullscreen = controller.isFullscreen();

      var newBrowserFullscreen = (document.fullscreenElement || document.msFullscreenElement || document.mozFullScreen || document.webkitIsFullScreen) && true;
      browserFullscreen = newBrowserFullscreen;

      $rootScope.$broadcast('fioi-editor2.updateFullscreen', newBrowserFullscreen || controller.ownFullscreen);

      if(controller.ownFullscreen) {
        $(controller.editor).css('width', '');
      } else if(browserFullscreen) {
        $(controller.editor).css('width', $(window).width() + 'px');
      } else {
        $(controller.editor).css('width', '762px');
      }
   };

   this.toggleHistory = function () {
      $rootScope.$broadcast('fioi-editor2.toggleHistory');
   };

   // Update state from the tabs service.
   this.update = function (iElement) {
      var config = controller.fioiEditor2();
      var classes = controller.buffersClasses = {};
      controller.tabs = [];
      controller.tab = null;

      if (typeof iElement !== "undefined") {
         controller.editor = iElement[0];
      }

      if (!config) {
         classes['fioi-editor2_error'] = true;
         return;
      }
      tabset = tabsets.find(config.tabset);
      if (!tabset) {
         classes['fioi-editor2_error'] = true;
         return;
      }
      tabset.editor = controller;
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

      controller.hasConcepts = (typeof conceptViewer !== 'undefined' && typeof taskSettings !== 'undefined') ? !!taskSettings.conceptViewer : false;
      controller.updateFullscreenAllowed();
   };

}
