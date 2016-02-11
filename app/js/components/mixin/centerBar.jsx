'use strict';

var _    = require('lodash');

var util = require('js/util');

var centerBar = function(refName) {
    if (!refName) {
        // Not really sure what to do here.
        throw new Error('No refName defined for centerBar()');
    }

    var bar = this.refs[refName];
    var barWidth = bar.offsetWidth;
    var windowWidth = window.innerWidth;
    var left = util.int((windowWidth - barWidth) / 2);
    bar.style.left = left + 'px';
};

module.exports = function(refName) {
    return {
        componentDidMount  : _.partial(centerBar, refName),
        componentDidUpdate : _.partial(centerBar, refName)
    };
};
