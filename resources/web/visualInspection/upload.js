/*
 * Copyright (c) 2016-2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('LABKEY.idri.VisualInspection', {

    extend: 'Ext.panel.Panel',

    alias: 'widget.idri-visualinspection',

    border: false,

    frame: false,

    height: 750,

    width: 1150,

    layout: 'fit',

    initComponent : function() {

        // a collection of ids for specific components
        this.ids = {
            comments: Ext4.id(),
            lotCombo: Ext4.id(),
            lots: Ext4.id(),
            oldTasks: Ext4.id(),
            taskDate: Ext4.id(),
            temperatures: Ext4.id(),
            timepoint: Ext4.id(),
            visualButtons: Ext4.id(),
            visualFail: Ext4.id(),
            visualInspection: Ext4.id(),
            visualPass: Ext4.id(),
            visual: {
                fail: {
                    button: Ext4.id(),
                    color: Ext4.id(),
                    opacity: Ext4.id(),
                    phase: Ext4.id()
                },
                pass: {
                    button: Ext4.id(),
                    color: Ext4.id(),
                    opacity: Ext4.id(),
                    phase: Ext4.id()
                }
            }
        };

        this.items = [{
            xtype: 'form',
            layout: 'border',
            border: false,
            frame: false,
            items: [{
                region: 'west',
                width: 305,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                defaults: {
                    border: false,
                    frame: false,
                    bodyPadding: 10
                },
                items: [{
                    title: 'Task Date',
                    height: 100,
                    items: [{
                        xtype: 'datefield',
                        fieldLabel: 'Date',
                        id: this.ids.taskDate,
                        value: new Date(),
                        listeners: {
                            change: function() {
                                this.getTasks();
                            },
                            scope: this
                        }
                    },{
                        xtype: 'checkbox',
                        boxLabel: 'Include Overdue Tasks',
                        id: this.ids.oldTasks,
                        name: 'oldTasks',
                        listeners: {
                            change: function() {
                                this.getTasks();
                            },
                            scope: this
                        }
                    }]
                },{
                    title: 'Timepoints',
                    name: 'timepoint',
                    id: this.ids.timepoint,
                    height: 200,
                    autoScroll: true,
                    layout: {
                        type: 'column'
                    },
                    defaults: {
                        columnWidth: 0.25,
                        margin: 5
                    },
                    scope: this
                },{
                    title: 'Lots',
                    name: 'lots',
                    id: this.ids.lots,
                    flex: 1, // required for scrolling to appear
                    autoScroll: true,
                    layout: {
                        type: 'column',
                        reserveScrollbar: true
                    },
                    defaults: {
                        columnWidth: 0.5,
                        margin: 5
                    },
                    scope: this
                }],
                scope: this
            },{
                region: 'center',
                id: 'maincenter',
                defaults: {
                    border: false,
                    frame: false
                },
                items: [{
                    title: 'Visual Inspection',
                    id: this.ids.visualInspection,
                    height: 350,
                    layout: 'border',
                    scope: this,
                    items:[{
                        region: 'west',
                        width: 100,
                        items:[{
                            id: this.ids.temperatures,
                            title: 'Temperature',
                            height: 215,
                            autoScroll: true,
                            layout: {
                                align: 'middle',
                                pack: 'center',
                                type: 'vbox'
                            },
                            border: 0
                        }]
                    }, {
                        region: 'west',
                        align: 'stretch',
                        pack: 'start',
                        width: 100,
                        items: [{
                            id: this.ids.visualButtons,
                            title: 'Pass/Fail',
                            align: 'stretch',
                            pack: 'start',
                            layout: 'vbox',
                            border: 0,
                            items: [{
                                xtype: 'button',
                                id: this.ids.visual.pass.button,
                                text: 'Pass',
                                width: 90,
                                margin: 5,
                                toggleGroup: 'passGroupButtons',
                                handler: function() {
                                    Ext4.getCmp(this.ids.visualFail).hide();
                                    Ext4.getCmp(this.ids.visualPass).show();
                                },
                                scope: this
                            },{
                                xtype: 'button',
                                id: this.ids.visual.fail.button,
                                text: 'Fail',
                                width: 90,
                                margin: 5,
                                toggleGroup: 'passGroupButtons',
                                handler: function() {
                                    Ext4.getCmp(this.ids.visualPass).hide();
                                    Ext4.getCmp(this.ids.visualFail).show();
                                },
                                scope: this
                            },{
                                xtype: 'button',
                                text: 'Reset',
                                width: 90,
                                margin: 5,
                                handler: this.handleReset.bind(this)
                            }]
                        }]
                    },{
                        region: 'center',
                        align: 'stretch',
                        pack: 'start',
                        items: [{
                            title: 'Visual Pass',
                            id: this.ids.visualPass,
                            layout: 'hbox',
                            border: 0,
                            hidden: true,
                            items: [{
                                id: this.ids.visual.pass.color,
                                title: 'Color',
                                region: 'west',
                                width: 175,
                                height: 350,
                                scope: this
                            }, {
                                id: this.ids.visual.pass.opacity,
                                title: 'Opacity',
                                region: 'west',
                                width: 175,
                                height: 350,
                                scope: this
                            }, {
                                id: this.ids.visual.pass.phase,
                                title: 'Phase',
                                region: 'west',
                                width: 300,
                                height: 350,
                                scope: this
                            }],
                            scope: this
                        }, {
                            title: 'Visual Fail',
                            id: this.ids.visualFail,
                            layout: 'hbox',
                            border: 0,
                            hidden: true,
                            items: [{
                                id: this.ids.visual.fail.color,
                                title: 'Color',
                                region: 'west',
                                width: 175,
                                height: 350,
                                scope: this
                            }, {
                                id: this.ids.visual.fail.opacity,
                                title: 'Opacity',
                                region: 'west',
                                width: 175,
                                height: 350,
                                scope: this
                            }, {
                                id: this.ids.visual.fail.phase,
                                title: 'Phase',
                                region: 'west',
                                width: 300,
                                height: 350,
                                scope: this
                            }],
                            scope: this
                        }]
                    },{
                        region: 'south',
                        border: 0,
                        items: [{
                            id: this.ids.comments,
                            xtype: 'textfield',
                            fieldLabel: 'Comments:',
                            name: 'comments',
                            width: 600,
                            scope: this
                        }]
                    },{
                        region: 'south',
                        border: 0,
                        buttonAlign: 'center',
                        buttons: [{
                            text: 'Save',
                            margin: 5,
                            width: 150,
                            listeners: {
                                click: function() {
                                    this.ensureRun();
                                },
                                scope: this
                            },
                            scope: this
                        }]
                    },{
                        region: 'south',
                        border: 0,
                        buttonAlign: 'center',
                        buttons: [{
                            text: 'History',
                            margin: 5,
                            width: 100,
                            listeners: {
                                click: function() {
                                    this.displayHistory();
                                },
                                scope: this
                            }
                        }, {
                            text: 'Log',
                            margin: 5,
                            width: 100,
                            listeners: {
                                click: function() {
                                    this.displayLog();
                                },
                                scope: this
                            }
                        }]
                    }]
                },{
                    title: 'Records',
                    name: 'records',
                    id: 'records',
                    height: 900,
                    items: [{
                        xtype: 'component',
                        html: '<div id="todayRecord"></div>'
                    }]
                }]
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

    getAssayDefinition : function(assayRowId, cb, scope) {

        var numRowId = parseInt(assayRowId);

        if (this._assayDef) {
            cb.call(scope || this, this._assayDef);
        }

        LABKEY.Assay.getById({
            id: assayRowId,
            success: function(definitions) {
                if (definitions) {
                    for (var i=0; i < definitions.length; i++) {
                        if (definitions[i].id === numRowId) {
                            this._assayDef = definitions[i];
                            cb.call(scope || this, definitions[i]);
                        }
                    }
                }
            },
            failure: function() {
                Ext4.Msg.alert('Failed to load Assay definition for rowId ' + assayRowId);
            },
            scope: this
        });
    },

    getStores : function() {

        if (!this.stores) {
            var week = this.getWeek();
            this.stores = {
                tempStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'Temperatures',
                    listeners: {
                        load: this.onLoadTemperatures.bind(this)
                    }
                }),
                taskListStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'TaskList',
                    groupField: 'cat',
                    groupDir: 'ASC',
                    sorters: [{
                        property: 'temperature',
                        direction: 'ASC'
                    },{
                        property: 'lotNum/Name',
                        direction: 'ASC'
                    }],
                    columns : [ 'lotNum/Name', '*' /* The rest of the columns */],
                    filters:  function(rec) {
                        if (rec.get('date') >= week[0] && rec.get('date') <= week[1] && (rec.get('cat') == 'aps' || rec.get('cat') == 'nano')) {
                            return true;
                        }
                    },
                    listeners: {
                        load : function() {
                            this.getTasks();
                        },
                        scope: this
                    }
                }),
                fullTaskListStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'TaskList',
                    groupField: 'cat',
                    groupDir: 'ASC',
                    sorters: [{
                        property: 'temperature',
                        direction: 'ASC'
                    },{
                        property: 'lotNum/Name',
                        direction: 'ASC'
                    }],
                    columns : [ 'lotNum/Name', '*' /* The rest of the columns */]
                }),
                formulationsStore: new LABKEY.ext4.Store({
                    schemaName: 'Samples',
                    queryName: 'Formulations'
                }),
                timepointStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'Timepoints',
                    sorters: [{
                        property: 'sort',
                        direction: 'ASC'
                    }],
                    listeners: {
                        load: this.onLoadTimepoints.bind(this)
                    }
                }),
                visualOptionsStore: new LABKEY.ext4.Store({
                    schemaName: 'lists',
                    queryName: 'VisualOptions',
                    sorters: [{
                        property: 'item',
                        direction: 'ASC'
                    }],
                    listeners: {
                        load: this.onLoadVisualOptions.bind(this)
                    }
                })
            };
        }

        return this.stores;
    },

    saveForm : function(run) {
        /* Assumes all data to be correct. Should be validated by local forms. */
        var hasTemp = false;
        var visualPass;
        var color;
        var opacity;
        var phase;
        var comments;
        var newDataRow;
        this.taskArray = [[]];

        /* One row for each temperature */
        if (this.lot != null && this.timepoint != null) {
            if (Ext4.getCmp(this.ids.visual.pass.button).pressed) {
                visualPass = true;
                Ext4.getCmp(this.ids.visual.pass.color).items.each(function(item) {
                    if (item.pressed) {
                        color = item.text;
                    }
                });

                Ext4.getCmp(this.ids.visual.pass.opacity).items.each(function(item) {
                    if (item.pressed) {
                        opacity = item.text;
                    }
                });

                Ext4.getCmp(this.ids.visual.pass.phase).items.each(function(item) {
                    if (item.pressed) {
                        phase = item.text;
                    }
                });

                comments = Ext4.getCmp(this.ids.comments).value;
            }
            else if (Ext4.getCmp(this.ids.visual.fail.button).pressed) {
                visualPass = false;
                Ext4.getCmp(this.ids.visual.fail.color).items.each(function(item) {
                    if (item.pressed) {
                        color = item.text;
                    }
                });

                Ext4.getCmp(this.ids.visual.fail.opacity).items.each(function(item) {
                    if (item.pressed) {
                        opacity = item.text;
                    }
                });

                Ext4.getCmp(this.ids.visual.fail.phase).items.each(function(item) {
                    if (item.pressed) {
                        phase = item.text;
                    }
                });

                comments = Ext4.getCmp(this.ids.comments).value;
            }
            else {
                Ext4.Msg.show({
                    msg: 'Please select a Pass or Fail'
                });
                return;
            }

            if (!color || !opacity || !phase) {
                Ext4.Msg.show({
                    msg: 'Please select Color, Opacity, and Phase'
                });
                return;
            }

            var timePoint = this.timepoint;
            Ext4.getCmp(this.ids.temperatures).items.each(function(item) {
                if (item.pressed) {
                    hasTemp = true;
                    newDataRow = {
                        Color: color,
                        Comment: comments,
                        CreatedTime: new Date().toISOString(),
                        Opacity: opacity,
                        Pass: visualPass,
                        Phase: phase,
                        Timepoint: timePoint,
                        Temperature: item.text
                    };

                    this.taskArray.push(newDataRow);

                    var placed = false;
                    for (var j = 0; j < run.dataRows.length; j++) {
                        if (run.dataRows[j]['Timepoint'] == newDataRow['Timepoint'] &&
                                run.dataRows[j]['Temperature'] == newDataRow['Temperature']) {
                            placed = true;
                            run.dataRows[j] = newDataRow;
                        }
                    }

                    if (!placed) {
                        run.dataRows.push(newDataRow);
                    }
                }
            }, this);

            if (!hasTemp) {
                Ext4.Msg.show({
                    msg: 'Please select a Temperature'
                });
                return;
            }

            /* check if this is a new lot */
            if (run.properties['LotNumber'] === undefined) {
                run.name = this.lot;
                run.properties['LotNumber'] = this.lotId;
            }

            LABKEY.page.batch.runs[0] = run;
            this.saveBatch();
        }
        else {
            Ext4.Msg.show({
                msg: 'Please select a timepoint and lot'
            });
        }
    },

    ensureRun : function() {

        LABKEY.Query.selectRows({
            schemaName: 'assay',
            queryName: LABKEY.page.assay.name + ' Runs',
            filterArray: [ LABKEY.Filter.create('name', this.lot) ],
            columns: ['Batch/RowId'],
            scope: this,
            success : function(data) {
                if (data.rows && data.rows.length > 0) {

                    // This will retrieve the batch for ones that already exist.
                    var existingBatchId = data.rows[0]['Batch/RowId'];
                    LABKEY.Experiment.loadBatch({
                        assayId: LABKEY.page.assay.id,
                        batchId: existingBatchId,
                        success: function(batch, response) {
                            LABKEY.page.batch = batch; // could be empty
                            if (!batch.runs || batch.runs.length == 0)
                                batch.runs = [ new LABKEY.Exp.Run() ];
                            var run = batch.runs[0];

                            if (!run.properties)
                                run.properties = {};

                            if (!run.dataRows)
                                run.dataRows = [];
                            this.saveForm(run);
                        },
                        failure: function(response) {
                            Ext4.Msg.show({
                                msg: 'Error loading batch!!'
                            })
                        },
                        scope: this
                    })
                }
                else {
                    // Setup a new batch
                    LABKEY.page.batch = {};
                    var batch = LABKEY.page.batch;
                    if (!batch.runs || batch.runs.length == 0)
                        batch.runs = [ new LABKEY.Exp.Run() ];
                    var run = batch.runs[0];

                    if (!run.properties)
                        run.properties = {};

                    if (!run.dataRows)
                        run.dataRows = [];
                    this.saveForm(run);
                }
            },
            failure : function() {
                Ext4.Msg.show({
                    msg: 'Error loading assay'
                })
            }
        });
    },

    displayHistory : function() {

        this.getAssayDefinition(LABKEY.ActionURL.getParameter('rowId'), function(assay) {

            var filters = [];

            if (this.lot != null) {
                filters.push(LABKEY.Filter.create('Run/LotNumber/Name', this.lot));
            }

            new LABKEY.QueryWebPart({
                title: 'History',
                renderTo: 'todayRecord',
                schemaName: assay.protocolSchemaName, // 'assay.visualInspection.<name>'
                queryName: 'Data',
                filterArray: filters
            });

        }, this);
    },

    displayLog : function() {

        this.getAssayDefinition(LABKEY.ActionURL.getParameter('rowId'), function(assay) {

            new LABKEY.QueryWebPart({
                title: 'Log',
                renderTo: 'todayRecord',
                schemaName: assay.protocolSchemaName,
                queryName: 'Data',
                filterArray: [
                    LABKEY.Filter.create('CreatedTime', new Date().toISOString(), LABKEY.Filter.Types.DATE_EQUAL)
                ],
                sort: '-CreatedTime'
            });

        }, this);
    },

    getTasks : function(newTimepoint) {

        this.timepoint = newTimepoint;
        var taskButtons = [];
        var date = Ext4.getCmp(this.ids.taskDate).getValue();
        var week = this.getWeek(date);
        this.stores.taskListStore.filters.clear();

        if (Ext4.getCmp(this.ids.oldTasks).getValue()) {
            this.stores.taskListStore.filter(function(rec) {
                var date = rec.get('date');
                var cat = rec.get('cat');
                
                if (
                    (date >= week[0] && date <= week[1] && (cat == 'aps' || cat == 'nano')) ||
                    (date < week[0] && !rec.get('complete') && !rec.get('failed') && (cat == 'aps' || cat == 'nano'))
                ) {
                    return true;
                }
            });
        }
        else {
            this.stores.taskListStore.filter(function(rec) {
                if (rec.get('date') >= week[0] && rec.get('date') <= week[1] && (rec.get('cat') == 'aps' || rec.get('cat') == 'nano')) {
                    return true;
                }
            });
        }

        /* Setup temperature items */
        Ext4.getCmp(this.ids.timepoint).items.each(function(item) {
            var record = this.stores.timepointStore.getById(item.recordId);
            if (record) {
                item.addCls('timepoint-selectable');
            }

            if (!newTimepoint) {
                item.toggle(false);
            }
        }, this);

        this.stores.taskListStore.each(function(rec) {
            var lot = rec.get('lotNum/Name');
            var timepoint = rec.get('timepoint');

            if (newTimepoint == timepoint || newTimepoint == null) {
                taskButtons.push({
                    xtype: 'button',
                    text: lot + ' (' + timepoint + ')',
                    toggleGroup: 'taskGroupButtons',
                    handler: function() {
                        this.onLotClick(lot, timepoint);
                    },
                    scope: this
                });
            }
        }, this);

        taskButtons.push({
            layout: 'hbox',
            columnWidth: 1,
            border: false,
            frame: false,
            items: [{
                xtype: 'combo',
                id: this.ids.lotCombo,
                emptyText: 'Choose a lot',
                store: this.stores.formulationsStore,
                triggerAction: 'all',
                displayField: 'Name',
                valueField: 'Name',
                handler: this.verifyField.bind(this),
                mode: 'local',
                width: 180,
                invalidText: 'Not a valid lot.'
            },{
                xtype: 'box',
                flex: 1
            },{
                xtype: 'button',
                text: 'Submit',
                handler: this.verifyField.bind(this)
            }]
        });

        var lots = Ext4.getCmp(this.ids.lots);
        lots.removeAll();
        lots.add(taskButtons);
    },

    getWeek : function(date) {
        // If no date object supplied, use current date
        // Copy date so don't modify supplied date
        var now = date ? new Date(date) : new Date();

        // set time to some convenient value
        now.setHours(0,0,0,0);

        // Get the previous Monday
        var monday = new Date(now);
        monday.setDate(monday.getDate() - monday.getDay() + 1);

        // Get next Sunday
        var sunday = new Date(now);
        sunday.setDate(sunday.getDate() - sunday.getDay() + 7);

        // Return array of date objects
        return [monday, sunday];
    },

    handleReset : function() {

        function untoggle(id) {
            Ext4.getCmp(id).items.each(function(item) {
                item.toggle(false);
            });
        }

        untoggle(this.ids.temperatures);

        Ext4.getCmp(this.ids.comments).setValue('');

        untoggle(this.ids.visualButtons);

        Ext4.getCmp(this.ids.visualPass).hide();
        Ext4.getCmp(this.ids.visualFail).hide();

        untoggle(this.ids.visual.pass.color);
        untoggle(this.ids.visual.pass.opacity);
        untoggle(this.ids.visual.pass.phase);

        untoggle(this.ids.visual.fail.color);
        untoggle(this.ids.visual.fail.opacity);
        untoggle(this.ids.visual.fail.phase);
    },

    onLoadTemperatures : function(store) {
        var buttons = [];
        store.each(function(rec) {
            buttons.push({
                xtype: 'button',
                text: rec.get('temperature'),
                recordId: rec.getId(),
                width: 50,
                margin: 5,
                enableToggle: true
            });
        }, this);

        if (buttons.length > 0) {
            var cmp = Ext4.getCmp(this.ids.temperatures);
            cmp.removeAll();
            cmp.add(buttons);
        }
    },

    onLoadTimepoints : function(store) {
        var buttons = [];
        store.each(function(rec) {
            var time = rec.get('time');
            buttons.push({
                xtype: 'button',
                recordId: rec.getId(),
                text: time,
                toggleGroup: 'timepointButtons',
                handler: this.getTasks.bind(this, time)
            });
        }, this);

        if (buttons.length > 0) {
            var cmp = Ext4.getCmp(this.ids.timepoint);
            cmp.removeAll();
            cmp.add(buttons);
        }
    },

    onLoadVisualOptions : function(store) {

        var visual = {
            fail: {
                color: [],
                opacity: [],
                phase: []
            },
            pass: {
                color: [],
                opacity: [],
                phase: []
            }
        };

        store.each(function(rec) {
            var pass = rec.get('pass');
            var fail = rec.get('fail');
            var category = rec.get('category');
            var item = rec.get('item');

            if (pass == 1) {
                if (category == 'Color') {
                    visual.pass.color.push({
                        xtype: 'button',
                        id: 'colorpass' + item,
                        name: 'colorpass' + item,
                        text: item,
                        width: 150,
                        margin: 5,
                        toggleGroup: 'visualColorPassButtons',
                        scope: this
                    });
                }

                if (category == 'Opacity') {
                    visual.pass.opacity.push({
                        xtype: 'button',
                        id: 'opacitypass' + item,
                        name: 'opacitypass' + item,
                        text: item,
                        width: 150,
                        margin: 5,
                        toggleGroup: 'visualOpacityPassButtons',
                        scope: this
                    });
                }

                if (category == 'Phase') {
                    visual.pass.phase.push({
                        xtype: 'button',
                        id: 'phasepass' + item,
                        name: 'phasepass' + item,
                        text: item,
                        width: 275,
                        margin: 5,
                        toggleGroup: 'visualPhasePassButtons',
                        scope: this
                    });
                }
            }

            if (fail == 1) {
                if (category == 'Color') {
                    visual.fail.color.push({
                        xtype: 'button',
                        id: 'colorfail' + item,
                        name: 'colorfail' + item,
                        text: item,
                        width: 150,
                        margin: 5,
                        toggleGroup: 'visualColorFailButtons',
                        scope: this
                    });
                }

                if (category == 'Opacity') {
                    visual.fail.opacity.push({
                        xtype: 'button',
                        id: 'opacityfail' + item,
                        name: 'opacityfail' + item,
                        text: item,
                        width: 150,
                        margin: 5,
                        toggleGroup: 'visualOpacityFailButtons',
                        scope: this
                    });
                }

                if (category == 'Phase') {
                    visual.fail.phase.push({
                        xtype: 'button',
                        id: 'phasefail' + item,
                        name: 'phasefail' + item,
                        text: item,
                        width: 275,
                        margin: 5,
                        toggleGroup: 'visualPhaseFailButtons',
                        scope: this
                    });
                }
            }
        }, this);

        // pass
        this._configureVisualOption(this.ids.visual.pass.color, visual.pass.color);
        this._configureVisualOption(this.ids.visual.pass.opacity, visual.pass.opacity);
        this._configureVisualOption(this.ids.visual.pass.phase, visual.pass.phase);

        // fail
        this._configureVisualOption(this.ids.visual.fail.color, visual.fail.color);
        this._configureVisualOption(this.ids.visual.fail.opacity, visual.fail.opacity);
        this._configureVisualOption(this.ids.visual.fail.phase, visual.fail.phase);
    },

    _configureVisualOption : function(id, buttons) {
        var cmp = Ext4.getCmp(id);
        cmp.removeAll();
        if (buttons.length > 0) {
            cmp.add(buttons);
        }
    },

    onLotClick : function(lot, timepoint) {
        this.lot = lot;
        this.timepoint = timepoint;
        this.lotId = this.stores.formulationsStore.findRecord('Name', this.lot).get('RowId').toString();
        var lotPanel = Ext4.getCmp(this.ids.visualInspection);
        lotPanel.setTitle("Visual Inspection of " + lot + " at " + timepoint);
        lotPanel.show();
    },

    saveBatch : function() {
        this.getEl().mask('Saving...');
        LABKEY.Experiment.saveBatch({
            assayId: LABKEY.page.assay.id,
            batch: LABKEY.page.batch,
            success : function(batch) {
                this.getEl().unmask();
                LABKEY.page.batch = batch;
                Ext4.Msg.show({
                    title: 'Saved Successfully',
                    msg: 'Save Successful'
                });
                this.displayLog();
                this.updateTask();
                setTimeout(function() {
                    Ext4.Msg.hide();
                }, 1000);
            },
            failure : function(errorInfo) {
                this.getEl().unmask();
                var msg = errorInfo.exception;
                Ext4.Msg.hide();
                Ext4.Msg.alert('Error saving', msg);
            },
            scope: this
        });
    },

    updateTask : function() {
        this.taskArray.forEach(function(item) {

            var index = this.stores.fullTaskListStore.findBy(function(record) {
                return (
                        record.get('timepoint') == item["Timepoint"] &&
                        record.get('temperature') == item["Temperature"].toString() &&
                        record.get('lotNum/Name') == this.lot &&
                        ((record.get('cat') == 'nano') || (record.get('cat') == 'aps'))
                );
            }, this);
            var currentTask = this.stores.fullTaskListStore.getAt(index);

            if (currentTask) {
                var existingComment = currentTask.get('comment'),
                        PASS = 'VPASS',
                        FAIL = 'VFAIL';

                if (existingComment) {
                    var passString = existingComment.search(PASS);
                    var failString = existingComment.search(FAIL);
                    if (item['Pass'] == true) {
                        if (passString == -1 && failString == -1) {
                            existingComment = PASS + ', ' + existingComment;
                        }
                        else if (failString != -1) {
                            existingComment = existingComment.replace(FAIL, PASS);
                        }
                    }
                    else
                    {
                        if (passString == -1 && failString == -1) {
                            existingComment = FAIL + ', ' + existingComment;
                        }
                        else if (passString != -1) {
                            existingComment = existingComment.replace(PASS, FAIL);
                        }

                    }
                }
                else {
                    existingComment = item['Pass'] === true ? PASS : FAIL;
                }

                currentTask.set('comment',existingComment);
            }

            this.stores.fullTaskListStore.commitChanges();
            this.stores.fullTaskListStore.sync();
        }, this);
    },

    verifyField : function() {
        var textValue = Ext4.getCmp(this.ids.lotCombo).value;

        if (textValue != null) {
            textValue = textValue.trim();

            if (this.stores.formulationsStore.findRecord('Name', textValue) != null) {
                if (this.timepoint) {
                    this.onLotClick(this.stores.formulationsStore.findRecord('Name', textValue).get('Name'), this.timepoint);
                }
                else {
                    Ext4.Msg.show({
                        msg: 'Please select a timepoint first.'
                    });
                }
            }
        }
        else {
            Ext4.Msg.show({
                msg: 'Please Enter a Value or Valid Lot.'
            });
        }
    }
});
