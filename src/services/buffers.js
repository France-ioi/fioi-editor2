import _ from 'lodash';

/**
This service maintains a set of buffers.
*/
BuffersFactory.$inject = ['FioiEditor2Recorder', 'FioiEditor2Registry'];
export function BuffersFactory (recorder, registry) {

   var service = {};
   var buffers = {};

   service.add = function (recording_id) {
      var id = registry.freshId('b', recording_id);
      var buffer = buffers[id] = new Buffer(id);
      registry.register(id, buffer);
      return buffer;
   };

   service.remove = function (id) {
      var buffer = buffers[id];
      if (buffer) {
         delete buffers[id];
      }
   };

   service.get = function (id) {
      return buffers[id];
   };

   function Buffer (id) {
      this.id = id;
      this.text = '';
      this.selection = {start: {row: 0, column: 0}, end: {row: 0, column: 0}};
      this.languages = null; // inherit from tab
      this.language = null; // must be set explicitly
      this.readOnly = false;
      this.control = null;
      this.isBlockly = false;
      this.blocklySource = '';
      this.workspace = null;
   }
   Buffer.prototype.dump = function () {
      return {
         text: this.text,
         language: this.language,
         selection: this.selection
      };
   };
   Buffer.prototype.load = function (dump) {
      this.update(dump);
      return this;
   };
   Buffer.prototype.update = function (attrs, quiet) {
      if ('tab' in attrs)
         this.tab = attrs.tab;
      if ('languages' in attrs)
         this.languages = attrs.languages;
      if ('text' in attrs)
         this.text = attrs.text.toString();
      if ('language' in attrs)
         this.language = attrs.language;
      if ('readOnly' in attrs)
         this.readOnly = attrs.readOnly;
      if ('selection' in attrs)
         this.selection = _.clone(attrs.selection);
      if ('isBlockly' in attrs) {
         this.isBlockly = attrs.isBlockly;
      } else {
         this.isBlockly = false;
      }
      if ('blocklySource' in attrs)
         this.blocklySource = attrs.blocklySource;
      if (!quiet)
         this.pushToControl();
      return this;
   };
   Buffer.prototype.getLanguages = function () {
      if (this.languages)
         return this.languages;
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
      if (this.control)
         this.control.load();
      return this;
   };
   Buffer.prototype.pullFromControl = function () {
      if (this.control)
         this.update(this.control.dump(), true);
      return this;
   };
   Buffer.prototype.recordEvent = function (e) {
      e.unshift(this.id);
      recorder.addEvent(e);
   };
   Buffer.prototype.logInsert = function (r1, c1, r2, c2, ls) {
      recorder.addEvent([this.id, 'i', r1, c1, r2, c2].concat(ls));
   };
   Buffer.prototype.logDelete = function (r1, c1, r2, c2) {
      recorder.addEvent([this.id, 'd', r1, c1, r2, c2]);
   };
   Buffer.prototype.logCursor = function (row, column) {
      recorder.addEvent([this.id, 'c', row, column]);
   };
   Buffer.prototype.logSelect = function (r1, c1, r2, c2) {
      recorder.addEvent([this.id, 's', r1, c1, r2, c2]);
   };
   Buffer.prototype.focus = function () {
      if (this.control)
         this.control.focus();
   };
   Buffer.prototype.replayEvent = function (e) {
      var control = this.control;
      if (!control) {
         // TODO: emulate the event...
         return;
      }
      switch (e[2]) {
         case 'c': control.moveCursor(e[3], e[4]); break;
         case 'i': control.insertLines(e[3], e[4], e[5], e[6], e.slice(7)); break;
         case 'd': control.deleteLines(e[3], e[4], e[5], e[6]); break;
         case 's': control.setSelection(e[3], e[4], e[5], e[6]); break;
         default: console.log('Buffer ignored event', e[2]);
      }
   };

   return service;
}
