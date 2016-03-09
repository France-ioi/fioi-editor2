
import angular from 'angular';
import 'angular-bootstrap';
import 'angular-ui-ace';

import './main.css!';

import {AudioFactory} from './services/audio.js';
import {BuffersFactory} from './services/buffers.js';
import {PlayerFactory} from './services/player.js';
import {RecorderFactory} from './services/recorder.js';
import {RegistryFactory} from './services/registry.js';
import {SignalsFactory} from './services/signals.js';
import {TabsServiceFactory} from './services/tabs.js';
import {TabsetsServiceFactory} from './services/tabsets.js';
import {bufferDirective} from './directives/buffer.js';
import {editorDirective} from './directives/editor.js';

function Config () {
   var service = {};
   // Set rootUri to the directory containing the compiled fioi-editor2.js,
   // whose URI will be made available by require.js as module.uri.
   service.rootUri = '@@ROOT_URI@@'; // module.uri.replace(/\/[^/]*$/, '');
   return service;
}

angular
   .module('fioi-editor2', ['ui.ace'])
   .factory('FioiEditor2Config', Config)
   .factory('FioiEditor2Registry', RegistryFactory)
   .factory('FioiEditor2Signals', SignalsFactory)
   .factory('FioiEditor2Audio', AudioFactory)
   .factory('FioiEditor2Recorder', RecorderFactory)
   .factory('FioiEditor2Player', PlayerFactory)
   .factory('FioiEditor2Buffers', BuffersFactory)
   .factory('FioiEditor2Tabs', TabsServiceFactory)
   .factory('FioiEditor2Tabsets', TabsetsServiceFactory)
   .directive('fioiEditor2Buffer', bufferDirective)
   .directive('fioiEditor2', editorDirective);
