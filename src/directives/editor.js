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

EditorController.$inject = ['FioiEditor2Tabsets'];
function EditorController (tabsets) {

   var controller = this;
   var editor = null;
   var tabset = null;
   var fullscreen = false;
   var fullscreenEvents = false;

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

   this.toggleFullscreen = function () {
      if (!controller.fullscreenEvents) {
        document.addEventListener("fullscreenchange", updateFullscreen);
        document.addEventListener("webkitfullscreenchange", updateFullscreen);
        document.addEventListener("mozfullscreenchange", updateFullscreen);
        document.addEventListener("MSFullscreenChange", updateFullscreen);
        controller.fullscreenEvents = true;
      }
      if (controller.fullscreen) {
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
//        var editor = document.getElementById("fioi-editor2");
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
      var curFullscreen = (document.fullscreenElement ||  document.msFullscreenElement || document.mozFullScreen || document.webkitIsFullScreen) && true;
      if (curFullscreen == controller.fullscreen) return;
      controller.fullscreen = curFullscreen;
      if (curFullscreen) {
        $(document.body).css('width', $(window).width() + 'px');
        $(controller.editor).parents(".fioi-editor2_1-buffers").parents("#fioi-editor2").css('width', $(window).width() + 'px');
        $(controller.editor).parents(".fioi-editor2_2-buffers").parents("#fioi-editor2").css('width', $(window).width()/2 + 'px');
      } else {
        $(document.body).css('width', '762px');
        $(controller.editor).parents(".fioi-editor2_1-buffers").parents("#fioi-editor2").css('width', '762px');
        $(controller.editor).parents(".fioi-editor2_2-buffers").parents("#fioi-editor2").css('width', '379px');
      }
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
