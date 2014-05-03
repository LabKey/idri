/*
 * Copyright (c) 2014 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('LABKEY.hplc.SampleCreator', {
    extend: 'Ext.panel.Panel',

    title: 'HPLC Qualitative Analysis',

    layout: {
        type: 'border',
        regionWeights: {
            west: 20,
            north: 10,
            south: -10,
            east: 20
        }
    },

    border: false,

    statics: {
        formStore: undefined,
        compoundStore: undefined,
        timeStore: undefined,
        tempStore: undefined,
        getTempStore : function() {
            if (!LABKEY.hplc.SampleCreator.tempStore) {

                LABKEY.hplc.SampleCreator.tempStore = Ext4.create('LABKEY.ext4.data.Store', {
                    schemaName: 'Lists',
                    queryName: 'Temperatures'
                });

                // doesn't currently work as the return value is of type string
//                LABKEY.hplc.SampleCreator.tempStore.on('load', function(s) {
//                    s.sort('temperature', 'ASC');
//                }, this, {single: true});

                LABKEY.hplc.SampleCreator.tempStore.load();
            }
            return LABKEY.hplc.SampleCreator.tempStore;
        },
        getTimeStore : function() {
            if (!LABKEY.hplc.SampleCreator.timeStore) {
                LABKEY.hplc.SampleCreator.timeStore = Ext4.create('LABKEY.ext4.data.Store', {
                    schemaName: 'Lists',
                    queryName: 'Timepoints'
                });

                LABKEY.hplc.SampleCreator.timeStore.on('load', function(s) {
                    s.sort('sort', 'ASC');
                }, this, {single: true});

                LABKEY.hplc.SampleCreator.timeStore.load();
            }
            return LABKEY.hplc.SampleCreator.timeStore;
        },
        getCompoundsStore : function() {
            if (!LABKEY.hplc.SampleCreator.compoundStore) {
                LABKEY.hplc.SampleCreator.compoundStore = Ext4.create('LABKEY.ext4.data.Store', {
                    schemaName: 'Samples',
                    queryName: 'Compounds'
                });
                LABKEY.hplc.SampleCreator.compoundStore.load();
            }
            return LABKEY.hplc.SampleCreator.compoundStore;
        },
        getFormulationStore : function() {
            if (!LABKEY.hplc.SampleCreator.formStore) {
                LABKEY.hplc.SampleCreator.formStore = Ext4.create('LABKEY.ext4.data.Store', {
                    schemaName: 'Samples',
                    queryName: 'Formulations'
                });
                LABKEY.hplc.SampleCreator.formStore.load();
            }
            return LABKEY.hplc.SampleCreator.formStore;
        }
    },

    constructor : function(config) {
        this.callParent([config]);

        this.addEvents('computedconcentration');
    },

    initComponent: function() {

        SS = this;

        this.items = [
            this.getWest(),
            this.getNorth(),
            this.getCenter(),
            this.getEast()
        ];

        this.callParent();

        this.curveTask = new Ext4.util.DelayedTask(function() {
            var xleft = Ext4.getCmp('aucleft').getValue();
            var xright = Ext4.getCmp('aucright').getValue();
            this.fireEvent('curvechange', xleft, xright);
        }, this);

        this.rangeTask = new Ext4.util.DelayedTask(function() {
            var low = Ext4.getCmp('mvrangelow').getValue();
            var high = Ext4.getCmp('mvrangehigh').getValue();
            this.fireEvent('rangechange', low, high);
        }, this);
    },

    getWest : function() {

        if (!this.westpanel) {
            this.westpanel = Ext4.create('Ext.panel.Panel', {
                region: 'west',
                title: 'Available Inputs',
                header: false,
                width: 250,
                border: false, frame: false,
                style: 'border-right: 1px solid lightgrey; overflow-x: hidden; overflow-y: auto;',
                bodyStyle: 'overflow-y: auto;',
                items: [{
                    itemId: 'inputsgrid',
                    xtype: 'grid',
                    store: {
                        xtype: 'store',
                        model: 'LABKEY.hplc.ProvisionalRun',
                        data: this.context.rawInputs
                    },
                    columns: [
                        {text: 'Inputs', dataIndex: 'name', width: 205}
                    ],
                    selModel: {
                        selType: 'checkboxmodel',
                        mode: 'MULTI'
                    },
                    hideHeaders: true,
                    listeners: {
                        viewready : function(g) {
                            //
                            // Filter to remove PRE_, POST_, and BLANK tags
                            //
                            g.getStore().filter([{
                                filterFn: function(item) {
                                    return item.get('name').indexOf('PRE_') == -1 && item.get('name').indexOf('POST_') == -1;
                                }
                            },{
                                filterFn: function(item) {
                                    return item.get('name').indexOf('BLANK') == -1;
                                }
                            }]);
                        },
                        selectionchange: function(g, recs) {
                            this.fireEvent('inputchange', recs);
                            Ext4.getCmp('startqcbtn').setDisabled(recs.length == 0);
                        },
                        scope: this
                    }
                }],
                dockedItems: [{
                    xtype: 'toolbar',
                    dock: 'top',
                    items: [{
                        id: 'startqcbtn',
                        text: 'Start QC',
                        disabled: true,
                        handler: function(b) {
                            this.fireEvent('startqc', b.up('panel').getComponent('inputsgrid').getSelectionModel().getSelection());
                        },
                        scope: this
                    },{
                        text: 'Define Standards',
                        handler: function() { this.fireEvent('requeststandards'); },
                        scope: this
                    }]
                }],
                scope: this
            });

            this.on('startqc', function() {
                this.updateZoom(0, 30, 0, 1200);
                this.westpanel.collapse();
            }, this);
        }

        return this.westpanel;
    },

    getNorth : function() {

        if (!this.northpanel) {
            this.northpanel = Ext4.create('Ext.panel.Panel', {
                region: 'north',
                height: 240,
                items: [{
                    xtype: 'panel',
                    columnWidth: 0.5,
                    border: false, frame: false,
                    items: [{
                        id: 'sampleform',
                        itemId: 'sampleform',
                        xtype: 'form',
                        border: false, frame: false,
                        padding: '15 10',
                        fieldDefaults: {
                            labelWidth: 150
                        },
                        items: [{
                            xtype: 'datefield',
                            id: 'rundate',
                            fieldLabel: 'Run Time',
                            name: 'rundate',
                            width: 400
                        },{
                            xtype: 'combobox',
                            id: 'compoundlist',
                            fieldLabel: 'Compound',
                            name: 'compoundrowid',
                            store: LABKEY.hplc.SampleCreator.getCompoundsStore(),
                            displayField: 'Name',
                            valueField: 'RowId',
                            typeAhead: true,
                            validateOnBlur: false,
                            allowBlank: false,
                            width: 400
                        },{
                            xtype: 'combobox',
                            id: 'standardslist',
                            fieldLabel: 'Standard',
                            name: 'standardrowid',
                            store: LABKEY.hplc.StandardCreator.getStandardsStore(this.context),
                            displayField: 'Name',
                            valueField: 'Key',
                            typeAhead: true,
                            validateOnBlur: false,
                            allowBlank: false,
                            width: 400
                        },{
                            xtype: 'fieldcontainer',
                            fieldLabel: 'Formulation',
                            layout: 'hbox',
                            width: 550,
                            items: [{
                                xtype: 'combobox',
                                id: 'formulationlist',
//                                fieldLabel: 'Formulation',
                                emptyText: 'Formulation',
                                name: 'formulationrowid',
                                store: LABKEY.hplc.SampleCreator.getFormulationStore(),
                                typeAhead: true,
                                validateOnBlur: false,
                                allowBlank: false,
                                displayField: 'Name',
                                valueField: 'RowId',
                                width: 120
                            },{
                                xtype: 'splitter'
                            },{
                                xtype: 'combobox',
                                id: 'temperaturelist',
                                emptyText: 'Temperature',
                                name: 'temperature',
                                store: LABKEY.hplc.SampleCreator.getTempStore(),
                                displayField: 'temperature',
                                valueField: 'temperature',
                                typeAhead: true,
                                validateOnBlur: false,
                                allowBlank: false,
                                width: 120
                            },{
                                xtype: 'splitter'
                            },{
                                xtype: 'combobox',
                                id: 'timelist',
                                emptyText: 'Timepoint',
                                name: 'timepoint',
                                store: LABKEY.hplc.SampleCreator.getTimeStore(),
                                displayField: 'time',
                                valueField: 'time',
                                typeAhead: true,
                                validateOnBlur: false,
                                allowBlank: false,
                                width: 120
                            }]
                        },{
                            id: 'avgconcfield',
                            xtype: 'numberfield',
                            editable: false,
                            hideTrigger: true,
                            allowBlank: false,
                            validateOnBlur: false,
                            emptyText: 'autofilled',
                            name: 'avgconc',
                            fieldLabel: 'Average Concentration'
                        },{
                            id: 'stddevfield',
                            xtype: 'numberfield',
                            editable: false,
                            hideTrigger: true,
                            allowBlank: false,
                            validateOnBlur: false,
                            emptyText: 'autofilled',
                            name: 'stddev',
                            fieldLabel: 'Standard Deviation'
                        },{
                            xtype: 'fieldcontainer',
                            fieldLabel: 'Curve Area',
                            layout: 'hbox',
                            width: 300,
                            items: [{
                                id: 'aucleft',
                                name: 'aucleft',
                                xtype: 'numberfield',
                                hideTrigger: true,
                                emptyText: 'left',
                                value: 0,
                                flex: 1,
                                listeners: {
                                    change: function() {
                                        this.curveTask.delay(300);
                                    },
                                    scope: this
                                }
                            },{
                                xtype: 'splitter'
                            },{
                                id: 'aucright',
                                name: 'aucright',
                                xtype: 'numberfield',
                                hideTrigger: true,
                                emptyText: 'right',
                                value: 30,
                                flex: 1,
                                listeners: {
                                    change: function() {
                                        this.curveTask.delay(300);
                                    },
                                    scope: this
                                }
                            }]
                        },{
                            xtype: 'fieldcontainer',
                            fieldLabel: 'mV Range',
                            layout: 'hbox',
                            width: 300,
                            items: [{
                                id: 'mvrangelow',
                                xtype: 'numberfield',
                                hideTrigger: true,
                                emptyText: 'left',
                                value: 0,
                                flex: 1,
                                listeners: {
                                    change: function() {
                                        this.rangeTask.delay(300);
                                    },
                                    scope: this
                                }
                            },{
                                xtype: 'splitter'
                            },{
                                id: 'mvrangehigh',
                                xtype: 'numberfield',
                                hideTrigger: true,
                                emptyText: 'right',
                                value: 1200,
                                flex: 1,
                                listeners: {
                                    change: function() {
                                        this.rangeTask.delay(300);
                                    },
                                    scope: this
                                }
                            }]
                        }]
                    }]
                }]
            });

            this.on('standardchange', function(standards) {

                var form = this.northpanel.getComponent('sampleform');
                if (form) {
                    var val = '', sep = '';
                    for (var s=0; s < standards.length; s++) {
                        val += sep + standards[s].get('name');
                        sep = ', ';
                    }
                    form.getForm().setValues({
                        standardslist: val
                    });
                }
            }, this);

            this.on('startqc', function(runs) {
                //
                // clear the form fields
                //
                this.getQCForm().getForm().reset();
                Ext4.getCmp('submitactionbtn').setDisabled(true);

                if (runs.length > 0) {
                    //
                    // build a valid date
                    //
                    var path = runs[0].get('filePath');
                    if (path) {
                        path = path.split('/');
                        var folder = path[path.length-2];
                        if (folder.indexOf('20') == 0) {
                            folder = folder.split('_');
                            var date = new Date('' + folder[0] + "-" + folder[1] + "-" + folder[2]);
                            date.setHours(parseInt(folder[3]));
                            date.setMinutes(parseInt(folder[4]));
                            date.setSeconds(parseInt(folder[5]));
                            Ext4.getCmp('rundate').setValue(date);
                        }
                    }
                }
            }, this);
        }
        return this.northpanel;
    },

    getQCForm : function() {
        return Ext4.getCmp('sampleform');
    },

    getCenter : function() {

        if (!this.centerpanel) {
            this.centerpanel = Ext4.create('Ext.panel.Panel', {
                region: 'center',
                border: false, frame: false,
                dockedItems: [{
                    xtype: 'toolbar',
                    dock: 'top',
                    items: [{
                        text: 'Reset Zoom',
                        handler: function() {
                            this.updateZoom(0, 30, 0, 1200);
                        },
                        scope: this
                    },'->',{
                        id: 'submitactionbtn',
                        text: 'Submit Analysis',
                        disabled: true,
                        handler: this.saveQC,
                        scope: this
                    }]
                }],
                items: [{
                    id: 'plotarea',
                    xtype: 'spectrum',
                    xLabel: 'Time (m)',
                    yLabel: 'mV',
                    leftBoundField: 'aucleft',
                    rightBoundField: 'aucright',
                    lowBoundField: 'mvrangelow',
                    highBoundField: 'mvrangehigh',
                    listeners: {
                        zoom: this.updateZoom,
                        scope: this
                    }
                }]
            });

            this.on('startqc', function(provisionalRuns) {
                //
                // load the appropriate content for each selected sample
                //
                var recieved = 0, expected = provisionalRuns.length, allContent = [],
                        contentMap = {};

                var done = function(content) {
                    recieved++;
                    allContent.push(content);
                    contentMap[content.fileName] = content;
                    if (recieved == expected) {
                        this.allContent = allContent;
                        this.contentMap = contentMap;
                        this.renderPlot(allContent);
                    }
                };

                for (var d=0; d < provisionalRuns.length; d++) {
                    var pr = provisionalRuns[d].get('expDataRun');
                    if (pr) {
                        LABKEY.hplc.QualityControl.FileContentCache(pr, done, this);
                    }
                    else {
                        console.error('Failed to load expDataRun from provisional run.');
                    }
                }

            }, this);
        }

        return this.centerpanel;
    },

    saveQC : function() {
        if (this.getQCForm().isValid()) {
            this.runAnalysis();
            this.saveToAssay(this.getQCForm().getForm());
        }
        else {
            Ext4.defer(function() {
                this.getForm().clearInvalid();
            }, 3000, this.getQCForm());
        }
    },

    saveToAssay : function(form) {
        //
        // Load the target QC assay batch
        //
        LABKEY.Experiment.loadBatch({
            assayId: this.context.HPLCDefinition.id,
            success: function(batch) {

                var values = form.getValues();
                var run = new LABKEY.Exp.Run();

                var formStore = LABKEY.hplc.SampleCreator.getFormulationStore();
                var formIdx = formStore.findExact('RowId', parseInt(values['formulationrowid']));
                var formulationName = formStore.getAt(formIdx).get('Name');

                run.name = formulationName;

                //
                // Set the run properties
                //
                run.properties = {
                    //
                    // Lookups
                    //
                    "LotNumber": values['formulationrowid'],
                    "CompoundNumber": values['compoundrowid'],
                    "StandardInstance": values['standardrowid'],
                    "StorageTemperature": values['temperature'],
                    "Time": values['timepoint'],

                    //
                    // Values
                    //
                    "RunDate": values['rundate'], //new Date(values['rundate']),
                    "Concentration": parseFloat(values['avgconc']),
                    "StandardDeviation": parseFloat(values['stddev'])
                };

                //
                // Set the run.dataRows
                //
                var samples = this.dupStore.getRange();
                var dataRows = [];

                Ext.each(samples, function(sample) {
                    if (sample.get('include')) {
                        dataRows.push({
                            Name: sample.get('name'),
                            Dilution: 20,
                            Concentration: sample.get('concentration'),
                            Xleft: sample.get('xleft'),
                            XRight: sample.get('xright'),
                            Base: sample.get('base'),
                            FilePath: sample.get('expDataRun').pipelinePath
                        });
                    }
                }, this);

                run.dataRows = dataRows;
                batch.runs.push(run);

                LABKEY.Experiment.saveBatch({
                    assayId: this.context.HPLCDefinition.id,
                    batch: batch,
                    success: function(b, r) {

                        Ext4.Msg.show({
                            title: 'Saved',
                            msg: 'HPLC Run saved successfully.',
                            buttons: Ext.Msg.OK
                        });

                        this.westpanel.on('expand', function(west) {

                            Ext4.defer(function() {
                                var selection = this.westpanel.getComponent('inputsgrid');
                                selection.getSelectionModel().deselectAll();
                                this.getQCForm().getForm().reset();
                                Ext4.getCmp('submitactionbtn').setDisabled(true);
                                this.clearPlot();
                            }, 200, this);

                        }, this, {single: true});

                        this.westpanel.expand();

                        Ext4.defer(function() {
                            Ext4.Msg.hide();
                        }, 2000, this);
                    },
                    failure: function(r) {
                        Ext4.Msg.show({
                            title: 'Failed',
                            msg: 'Failed to save HPLC Run.',
                            buttons: Ext.Msg.OK
                        });
                    },
                    scope: this
                });
            },
            scope: this
        });
    },

    getQCPane : function(model) {
        var qcPane = Ext4.create('Ext.panel.Panel', {
            hideHeader: true,
            items: [{
                xtype: 'panel',
                border: false, frame: false,
                items: [{
                    xtype: 'box',
                    autoEl: {
                        tag: 'h2',
                        html: model.get('name')
                    }
                },{
                    xtype: 'form',
                    border: false, frame: false,
                    items: [{
                        xtype: 'checkboxfield',
                        name: 'include',
                        checked: true,
                        fieldLabel: 'Include'
                    },{
                        xtype: 'fieldcontainer',
                        layout: 'hbox',
                        items: [{
                            itemId: 'xleft',
                            name: 'xleft',
                            xtype: 'numberfield',
                            hideTrigger: true,
                            emptyText: 'left',
                            flex: 1,
                            listeners: {
                                change: function(field, value) {
                                    var l = value;
                                    var r = field.up('fieldcontainer').getComponent('xright').getValue();
                                    if (r && r > l) {
                                        var data = LABKEY.hplc.QualityControl.getData(this.contentMap[model.get('name')+'.'+model.get('fileExt')], l, r);
                                        var aucPeak = LABKEY.hplc.Stats.getAUC(data, 29);
                                        field.up('form').getComponent('aucfield').setValue(aucPeak.auc);
                                        field.up('form').getComponent('peakfield').setValue(aucPeak.peakMax);

                                        //
                                        // calculate concentration
                                        //
                                        var auc = aucPeak.auc;
                                        var combo = Ext4.getCmp('standardslist');
                                        if (combo && Ext4.isDefined(combo.getValue())) {
                                            var store = combo.getStore();
                                            var idx = store.findExact('Key', combo.getValue());
                                            if (idx > -1) {
                                                var m = store.getAt(idx);
                                                var a = m.get('b0');
                                                var b = m.get('b1');
                                                var c = m.get('b2');

                                                //
                                                // quadratic formula
                                                //
                                                var inner = Math.pow(b, 2) - (4 * a * c);
                                                var sqrtInner = Math.sqrt(inner);
                                                var negB = -1 * b;
                                                var bottom = 2*a;
                                                var xpos = (negB + sqrtInner) / bottom;
                                                var xneg = (negB - sqrtInner) / bottom;
                                            }
                                        }
                                    }
                                },
                                scope: this
                            }
                        },{
                            xtype: 'splitter'
                        },{
                            itemId: 'xright',
                            name: 'xright',
                            xtype: 'numberfield',
                            hideTrigger: true,
                            emptyText: 'right',
                            flex: 1,
                            listeners: {
                                change: function(field, value) {
                                    var l = field.up('fieldcontainer').getComponent('xleft').getValue();
                                    var r = value;
                                    if (l && r > l) {
                                        var data = LABKEY.hplc.QualityControl.getData(this.contentMap[model.get('name')+'.'+model.get('fileExt')], l, r);
                                        var aucPeak = LABKEY.hplc.Stats.getAUC(data, 29);
                                        field.up('form').getComponent('aucfield').setValue(aucPeak.auc);
                                        field.up('form').getComponent('peakfield').setValue(aucPeak.peakMax);

                                        //
                                        // calculate concentration
                                        //
                                        var auc = aucPeak.auc;
                                        var combo = Ext4.getCmp('standardslist');
                                        if (combo && Ext4.isDefined(combo.getValue())) {
                                            var store = combo.getStore();
                                            var idx = store.findExact('Key', combo.getValue());
                                            if (idx > -1) {
                                                var m = store.getAt(idx);
                                                var a = m.get('b0');
                                                var b = m.get('b1');
                                                var c = m.get('b2');

                                                //
                                                // quadratic formula
                                                //
                                                var inner = Math.pow(b, 2) - (4 * a * c);
                                                var sqrtInner = Math.sqrt(inner);
                                                var negB = -1 * b;
                                                var bottom = 2*a;
                                                var xpos = (negB + sqrtInner) / bottom;
                                                var xneg = (negB - sqrtInner) / bottom;
                                            }
                                        }
                                    }
                                },
                                scope: this
                            }
                        }]
                    },{
                        itemId: 'aucfield',
                        xtype: 'displayfield',
                        fieldLabel: 'Peak Area'
                    },{
                        itemId: 'peakfield',
                        xtype: 'displayfield',
                        fieldLabel: 'Max Peak'
                    },{
                        xtype: 'displayfield',
                        fieldLabel: 'Concentration'
                    }]
                }]
            }]
        });

        return qcPane;
    },

    getSampleFormView : function() {
        return Ext4.getCmp('sampleformview');
    },

    getEast : function() {

        if (!this.eastpanel) {

            var view = Ext4.create('Ext.view.View', {
                id: 'sampleformview',
                store: {
                    xtype: 'store',
                    model: 'LABKEY.hplc.Sample'
                },
                itemSelector: 'tr.item',
                autoScroll: true,
                tpl: new Ext4.XTemplate(
                    '<table style="width: 100%;">',
                        '<tr>',
                            '<th style="text-align: left;">Name</th>',
                            '<th style="text-align: left;">Left</th>',
                            '<th style="text-align: left;">Right</th>',
                            '<th style="text-align: left;">Base</th>',
                            '<th style="text-align: left;">Include</th>',
                            '<th style="text-align: left;">Response</th>',
                        '</tr>',
                        '<tpl for=".">',
                            '<tr class="item" modelname="{name}">',
                                '<td>{name}</td>',
                                '<td><input value="{xleft}" placeholder="xleft" name="xleft" style="width: 40px;"/></td>',
                                '<td><input value="{xright}" placeholder="xright" name="xright" style="width: 40px;"/></td>',
                                '<td><input value="{base}" name="base" style="width: 40px;"/></td>',
                                '<td><input value="{include}" name="include" type="checkbox" checked="checked"/></td>',
                                '<td><span name="response">{peakResponse}</span></td>',
                            '</tr>',
                        '</tpl>',
                    '</table>'
                ),
                listeners: {
                    itemclick: function(x,y,z,a,evt) {
                        // for some reason, focus is not maintained even after a user clicks an input
                        Ext4.defer(function() { Ext4.get(evt.target).dom.focus(); }, 50);
                    },
                    select: this.bindCalc,
                    scope: this
                }
            });

            this.eastpanel = Ext4.create('Ext.panel.Panel', {
                title: 'QC Results',
                region: 'east',
                autoScroll: true,
                width: 400,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                items: [view],
                dockedItems: [{
                    xtype: 'toolbar',
                    dock: 'top',
                    items: [{
                        text: 'Calculate',
                        handler: this.runAnalysis,
                        scope: this
                    },{
                        text: 'Clear Highlight',
                        handler: function() {
                            this.highlighted = undefined;
                            this.renderPlot(this.allContent);
                        },
                        scope: this
                    }]
                }]
            });

            this.on('startqc', function(runs) {

                var _runs = [], dups = [], d, r=0;
                for (; r < runs.length; r++) {
                    d = Ext4.clone(runs[r].data);
                    _runs.push(d);
                    d = Ext4.clone(d);
                    dups.push(d);
                }

                this.dupStore = Ext4.create('Ext.data.Store', {
                    model: 'LABKEY.hplc.Sample'
                });

                view.getStore().loadData(_runs);
                this.dupStore.loadData(dups);

            }, this);
            this.on('curvechange', function(xleft, xright) { this.renderPlot(this.allContent); }, this);
            this.on('rangechange', function(low, high) { this.renderPlot(this.allContent); }, this);
        }

        return this.eastpanel;
    },

    /**
     * The intent of this method is to gather all input sample results and compare them against the
     * selected standard curve.
     */
    runAnalysis : function() {
        var standardStore = LABKEY.hplc.StandardCreator.getStandardsStore(this.context);

        //
        // Determine the selected standard
        //
        var standardRowId = this.getQCForm().getValues()['standardrowid'];

        if (Ext4.isNumber(standardRowId)) {
            var idx = standardStore.findExact('Key', standardRowId);

            var standardModel = standardStore.getAt(idx);
            var a = standardModel.get('b2');
            var b = standardModel.get('b1');
            var c = standardModel.get('b0');

            //
            // Get the set of qc results
            //
            var resultStore = this.dupStore, concs = [];
            var rcount = resultStore.getCount(), result;
            for (var r=0; r < rcount; r++) {
                result = resultStore.getAt(r);

                if (result.get('include') === true) {

                    var response = result.get('peakResponse');

                    // calculate concentration
                    var _c = c - response;

                    var x = LABKEY.hplc.Stats.getQuadratic(a, b, _c);
                    var nonDiluted = x[0] * 20; // account for dilution ratio
                    result.set('concentration', nonDiluted);
                    concs.push(nonDiluted);
                }
            }

            var mean = 0; var deviation = 0;
            if (concs.length > 0) {
                var computed = LABKEY.hplc.Stats.average(concs);
                mean = computed.mean;
                deviation = computed.deviation;
            }

            Ext4.getCmp('avgconcfield').setValue(mean);
            Ext4.getCmp('stddevfield').setValue(deviation);
            Ext4.getCmp('submitactionbtn').setDisabled(false);
        }
        else {
            alert('Please select a standard to base these samples on.');
        }
    },

    bindCalc : function(view, sample) {
        var modelname = sample.get('name');

        // clear listeners
        Ext4.iterate(this.nodes, function(node) {
            if (node && Ext4.isFunction(node.removeAllListeners)) {
                node.removeAllListeners();
            }
        }, this);

        if (modelname) {
            var node = Ext4.DomQuery.select('tr[modelname="' + modelname + '"]')[0];

            this.nodes = {
                sample: sample,
                leftIn: Ext4.get(Ext4.DomQuery.select('input[name="xleft"]', node)[0]),
                rightIn: Ext4.get(Ext4.DomQuery.select('input[name="xright"]', node)[0]),
                baseIn: Ext4.get(Ext4.DomQuery.select('input[name="base"]', node)[0]),
                include: Ext4.get(Ext4.DomQuery.select('input[name="include"]', node)[0]),
                responseOut: Ext4.get(Ext4.DomQuery.select('span[name="response"]', node)[0])
            };

            this.nodes.leftIn.on('keyup', this.updateModels, this);
            this.nodes.rightIn.on('keyup', this.updateModels, this);
            this.nodes.baseIn.on('keyup', this.updateModels, this);
            this.nodes.include.on('click', this.updateModels, this);

            this.highlighted = sample.get('name') + '.'  + sample.get('fileExt');
            this.renderPlot(this.allContent);

            this.updateModels();
        }
    },

    computeCalc : function() {
        var left = parseFloat(this.nodes.leftIn.getValue());
        var right = parseFloat(this.nodes.rightIn.getValue());
        var base = parseFloat(this.nodes.baseIn.getValue());
        var model = this.nodes.sample;

        if (left > 0 && right > 0 && base > -1) {
            var fileContent = this.contentMap[model.get('name') + '.' + model.get('fileExt')];
            var data = LABKEY.hplc.QualityControl.getData(fileContent, left, right, false);
            var aucPeak = LABKEY.hplc.Stats.getAUC(data, base);
            this.nodes.responseOut.update(+aucPeak.auc.toFixed(3));

            var sampleModel = this.dupStore.getAt(this.dupStore.findExact('name', model.get('name')));

            sampleModel.suspendEvents(true);
            sampleModel.set('xleft', left);
            sampleModel.set('xright', right);
            sampleModel.set('base', base);
            sampleModel.set('auc', aucPeak.auc);
            sampleModel.set('peakResponse', aucPeak.auc);
            sampleModel.set('peakMax', aucPeak.peakMax);
            sampleModel.set('include', this.nodes.include.dom.checked);
            sampleModel.resumeEvents();

            this.fireEvent('computedconcentration', this.dupStore);
        }
    },

    updateModels : function() {

        if (!this.computeTask) { this.computeTask = new Ext4.util.DelayedTask(this.computeCalc, this); }

        this.computeTask.delay(500);
    },

    renderPlot : function(contents) {
        var spectrumPlot = Ext4.getCmp('plotarea');

        spectrumPlot.setHighlight(this.highlighted);
        spectrumPlot.renderPlot(contents);

        this.fireEvent('samplesrendered');
    },

    clearPlot : function() {
        Ext4.getCmp('plotarea').clearPlot();
    },

    updateZoom : function(l, r, b, t) {
        var leftCmp = Ext4.getCmp('aucleft');
        var rightCmp = Ext4.getCmp('aucright');
        var mvLowCmp = Ext4.getCmp('mvrangelow');
        var mvHighCmp = Ext4.getCmp('mvrangehigh');
        leftCmp.setValue(l);
        rightCmp.setValue(r);
        mvLowCmp.setValue(b);
        mvHighCmp.setValue(t);
    }
});
