'use strict';

var Reflux = require('reflux');

var MapActions = Reflux.createActions([
    'showPlanetMap',
    'showStarMap',
    'showNewMap',
    'toggleMapMode',
    'changePlanet'
]);

module.exports = MapActions;
