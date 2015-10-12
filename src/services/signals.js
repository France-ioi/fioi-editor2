module.exports = function (m) {
'use strict';

m.factory('FioiEditor2Signals', SignalsFactory);
SignalsFactory.$inject = ['$rootScope'];
function SignalsFactory ($rootScope) {

   var prefix = 'fioi-editor2_';
   var service = {};
   var pending = {};
   var mustEmit = false;
   var willEmit = false;
   var defer = false;

   service.on = function (signal, handler) {
      return $rootScope.$on(prefix + signal, handler);
   };

   service.defer = function (flag) {
      defer = flag;
      if (mustEmit && !willEmit)
         doEmit();
   };

   service.emitUpdate = function () {
      this.emit('update');
   };

   service.emit = function (signal) {
      if (pending[signal])
         return;
      pending[signal] = true;
      mustEmit = true;
      if (defer || willEmit)
         return;
      willEmit = true;
      window.requestAnimationFrame(doEmit);
   };

   function doEmit () {
      var signals = pending;
      pending = {};
      mustEmit = false;
      willEmit = false;
      _.each(signals, function (flag, signal) {
         $rootScope.$emit(prefix + signal);
      });
   }

   return service;
}

};
