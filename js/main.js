'use strict';
var m = angular.module('fioi-editor2', []);
require('./services/storage')(m);
require('./directives/editor')(m);
require('./directives/buffer')(m);
