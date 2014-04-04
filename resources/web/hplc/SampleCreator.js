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
            east: -20
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
                width: 230,
                title: 'Available Inputs',
                items: [{
                    xtype: 'grid',
                    autoScroll: true,
                    store: {
                        xtype: 'store',
                        model: 'LABKEY.hplc.ProvisionalRun',
                        data: this.context.rawInputs
                    },
                    columns: [
                        {text: 'Inputs', dataIndex: 'name', flex: 1}
                    ],
                    selModel: {
                        selType: 'checkboxmodel',
                        mode: 'MULTI'
                    },
                    dockedItems: [{
                        xtype: 'toolbar',
                        dock: 'top',
                        items: [{
                            id: 'startqcbtn',
                            text: 'Start QC',
                            disabled: true,
                            handler: function(b) {
                                this.fireEvent('startqc', b.up('grid').getSelectionModel().getSelection());
                            },
                            scope: this
                        },{
                            text: 'Define Standards',
                            handler: function() { this.fireEvent('requeststandards'); },
                            scope: this
                        }]
                    }],
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
                scope: this
            });

            this.on('startqc', function() { this.westpanel.collapse(); }, this);
        }

        return this.westpanel;
    },

    getNorth : function() {

        if (!this.northpanel) {
            this.northpanel = Ext4.create('Ext.panel.Panel', {
                region: 'north',
                height: 200,
                layout: 'column',
                items: [{
                    xtype: 'panel',
                    columnWidth: 0.5,
                    border: false, frame: false,
                    items: [{
                        itemId: 'sampleform',
                        xtype: 'form',
                        border: false, frame: false,
                        padding: '15 10',
                        items: [{
                            xtype: 'textfield',
                            id: 'samplename',
                            fieldLabel: 'Sample Name',
                            width: 400
                        },{
                            xtype: 'combobox',
                            id: 'standardslist',
                            fieldLabel: 'Standard',
                            store: LABKEY.hplc.StandardCreator.getStandardsStore(this.context),
                            displayField: 'Name',
                            valueField: 'Key',
                            editable: false,
                            width: 400
                        },{
                            xtype: 'fieldcontainer',
                            fieldLabel: 'Curve Area',
                            layout: 'hbox',
                            width: 400,
                            items: [{
                                id: 'aucleft',
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
                            width: 400,
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
//                    },{
//                        xtype: 'button',
//                        text: 'Standard Curve',
//                        margin: '0 10',
//                        handler: this.displayStandardCurve,
//                        scope: this
//                    },{
//                        xtype: 'button',
//                        text: 'AUC',
//                        margin: '0 10',
//                        handler: function() {
//                            var left = Ext4.getCmp('aucleft').getValue();
//                            var right = Ext4.getCmp('aucright').getValue();
//                            var data = LABKEY.hplc.QualityControl.getData(this.datacontent, left, right);
//                            var aucPeak = LABKEY.hplc.QualityControl.getAUC(data);
//                        },
//                        scope: this
//                    }]
                },{
                    xtype: 'box',
                    id: 'stdcurveplot',
                    autoEl: {
                        tag: 'div'
                    }
                }]
            });

            //
            // Update the Form
            //
//            this.on('inputchange', function(model) {
//
//                var form = this.northpanel.getComponent('sampleform');
//                if (form) {
//                    form.getForm().setValues({
//                        samplename: model.get('name'),
//                        standardslist: ''
//                    });
//                }
//            }, this);

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
        }
        return this.northpanel;
    },

    getCenter : function() {

        if (!this.centerpanel) {
            this.centerpanel = Ext4.create('Ext.panel.Panel', {
                region: 'center',
                border: false, frame: false,
                items: [{
                    xtype: 'box',
                    id: 'plotarea',
                    height: '100%',
                    autoEl: {
                        tag: 'div'
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
                                        var aucPeak = LABKEY.hplc.QualityControl.getAUC(data, 0);
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
                                                console.log('conc:', xpos, xneg);
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
                                        var aucPeak = LABKEY.hplc.QualityControl.getAUC(data, 0);
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
                                                console.log('conc:', xpos, xneg);
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

    getEast : function() {

        if (!this.eastpanel) {
            this.eastpanel = Ext4.create('Ext.panel.Panel', {
                title: 'QC Results',
                region: 'east',
                autoScroll: true,
                width: 300,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                items: []
            });

            this.on('startqc', function(provisionalRuns) {
                //
                // clear the current context
                //
                this.eastpanel.removeAll();

                for (var p=0; p < provisionalRuns.length; p++) {
                    this.eastpanel.add(this.getQCPane(provisionalRuns[p]));
                }
            }, this);

            this.on('curvechange', function(xleft, xright) { this.renderPlot(this.allContent); }, this);

            this.on('rangechange', function(low, high) { this.renderPlot(this.allContent); }, this);
        }

        return this.eastpanel;
    },

    renderPlot : function(contents) {

        //
        // render the plot
        //
        var layers = [];
        var colors = ['#00FE00', '#0100FE', '#FC01FC', '#ff0000'], c=0;
        var xleft = Ext4.getCmp('aucleft').getValue();
        var xright = Ext4.getCmp('aucright').getValue();
        var low = Ext4.getCmp('mvrangelow').getValue();
        var high = Ext4.getCmp('mvrangehigh').getValue();

        if (!xleft) {
            xleft = 0;
        }
        if (!xright) {
            xright = 0;
        }

        for (var i=0; i < contents.length; i++) {
            //
            // create point layer
            //
            var pointLayer = new LABKEY.vis.Layer({
                data: LABKEY.hplc.QualityControl.getData(contents[i], xleft, xright, 2),
                aes: {
                    x: function(r) { return r[0]; },
                    y: function(r) { return r[1]; }
                },
                geom: new LABKEY.vis.Geom.Path({
                    color: colors[c%colors.length]
                })
            });
            c++;

            layers.push(pointLayer);
        }

        var el = Ext4.get('plotarea');
        el.update('');
        var plotbox = el.getBox();

        var width = plotbox.width;
        var height = plotbox.height - 30;

        var plot = new LABKEY.vis.Plot({
            renderTo: 'plotarea',
            rendererType: 'd3',
            width: width,
            height: height,
            layers: layers,
            legendPos: 'none',
            labels: {
                x: {value: 'Time (m)'},
                y: {value: 'mV'}
            },
            scales: {
                x: { domain: [xleft, xright] },
                y: { domain: [low, high] }
            }
        });

        plot.render();
    },

    displayStandardCurve : function() {
        var el = Ext4.get('stdcurveplot');
        el.update('');

        var grid = this.getWest().getComponent('standardgrid');
        if (grid) {
            var standards = grid.getSelectionModel().getSelection();
            for (var i=0; i < standards.length; i++) {

            }
        }
    }
});
