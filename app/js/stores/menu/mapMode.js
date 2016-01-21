'use strict';

var Reflux = require('reflux');

var MapActions = require('js/actions/menu/map');

var PLANET_MAP_MODE = 'planetMap';
var STAR_MAP_MODE   = 'starMap';
var NEW_MAP_MODE    = 'newMap';

var MapModeStore = Reflux.createStore({
    listenables: MapActions,

    init: function() {
        this.mapMode = this.getInitialState();
    },

    getInitialState: function() {
        return PLANET_MAP_MODE;
    },

    setMapMode: function(mapMode) {
        if (mapMode !== this.mapMode) {
            this.mapMode = mapMode;
            this.trigger(this.mapMode);
        }
    },

    onShowPlanetMap: function() {
        this.setMapMode(PLANET_MAP_MODE);
    },

    onShowStarMap: function() {
        this.setMapMode(STAR_MAP_MODE);
    },

    onShowNewMap: function() {
        this.setMapMode(NEW_MAP_MODE);
    },

    onToggleMapMode: function() {
        if (this.mapMode === PLANET_MAP_MODE) {
            this.setMapMode(STAR_MAP_MODE);
        }
        else if (this.mapMode === STAR_MAP_MODE) {
            this.setMapMode(NEW_MAP_MODE);
        }
        else {
            this.setMapMode(PLANET_MAP_MODE);
        }
    }
});

module.exports = MapModeStore;
module.exports.PLANET_MAP_MODE  = PLANET_MAP_MODE;
module.exports.STAR_MAP_MODE    = STAR_MAP_MODE;
module.exports.NEW_MAP_MODE     = NEW_MAP_MODE;
