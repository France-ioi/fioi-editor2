'use strict';
define(['angular', 'lodash', 'angular-ui-ace'], function (angular, _) {

require('./main.css');

var m = angular.module('fioi-editor2', ['ui.ace']);
require('./services/recorder')(m);
require('./services/tabsets')(m);
require('./services/tabs')(m);
require('./services/buffers')(m);
require('./directives/editor')(m);
require('./directives/buffer')(m);

});