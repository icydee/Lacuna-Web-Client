YAHOO.namespace("lacuna.buildings");

if (typeof YAHOO.lacuna.buildings.Embassy == "undefined" || !YAHOO.lacuna.buildings.Embassy) {
    
(function(){
    var Lang = YAHOO.lang,
        Util = YAHOO.util,
        Dom = Util.Dom,
        Event = Util.Event,
        Sel = Util.Selector,
        Lacuna = YAHOO.lacuna,
        Game = Lacuna.Game,
        Lib = Lacuna.Library,
        stashSel = '<select><option value="1">1</option><option value="10">10</option><option value="100">100</option><option value="1000" selected="selected">1000</option><option value="10000">10000</option></select>';

    var Embassy = function(result){
        Embassy.superclass.constructor.call(this, result);
        
        this.service = Game.Services.Buildings.Embassy;
        this.alliance = result.alliance_status;
        this.isLeader = this.alliance && this.alliance.leader_id == Game.EmpireData.id;
        
        if(this.building.level > 0) {
            this.subscribe("onLoad", this.MembersPopulate, this, true);
        }
        this.canRepealLaw = this.building.level >= 5;
    };
    
    Lang.extend(Embassy, Lacuna.buildings.Building, {
        /*destroy : function() {
            Event.removeListener(document, "mouseup", this.StashMouseUp);
            
            Embassy.superclass.destroy.call(this);
        },*/
        getChildTabs : function() {
            if(this.alliance) {
                var tabs =  [this._getStashTab(),this._getAllianceTab(),this._getMemberTab(),this._getInvitesTab()];
                if(this.isLeader) {
                    tabs.push(this._getSendTab());
                }
                tabs.push(this._getLawsTab());
                tabs.push(this._getPropsTab());
                if(this.building.level >= 4) {
                    tabs.push(this._getProposeTab());
                }
                return tabs;
            }
            else {
                return [this._getCreateAllianceTab(),this._getInvitesTab()];
            }
        },
        _getLawsTab : function() {
            this.lawsTab = new YAHOO.widget.Tab({ label: "Laws", content: [
                '<div>',
                '    <div style="overflow:auto;"><ul id="lawsDetails"></ul></div>',
                '</div>'
            ].join('')});
            this.lawsTab.subscribe("activeChange", function(e) {
                if(e.newValue) {
                    if(!this.laws) {
                        Lacuna.Pulser.Show();
                        this.service.view_laws({ session_id:Game.GetSession(), building_id:this.building.id }, {
                            success : function(o){
                                Lacuna.Pulser.Hide();
                                this.rpcSuccess(o);
                                this.laws = o.result.laws;

                                this.LawsPopulate();
                            },
                            scope:this
                        });
                    }
                }
            }, this, true);

            Event.delegate("lawsDetails", "click", this.LawClick, "button", this, true);
            Event.delegate("lawsDetails", "click", this.handleProfileLink, "a.profile_link", this, true);
            Event.delegate("lawsDetails", "click", this.handleStarmapLink, "a.starmap_link", this, true);
            Event.delegate("lawsDetails", "click", this.handlePlanetLink, "a.planet_link", this, true);
            Event.delegate("lawsDetails", "click", this.handleAllianceLink, "a.alliance_link", this, true);

            return this.lawsTab;
        },
        _getPropsTab : function() {
            this.propsTab = new YAHOO.widget.Tab({ label: "Propositions", content: [
                '<div>',
                '    <div style="overflow:auto;"><ul id="propsDetails"></ul></div>',
                '</div>'
            ].join('')});

            return this.propsTab;
        },
        _getProposeTab : function() {
            this.createEvent("onAllianceMembers");
            this.createEvent("onSeizedStars");
            var opts = ['<option value="proposeWrit" selected>Writ</option>'];
            var dis = [];
            var getAllianceMembers;
            this.seized_stars = [];

            if (this.building.level >= 8) {
                this.service.get_stars_in_jurisdiction({session_id:Game.GetSession(""),building_id:this.building.id},{
                    success:function(o){
                        this.seized_stars = o.result.stars;
                        this.fireEvent("onSeizedStars");
                    },
                    scope : this
                });
            }

            if(this.building.level >= 6) {
                opts[opts.length] = '<option value="proposeTransfer">Transfer Station Ownership</option>';
                dis[dis.length] = [
                '    <div id="proposeTransfer" class="proposeOption" style="display:none;">',
                '        <label>Empire:</label><select id="proposeTransferTo"></select><br />',
                '        <button type="button" id="proposeTransferSubmit">Propose Transfer</button>',
                '    </div>'
                ].join('');
                getAllianceMembers = true;
                this.subscribe("onLoad", function() {
                    this.subscribe("onAllianceMembers", function() {
                        var sel = Dom.get("proposeTransferTo"),
                            opts = [];
                        for(var n=0; n<this.allianceMembers.length; n++) {
                            var member = this.allianceMembers[n];
                            if(member.id != Game.EmpireData.id) {
                                opts[opts.length] = '<option value="'+member.id+'">'+member.name+'</option>';
                            }
                        }
                        sel.innerHTML = opts.join('');
                        sel.selectedIndex = -1;
                    }, this, true);
                    Event.on("proposeTransferSubmit", "click", this.TransferOwner, this, true);
                }, this, true);
            }

            if(this.building.level >= 7) {
                opts[opts.length] = '<option value="proposeSeizeStar">Seize Star</option>';
                dis[dis.length] = [
                '    <div id="proposeSeizeStar" class="proposeOption" style="display:none;">',
                '        <label>Star:</label><input type="text" id="proposeSeizeStarFind" /><br />',
                '        <button type="button" id="proposeSeizeStarSubmit">Propose Seize Star</button>',
                '    </div>'
                ].join('');
                this.subscribe("onLoad", function() {
                    this.seizeStarTextboxList = this.CreateStarSearch("proposeSeizeStarFind");
                    Event.on("proposeSeizeStarSubmit", "click", this.SeizeStar, this, true);
                }, this, true);
            }

            if(this.building.level >= 8) {
                opts[opts.length] = '<option value="proposeRenameStar">Rename Star</option>';
                dis[dis.length] = [
                '    <div id="proposeRenameStar" class="proposeOption" style="display:none;">',
                '        <ul><li><label>Star:</label><select id="proposeRenameStarSelect"></select></li>',
                '        <li><label>New Name:</label><input type="text" id="proposeRenameStarName" /></li></ul><br />',
                '        <button type="button" id="proposeRenameStarSubmit">Propose Rename Star</button>',
                '    </div>'
                ].join('');
                this.subscribe("onLoad", function() {
                    this.subscribe("onSeizedStars", function() {
                        var el = Dom.get('proposeRenameStarSelect');
                        if (el) {
                            var opts = [];
                            for(var m=0; m<this.seized_stars.length; m++) {
                                var obj = this.seized_stars[m];
                                opts[opts.length] = '<option value="'+obj.id+'">'+obj.name+'</option>';
                            }
    
                            el.innerHTML = opts.join('');
                            el.selectedIndex = -1;
                        }
                        Event.on("proposeRenameStarSubmit", "click", this.RenameStar, this, true);
                    }, this, true);
                }, this, true);
            }

            if(this.building.level >= 9) {
                opts[opts.length] = '<option value="proposeBroadcast">Broadcast on Net19</option>';
                dis[dis.length] = [
                '    <div id="proposeBroadcast" class="proposeOption" style="display:none;">',
                '        <label>Message:</label><input type="text" id="proposeBroadcastMessage" maxlength="100" size="50" /><br />',
                '        <button type="button" id="proposeBroadcastSubmit">Propose Broadcast</button>',
                '    </div>'
                ].join('');
                this.subscribe("onLoad", function() {
                    Event.on("proposeBroadcastSubmit", "click", this.Broadcast, this, true);
                }, this, true);
            }

            if(this.building.level >= 10) {
                opts[opts.length] = '<option value="proposeInduct">Induct Member</option>';
                opts[opts.length] = '<option value="proposeExpel">Expel Member</option>';
                dis[dis.length] = [
                '    <div id="proposeInduct" class="proposeOption" style="display:none;">',
                '        <ul><li><label>Empire:</label><input type="text" id="proposeInductMember" /></li>',
                '        <li><label>Message:</label><textarea id="proposeInductMessage" rows="4" cols="80"></textarea></li></ul><br />',
                '        <button type="button" id="proposeInductSubmit">Propose Induct Member</button>',
                '    </div>',
                '    <div id="proposeExpel" class="proposeOption" style="display:none;">',
                '        <ul><li><label>Empire:</label><select id="proposeExpelMember"></select></li>',
                '        <li><label>Reason:</label><textarea id="proposeExpelReason" rows="4" cols="80"></textarea></li></ul><br />',
                '        <button type="button" id="proposeExpelSubmit">Propose Expel Member</button>',
                '    </div>'
                ].join('');
                getAllianceMembers = true;
                this.subscribe("onLoad", function() {
                    this.subscribe("onAllianceMembers", function() {
                        var sel = Dom.get("proposeExpelMember"),
                            opts = [];
                        for(var n=0; n<this.allianceMembers.length; n++) {
                            var member = this.allianceMembers[n];
                            if(!member.isLeader && member.id != Game.EmpireData.id) {
                                opts[opts.length] = '<option value="'+member.id+'">'+member.name+'</option>';
                            }
                        }
                        sel.innerHTML = opts.join('');
                        sel.selectedIndex = -1;
                    }, this, true);

                    this.inductMemberTextboxList = this.CreateEmpireSearch("proposeInductMember");
                    Event.on("proposeInductSubmit", "click", this.MemberInduct, this, true);
                    Event.on("proposeExpelSubmit", "click", this.MemberExpel, this, true);
                }, this, true);
            }

            if(this.building.level >= 11) {
                opts[opts.length] = '<option value="proposeElectLeader">Elect New Leader</option>';
                dis[dis.length] = [
                '    <div id="proposeElectLeader" class="proposeOption" style="display:none;">',
                '        <label>Empire:</label><select id="proposeElectLeaderMember"></select><br />',
                '        <button type="button" id="proposeElectLeaderSubmit">Propose as New Leader</button>',
                '    </div>'
                ].join('');
                getAllianceMembers = true;
                this.subscribe("onLoad", function() {
                    this.subscribe("onAllianceMembers", function() {
                        var sel = Dom.get("proposeElectLeaderMember"),
                            opts = [];
                        for(var n=0; n<this.allianceMembers.length; n++) {
                            var member = this.allianceMembers[n];
                            if(!member.isLeader && member.id != Game.EmpireData.id) {
                                opts[opts.length] = '<option value="'+member.id+'">'+member.name+'</option>';
                            }
                        }
                        sel.innerHTML = opts.join('');
                        sel.selectedIndex = -1;
                    }, this, true);
                    Event.on("proposeElectLeaderSubmit", "click", this.MemberNewLeader, this, true);
                }, this, true);
            }

            if(this.building.level >= 12) {
                opts[opts.length] = '<option value="proposeRenameAsteroid">Rename Asteroid</option>';
                dis[dis.length] = [
                '    <div id="proposeRenameAsteroid" class="proposeOption" style="display:none;">',
                                '               <ul><li><label>Star:</label><select id="proposeRenameAsteroidStar"></select></li>',
                '        <li><label>Asteroid:</label><select id="proposeRenameAsteroidName"></select></li>',
                '        <li><label>Name:</label><input type="text" id="proposeRenameAsteroidNewName" /></li></ul><br />',
                '        <button type="button" id="proposeRenameAsteroidSubmit">Propose Rename Asteroid</button>',
                '    </div>'
                ].join('');

                this.subscribe("onSeizedStars", function() {
                    var el = Dom.get('proposeRenameAsteroidStar');
                    if (el) {
                        var opts = [];
                        for(var m = 0; m < this.seized_stars.length; m++) {
                            var obj = this.seized_stars[m];
                            opts[opts.length] = '<option value="' + obj.id + '">' + obj.name + '</option>';
                        }
                        el.innerHTML = opts.join('');
                        el.selectedIndex = -1;
                    }
                }, this, true);

                Event.on('proposeRenameAsteroidStar', 'change', this.PopulateBodiesForStar, {
                    starElement: 'proposeRenameAsteroidStar',
                    bodyElement: 'proposeRenameAsteroidName',
                    type: 'asteroid',
                    Self: this}, true);

                Event.on('proposeRenameAsteroidSubmit', 'click', this.RenameAsteroid, this, true);
            }

            if(this.building.level >= 13) {
                opts[opts.length] = '<option value="proposeMembersMining">Members Only Mining Rights</option>';
                dis[dis.length] = [
                '    <div id="proposeMembersMining" class="proposeOption" style="display:none;">',
                '        Allow only members to mine on asteroids under this stations jurisdiction.<br />',
                '        <button type="button" id="proposeMembersMiningSubmit">Propose</button>',
                '    </div>'
                ].join('');
                Event.on("proposeMembersMiningSubmit", "click", this.MiningOnly, this, true);
            }

            if(this.building.level >= 14) {
                                opts[opts.length] = '<option value="proposeEvictMining">Evict Mining Platform</option>';
                dis[dis.length] = [
                '    <div id="proposeEvictMining" class="proposeOption" style="display:none;">',
                '               <ul><li><label>Star:</label><select id="proposeEvictMiningStar"></select></li>',
                '        <button type="button" id="proposeEvictMiningSubmit">Propose Eviction</button></ul>',
                '    </div>'
                ].join('');

                this.subscribe("onSeizedStars", function() {
                    var el = Dom.get('proposeEvictMiningStar');
                    if (el) {
                        var opts = [];
                        for(var m = 0; m < this.seized_stars.length; m++) {
                            var obj = this.seized_stars[m];
                            opts[opts.length] = '<option value="' + obj.id + '">' + obj.name + '</option>';
                        }

                        el.innerHTML = opts.join('');
                        el.selectedIndex = -1;
                    }
                }, this, true);

                Event.on("proposeEvictMiningStar", "change", this.PopulateBodiesForStar, {
                    starElement: 'proposeEvictMiningStar',
                    type: 'asteroid',
                    Self: this}, true);
                Event.on('proposeEvictMiningBody', 'change', this.LoadMining, this, true);
                Event.on('proposeEvictMiningSubmit', 'click', this.EvictMining, this, true);
            }

            if(this.building.level >= 17) {
                opts[opts.length] = '<option value="proposeRenameUninhabited">Rename Uninhabited</option>';
                dis[dis.length] = [
                '    <div id="proposeRenameUninhabited" class="proposeOption" style="display:none;">',
                                '               <ul><li><label>Star:</label><select id="proposeRenameUninhabitedStar"></select></li>',
                '        <li><label>Planet:</label><select id="proposeRenameUninhabitedName"></select></li>',
                '        <li><label>Name:</label><input type="text" id="proposeRenameUninhabitedNewName" /></li></ul><br />',
                '        <button type="button" id="proposeRenameUninhabitedSubmit">Propose Rename Uninhabited</button>',
                '    </div>'
                ].join('');

                this.subscribe("onSeizedStars", function() {
                    var el = Dom.get('proposeRenameUninhabitedStar');
                    if (el) {
                        var opts = [];
                        for(var m = 0; m < this.seized_stars.length; m++) {
                            var obj = this.seized_stars[m];
                            opts[opts.length] = '<option value="' + obj.id + '">' + obj.name + '</option>';
                        }

                        el.innerHTML = opts.join('');
                        el.selectedIndex = -1;
                    }
                }, this, true);

                Event.on('proposeRenameUninhabitedStar', 'change', this.PopulateBodiesForStar, {
                    starElement: 'proposeRenameUninhabitedStar',
                    bodyElement: 'proposeRenameUninhabitedName',
                    type: 'habitable planet',
                    Self: this}, true);

                Event.on('proposeRenameUninhabitedSubmit', 'click', this.RenameUninhabited, this, true);
            }

            if(this.building.level >= 18) {
                opts[opts.length] = '<option value="proposeMembersColonize">Members Only Colonization</option>';
                dis[dis.length] = [
                '    <div id="proposeMembersColonize" class="proposeOption" style="display:none;">',
                '        Allow only members to colonize planets under this stations jurisdiction.<br />',
                '        <button type="button" id="proposeMembersColonizeSubmit">Propose</button>',
                '    </div>'
                ].join('');
                Event.on("proposeMembersColonizeSubmit", "click", this.ColonizeOnly, this, true);
            }

            if(this.building.level >= 20) {
                opts[opts.length] = '<option value="proposeMembersExcavation">Members Only Excavation</option>';
                dis[dis.length] = [
                '    <div id="proposeMembersExcavation" class="proposeOption" style="display:none;">',
                '        Allow only members to excavate on bodies under this stations jurisdiction.<br />',
                '        <button type="button" id="proposeMembersExcavationSubmit">Propose</button>',
                '    </div>'
                ].join('');
                Event.on("proposeMembersExcavationSubmit", "click", this.ExcavationOnly, this, true);
            }
            if(this.building.level >= 21) {
                opts[opts.length] = '<option value="proposeEvictExcav">Evict Excavator</option>';
                dis[dis.length] = [
                '    <div id="proposeEvictExcav" class="proposeOption" style="display:none;">',
                                '               <ul><li><label>Star:</label><select id="proposeEvictExcavStar"></select></li>',
                                '                <li><label>Body:</label><select id="proposeEvictExcavBody"></select></li>',
                '        <li><label>Excavator:</label><select id="proposeEvictExcavId"></select></li><br />',
                '        <button type="button" id="proposeEvictExcavSubmit">Propose Eviction</button></ul>',
                '    </div>'
                ].join('');
            }

            if(this.building.level >= 23) {
                opts[opts.length] = '<option value="proposeNeutralizeBHG">Neutralize BHG</option>';
                dis[dis.length] = [
                '    <div id="proposeNeutralizeBHG" class="proposeOption" style="display:none;">',
                '        Neutralizes all Black Hole Generators under this stations jurisdiction.<br />',
                '        <button type="button" id="proposeNeutralizeBHGSubmit">Propose</button>',
                '    </div>'
                ].join('');
                Event.on("proposeNeutralizeBHGSubmit", "click", this.NeutralizeBHG, this, true);
            }

            if(this.building.level >= 25) {
                opts[opts.length] = '<option value="proposeFireBfg">Fire BFG</option>';
                dis[dis.length] = [
                '    <div id="proposeFireBfg" class="proposeOption" style="display:none;">',
                                '               <ul><li><label>Star:</label><select id="proposeFireBfgStars"></select></li>',
                '        <li><label>Body:</label><select id="proposeFireBfgBody"></select></li>',
                '        <li><label>Reason:</label><textarea id="proposeFireBfgReason" rows="4" cols="80"></textarea></li></ul><br />',
                '        <button type="button" id="proposeFireBfgSubmit">Propose to Fire BFG!</button>',
                '    </div>'
                ].join('');

                this.subscribe("onSeizedStars", function() {
                    var el = Dom.get('proposeFireBfgStars');
                    if (el) {
                        var opts = [];
                        for(var m = 0; m < this.seized_stars.length; m++) {
                            var obj = this.seized_stars[m];
                            opts[opts.length] = '<option value="' + obj.id + '">' + obj.name + '</option>';
                        }

                        el.innerHTML = opts.join('');
                        el.selectedIndex = -1;
                    }
                }, this, true);

                Event.on("proposeFireBfgStars", "change", this.PopulateBodiesForStar, {
                    starElement: 'proposeFireBfgStars',
                    bodyElement: 'proposeFireBfgBody',
                    Self: this}, true);
                Event.on("proposeFireBfgSubmit", "click", this.FireBFG, this, true);
            }

            if (getAllianceMembers) {
                    Game.Services.Alliance.view_profile({
                        session_id :    Game.GetSession(),
                        alliance_id :   Game.EmpireData.alliance_id
                    }, {
                        success: function(o) {
                            var el = Dom.get('proposeTransferTo');
                            if (el) {
                                var profile = o.result.profile;
                                var memberArray = [];
                                for (var m = 0; m < profile.members.length; m++) {
                                    var member = profile.members[m];
                                    member.isLeader = member.id == profile.leader_id
                                    memberArray[memberArray.length] = member;
                                }
                                this.allianceMembers = memberArray;
                                this.fireEvent("onAllianceMembers");
                            }
                        },
                        scope: this
                    });
            }

            this.proposeTab = new YAHOO.widget.Tab({ label: "Propose", content: [
                '<div id="proposeContainer">',
                '    <div style="border-bottom:1px solid #52acff;padding-bottom:5px; margin-bottom:5px;">',
                '        Propose: <select id="proposeSelect">',
                opts.join(''),
                '    </select></div>',
                '    <div id="proposeMessage"></div>',
                '    <div id="proposeWrit" class="proposeOption">',
                '        <ul><li><label>Template:</label><select id="proposeWritTemplates"></select></li>',
                '        <li><label>Title:</label><input type="text" id="proposeTitle" size="50" maxlength="30" /></li>',
                '        <li><label>Description:</label><textarea id="proposeDesc" rows="4" cols="80"></textarea></li></ul><br />',
                '        <button type="button" id="proposeWritSubmit">Propose Writ</button>',
                '    </div>',
                dis.join(''),
                '</div>'
            ].join('')});

            this.subscribe("onLoad", function() {
                this.proposeOptions = Sel.query("div.proposeOption", "proposeContainer");
                this.proposeMessage = Dom.get("proposeMessage");

                Event.on("proposeSelect", "change", function(e) {
                    Dom.setStyle(this.proposeOptions, "display", "none");
                    Dom.setStyle(Lib.getSelectedOptionValue("proposeSelect"), "display", "");
                }, this, true);

                //Propose Writ
                var t = Dom.get("proposeWritTemplates"),
                    templates = Game.Resources.writ_templates,
                    opts = [];
                for(var n=0; n<templates.length; n++) {
                    var tmp = templates[n];
                    opts.push('<option value="');
                    opts.push(n);
                    opts.push('">');
                    opts.push(tmp.title);
                    opts.push('</option>');
                }
                t.innerHTML = opts.join('');
                Dom.get("proposeTitle").value = templates[0].title;
                Dom.get("proposeDesc").value = templates[0].description;

                Event.on(t, "change", this.ProposeWritTemplateChange, this, true);

                Event.on("proposeWritSubmit", "click", this.ProposeWrit, this, true);
            }, this, true);

            return this.proposeTab;
        },
        _getAllianceTab : function() {
            var div = document.createElement("div");
            if(this.isLeader) {
                div.innerHTML = ['<div>',
                '    <ul>',
                '        <li><label>Founded: </label>', Lib.formatServerDate(this.alliance.date_created),'</li>',
                '        <li><label>Description: </label><input type="text" id="embassyAllianceDesc" value="', this.alliance.description,'" size="50" /></li>',
                '        <li><label>Forums: </label><input type="text" id="embassyAllianceForums" value="', this.alliance.forum_uri,'" size="50" /></li>',
                '        <li><label>Announcements: </label><textarea id="embassyAllianceAnnoucements" rows="2" cols="80">', this.alliance.announcements,'</textarea></li>',
                '        <li id="embassyAllianceMessage"></li>',
                '        <li><button type="button" id="embassyAllianceUpdate">Save</button></li>',
                '    </ul>',
                '    <hr /><div><button type="button" id="embassyAllianceDissolve">Dissolve Alliance</button>',
                '</div>'].join('');
                
                Event.on("embassyAllianceUpdate","click", this.UpdateAlliance, this, true);
                Event.on("embassyAllianceDissolve","click", this.DissolveAlliance, this, true);
            }
            else {
                div.innerHTML = ['<div>',
                '    <ul>',
                '        <li><label>Founded: </label>', Lib.formatServerDate(this.alliance.date_created),'</li>',
                '        <li><label>Description: </label>', this.alliance.description,'</li>',
                '        <li><label>Forums: </label>', this.alliance.forum_uri ? ['<a href="',this.alliance.forum_uri,'" target="_blank">View</a>'].join('') : '','</li>',
                '        <li><label>Announcements: </label>', this.alliance.announcements ? this.alliance.announcements.replace('\n','<br />') : "",'</li>',
                '    </ul>',
                '    <hr /><div>',
                '        <textarea id="embassyAllianceLeaveReason" rows="3" cols="80"></textarea>',
                '        <button type="button" id="embassyAllianceLeave">Leave Alliance</button>',
                '    </div>',
                '</div>'].join('');
                
                Event.on("embassyAllianceLeave","click", this.LeaveAlliance, this, true);
            }
        
            this.allianceTab = new YAHOO.widget.Tab({ label: 'Alliance', contentEl:div });
            
            return this.allianceTab;
        },
        _getMemberTab : function() {
            this.memberTab = new YAHOO.widget.Tab({ label: "Members", content: ['<div>',
            '    <ul class="embassyHeader embassyInfo clearafter">',
            '        <li class="embassyEmpire">Empire</li>',
            '        <li class="embassyAction"></li>',
            '        <li class="embassyMessage"></li>',
            '    </ul>',
            '    <div><div id="embassyMemberDetails"></div></div>',
            '</div>'].join('')});
            
            return this.memberTab;
        },
        _getCreateAllianceTab : function() {
            this.createAllianceTab = new YAHOO.widget.Tab({ label: "Create Alliance", content: ['<div>',
            '    <label>Alliance Name</label><input type="text" id="embassyCreateName" />',
            '    <div id="embassyCreateMessage" class="alert"></div>',
            '    <button type="button" id="embassyCreateSubmit">Create</button>',
            '</div>'].join('')});
            
            Event.on("embassyCreateSubmit", "click", this.CreateAlliance, this, true);
            
            return this.createAllianceTab;
        },
        _getInvitesTab : function() {
            this.invitesTab = new YAHOO.widget.Tab({ label: "My Invites", content: ['<div>',
            '    <ul class="embassyHeader embassyInfo clearafter">',
            '        <li class="embassyAlliance">Alliance</li>',
            '        <li class="embassyAction"></li>',
            '        <li class="embassyAction"></li>',
            '        <li class="embassyMessage"></li>',
            '    </ul>',
            '    <div><div id="embassyInvitesDetails"></div></div>',
            '</div>'].join('')});
            
            this.invitesTab.subscribe("activeChange", this.getInvites, this, true);
            
            return this.invitesTab;
        },
        _getSendTab : function() {
            this.sendTab = new YAHOO.widget.Tab({ label: "Send Invites", content: ['<div>',
            '    <ul>',
            '        <li>Invite: <span style="width:200px;display:inline-block;"><input id="embassySendTo" type="text" /></span></li>',
            '        <li>Message: <textarea id="embassySendMessage" rows="1" cols="80"></textarea></li>',
            '        <li><button type="button" id="embassySendInvite">Send Invite</button></li>',
            '    </ul>',
            '    <hr />',
            '    <h3>Pending Invites</h3>',
            '    <ul class="embassyHeader embassyInfo clearafter">',
            '        <li class="embassyEmpire">Empire</li>',
            '        <li class="embassyAction"></li>',
            '        <li class="embassyMessage"></li>',
            '    </ul>',
            '    <div><div id="embassySendDetails"></div></div>',
            '</div>'].join('')});
            
            this.sendTab.subscribe("activeChange", this.getPendingInvites, this,true);
            
            Event.on("embassySendInvite","click",this.SendInvite,this,true);
            
            return this.sendTab;
        },
        _getStashTab : function() {
            this.stashTab = new YAHOO.widget.Tab({ label: "Stash", content: [
            '<div id="embassyStashAnnounce"></div>',
            '<div class="embassyStash yui-g">',
            '    <div class="yui-g first">',
            '        <div class="yui-u first">',
            '            <legend>On Planet</legend>',
            '            <div class="embassyContainers" id="sopHt"><ul id="embassyStashOnPlanet"></ul></div>',
            '        </div>',
            '        <div class="yui-u">',
            '            <legend>Donate</legend>',
            '            <div class="embassyContainers" id="stdHt"><ul id="embassyStashToDonate"></ul></div>',
            '            <div>Total:<span id="embassyTotalDonate">0</span></div>',
            '        </div>',
            '    </div>',
            '    <div class="yui-g">',
            '        <div class="yui-u first">',
            '            <legend>Exchange</legend>',
            '            <div class="embassyContainers" id="steHt"><ul id="embassyStashToExchange"></ul></div>',
            '            <div>Total:<span id="embassyTotalExchange">0</span></div>',
            '        </div>',
            '        <div class="yui-u">',
            '            <legend>In Stash</legend>',
            '            <div class="embassyContainers" id="sisHt"><ul id="embassyStashInStash"></ul></div>',
            '        </div>',
            '    </div>',
            '</div>',
            '<div style="text-align: center;">',
            '    <div id="embassyStashMessage" class="alert"></div>',
            '    <button type="button" id="embassyStashSubmit">Transfer</button>',
            '</div>'].join('')});
            
            this.stashTab.subscribe("activeChange", this.getStash, this, true);
            
            Event.on("embassyStashSubmit", "click", this.StashSubmit, this, true);
            
            Event.delegate("embassyStashOnPlanet", "click", this.StashDonateAdd, "button", this, true);
            Event.delegate("embassyStashToDonate", "click", this.StashDonateRemove, "button", this, true);

            Event.delegate("embassyStashInStash", "click", this.StashExchangeAdd, "button", this, true);
            Event.delegate("embassyStashToExchange", "click", this.StashExchangeRemove, "button", this, true);
            
            return this.stashTab;
        },
        
        _createSendToSelect : function() {
            var dataSource = new Util.XHRDataSource("/empire");
            dataSource.connMethodPost = "POST";
            dataSource.maxCacheEntries = 2;
            dataSource.responseType = YAHOO.util.XHRDataSource.TYPE_JSON;
            dataSource.responseSchema = {
                resultsList : "result.empires",
                fields : ["name","id"]
            };
            
            var oTextboxList = new YAHOO.lacuna.TextboxList("embassySendTo", dataSource, { //config options
                maxResultsDisplayed: 10,
                minQueryLength:3,
                multiSelect:false,
                forceSelection:true,
                formatResultLabelKey:"name",
                formatResultColumnKeys:["name"],
                useIndicator:true
            });
            oTextboxList.generateRequest = function(sQuery){                
                var s = Lang.JSON.stringify({
                        "id": YAHOO.rpc.Service._requestId++,
                        "method": "find",
                        "jsonrpc": "2.0",
                        "params": [
                            Game.GetSession(""),
                            decodeURIComponent(sQuery)
                        ]
                    });
                return s;
            };
            
            this.embassySendTo = oTextboxList;
        },
        
        //Stash 
        getStash : function(e) {
            if(e.newValue) {
                Lacuna.Pulser.Show();
                this.service.view_stash({session_id:Game.GetSession(),building_id:this.building.id}, {
                    success : function(o){
                        Lacuna.Pulser.Hide();
                        this.rpcSuccess(o);
                        
                        delete o.result.status;
                        this.stash = o.result;
                        
                        this.StashPopulate();
                    },
                    scope:this
                });
            }
        },
        StashPopulate : function() {
            /*        
            "stash" : {"gold" : 4500},
            "stored" : {"energy" : 40000},
            "max_exchange_size" : 30000,
            "exchanges_remaining_today" : 1
            */
            var stash = this.stash || {}, 
                onPlanet = Dom.get("embassyStashOnPlanet"),
                inStash = Dom.get("embassyStashInStash"),
                announce = Dom.get("embassyStashAnnounce"),
                li = document.createElement("li"), nLi, ul,
                r,x,resource,name;
                
            if(announce) {
                announce.innerHTML = ['Donations are unlimited. You can exchange at most ', Lib.formatNumber(stash.max_exchange_size), ' resources and you have ', stash.exchanges_remaining_today, ' exchange(s) remaining today.'].join('');
            }
                
            if(onPlanet) {
                onPlanet.innerHTML = "";
                
                for(r in Lib.ResourceTypes) {
                    if(Lib.ResourceTypes.hasOwnProperty(r)) {
                        resource = Lib.ResourceTypes[r];
                        if(Lang.isArray(resource)) {
                            for(x=0; x < resource.length; x++) {
                                name = resource[x];
                                if(stash.stored[name]) {
                                    nLi = li.cloneNode(false);
                                    nLi.Stash = {type:name,quantity:stash.stored[name]*1};
                                    nLi.innerHTML = ['<span class="stashName">',name.titleCaps(), ' (<label class="quantity">', stash.stored[name], '</label>)</span> ', stashSel, '<button type="button">+</button>'].join('');
                                    onPlanet.appendChild(nLi);
                                }
                            }
                        }
                        else if(stash.stored[r] && resource) {
                            nLi = li.cloneNode(false);
                            nLi.Stash = {type:r,quantity:stash.stored[r]*1};
                            nLi.innerHTML = ['<span class="stashName">',r.titleCaps(), ' (<label class="quantity">', stash.stored[r], '</label>)</span> ', stashSel, '<button type="button">+</button>'].join('');
                            
                            onPlanet.appendChild(nLi);
                        }
                    }
                }
            }
            if(inStash && stash.stash) {
                inStash.innerHTML = "";                
                for(r in Lib.ResourceTypes) {
                    if(Lib.ResourceTypes.hasOwnProperty(r)) {
                        resource = Lib.ResourceTypes[r];
                        if(Lang.isArray(resource)) {
                            for(x=0; x < resource.length; x++) {
                                name = resource[x];
                                if(stash.stash[name]) {
                                    nLi = li.cloneNode(false);
                                    nLi.Stash = {type:name,quantity:stash.stash[name]*1};
                                    nLi.innerHTML = ['<span class="stashName">',name.titleCaps(), ' (<label class="quantity">', stash.stash[name], '</label>)</span> ', stashSel, '<button type="button">+</button>'].join('');
                                    inStash.appendChild(nLi);
                                }
                            }
                        }
                        else if(stash.stash[r] && resource) {
                            nLi = li.cloneNode(false);
                            nLi.Stash = {type:r,quantity:stash.stash[r]*1};
                            nLi.innerHTML = ['<span class="stashName">',r.titleCaps(), ' (<label class="quantity">', stash.stash[r], '</label>)</span> ', stashSel, '<button type="button">+</button>'].join('');
                            
                            inStash.appendChild(nLi);
                        }
                    }
                }
            }
            var Ht = Game.GetSize().h - 245;
            if(Ht > 200) { Ht = 200; }
            Dom.setStyle(Dom.get('sopHt'), 'height', Ht + 'px');
            Dom.setStyle(Dom.get('stdHt'), 'height', Ht + 'px');
            Dom.setStyle(Dom.get('steHt'), 'height', Ht + 'px');
            Dom.setStyle(Dom.get('sisHt'), 'height', Ht + 'px');

        },
        StashDonateAdd : function(e, matchedEl, container){
            var quantity = Lib.getSelectedOptionValue(matchedEl.previousSibling)*1,
                li = matchedEl.parentNode,
                c = Dom.get("embassyStashToDonate");
            if(quantity && c) {
                var id = "stashResource-" + li.Stash.type,
                    exists = Sel.query("#"+id, c);
                if(exists.length == 0) {
                    var item = document.createElement("li"),
                        del = item.appendChild(document.createElement("div")),
                        content = item.appendChild(document.createElement("div"));
                    item.id = id;
                    if(quantity > li.Stash.quantity) {
                        quantity = li.Stash.quantity;
                    }
                    Dom.addClass(item, "stashItem");
                    Dom.addClass(del, "stashDelete");
                    Event.on(del, "click", function(e){
                        var ed = Event.getTarget(e),
                            ep = ed.parentNode;
                        this.updateStashDonate(ep.Object.quantity * -1);
                        Event.purgeElement(ep);
                        ep.parentNode.removeChild(ep);
                    }, this, true);
                    item.Object = {type:li.Stash.type, quantity:quantity};
                    content.innerHTML = ['<span class="stashName">',item.Object.type.titleCaps(), ' (<label class="quantity">', quantity, '</label>)</span> ', stashSel, '<button type="button">-</button>'].join('');
                    c.appendChild(item);
                    this.updateStashDonate(quantity);
                }
                else {
                    var found = exists[0],
                        newTotal = found.Object.quantity + quantity,
                        diff = quantity,
                        lq = Sel.query(".quantity", found, true);
                    if(newTotal > li.Stash.quantity) {
                        newTotal = li.Stash.quantity;
                        diff = newTotal - found.Object.quantity;
                    }
                    lq.innerHTML = newTotal;
                    found.Object.quantity = newTotal;
                    this.updateStashDonate(diff);
                }
            }
        },
        StashDonateRemove : function(e, matchedEl, container){
            var quantity = Lib.getSelectedOptionValue(matchedEl.previousSibling)*1,
                li = matchedEl.parentNode.parentNode;
            if(quantity) {
                var newTotal = li.Object.quantity - quantity,
                    diff = quantity*-1,
                    lq = Sel.query(".quantity", li, true);
                if(newTotal < 0) {
                    newTotal = 0;
                    diff = li.Object.quantity*-1;
                }
                
                if(newTotal == 0) {
                    this.updateStashDonate(li.Object.quantity * -1);
                    Event.purgeElement(li);
                    li.parentNode.removeChild(li);
                }
                else {
                    lq.innerHTML = newTotal;
                    li.Object.quantity = newTotal;
                    this.updateStashDonate(diff);
                }
            }
        },
        StashExchangeAdd : function(e, matchedEl, container){
            var quantity = Lib.getSelectedOptionValue(matchedEl.previousSibling)*1,
                li = matchedEl.parentNode,
                c = Dom.get("embassyStashToExchange");
            if(quantity && c) {
                var id = "stashResource-" + li.Stash.type,
                    exists = Sel.query("#"+id, c);
                if(exists.length == 0) {
                    var item = document.createElement("li"),
                        del = item.appendChild(document.createElement("div")),
                        content = item.appendChild(document.createElement("div"));
                    item.id = id;
                    if(quantity > li.Stash.quantity) {
                        quantity = li.Stash.quantity;
                    }
                    Dom.addClass(item, "stashItem");
                    Dom.addClass(del, "stashDelete");
                    Event.on(del, "click", function(e){
                        var ed = Event.getTarget(e),
                            ep = ed.parentNode;
                        this.updateStashExchange(ep.Object.quantity * -1);
                        Event.purgeElement(ep);
                        ep.parentNode.removeChild(ep);
                    }, this, true);
                    item.Object = {type:li.Stash.type, quantity:quantity};
                    content.innerHTML = ['<span class="stashName">',item.Object.type.titleCaps(), ' (<label class="quantity">', quantity, '</label>)</span> ', stashSel, '<button type="button">-</button>'].join('');
                    c.appendChild(item);
                    this.updateStashExchange(quantity);
                }
                else {
                    var found = exists[0],
                        newTotal = found.Object.quantity + quantity,
                        diff = quantity,
                        lq = Sel.query(".quantity", found, true);
                    if(newTotal > li.Stash.quantity) {
                        newTotal = li.Stash.quantity;
                        diff = newTotal - found.Object.quantity;
                    }
                    lq.innerHTML = newTotal;
                    found.Object.quantity = newTotal;
                    this.updateStashExchange(diff);
                }
            }
        },
        StashExchangeRemove : function(e, matchedEl, container){
            var quantity = Lib.getSelectedOptionValue(matchedEl.previousSibling)*1,
                li = matchedEl.parentNode.parentNode;
            if(quantity) {
                var newTotal = li.Object.quantity - quantity,
                    diff = quantity*-1,
                    lq = Sel.query(".quantity", li, true);
                if(newTotal < 0) {
                    newTotal = 0;
                    diff = li.Object.quantity;
                }
                
                if(newTotal == 0) {
                    this.updateStashExchange(li.Object.quantity * -1);
                    Event.purgeElement(li);
                    li.parentNode.removeChild(li);
                }
                else {
                    lq.innerHTML = newTotal;
                    li.Object.quantity = newTotal;
                    this.updateStashExchange(diff);
                }
            }
        },
        updateStashDonate : function(byVal) {
            var c = Dom.get("embassyTotalDonate"),
                cv = c.innerHTML*1;
            c.innerHTML = cv + byVal;
        },
        updateStashExchange : function(byVal) {
            var c = Dom.get("embassyTotalExchange"),
                cv = c.innerHTML*1;
            c.innerHTML = cv + byVal;
        },
        StashSubmit : function() {
            var data = {
                    session_id: Game.GetSession(""),
                    building_id: this.building.id
                },
                toDonateLis = Sel.query("li","embassyStashToDonate"),
                toExchangeLis = Sel.query("li","embassyStashToExchange"),
                donateItems = {}, donateTotal = 0,
                exchangeItems = {}, exchangeTotal = 0,
                n, obj, 
                serviceFunc;
                
            for(n=0; n<toDonateLis.length; n++) {
                obj = toDonateLis[n].Object;
                if(obj) {
                    donateItems[obj.type] = obj.quantity;
                    donateTotal += obj.quantity;
                }
            }
            for(n=0; n<toExchangeLis.length; n++) {
                obj = toExchangeLis[n].Object;
                if(obj) {
                    exchangeItems[obj.type] = obj.quantity;
                    exchangeTotal += obj.quantity;
                }
            }
            
            data.donation = donateItems;

            if(donateTotal == 0) {
                Dom.get("embassyStashMessage").innerHTML = "Must add items to donate to Stash.";
            }
            else if(exchangeTotal > 0 && this.stash.exchanges_remaining_today <= 0) {
                Dom.get("embassyStashMessage").innerHTML = 'You have already used up the amount of stash exchanges you can perform in a single day.';
            }
            else if(exchangeTotal > 0 && donateTotal > this.stash.max_exchange_size) {
                Dom.get("embassyStashMessage").innerHTML = ['You are only able to transfer ', this.stash.max_exchange_size, ' resources from the stash.'].join('');
            }
            else if(exchangeTotal > 0 && donateTotal != exchangeTotal) {
                Dom.get("embassyStashMessage").innerHTML = 'Total amount of resources transfered from stash must be equal to the amount donating.';
            }
            else {
            
                if(exchangeTotal > 0) {
                    data.request = exchangeItems;
                    serviceFunc = this.service.exchange_with_stash;
                }
                else {
                    serviceFunc = this.service.donate_to_stash;
                }
            
                Dom.get("embassyStashMessage").innerHTML = "";
                Lacuna.Pulser.Show();
                serviceFunc(data, {
                    success : function(o){
                        this.rpcSuccess(o);
                        var n;
                        
                        for(n=0; n<toDonateLis.length; n++) {
                            if(toDonateLis[n].Object) {
                                Event.purgeElement(toDonateLis[n]);
                                toDonateLis[n].parentNode.removeChild(toDonateLis[n]);
                            }
                        }
                        for(n=0; n<toExchangeLis.length; n++) {
                            if(toExchangeLis[n].Object) {
                                Event.purgeElement(toExchangeLis[n]);
                                toExchangeLis[n].parentNode.removeChild(toExchangeLis[n]);
                            }
                        }
                        Dom.get("embassyTotalDonate").innerHTML = "0";
                        Dom.get("embassyTotalExchange").innerHTML = "0";
                        
                        Dom.get("embassyStashMessage").innerHTML = "Successfully donated. ";
                        Lib.fadeOutElm("embassyStashMessage");
                        
                        delete o.result.status;
                        this.stash = o.result;
                        this.StashPopulate();
                        
                        Lacuna.Pulser.Hide();
                    },
                    scope:this
                });
            }
        },
        
        //Create
        CreateAlliance : function() {
            var data = {
                session_id: Game.GetSession(""),
                building_id: this.building.id,
                name: Dom.get("embassyCreateName").value
            };
            
            if(!data.name || data.name.length == 0) {
                Dom.get("embassyCreateMessage").innerHTML = "Must enter a name.";
            }
            else {
                this.service.create_alliance(data, {
                    success : function(o){
                        YAHOO.log(o, "info", "Embassy.CreateAlliance.success");
                        this.rpcSuccess(o);
                        this.alliance = o.result.alliance;
                        this.isLeader = this.alliance && this.alliance.leader_id == Game.EmpireData.id;
                        Dom.get("embassyCreateMessage").innerHTML = "";
                        Dom.get("embassyCreateName").value = "";
                        this.addTab(this._getAllianceTab());
                        this.addTab(this._getMemberTab());
                        this.addTab(this._getSendTab());
                        this.removeTab(this.createAllianceTab);
                        this.MembersPopulate();
                        Lacuna.Pulser.Hide();
                    },
                    scope:this
                });
            }
        },
        
        //View Invites
        getInvites : function(e) {
            if(e.newValue) {
                Lacuna.Pulser.Show();
                this.service.get_my_invites({session_id:Game.GetSession(),building_id:this.building.id}, {
                    success : function(o){
                        YAHOO.log(o, "info", "Embassy.get_my_invites.success");
                        Lacuna.Pulser.Hide();
                        this.rpcSuccess(o);
                        
                        this.invites = o.result.invites;
                        
                        this.InvitesPopulate();
                    },
                    scope:this
                });
            }
        },
        InvitesPopulate : function() {
            var details = Dom.get("embassyInvitesDetails");
            if(details) {
                var invites = this.invites,
                    ul = document.createElement("ul"),
                    li = document.createElement("li");
                    
                Event.purgeElement(details);
                details.innerHTML = "";
                                
                for(var i=0; i<invites.length; i++) {
                    var obj = invites[i],
                        nUl = ul.cloneNode(false),
                        nLi = li.cloneNode(false);
                        
                    nUl.Invite = obj;
                    Dom.addClass(nUl, "embassyInfo");
                    Dom.addClass(nUl, "clearafter");

                    nLi = li.cloneNode(false);
                    Dom.addClass(nLi,"embassyAlliance");
                    nLi.innerHTML = obj.name;
                    nUl.appendChild(nLi);

                    nLi = li.cloneNode(false);
                    Dom.addClass(nLi,"embassyAction");
                    var bbtn = document.createElement("button");
                    bbtn.setAttribute("type", "button");
                    bbtn.innerHTML = "Accept";
                    bbtn = nLi.appendChild(bbtn);
                    Event.on(bbtn, "click", this.InvitesAccept, {Self:this,Invite:obj,Line:nUl}, true);
                    nUl.appendChild(nLi);

                    nLi = li.cloneNode(false);
                    Dom.addClass(nLi,"embassyAction");
                    bbtn = document.createElement("button");
                    bbtn.setAttribute("type", "button");
                    bbtn.innerHTML = "Reject";
                    bbtn = nLi.appendChild(bbtn);
                    Event.on(bbtn, "click", this.InvitesReject, {Self:this,Invite:obj,Line:nUl}, true);
                    nUl.appendChild(nLi);

                    nLi = li.cloneNode(false);
                    Dom.addClass(nLi,"embassyMessage");
                    nLi.innerHTML = 'Reason:<input type="text" class="embassyActionMessage" />';
                    nUl.appendChild(nLi);
                                
                    details.appendChild(nUl);
                    
                }
                
                //wait for tab to display first
                setTimeout(function() {
                    var Ht = Game.GetSize().h - 170;
                    if(Ht > 300) { Ht = 300; }
                    Dom.setStyle(details.parentNode,"height",Ht + "px");
                    Dom.setStyle(details.parentNode,"overflow-y","auto");
                },10);
            }
        },
        InvitesAccept : function() {
            if(confirm(['Are you sure you want to accept the alliance invite from ', this.Invite.name,'?'].join(''))) {
                this.Self.service.accept_invite({
                    session_id:Game.GetSession(""),
                    building_id:this.Self.building.id,
                    invite_id:this.Invite.id,
                    message:(Sel.query('.embassyActionMessage', this.Line, true).value || "")
                }, {
                    success : function(o){
                        YAHOO.log(o, "info", "Embassy.accept_invite.success");
                        this.Self.rpcSuccess(o);
                        var arr = this.Self.invites;
                        for(var i=0; i<arr.length; i++) {
                            if(arr[i].id == this.Invite.id) {
                                arr.splice(i,1);
                                break;
                            }
                        }
                        this.Line.parentNode.removeChild(this.Line);
                        
                        this.Self.alliance = o.result.alliance;
                        this.Self.isLeader = this.Self.alliance && this.Self.alliance.leader_id == Game.EmpireData.id;
                        this.Self.addTab(this.Self._getAllianceTab());
                        this.Self.addTab(this.Self._getMemberTab());
                        this.Self.removeTab(this.Self.createAllianceTab);
                        this.Self.MembersPopulate();
                        
                        Lacuna.Pulser.Hide();
                    },
                    scope:this
                });
            }
        },
        InvitesReject : function() {
            if(confirm(['Are you sure you want to reject the alliance invite from ', this.Invite.name,'?'].join(''))) {                
                this.Self.service.reject_invite({
                    session_id:Game.GetSession(""),
                    building_id:this.Self.building.id,
                    invite_id:this.Invite.id,
                    message:(Sel.query('.embassyActionMessage', this.Line, true).value || "")
                }, {
                    success : function(o){
                        YAHOO.log(o, "info", "Embassy.reject_invite.success");
                        this.Self.rpcSuccess(o);
                        var arr = this.Self.invites;
                        for(var i=0; i<arr.length; i++) {
                            if(arr[i].id == this.Invite.id) {
                                arr.splice(i,1);
                                break;
                            }
                        }
                        this.Line.parentNode.removeChild(this.Line);
                        Lacuna.Pulser.Hide();
                    },
                    scope:this
                });
            }
        },

        //Alliance Admin
        UpdateAlliance : function() {
            this.service.update_alliance({
                session_id:Game.GetSession(""),
                building_id:this.building.id,
                params: {
                    description:Dom.get("embassyAllianceDesc").value,
                    forum_uri:Dom.get("embassyAllianceForums").value,
                    announcements:Dom.get("embassyAllianceAnnoucements").value
                }
            }, {
                success : function(o){
                    YAHOO.log(o, "info", "Embassy.update_alliance.success");
                    this.rpcSuccess(o);
                    Dom.get("embassyAllianceMessage").innerHTML = "Updated alliance info.";
                    var a = new Util.Anim(Dom.get("embassyAllianceMessage"), {opacity:{from:1,to:0}}, 3);
                    a.onComplete.subscribe(function(){
                        Dom.get("embassyAllianceMessage").innerHTML = "";
                        Dom.setStyle("embassyAllianceMessage", "opacity", 1);
                    });
                    a.animate();
                    Lacuna.Pulser.Hide();
                },
                scope:this
            });
        },
        LeaveAlliance : function() {
            if(confirm(['Are you sure you want to leave ', this.alliance.name,'?'].join(''))) {
                this.service.leave_alliance({
                    session_id:Game.GetSession(""),
                    building_id:this.building.id,
                    message:Dom.get("embassyAllianceLeaveReason").value
                }, {
                    success : function(o){
                        YAHOO.log(o, "info", "Embassy.leave_alliance.success");
                        this.rpcSuccess(o);
                        delete this.alliance;
                        this.removeTab(this.allianceTab);
                        this.removeTab(this.memberTab);
                        if(this.sendTab) {
                            this.removeTab(this.sendTab);
                        }
                        this.addTab(this._getCreateTab());
                        Lacuna.Pulser.Hide();
                    },
                    scope:this
                });
            }
        },
        DissolveAlliance : function() {
            if(confirm(['All Space Stations will be abandoned. Are you sure you want to dissolve ', this.alliance.name,'?'].join(''))) {
                this.service.dissolve_alliance({
                    session_id:Game.GetSession(""),
                    building_id:this.building.id
                }, {
                    success : function(o){
                        YAHOO.log(o, "info", "Embassy.dissolve_alliance.success");
                        this.rpcSuccess(o);
                        delete this.alliance;
                        this.removeTab(this.allianceTab);
                        this.removeTab(this.memberTab);
                        if(this.sendTab) {
                            this.removeTab(this.sendTab);
                        }
                        this.addTab(this._getCreateTab());
                        Lacuna.Pulser.Hide();
                    },
                    scope:this
                });
            }
        },
        
        //Alliance Inviting
        getPendingInvites : function(e) {
            if(e.newValue) {
                if(!this.embassySendTo){
                    this._createSendToSelect();
                }
                    
                Lacuna.Pulser.Show();
                this.service.get_pending_invites({session_id:Game.GetSession(),building_id:this.building.id}, {
                    success : function(o){
                        YAHOO.log(o, "info", "Embassy.get_pending_invites.success");
                        Lacuna.Pulser.Hide();
                        this.rpcSuccess(o);
                        
                        this.pendingInvites = o.result.invites;
                        
                        this.PendingPopulate();
                    },
                    scope:this
                });
            }
        },
        PendingPopulate : function() {
            var details = Dom.get("embassySendDetails");
            if(details) {
                var pendingInvites = this.pendingInvites,
                    ul = document.createElement("ul"),
                    li = document.createElement("li");
                    
                Event.purgeElement(details);
                details.innerHTML = "";
                                
                for(var i=0; i<pendingInvites.length; i++) {
                    var obj = pendingInvites[i],
                        nUl = ul.cloneNode(false),
                        nLi = li.cloneNode(false);
                        
                    nUl.Invite = obj;
                    Dom.addClass(nUl, "embassyInfo");
                    Dom.addClass(nUl, "clearafter");

                    nLi = li.cloneNode(false);
                    Dom.addClass(nLi,"embassyEmpire");
                    nLi.innerHTML = obj.name;
                    nUl.appendChild(nLi);

                    nLi = li.cloneNode(false);
                    Dom.addClass(nLi,"embassyAction");
                    var bbtn = document.createElement("button");
                    bbtn.setAttribute("type", "button");
                    bbtn.innerHTML = "Withdraw";
                    bbtn = nLi.appendChild(bbtn);
                    Event.on(bbtn, "click", this.PendingWithdraw, {Self:this,Invite:obj,Line:nUl}, true);
                    nUl.appendChild(nLi);
                    
                    nLi = li.cloneNode(false);
                    Dom.addClass(nLi,"embassyMessage");
                    nLi.innerHTML = '<label>Reason:</label><input type="text" class="embassyPendingActionMessage" />';
                    nUl.appendChild(nLi);
                                
                    details.appendChild(nUl);
                    
                }
                
                //wait for tab to display first
                setTimeout(function() {
                    var Ht = Game.GetSize().h - 290;
                    if(Ht > 300) { Ht = 300; }
                    Dom.setStyle(details.parentNode,"height",Ht + "px");
                    Dom.setStyle(details.parentNode,"overflow-y","auto");
                },10);
            }
        },
        PendingWithdraw : function() {
            if(confirm(['Are you sure you want to withdraw the invite from ', this.Invite.name].join(''))) {
                this.Self.service.withdraw_invite({
                    session_id:Game.GetSession(""),
                    building_id:this.Self.building.id,
                    invite_id:this.Invite.id,
                    message:(Sel.query('.embassyPendingActionMessage', this.Line, true).value || "")
                }, {
                    success : function(o){
                        YAHOO.log(o, "info", "Embassy.withdraw_invite.success");
                        this.Self.rpcSuccess(o);
                        var arr = this.Self.pendingInvites;
                        for(var i=0; i<arr.length; i++) {
                            if(arr[i].id == this.Invite.id) {
                                arr.splice(i,1);
                                break;
                            }
                        }
                        this.Line.parentNode.removeChild(this.Line);
                        Lacuna.Pulser.Hide();
                    },
                    scope:this
                });
            }
        },
        SendInvite : function(){
            var inviteeId = this.embassySendTo._oTblSingleSelection && this.embassySendTo._oTblSingleSelection.Object.id || null;
            
            if(inviteeId) {
                this.service.send_invite({
                    session_id:Game.GetSession(""),
                    building_id:this.building.id,
                    invitee_id:inviteeId,
                    message:Dom.get("embassySendMessage").value
                }, {
                    success : function(o){
                        YAHOO.log(o, "info", "Embassy.send_invite.success");
                        this.rpcSuccess(o);
                        
                        this.embassySendTo.ResetSelections();
                        Dom.get("embassySendMessage").value = "";
                        this.getPendingInvites({newValue:1});
                        
                        Lacuna.Pulser.Hide();
                    },
                    scope:this
                });
            }
        },
        
        //Members 
        MembersPopulate : function() {
            var details = Dom.get("embassyMemberDetails");
            if(details && this.alliance) {
                var members = this.alliance.members,
                    ul = document.createElement("ul"),
                    li = document.createElement("li");
                    
                Event.purgeElement(details);
                details.innerHTML = "";
                                
                for(var i=0; i<members.length; i++) {
                    var obj = members[i],
                        nUl = ul.cloneNode(false),
                        nLi = li.cloneNode(false);
                        
                    nUl.Member = obj;
                    Dom.addClass(nUl, "embassyInfo");
                    Dom.addClass(nUl, "clearafter");

                    nLi = li.cloneNode(false);
                    Dom.addClass(nLi,"embassyEmpire");
                    nLi.innerHTML = obj.name;
                    Event.on(nLi, "click", this.EmpireInfo, obj.empire_id);
                    nUl.appendChild(nLi);

                    if(this.isLeader && this.alliance.leader_id != obj.empire_id) {
                        nLi = li.cloneNode(false);
                        Dom.addClass(nLi,"embassyAction");
                        var lbtn = document.createElement("button");
                        lbtn.setAttribute("type", "button");
                        lbtn.innerHTML = "Make Leader";
                        lbtn = nLi.appendChild(lbtn);
                        Event.on(lbtn, "click", this.MembersPromote, {Self:this,Member:obj,Line:nUl}, true);
                        var bbtn = document.createElement("button");
                        bbtn.setAttribute("type", "button");
                        bbtn.innerHTML = "Expel";
                        bbtn = nLi.appendChild(bbtn);
                        Event.on(bbtn, "click", this.MembersExpel, {Self:this,Member:obj,Line:nUl}, true);
                        nUl.appendChild(nLi);

                        nLi = li.cloneNode(false);
                        Dom.addClass(nLi,"embassyMessage");
                        nLi.innerHTML = '<label>Reason:</label><input type="text" class="embassyMembersMessage" />';
                        nUl.appendChild(nLi);
                    }
                                
                    details.appendChild(nUl);
                    
                }
                
                //wait for tab to display first
                setTimeout(function() {
                    var Ht = Game.GetSize().h - 170;
                    if(Ht > 300) { Ht = 300; }
                    Dom.setStyle(details.parentNode,"height",Ht + "px");
                    Dom.setStyle(details.parentNode,"overflow-y","auto");
                },10);
            }
        },
        EmpireInfo : function(e, id) {
            Lacuna.Info.Empire.Load(id);
        },
        MembersExpel : function() {
            if(confirm(['Are you sure you want to expel ', this.Member.name,' from the alliance?'].join(''))) {
                this.Self.service.expel_member({
                    session_id:Game.GetSession(""),
                    building_id:this.Self.building.id,
                    empire_id:this.Member.empire_id,
                    message:(Sel.query('.embassyMembersMessage', this.Line, true).value || "")
                }, {
                    success : function(o){
                        YAHOO.log(o, "info", "Embassy.expel_member.success");
                        this.Self.rpcSuccess(o);
                        this.Self.alliance = o.result.alliance;
                        this.Self.MembersPopulate();
                        Lacuna.Pulser.Hide();
                    },
                    scope:this
                });
            }
        },
        MembersPromote: function() {
            if(confirm(['Are you sure you want to transfer alliance control to ', this.Member.name,'?'].join(''))) {
                this.Self.service.assign_alliance_leader({
                    session_id:Game.GetSession(""),
                    building_id:this.Self.building.id,
                    new_leader_id:this.Member.empire_id
                }, {
                    success : function(o){
                        YAHOO.log(o, "info", "Embassy.assign_alliance_leader.success");
                        this.Self.rpcSuccess(o);
                        this.Self.alliance = o.result.alliance;
                        this.Self.isLeader = this.Self.alliance && this.Self.alliance.leader_id == Game.EmpireData.id;
                        this.Self.removeTab(this.Self.allianceTab);
                        this.Self.addTab(this.Self._getAllianceTab());
                        this.Self.removeTab(this.Self.memberTab);
                        this.Self.addTab(this.Self._getMemberTab());
                        this.Self.MembersPopulate();
                        this.Self.removeTab(this.Self.invitesTab);
                        this.Self.addTab(this.Self._getInvitesTab());
                        this.Self.removeTab(this.Self.sendTab);
                        Lacuna.Pulser.Hide();
                    },
                    scope:this
                });
            }
        },
        LawsPopulate : function(){
            var details = Dom.get("lawsDetails");

            if(details) {
                var laws = this.laws,
                    parentEl = details.parentNode,
                    li = document.createElement("li");

                //Event.purgeElement(details, true);
                details = parentEl.removeChild(details);
                details.innerHTML = "";

                for(var i=0; i<laws.length; i++) {
                    var law = laws[i],
                        nLi = li.cloneNode(false);

                    nLi.Law = law;
                    nLi.innerHTML = ['<div style="margin-bottom:2px;">',
                        '<div class="yui-gb" style="border-bottom:1px solid #52acff;">',
                        '    <div class="yui-u first"><label>',law.name,'</label></div>',
                        '    <div class="yui-u" >',(this.canRepealLaw ? '<button type="button">Repeal</button>' : '&nbsp;'),'</span></div>',
                        '    <div class="yui-u" style="text-align:right;">Enacted ',Lib.formatServerDate(law.date_enacted),'</span></div>',
                        '</div>',
                        '<div class="lawDesc">',this.formatBody(law.description),'</div>',
                        '</div>'].join('');

                    details.appendChild(nLi);

                }

                //add child back in
                parentEl.appendChild(details);

                //wait for tab to display first
                setTimeout(function() {
                    var Ht = Game.GetSize().h - 230;
                    if(Ht > 300) { Ht = 300; }
                    var tC = details.parentNode;
                    Dom.setStyle(tC,"height",Ht + "px");
                    Dom.setStyle(tC,"overflow-y","auto");
                },10);
            }
        },
        LawClick : function(e, matchedEl, container){
            if(matchedEl.innerHTML == "Repeal") {
                matchedEl.disabled = true;
                var el = Dom.getAncestorByTagName(matchedEl, "li");
                if(el) {
                    this.service.propose_repeal_law({
                        session_id:Game.GetSession(""),
                        building_id:this.building.id,
                        law_id:el.Law.id
                    },{
                        success : function(o) {
                            delete this.props;
                            matchedEl.parentNode.removeChild(matchedEl);
                        },
                        failure : function() {
                            matchedEl.disabled = false;
                        },
                        scope:this
                    });
                }
            }

        },
        PopulateBodiesForStar : function(e) {
            var starId   = Lib.getSelectedOptionValue(this.starElement),
                 bodyList = Dom.get(this.bodyElement);

            Lacuna.Pulser.Show()
            this.Self.service.get_bodies_for_star_in_jurisdiction({
                 session_id: Game.GetSession(''),
                 building_id: this.Self.building.id,
                 star_id: starId
            }, {   
                 success: function(o) {
                     Lacuna.Pulser.Hide();
                     this.Self.rpcSuccess(o);

                     if (bodyList) {
                         var bodies = o.result.bodies;

                         var opts = [];
                         for (var i = 0; i < bodies.length; i++) {
                             var obj = bodies[i];

                             if (this.type) {
                                 if (obj.type == this.type) {
                                     opts[opts.length] = '<option value="' + obj.id + '">' + obj.name + '</option>';
                                 }
                             }
                             else {
                                 opts[opts.length] = '<option value="' + obj.id + '">' + obj.name + '</option>';
                             }
                         }

                         bodyList.innerHTML = opts.join('');
                         bodyList.selectedIndex = -1;
                    }
                },
            scope: this
            });
        },

        formatBody : function(body) {
            body = body.replace(/&/g,'&amp;');
            body = body.replace(/</g,'&lt;');
            body = body.replace(/>/g,'&gt;');
            body = body.replace(/\n/g,'<br />');
            body = body.replace(/\*([^*]+)\*/gi,'<b>$1</b>');
            body = body.replace(/\{(food|water|ore|energy|waste|happiness|time|essentia|plots|build)\}/gi, function(str,icon){
                var cl = 'small' + icon.substr(0,1).toUpperCase() + icon.substr(1);
                return '<img src="' + Lib.AssetUrl + 'ui/s/' + icon + '.png" class="' + cl + '" />';
            });
            body = body.replace(/\[(https?:\/\/[a-z0-9_.\/\-]+)\]/gi,'<a href="$1">$1</a>');
            body = body.replace(/\{Empire\s+(-?\d+)\s+([^\}]+)\}/gi,'<a class="profile_link" href="#$1">$2</a>');
            body = body.replace(/\{Starmap\s+(-?\d+)\s+(-?\d+)\s+([^\}]+)\}/gi,'<a class="starmap_link" href="#$1x$2">$3</a>');
            body = body.replace(/\{Planet\s+(-?\d+)\s+([^\}]+)\}/gi,'<a class="planet_link" href="#$1">$2</a>');
            body = body.replace(/\{Alliance\s+(-?\d+)\s+([^\}]+)\}/gi,'<a class="alliance_link" href="#$1">$2</a>');
            body = body.replace(/\{VoteYes\s(-*\d+)\s(-*\d+)\s(-*\d+)\}/gi,'<a class="voteyes_link" href="#$1&$2&$3">Yes!</a>');
            body = body.replace(/\{VoteNo\s(-*\d+)\s(-*\d+)\s(-*\d+)\}/gi,'<a class="voteno_link" href="#$1&$2&$3">No!</a>');
            return body;
        },


    });
    
    Lacuna.buildings.Embassy = Embassy;

})();
YAHOO.register("embassy", YAHOO.lacuna.buildings.Embassy, {version: "1", build: "0"}); 

}
// vim: noet:ts=4:sw=4
