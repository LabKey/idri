/*
 * Copyright (c) 2015 LabKey Corporation
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

    initComponent : function()
    {
        this.isUpdate = false;

        var stores = this.getStores();

        this.callParent();

        this.on('afterrender', function() {
            Ext4.iterate(stores, function(name, store) {
                if (store.loadOnRender !== false) {
                    store.load();
                }
            });
        }, this, { single: true});
    },

    getStores : function()
    {
        if (!this.stores) {
            this.stores = {
                tempStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'Temperatures',
                    listeners: {
                        load: {
                            fn: function() {
                                var formPanel = this.getFormPanel();
                                this.removeAll();
                                this.add(formPanel);

                                this.stores.stabilityStore.load();
                            },
                            scope: this,
                            single: true
                        }
                    }
                }),
                stabilityStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'StabilityProfile',
                    loadOnRender: false,
                    listeners: {
                        load: {
                            fn: this.loadStabilityProfile,
                            scope: this,
                            single: true
                        }
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
                timepointStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'Timepoints',
                    sort: '[+]sort'
                }),
                timepointHplcUvStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'TimepointsHPLCUV',
                    sort: '[+]sort'
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

            this.getFormPanel().getForm().setValues(Ext4.decode(record.get('profile')));

            var cmp1 = Ext4.getCmp('submit-profile-btn');

            if (cmp1)
            {
                cmp1.setText('Update');
                this.isUpdate = true;
            }
        }
    },

    getFormPanel : function()
    {
        if (!this.formPanel) {
            var tempItems = [],
                stores = this.getStores();

            /* Setup temperature items */
            stores.tempStore.each(function(rec) {
                var temp = rec.get('temperature');
                tempItems.push({
                    boxLabel: temp + 'C',
                    name: 'sb-watch-temp-' + temp,
                    id: 'sb-watch-temp-' + temp,
                    checked: true
                });
            });

            this.formPanel = new Ext4.form.Panel({
                labelAlign: 'top',
                itemId: 'form-panel',
                width: 625,
                border: false,
                frame: false,
                scope: this,
                items: [{
                    width   : 600,
                    columns : [100, 100, 100, 100, 100, 100],
                    xtype : 'checkboxgroup',
                    fieldLabel: 'Temperatures',
                    allowBlank : false,
                    validateOnBlur : false,
                    items : tempItems,
                    name : 'temp'
                }, {
                    width   : 250,
                    columns : [100, 100],
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
                    }],
                    name : 'pSize',
                    id: 'pSize'
                }, {
                    xtype: 'checkboxgroup',
                    columns: [100, 150],
                    border: false,
                    frame: false,
                    fieldLabel: 'Adjuvant Concentration',
                    items: [{
                        xtype: 'checkbox',
                        boxLabel: 'UV Type',
                        id: 'uv',
                        name: 'uv',
                        checked: false
                    }, {
                        xtype: 'combo',
                        name: 'uvType',
                        id: 'uvType',
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
                                LABKEY.Filter.create('CompoundLookup/type', 'adjuvant', LABKEY.Filter.Types.EQUAL)
                            ]
                        })
                    }, {
                        xtype: 'checkbox',
                        boxLabel: 'HPLC Type',
                        id: 'hplc',
                        name: 'hplc'
                    }, {
                        xtype: 'combo',
                        name: 'hplcType',
                        id: 'hplcType',
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
                                LABKEY.Filter.create('CompoundLookup/type', 'adjuvant', LABKEY.Filter.Types.EQUAL)
                            ]
                        })
                    }]
                },{
                    xtype: 'button',
                    id : 'submit-profile-btn',
                    name: 'submit-profile-btn',
                    text : 'Create',
                    handler : this.onCreateStability,
                    scope : this
                }]
            });
        }

        return this.formPanel;
    },

    onCreateStability : function()
    {
        var _profile = Ext4.encode(this.getFormPanel().getForm().getValues()),
            stores = this.getStores();

        if (this.isUpdate)
        {
            // Update the profile
            var record = stores.stabilityStore.findRecord('lotNum', this.rowId);
            record.set('profile', _profile);

            stores.stabilityStore.sync({
                success: function() {

                    // delete all tasks for the lot
                    var tasks = stores.taskListStore.getRange(),
                        removed = [];

                    Ext4.each(tasks, function(task) {
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
                            scope: this
                        });
                    }
                },
                scope: this
            });
        }
        else
        {
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
            cmp;

        stores.tempStore.each(function(rec)
        {
            var temp = rec.get('temperature');
            cmp = Ext4.getCmp('sb-watch-temp-' + temp);

            if (cmp && cmp.getValue())
            {
                stores.timepointStore.each(function(recTime)
                {
                    var tempTime = Ext4.Date.add(DM, Ext4.Date.DAY, parseInt(recTime.get('sort')));

                    var pSize = Ext4.getCmp('pSize');

                    if (tempTime >= currentDate)
                    {
                        stores.taskListStore.add({
                            lotNum: this.rowId,
                            cat: pSize.getValue().pSizeChoice,
                            temperature: temp,
                            timepoint: recTime.get("time"),
                            type: record.get('Type'),
                            date: tempTime
                        });
                    }
                }, this);
            }
        }, this);

        cmp = Ext4.getCmp('uv');
        if (cmp && cmp.getValue())
        {
            stores.timepointHplcUvStore.each(function(recTime)
            {
                var tempTime = Ext4.Date.add(DM, Ext4.Date.DAY, parseInt(recTime.get('sort')));

                var uvType = Ext4.getCmp('uvType');

                if (tempTime >= currentDate)
                {
                    stores.taskListStore.add({
                        lotNum: this.rowId,
                        cat: 'UV',
                        timepoint: recTime.get("time"),
                        type: record.get('Type'),
                        adjuvant: uvType.getValue(),
                        date: tempTime
                    });
                }
            }, this);

        }

        cmp = Ext4.getCmp('hplc');
        if (cmp && cmp.getValue())
        {
            stores.timepointHplcUvStore.each(function(recTime)
            {
                var tempTime = Ext4.Date.add(DM, Ext4.Date.DAY, parseInt(recTime.get('sort')));
                var hplcType = Ext4.getCmp('hplcType');

                if (tempTime >= currentDate)
                {
                    stores.taskListStore.add({
                        lotNum: this.rowId,
                        cat: "HPLC",
                        timepoint: recTime.get("time"),
                        type: record.get('Type'),
                        adjuvant: hplcType.getValue(),
                        date: tempTime
                    });
                }
            }, this);
        }

        stores.taskListStore.sync({
            success: function() {
                Ext4.Msg.show({
                    title: 'Stability Profile',
                    msg: 'The Stability Profile have been Created',
                    buttons: Ext4.Msg.OK,
                    fn: function (id)
                    {
                        if (id == 'ok')
                        {
                            // This is a little strange to only fire the event if the user hits 'ok'. They could
                            // just close the box, etc.
                            this.fireEvent('profilecreated');
                        }
                    },
                    scope: this
                });
            },
            scope: this
        });
    }
});
