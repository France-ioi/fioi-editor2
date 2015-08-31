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
      this.selection = {start: {row: 0, column: 0}, end: {row: 0, column: 0}};
      this.language = this.options.language || 'text';
      this.control = null;
   }
   Buffer.prototype.update = function (attrs) {
      if ('text' in attrs)
         this.text = attrs.text;
      if ('language' in attrs)
         this.language = attrs.language;
      if ('selection' in attrs)
         this.selection = _.clone(attrs.selection);
   };
   Buffer.prototype.getLanguages = function () {
      if (this.options.languages)
         return this.options.languages;
      return this.tab.getLanguages();
   };
   Buffer.prototype.attachControl = function (control) {
      this.control = control;
      return this;
   };
   Buffer.prototype.detachControl = function () {
      this.control = null;
      return this;
   };
   Buffer.prototype.pushToControl = function () {
      this.control.load(this);
      return this;
   };
   Buffer.prototype.pullFromControl = function () {
      this.update(this.control.dump());
      return this;
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