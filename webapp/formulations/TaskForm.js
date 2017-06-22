/*
 * Copyright (c) 2015-2017 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('LABKEY.idri.TaskPanel', {

    extend: 'Ext.panel.Panel',

    alias: 'widget.idri-taskpanel',

    border: false,

    frame: false,

    rowId: 0,

    constructor : function(config) {

        this.callParent([config]);

        this.addEvents('profilecreated');
    },

    initComponent : function() {
        this.isUpdate = false;

        this.ids = {
            pSize: Ext4.id(),
            importance: Ext4.id(),
            uv: Ext4.id(),
            uvType: Ext4.id(),
            hplc: Ext4.id(),
            hplcType: Ext4.id(),
            submit: Ext4.id(),
            temperatures: Ext4.id(),
            timepoints: Ext4.id(),
            hplcuvtimepoints: Ext4.id(),
            stabilityForm: Ext4.id()
        };

        this.items = [{
            xtype: 'form',
            labelAlign: 'top',
            itemId: 'form-panel',
            width: 625,
            border: false,
            frame: false,
            scope: this,
            id: this.ids.stabilityForm,
            items: [{
                width   : 450,
                columns : [150, 150],
                xtype: 'checkbox',
                fieldLabel: 'High Importance',
                id: this.ids.importance,
                name: 'importance',
                checked: false
            },{
                html: "<hr>",
                border: false
            },{
                width   : 600,
                columns : [100, 100, 100, 100, 100, 100],
                xtype : 'checkboxgroup',
                fieldLabel: 'Temperatures',
                allowBlank : false,
                validateOnBlur : false,
                id: this.ids.temperatures
            }, {
                html: "<hr>",
                border: false
            }, {
                width   : 600,
                columns : [100, 100, 100, 100, 100, 100],
                xtype : 'checkboxgroup',
                fieldLabel: 'Timpoints',
                allowBlank : false,
                validateOnBlur : false,
                id: this.ids.timepoints
            },{
                width   : 350,
                columns : [100, 100, 100],
                xtype : 'radiogroup',
                fieldLabel: 'Particle Size',
                allowBlank : false,
                validateOnBlur : false,
                items : [{
                    boxLabel: 'Nano',
                    name: 'pSizeChoice',
                    inputValue: 'nano',
                    checked: true
                }, {
                    boxLabel: 'APS',
                    name: 'pSizeChoice',
                    inputValue: 'aps'
                }, {
                    boxLabel: 'None',
                    name: 'pSizeChoice',
                    inputValue: 'none'
                }],
                name : 'pSize',
                id: this.ids.pSize
            }, {
                html: "<hr>",
                border: false
            },{
                xtype: 'checkboxgroup',
                columns: [100, 150],
                border: false,
                frame: false,
                fieldLabel: 'Adjuvant Concentration',
                items: [{
                    xtype: 'checkbox',
                    boxLabel: 'UV Type',
                    id: this.ids.uv,
                    name: 'uv',
                    checked: false
                }, {
                    xtype: 'combo',
                    name: 'uvType',
                    id: this.ids.uvType,
                    width: 200,
                    triggerAction: 'all',
                    multiSelect: true,
                    typeAhead: true,
                    allowBlank: false,
                    editable: false,
                    validateOnBlur: false,
                    //valueField: 'RowId',
                    displayField: 'Name',
                    store: new LABKEY.ext4.Store({
                        schemaName: 'Samples',
                        queryName: 'Compounds',
                        filterArray:  [
                            LABKEY.Filter.create('CompoundLookup/type', 'adjuvant')
                        ]
                    })
                }, {
                    xtype: 'checkbox',
                    boxLabel: 'HPLC Type',
                    id: this.ids.hplc,
                    name: 'hplc'
                }, {
                    xtype: 'combo',
                    name: 'hplcType',
                    id: this.ids.hplcType,
                    multiSelect: true,
                    mode: 'local',
                    width: 200,
                    triggerAction: 'all',
                    typeAhead: true,
                    allowBlank: false,
                    editable: false,
                    validateOnBlur: false,
                    displayField: 'Name',
                    store: new LABKEY.ext4.Store({
                        schemaName: 'Samples',
                        queryName: 'Compounds',
                        filterArray:  [
                            LABKEY.Filter.create('CompoundLookup/type', 'adjuvant')
                        ]
                    })
                }]
            },{
                width   : 600,
                columns : [100, 100, 100, 100, 100, 100],
                xtype : 'checkboxgroup',
                fieldLabel: 'Adjuvant Concentration Timpoints',
                allowBlank : false,
                validateOnBlur : false,
                id: this.ids.hplcuvtimepoints
            },{
                xtype: 'button',
                id : this.ids.submit,
                name: 'submit-profile-btn',
                text : 'Create',
                handler : this.onCreateStability,
                scope : this
            }]
        }];

        this.callParent();

        this.on('afterrender', function() {
            Ext4.iterate(this.getStores(), function(name, store) {
                if (store.loadOnRender !== false) {
                    store.load();
                }
            });
        }, this, { single: true });
    },

    getStores : function() {
        if (!this.stores) {
            this.stores = {
                timepointStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'Timepoints',
                    fields: ['time', 'sort', 'defaultStability'],
                    sort: 'sort',
                    listeners: {
                        load: this.onLoadTimepoints.bind(this)
                    }
                }),
                timepointHplcUvStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'TimepointsHPLCUV',
                    sort: 'sort',
                    listeners: {
                        load: this.onLoadHplcUvTimepoints.bind(this)
                    }
                }),
                taskListStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'TaskList'
                }),
                formulationsStore: new LABKEY.ext4.Store({
                    schemaName: 'Samples',
                    queryName: 'Formulations'
                }),
                tempStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'Temperatures',
                    listeners: {
                        load: this.onLoadTemperatures.bind(this)
                    }
                }),
                stabilityStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'StabilityProfile',
                    listeners: {
                        load: {
                            fn: this.loadStabilityProfile.bind(this),
                            scope: this,
                            single: true
                        }
                    }
                })
            };
        }

        return this.stores;
    },

    loadStabilityProfile : function(stabilityStore)
    {
        var record = stabilityStore.findRecord('lotNum', this.rowId),
                stores = this.getStores();

        if (record != null)
        {
            stores.tempStore.each(function(rec) {
                var temp = rec.get('temperature');
                var cmp = Ext4.getCmp('sb-watch-temp-' + temp);
                cmp.setValue('false');
            });
            var cmp = Ext4.getCmp(this.ids.importance);
            cmp.setValue('false');

            stores.timepointStore.each(function(rec) {
                var temp = rec.get('time');
                var cmp = Ext4.getCmp('sb-watch-time-' + temp);
                cmp.setValue('false');
            });

            stores.timepointHplcUvStore.each(function(rec) {
                var temp = rec.get('time');
                var cmp = Ext4.getCmp('sb-watch-timeHplc-' + temp);
                cmp.setValue('false');
            });


            Ext4.getCmp(this.ids.stabilityForm).getForm().setValues(Ext4.decode(record.get('profile')));

            var submitBtn = Ext4.getCmp(this.ids.submit);

            if (submitBtn) {
                submitBtn.setText('Update');
                this.isUpdate = true;
            }
        }
    },

    onLoadTemperatures : function(store) {
        var tempItems = [];
        store.each(function(rec) {
            var temp = rec.get('temperature');
            tempItems.push({
                boxLabel: temp + 'C',
                checked: rec.get('defaultStability'),
                id: 'sb-watch-temp-' + temp,
                inputId: 'sb-watch-temp-' + temp
            });
        }, this);

        if (tempItems.length > 0) {
            var cmp = Ext4.getCmp(this.ids.temperatures);
            cmp.removeAll();
            cmp.add(tempItems);
        }
    },

    onLoadTimepoints : function(store) {
        var timeItems = [];
        store.each(function(rec) {
            var time = rec.get('time');
            timeItems.push({
                boxLabel: time,
                checked: rec.get('defaultStability'),
                id: 'sb-watch-time-' + time,
                inputId :'sb-watch-time-' + time
            });
        }, this);

        if (timeItems.length > 0) {
            var cmp = Ext4.getCmp(this.ids.timepoints);
            cmp.removeAll();
            cmp.add(timeItems);
        }
    },

    onLoadHplcUvTimepoints : function(store) {
        var timeItems = [];
        store.each(function(rec) {
            var time = rec.get('time');
            timeItems.push({
                boxLabel: time,
                checked: rec.get('defaultStability'),
                id: 'sb-watch-timeHplc-' + time,
                inputId :'sb-watch-timeHplc-' + time
            });
        }, this);

        if (timeItems.length > 0) {
            var cmp = Ext4.getCmp(this.ids.hplcuvtimepoints);
            cmp.removeAll();
            cmp.add(timeItems);
        }
    },

    onCreateStability : function()
    {
        var _profile = Ext4.encode(Ext4.getCmp(this.ids.stabilityForm).getForm().getValues()),
            stores = this.getStores();

        if (this.isUpdate) {
            // Update the profile
            var record = stores.stabilityStore.findRecord('lotNum', this.rowId);
            record.set('profile', _profile);

            stores.stabilityStore.sync({
                success: function() {
                    // delete all tasks for the lot
                    var removed = [];

                    Ext4.each(stores.taskListStore.getRange(), function(task) {
                        if (task.get('lotNum') === this.rowId) {
                            removed.push(task);
                        }
                    }, this);

                    if (Ext4.isEmpty(removed)) {
                        this.addTasks();
                    }
                    else {
                        stores.taskListStore.remove(removed);
                        stores.taskListStore.sync({
                            success: function() {
                                this.addTasks();
                            },
                            failure: function() {
                                Ext4.Msg.alert('Error', 'Failed to sync Task List store.');
                            },
                            scope: this
                        });
                    }
                },
                failure: function() {
                    Ext4.Msg.alert('Error', 'Failed to sync Stability Store on update.');
                },
                scope: this
            });
        }
        else {
            // Create the profile
            stores.stabilityStore.add({
                lotNum: this.rowId,
                profile: _profile,
                scope: this
            });

            stores.stabilityStore.sync({
                success: function() {
                    this.addTasks();
                },
                failure: function() {
                    Ext4.Msg.alert('Error', 'Failed to sync Stability Store on create.');
                },
                scope: this
            });
        }
    },

    addTasks : function()
    {
        var stores = this.getStores(),
            record = stores.formulationsStore.findRecord('RowId', this.rowId),
            DM = record.get('DM'),
            currentDate = new Date(),
            cmp = Ext4.getCmp(this.ids.importance),
            cmp2,
            cmpTimeHplc,
            importance;

        if (cmp && cmp.getValue()) {
            importance = 'high';
        }

        stores.tempStore.each(function(rec)
        {
            var temp = rec.get('temperature');
            cmp = Ext4.getCmp('sb-watch-temp-' + temp);

            if (cmp && cmp.getValue())
            {
                stores.timepointStore.each(function(recTime)
                {
                    var cmpTime = Ext4.getCmp('sb-watch-time-' + recTime.get('time'));
                    if (cmpTime && cmpTime.getValue())
                    {
                        var tempTime = Ext4.Date.add(DM, Ext4.Date.DAY, parseInt(recTime.get('sort')));

                        var pSize = Ext4.getCmp(this.ids.pSize);

                        if (tempTime >= currentDate && pSize.getValue().pSizeChoice != 'none') {
                            stores.taskListStore.add({
                                lotNum: this.rowId,
                                cat: pSize.getValue().pSizeChoice,
                                temperature: temp,
                                timepoint: recTime.get("time"),
                                type: record.get('Type'),
                                date: tempTime,
                                importance: importance
                            });
                        }
                    }
                }, this);

                cmp2 = Ext4.getCmp(this.ids.uv);
                if (cmp2 && cmp2.getValue())
                {
                    stores.timepointHplcUvStore.each(function(recTime)
                    {
                        cmpTimeHplc = Ext4.getCmp('sb-watch-timeHplc-' + recTime.get('time'));
                        if (cmpTimeHplc && cmpTimeHplc.getValue()){
                            var tempTime = Ext4.Date.add(DM, Ext4.Date.DAY, parseInt(recTime.get('sort')));

                            var uvType = Ext4.getCmp(this.ids.uvType);

                            if (tempTime >= currentDate)
                            {
                                stores.taskListStore.add({
                                    lotNum: this.rowId,
                                    cat: 'UV',
                                    temperature: temp,
                                    timepoint: recTime.get("time"),
                                    type: record.get('Type'),
                                    adjuvant: uvType.getValue(),
                                    date: tempTime,
                                    importance: importance
                                });
                            }
                        }
                    }, this);

                }

                cmp2 = Ext4.getCmp(this.ids.hplc);
                if (cmp2 && cmp2.getValue())
                {
                    stores.timepointHplcUvStore.each(function(recTime)
                    {
                        cmpTimeHplc = Ext4.getCmp('sb-watch-timeHplc-' + recTime.get('time'));
                        if (cmpTimeHplc && cmpTimeHplc.getValue()){
                            var tempTime = Ext4.Date.add(DM, Ext4.Date.DAY, parseInt(recTime.get('sort')));
                            var hplcType = Ext4.getCmp(this.ids.hplcType);

                            if (tempTime >= currentDate)
                            {
                                stores.taskListStore.add({
                                    lotNum: this.rowId,
                                    cat: 'HPLC',
                                    temperature: temp,
                                    timepoint: recTime.get('time'),
                                    type: record.get('Type'),
                                    adjuvant: hplcType.getValue(),
                                    date: tempTime,
                                    importance: importance
                                });
                            }
                        }
                    }, this);
                }
            }
        }, this);

        function showSuccess() {
            Ext4.Msg.show({
                title: 'Stability Profile',
                msg: 'The Stability Profile have been Created',
                buttons: Ext4.Msg.OK,
                fn: function(id) {
                    if (id === 'ok') {
                        this.fireEvent('profilecreated');
                    }
                },
                scope: this
            });
        }

        if (stores.taskListStore.getModifiedRecords().length > 0) {
            stores.taskListStore.sync({
                success: showSuccess,
                failure: function() {
                    Ext4.Msg.alert('Error', 'Failed to sync Task List store');
                },
                scope: this
            });
        }
        else {
            showSuccess.call(this);
        }
    }
});