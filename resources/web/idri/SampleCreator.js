/*
 * Copyright (c) 2015-2016 LabKey Corporation
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
        }
    },

    initComponent: function() {

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
                id: 'sampleinputs',
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
                            this.fireEvent('startqc', this.getSelectedInputResults());
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
                height: 285,
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
                            store: (function() {
                                var remoteStore = Ext4.create('LABKEY.ext4.data.Store', {
                                    schemaName: 'Samples',
                                    queryName: 'Compounds',
                                    sort: 'Name'
                                });

                                // Share the model generated by the remote store
                                var localStore = Ext4.create('Ext.data.Store', {
                                    model: remoteStore.model
                                });

                                remoteStore.on('load', function(s) {
                                    localStore.add(s.getRange());
                                }, this, {single: true});

                                remoteStore.load();

                                return localStore;
                            })(),
                            displayField: 'Name',
                            valueField: 'RowId',
                            queryMode: 'local',
                            validateOnBlur: false,
                            allowBlank: false,
                            width: 400,
                            enableKeyEvents: true,
                            selectOnFocus: true,
                            listeners: {
                                blur: function(cb) {
                                    // ensure valid value -- otherwise, clear
                                    if (isNaN(parseInt(cb.getValue()))) {
                                        cb.clearValue();
                                    }

                                    Ext4.defer(function() {
                                        cb.getStore().clearFilter();
                                    }, 150);
                                },
                                focus: function(cb) {
                                    cb.expand();
                                },
                                keyup: function(cb, evt) {
                                    var key = evt.button;

                                    if (key === 8 /* TAB */) {
                                        return;
                                    }

                                    var value = cb.getValue();

                                    cb.getStore().clearFilter();

                                    if (value && value.length > 0) {
                                        var lower = value.toLowerCase();
                                        cb.getStore().filterBy(function(compound) {
                                            return compound.get('Name').toLowerCase().indexOf(lower) === 0;
                                        });
                                    }
                                }
                            }
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
                                id: 'formulation-name-field',
                                xtype: 'hidden',
                                name: 'formulationname',
                                allowBlank: false
                            },{
                                xtype: 'combobox',
                                id: 'formulationlist',
                                emptyText: 'Formulation',
                                name: 'formulationrowid',
                                store: (function() {
                                    var remoteStore = Ext4.create('LABKEY.ext4.data.Store', {
                                        schemaName: 'Samples',
                                        queryName: 'Formulations',
                                        sort: 'RowId'
                                    });

                                    var localStore = Ext4.create('Ext.data.Store', {
                                        model: remoteStore.model
                                    });

                                    remoteStore.on('load', function(s) {
                                        localStore.add(s.getRange());
                                    }, this, {single: true});

                                    remoteStore.load();

                                    return localStore;
                                })(),
                                queryMode: 'local',
                                typeAhead: true,
                                validateOnBlur: false,
                                allowBlank: false,
                                displayField: 'Name',
                                valueField: 'RowId',
                                width: 120,
                                enableKeyEvents: true,
                                selectOnFocus: true,
                                listeners: {
                                    blur: function(cb) {
                                        // ensure valid value -- otherwise, clear
                                        if (isNaN(parseInt(cb.getValue()))) {
                                            cb.clearValue();
                                        }

                                        Ext4.defer(function() {
                                            cb.getStore().clearFilter();
                                        }, 150);
                                    },
                                    focus: function(cb) {
                                        cb.expand();
                                    },
                                    keyup: function(cb, evt) {
                                        var key = evt.button;

                                        if (key === 8 /* TAB */) {
                                            return;
                                        }

                                        var value = cb.getValue();

                                        cb.getStore().clearFilter();

                                        if (value && value.length > 0) {
                                            var lower = value.toLowerCase();
                                            cb.getStore().filterBy(function(formulation) {
                                                // see if partial match
                                                return formulation.get('Name').toLowerCase().indexOf(lower) === 0;
                                            });
                                        }
                                    },
                                    select: function(cb, records) {
                                        if (records.length > 0) {
                                            Ext4.getCmp('formulation-name-field').setValue(records[0].get('Name'));
                                        }
                                    }
                                }
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
                            id: 'dilfactorfield',
                            xtype: 'numberfield',
                            allowBlank: false,
                            fieldLabel: 'Dilution Factor',
                            hideTrigger: true,
                            name: 'dilution',
                            validateOnBlur: false,
                            value: 20
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
                            fieldLabel: 'Time (m)',
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

            this.on('standardchange', this.onStandardChange, this);

            this.on('startqc', function(runs) {
                //
                // clear the form fields
                //
                this.getQCForm().getForm().reset();
                Ext4.getCmp('submitactionbtn').setDisabled(true);

                if (runs.length > 0) {
                    //
                    // compute a valid date from the file path
                    //
                    var date = HPLCService.getDate(runs[0].get('filePath'));
                    if (date) {
                        Ext4.getCmp('rundate').setValue(date);
                    }
                }
            }, this);
        }
        return this.northpanel;
    },

    getInputsSelectionModel : function() {
        return this.westpanel.getComponent('inputsgrid').getSelectionModel();
    },

    getSelectedInputResults : function() {
        return this.getInputsSelectionModel().getSelection();
    },

    onStandardChange : function(standards) {
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
                var received = 0, expected = provisionalRuns.length, allContent = [],
                        contentMap = {};

                var done = function(content) {
                    received++;
                    allContent.push(content);
                    contentMap[content.fileName] = content;
                    if (received == expected) {
                        this.allContent = allContent;
                        this.contentMap = contentMap;
                        this.renderPlot(allContent);
                    }
                };

                for (var d=0; d < provisionalRuns.length; d++) {
                    var pr = provisionalRuns[d].get('expDataRun');
                    if (pr) {
                        HPLCService.FileContentCache(pr, done, this);
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

                run.name = values['formulationname'];

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
                    "RunDate": values['rundate'],
                    "Concentration": parseFloat(values['avgconc']),
                    "StandardDeviation": parseFloat(values['stddev'])
                };

                //
                // Set the run.dataRows
                //
                var dataRows = [];

                Ext4.each(this.qcresultview.getStore().getRange(), function(sample) {
                    if (sample.get('include')) {
                        dataRows.push({
                            Name: sample.get('name'),
                            Dilution: values['dilution'], // dilution factor is shared
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
                            buttons: Ext4.Msg.OK
                        });

                        this.westpanel.on('expand', function(west) {

                            Ext4.defer(function() {
                                this.getInputsSelectionModel().deselectAll();
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
                            buttons: Ext4.Msg.OK
                        });
                    },
                    scope: this
                });
            },
            scope: this
        });
    },

    getEast : function() {

        if (!this.eastpanel) {

            var view = Ext4.create('Ext.view.View', {
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
                        '<th></th>',
                        '</tr>',
                        '<tpl for=".">',
                        '<tr class="item" modelname="{name}">',
                        '<td>{name}</td>',
                        '<td><input value="{xleft}" placeholder="xleft" name="xleft" style="width: 40px;"/></td>',
                        '<td><input value="{xright}" placeholder="xright" name="xright" style="width: 40px;"/></td>',
                        '<td><input value="{base}" name="base" style="width: 40px;"/></td>',
                        '<td><input value="{include}" name="include" type="checkbox" {include:this.renderChecked}/></td>',
                        '<td><span name="response">{peakResponse:this.renderPeakResponse}</span></td>',
                        '<td><button title="copy">C</button></td>',
                        '</tr>',
                        '</tpl>',
                        '</table>',
                        {
                            renderChecked : function(checked) {
                                var ret = '';
                                if (checked === true) {
                                    ret = ' checked="checked" ';
                                }
                                return ret;
                            },
                            renderPeakResponse : function(response) {
                                return response.toFixed(3);
                            }
                        }
                ),
                listeners: {
                    viewready: function(v) { this.qcresultview = v; },
                    itemclick: this.onQCResultItemSelect,
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

                var _runs = [];
                for (var r=0; r < runs.length; r++) {
                    _runs.push(Ext4.clone(runs[r].data));
                }
                view.getStore().loadData(_runs);

            }, this);
            this.on('curvechange', function(xleft, xright) { this.renderPlot(this.allContent); }, this);
            this.on('rangechange', function(low, high) { this.renderPlot(this.allContent); }, this);
        }

        return this.eastpanel;
    },

    /**
     * Fires whenever a user selects any input for a give QC Result row. Primarily used to check if they clicked
     * 'C' meaning to copy that rows results as a convenience.
     */
    onQCResultItemSelect : function(view, model, z, a, evt) {
        if (evt.target && Ext4.isString(evt.target.tagName) && evt.target.tagName.toLowerCase() === "button") {
            Ext4.Msg.show({
                msg: 'Copy \'' + model.get('name') + '\' (xleft, right, base) to all other selections?',
                buttons: Ext4.Msg.YESNO,
                icon: Ext4.window.MessageBox.INFO,
                fn: function(b) {
                    if (b === 'yes') {
                        this.updateModels(function() {

                            var store = view.getStore();
                            var _model = store.getAt(store.findExact('name', model.get('name')));

                            var models = store.getRange(),
                                    n = _model.get('name'),
                                    xl = _model.get('xleft'),
                                    xr = _model.get('xright'),
                                    base = _model.get('base');

                            Ext4.each(models, function(m) {
                                if (m.get('name') !== n) {
                                    m.suspendEvents(true);
                                    m.set('xleft', xl);
                                    m.set('xright', xr);
                                    m.set('base', base);
                                    m.resumeEvents();
                                }
                            }, this);

                            this.updateModels(undefined, undefined, _model);

                        }, this);
                    }
                },
                scope: this
            });
        }
        else {
            // for some reason, focus is not maintained even after a user clicks an input
            Ext4.defer(function() { Ext4.get(evt.target).dom.focus(); }, 50);
        }
    },

    /**
     * The intent of this method is to gather all input sample results and compare them against the
     * selected standard curve.
     */
    runAnalysis : function() {

        this.updateModels(function() {
            var standardStore = LABKEY.hplc.StandardCreator.getStandardsStore(this.context);

            //
            // Determine the selected standard
            //
            var standardRowId = this.getQCForm().getValues()['standardrowid'];

            if (Ext4.isNumber(standardRowId)) {
                var idx = standardStore.findExact('Key', standardRowId);

                var dilutionFactor = Ext4.getCmp('dilfactorfield').getValue();

                if (!dilutionFactor) {
                    Ext4.Msg.alert('Dilution Factor', 'Please set a dilution factor.');
                    return;
                }

                var standardModel = standardStore.getAt(idx);
                var a = standardModel.get('b2');
                var b = standardModel.get('b1');
                var c = standardModel.get('b0');

                //
                // Get the set of qc results
                //
                var resultStore = this.qcresultview.getStore(), concs = [];
                var rcount = resultStore.getCount(), result;
                for (var r=0; r < rcount; r++) {
                    result = resultStore.getAt(r);

                    if (result.get('include') === true) {

                        var response = result.get('peakResponse');

                        // calculate concentration
                        var _c = c - response;

                        var x = LABKEY.hplc.Stats.getQuadratic(a, b, _c);
                        var nonDiluted = x[0] * dilutionFactor; // account for dilution ratio
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
                Ext4.Msg.alert('Choose a standard', 'Please select a standard to base these samples on. If you have not yet defined any standards click "Define Standards".');
            }
        }, this);
    },

    bindCalc : function(view, sample) {
        var modelname = sample.get('name');

        if (modelname) {
            this.highlighted = sample.get('name') + '.'  + sample.get('fileExt');
            this.renderPlot(this.allContent);
        }
    },

    updateModels : function(callback, scope, toCopy) {
        //
        // Iterate over all QC Results updating there peakResponse based on given values for that row/result
        //
        if (Ext4.isDefined(this.qcresultview)) {
            var view = this.qcresultview;
            var store = view.getStore();
            var models = store.getRange();

            var xleft, xright, base, include, response;

            Ext4.each(models, function(model) {

                if (Ext4.isDefined(toCopy)) {
                    xleft = toCopy.get('xleft');
                    xright = toCopy.get('xright');
                    base = toCopy.get('base');
                }
                else {
                    xleft = +this._getNodeValue(view, model, 'input[name="xleft"]');
                    xright = +this._getNodeValue(view, model, 'input[name="xright"]');
                    base = +this._getNodeValue(view, model, 'input[name="base"]');
                }

                include = this._getNode(view, model, 'input[name="include"]');
                response = this._getNode(view, model, 'span[name="response"]');

                var fileContent = this.contentMap[model.get('name') + '.' + model.get('fileExt')];
                var data = HPLCService.getData(fileContent, xleft, xright, false);
                var aucPeak = LABKEY.hplc.Stats.getAUC(data, base);
                response.update(+aucPeak.auc.toFixed(3));

                model.suspendEvents(true);
                model.set('xleft', xleft);
                model.set('xright', xright);
                model.set('base', base);
                model.set('auc', aucPeak.auc);
                model.set('peakResponse', aucPeak.auc);
                model.set('peakMax', aucPeak.peakMax);
                model.set('include', include.dom.checked);
                model.resumeEvents();
            }, this);

            if (Ext4.isFunction(callback)) {
                callback.call(scope);
            }
        }
        else {
            console.error('qcresultview not initialized before update.');
        }
    },

    _getNode : function(view, model, selector) {
        return Ext4.get(Ext4.DomQuery.select(selector, view.getNodeByRecord(model))[0]);
    },

    _getNodeValue : function(view, model, selector) {
        return this._getNode(view, model, selector).getValue();
    },

    renderPlot : function(contents) {

        var spectrumPlot = Ext4.getCmp('plotarea');
        spectrumPlot.leftRight = [Ext4.getCmp('aucleft').getValue(), Ext4.getCmp('aucright').getValue()];
        spectrumPlot.lowHigh = [Ext4.getCmp('mvrangelow').getValue(), Ext4.getCmp('mvrangehigh').getValue()];
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
