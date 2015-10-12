define(['module', 'angular', 'lodash', 'angular-ui-ace'], function (module, angular, _) {
'use strict';

require('./main.css');

var m = angular.module('fioi-editor2', ['ui.ace']);

m.factory('FioiEditor2Config', function () {
   var service = {};
   // Set rootUri to the directory containing the compiled fioi-editor2.js,
   // whose URI will be made available by require.js as module.uri.
   service.rootUri = module.uri.replace(/\/[^/]*$/, '');
   return service;
});

require('./services/signals')(m);
require('./services/registry')(m);
require('./services/audio')(m);
require('./services/recorder')(m);
require('./services/player')(m);
require('./services/tabsets')(m);
require('./services/tabs')(m);
require('./services/buffers')(m);
require('./directives/editor')(m);
require('./directives/buffer')(m);

});
