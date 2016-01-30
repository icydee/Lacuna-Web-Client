'use strict';

var React       = require('react');
var Reflux      = require('reflux');
var Draggable   = require('react-draggable');
var Panel       = require('js/components/panel');

var Lib = window.YAHOO.lacuna.Library;
var starFieldImage = "url(" + Lib.AssetUrl+'star_system/field.png' + ")";


var StarField = React.createClass({
    render: function() {
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;
        
        return (
            // This is the 'view-port' container
            <div id="view-port" style={{
                width:      windowWidth,
                height:     windowHeight,
                position:   "absolute",
                top:        0,
                left:       0
              }}>
              // This is the whole of the expanse
              <div id="expanse" style={{
                position:   "absolute",
                left:       windowWidth - 20000,
                top:        windowHeight - 20000,
                width:      40000 - windowWidth,
                height:     40000 - windowHeight
              }}>
                <Draggable 
                  bounds = "parent"
                >
                  <div id="starmap" style={{ 
                    width:    20000, 
                    height:   20000, 
                    position: "absolute", 
                    top:      10000,
                    left:     10000,
                    backgroundImage: starFieldImage 
                  }} />
                </Draggable>
              </div>
            </div>
        );
    }
});

module.exports = StarField;
