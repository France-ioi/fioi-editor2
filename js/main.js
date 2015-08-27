'use strict';
define(['angular', 'lodash'], function (angular, _) {

var m = angular.module('fioi-editor2', []);
require('./services/tabsets')(m);
require('./services/tabs')(m);
require('./services/buffers')(m);
require('./directives/editor')(m);
require('./directives/buffer')(m);

});