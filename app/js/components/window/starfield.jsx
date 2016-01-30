'use strict';

var React       = require('react');
var Reflux      = require('reflux');
var Draggable   = require('react-draggable');
var Panel       = require('js/components/panel');
var StarTiles   = require('js/components/windows/startiles');

var Lib = window.YAHOO.lacuna.Library;
var starFieldImage = "url(" + Lib.AssetUrl+'star_system/field.png' + ")";


var StarField = React.createClass({
    propTypes: {
        zoom:   React.PropTypes.number
    },

    getDefaultProps: function() {
        return {
            zoom:   0,
        };
    },

    render: function() {
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;
       
        // the 'viewport' represents the bit you see in your browser
        // it will be the size of your browser window.
        //
        // the 'expanse' can be thought of as the backdrop on which
        // the whole of the starmap will be rendered, 2999 x 2999
        // however we will not render every single star and planet!
        // we will however render the stars visible in the viewport
        // and perhaps some just outside the viewport.
        //
        // as the 'expanse' is dragged it will bring more stars into
        // view and we can then remove some of the stars off the other
        // side which have gone out of view.
        //
        // the 'bounds_box' is calculated so we can prevent the expanse
        // from scrolling off the edges of the map
        // 
        return (
            <div id="view-port" style={{
                width:      windowWidth,
                height:     windowHeight,
                position:   "absolute",
                top:        0,
                left:       0
              }}>
              <div id="bounds_box" style={{
                position:   "absolute",
                left:       windowWidth - 20000,
                top:        windowHeight - 20000,
                width:      40000 - windowWidth,
                height:     40000 - windowHeight
              }}>
                <Draggable 
                  bounds = "parent"
                >
                  <div id="expanse" style={{ 
                    width:    20000, 
                    height:   20000, 
                    position: "absolute", 
                    top:      10000,
                    left:     10000,
                    backgroundImage: starFieldImage 
                  }}>
                    <StarTiles />
                  </div>
                </Draggable>
              </div>
            </div>
        );
    }
});

module.exports = StarField;
