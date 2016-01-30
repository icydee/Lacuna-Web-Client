'use strict';

var Reflux = require('reflux');

var StarMapActions  = require('js/actions/map/star');

var StarMapStore = Reflux.createStore({
    listenables: [StarmapActions]
});

module.exports = StarMapStore;
