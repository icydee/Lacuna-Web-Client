'use strict';

var React       = require('react');
var Reflux      = require('reflux');
var Draggable   = require('react-draggable');
var Panel       = require('js/components/panel');

var Lib = window.YAHOO.lacuna.Library;
var starFieldImage = "url(" + Lib.AssetUrl+'star_system/field.png' + ")";


var StarField = React.createClass({
    render: function() {
        return (
            <div id="expanse" style={{
                width:      "100vw",
                height:     "100vh",
                position:   "absolute",
                top:        0,
                left:       0
              }}>
              <Draggable >
                <div id="starmap" style={{ 
                  width:    20000, 
                  height:   20000, 
                  position: "absolute", 
                  top:      -10000,
                  left:     -10000,
                  backgroundImage: starFieldImage 
                }} />
              </Draggable>
            </div>
        );
    }
});

module.exports = StarField;
