'use strict';

var React                   = require('react');
var Reflux                  = require('reflux');
var _                       = require('lodash');


var BuildingWindowActions   = require('js/actions/windows/building');

var ActionButton            = require('js/components/windows/building/actionButton');
var ResourceProduction      = require('js/components/windows/building/resourceProduction');
var ResourceCost            = require('js/components/windows/building/resourceCost');
var ResourceLine            = require('js/components/windows/building/resourceLine');

var util                    = require('js/util');
var vex                     = require('js/vex');

var ProductionTab = React.createClass({

    onDemolishClick : function() {
        var name = this.props.building.name + ' ' + this.props.building.level;

        vex.confirm(
            'Are you sure you want to demolish your ' + name + '?',
            _.bind(function() {
                BuildingWindowActions.buildingWindowDemolish(this.props.building.url, this.props.building.id);
            }, this)
        );
    },

    onDowngradeClick : function() {
        var name = this.props.building.name + ' ' + this.props.building.level;

        vex.confirm(
            'Are you sure you want to downgrade your ' + name + '?',
            _.bind(function() {
                BuildingWindowActions.buildingWindowDowngrade(this.props.building.url, this.props.building.id);
            }, this)
        );
    },

    onUpgradeClick : function() {
        BuildingWindowActions.buildingWindowUpgrade(this.props.building.url, this.props.building.id);
    },

    render : function() {
        var b    = this.props.building;
        var body = this.props.body;

        // Don't let the user downgrade a level 1 building. They shoulod demolish it instead.
        if (b.level === 1) {
            b.downgrade.can = 0;
            b.downgrade.reason = [
                1009,
                'You cannot downgrade a level 1 building.',
                undefined
            ];
        }

        return (
            <div className="ui grid">

                <div className="ui centered row">
                    <div className="five wide column">
                        <div style={{
                            textAlign  : 'center',
                            fontWeight : 'bold'
                        }}>
                            Current production
                        </div>
                    </div>
                    <div className="five wide column">
                        <div style={{
                            textAlign  : 'center',
                            fontWeight : 'bold'
                        }}>
                            Upgrade production
                        </div>
                    </div>
                    <div className="five wide column">
                        <div style={{
                            textAlign  : 'center',
                            fontWeight : 'bold'
                        }}>
                            Upgrade cost
                        </div>
                    </div>
                </div>

                <div className="ui centered row">

                    <div className="five wide column">
                        <ResourceProduction
                            icon="food"
                            number={b.food_hour}
                        />
                        <ResourceProduction
                            icon="diamond"
                            number={b.ore_hour}
                        />

                        <ResourceProduction
                            icon="theme"
                            number={b.water_hour}
                        />

                        <ResourceProduction
                            icon="lightning"
                            number={b.energy_hour}
                        />

                        <ResourceProduction
                            icon="trash"
                            number={b.waste_hour}
                        />

                        <ResourceProduction
                            icon="smile"
                            number={b.happiness_hour}
                        />
                    </div>

                    <div className="five wide column">
                        <ResourceProduction
                            icon="food"
                            number={b.upgrade.production.food_hour}
                        />
                        <ResourceProduction
                            icon="diamond"
                            number={b.upgrade.production.ore_hour}
                        />

                        <ResourceProduction
                            icon="theme"
                            number={b.upgrade.production.water_hour}
                        />

                        <ResourceProduction
                            icon="lightning"
                            number={b.upgrade.production.energy_hour}
                        />

                        <ResourceProduction
                            icon="trash"
                            number={b.upgrade.production.waste_hour}
                        />

                        <ResourceProduction
                            icon="smile"
                            number={b.upgrade.production.happiness_hour}
                        />
                    </div>

                    <div className="five wide column">
                        <ResourceCost
                            icon="food"
                            number={b.upgrade.cost.food}
                            stored={body.food_stored}
                        />
                        <ResourceCost
                            icon="diamond"
                            number={b.upgrade.cost.ore}
                            stored={body.ore_stored}
                        />

                        <ResourceCost
                            icon="theme"
                            number={b.upgrade.cost.water}
                            stored={body.water_stored}
                        />

                        <ResourceCost
                            icon="lightning"
                            number={b.upgrade.cost.energy}
                            stored={body.energy_stored}
                        />

                        <ResourceCost
                            icon="trash"
                            number={b.upgrade.cost.waste}
                        />

                        <ResourceLine
                            icon="wait"
                            title=""
                            content={util.formatTime(b.upgrade.cost.time)}
                        />
                    </div>
                </div>

                <div className="ui centered row">
                    <div className="fifteen wide column">
                        <div className="3 ui medium fluid buttons">
                            <ActionButton
                                color="red"
                                actionName="Demolish"
                                onClick={this.onDemolishClick}
                            />

                           <ActionButton
                                color="green"
                                actionName="Upgrade"
                                error={b.upgrade.can ? '' : b.upgrade.reason[1]}
                                onClick={this.onUpgradeClick}
                            />

                            <ActionButton
                                color="blue"
                                actionName="Downgrade"
                                error={b.downgrade.can ? '' : b.downgrade.reason[1]}
                                onClick={this.onDowngradeClick}
                            />

                         </div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = ProductionTab;
