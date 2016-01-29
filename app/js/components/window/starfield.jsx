'use strict';

var React = require('react');
var Reflux = require('reflux');

var Panel = require('js/components/panel');

var StarField = React.createClass({

    render: function() {
        return (
            <div id="starmap" style={{ width: 1603, height: 1339, overflow: "hidden", backgroundImage: "url('//d16cbq0l6kkf21.cloudfront.net/assets/star_system/field.png')" }} >
            </div>
        );
    }
});

module.exports = StarField;
