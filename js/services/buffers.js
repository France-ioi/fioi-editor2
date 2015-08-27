'use strict';
module.exports = function (m) {

/**
This service maintains a set of named buffers.
*/
m.factory('FioiEditor2Buffers', BuffersFactory);
BuffersFactory.$inject = ['$rootScope'];
function BuffersFactory ($rootScope) {

   var service = {};
   var buffers = {};
   var nextId = 1;

   function Buffer (name, text, options) {
      this.options = options || {};
      this.name = name;
      this.text = (text || "").toString();
      this.language = this.options.language || 'text';
   }
   Buffer.prototype.setText = function (text) {
      this.text = text;
      this._emit('changed');
   };
   Buffer.prototype.getLanguages = function () {
      if (this.options.languages)
         return this.options.languages;
      return this.tab.getLanguages();
   };
   Buffer.prototype._emit = function (name) {
      $rootScope.$emit('fioi-editor2_buffer-'+this.name+'_'+name);
   };

   service.add = function (text, options) {
      var name = 'b' + nextId;
      nextId += 1;
      var buffer = buffers[name] = new Buffer(name, text, options);
      return buffer;
   };

   service.remove = function (name) {
      var buffer = buffers[name];
      if (buffer) {
         delete buffers[name];
      }
   };

   service.get = function (name) {
      return buffers[name];
   };

   return service;
}

};