'use strict';
module.exports = function (m) {

/**
This service maintains a set of named buffers.
*/
m.factory('FioiEditor2Buffers', BuffersFactory);
function BuffersFactory () {
   var service = {};
   var buffers = {};
   var nextId = 1;

   function Buffer (name, text, language) {
      this.name = name;
      this.text = (text || "").toString();
      this.language = language || service.languages[0];
      this.client = null;
   }
   Buffer.prototype.bind = function (client) {
      if (!this.client)
         this.client = client;
   };
   Buffer.prototype.unbind = function (client) {
      if (this.client == client)
         this.client = null;
   };

   service.add = function (text, language) {
      var name = 'b' + nextId;
      nextId += 1;
      var buffer = buffers[name] = new Buffer(name, text, language);
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

   service.languages = [
      {name: "C", ext: 'c'},
      {name: "C++", ext: 'cpp'},
      {name: "Pascal", ext: 'pas'},
      {name: "OCaml", ext: 'ml'},
      {name: "Java", ext: 'java'},
      {name: "JavaScool", ext: 'java'},
      {name: "Python", ext: 'py'}
   ];

   return service;
}

};