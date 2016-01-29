'use strict';

var React = require('react');
var Reflux = require('reflux');

var Panel = require('js/components/panel');
var Lib = window.YAHOO.lacuna.Library;
var starFieldImage = "url(" + Lib.AssetUrl+'star_system/field.png' + ")";

var StarField = React.createClass({


    render: function() {
        return (
            <div id="starmap" style={{ width: "100vw", height: "100vh", position: "absolute", top: 0, backgroundImage: starFieldImage }} >
            </div>
        );
    }
});

module.exports = StarField;
