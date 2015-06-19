'use strict';

var Reflux = require('reflux');

var Window = require('js/stores/mixins/window');

var StatsActions = require('js/actions/window/stats');

var StatsStore = Reflux.createStore({
    mixins: [Window],
    listenables: StatsActions
});

module.exports = StatsStore;
