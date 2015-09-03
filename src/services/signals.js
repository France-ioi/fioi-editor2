'use strict';
module.exports = function (m) {

m.factory('FioiEditor2Signals', SignalsFactory);
SignalsFactory.$inject = ['$rootScope'];
function SignalsFactory ($rootScope) {

   var service = {};
   var pending = {};
   var mustEmit = false;
   var willEmit = false;
   var defer = false;

   service.on = function (signal, handler) {
      return $rootScope.$on('fioi-editor2_' + signal, handler);
   };

   service.defer = function (flag) {
      defer = flag;
      if (mustEmit && !willEmit)
         doEmit();
   };

   service.emitUpdate = function () {
      emit('update');
   };

   function emit (signal) {
      if (pending[signal])
         return;
      pending[signal] = true;
      mustEmit = true;
      if (defer || willEmit)
         return;
      willEmit = true;
      window.requestAnimationFrame(doEmit);
   }

   function doEmit () {
      var signals = pending;
      pending = {};
      mustEmit = false;
      willEmit = false;
      if (signals.update)
         $rootScope.$emit('fioi-editor2_update');
   }

   return service;
}

};