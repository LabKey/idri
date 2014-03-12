Ext4.define('LABKEY.hplc.StandardCreator', {

    extend: 'Ext.panel.Panel',

    title: 'Define Standards',

    layout: 'border',

    border: false, frame: false,

    statics: {
        standardsStore : undefined,
        getStandardsStore : function(context) {
            if (!LABKEY.hplc.StandardCreator.standardsStore) {
                LABKEY.hplc.StandardCreator.standardsStore = Ext4.create('LABKEY.ext4.data.Store', {
//                   model: 'LABKEY.hplc.Standard',
                    schemaName: 'lists',
                    queryName: 'HPLCStandard',
                    filterArray: [
                        LABKEY.Filter.create('provisionalRun', context.RunId)
                    ]
                });
                LABKEY.hplc.StandardCreator.standardsStore.load();
            }
            return LABKEY.hplc.StandardCreator.standardsStore;
        },
        getSourcesStore : function(doFilter, standardKey) {

            if (!Ext4.isNumber(standardKey)) {
                standardKey = -1;
            }

            var filters = [ LABKEY.Filter.create('standard/Key', standardKey) ];

            if (!LABKEY.hplc.StandardCreator.sourcesStore) {
                LABKEY.hplc.StandardCreator.sourcesStore = Ext4.create('LABKEY.ext4.data.Store', {
//                   model: 'LABKEY.hplc.StandardSource',
                    schemaName: 'lists',
                    queryName: 'HPLCStandardSource'
                });
            }

            if (doFilter) {
                LABKEY.hplc.StandardCreator.sourcesStore.filterArray = filters;
                LABKEY.hplc.StandardCreator.sourcesStore.load();
            }
            return LABKEY.hplc.StandardCreator.sourcesStore;
        }
    },

    initComponent : function() {

        SC = this;
        this.loadContext(this.context);

        this.items = [
            this.getInputs(), // west
            this.getDefinitionForm(), // east
            this.getStandardsDisplay() // center
        ];

        this.buttons = [{
            text: 'Return to Samples',
            handler: function() {
                this.clearCalibrationCurve();
                this.clearStandardViewer();
                this.fireEvent('complete');
            },
            scope: this
        }];

        this.callParent();

        this.on('selectsource', this.onSelectSource, this);
        this.on('standardsave', this.onStandardSave, this);

        this.pTask = new Ext4.util.DelayedTask(function() {
            if (Ext4.isArray(this.definitions)) {
                this.renderCalibrationStandards(this.definitions);
            }
        }, this);
    },

    plotTask : function() {
        this.pTask.delay(500);
    },

    loadContext : function(context) {
        this.rawInputs = context.rawInputs;
    },

    getInputs : function() {

        return {
            xtype: 'panel',
            itemId: 'west',
            title: 'All Inputs',
            region: 'west',
            width: 200,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            items: [{
                xtype: 'form',
                height: 50,
                html: 'Choose a Standard to Define',
                border: false, frame: false
            },{
                id: 'inputsgrid',
                xtype: 'grid',
                height: 400,
                store: {
                    xtype: 'store',
                    model: 'LABKEY.hplc.StandardSource',
                    data: this.rawInputs
                },
                selModel: {
                    selType: 'checkboxmodel',
                    mode: 'MULTI'
                },
                columns: [{text: 'Inputs', dataIndex: 'name', flex: 1}],
                hideHeaders: true,

                // listeners
                listeners: {
                    viewready : function(g) {
                        g.getStore().filter([{
                            filterFn: function(item) {
                                return item.get('name').indexOf('PRE_') == -1 && item.get('name').indexOf('POST_') == -1;
                            }
                        },{
                            filterFn: function(item) {
                                return item.get('name').indexOf('BLANK') == -1;
                            }
                        },{
                            filterFn: function(item) {
                                return item.get('name').indexOf('QF') == -1;
                            }
                        },{
                            filterFn: function(item) {
                                return item.get('name').indexOf('QD') == -1;
                            }
                        }]);
                    },
                    selectionchange: function(g, selects) {
                        this.fireEvent('selectsource', selects);
                    },
                    scope: this
                },
                scope: this
            },{
                xtype: 'panel',
                height: 50,
                html: 'Standards Previously Defined',
                border: false, frame: false
            },{
                xtype: 'grid',
                itemId: 'standardsgrid',
                height: 200,
                store: LABKEY.hplc.StandardCreator.getStandardsStore(this.context),
                columns: [
                    {text: 'Inputs', dataIndex: 'Name', flex: 3}
                ],
                hideHeaders: true,
                emptyText: 'No Standards Defined',
                listeners: {
                    select: this.onLoadStandard,
                    scope: this
                },
                scope: this
            }]
        };
    },

    /**
     * Called when a used clicks to select a pre-defiend standard
     * @param grid
     * @param standard
     */
    onLoadStandard : function(grid, standard) {

        //
        // Clear calibration curve
        //
        this.clearCalibrationCurve();

        //
        // Clear the selected sources
        //
        var sourcesGrid = this.getComponent('west').getComponent('inputsgrid');
        sourcesGrid.getSelectionModel().deselectAll();

        //
        // Load the set of standard 'sources'
        //
        if (standard) {
            var store = LABKEY.hplc.StandardCreator.getSourcesStore(true, standard.get('Key'));
            store.on('load', function(s) {
                // merge the 'sources' data to the inputs data
                var inputsStore = sourcesGrid.getStore();
                var sources = s.getRange(), i = 0, r, s, sels = [];
                for (; i < sources.length; i++) {
                    s = sources[i];
                    r = inputsStore.findExact('name', s.get('name'));
                    if (r > -1) {;
                        r = inputsStore.getAt(r);
                        r.set('auc', s.get('auc'));
                        r.set('concentration', s.get('concentration'));
                        r.set('peakMax', s.get('peakMax'));
                        r.set('xleft', s.get('xleft'));
                        r.set('xright', s.get('xright'));
                        r.set('base', s.get('base'));
                        sels.push(r);
                    }
                }

                sourcesGrid.getSelectionModel().select(sels);
                this.on('standardsrendered', this.generateCalibrationCurve, this, {single: true});

                //
                // Update definition form
                //
                Ext4.getCmp('standardname').setValue(standard.get('Name'));
                Ext4.getCmp('isupdate').setValue(true);
                Ext4.getCmp('deletestandardbtn').show();
            }, this, {single: true});
        }
    },

    /**
     * Called when a use clicks to select a standard source
     * @param grid
     * @param source
     */
    onSelectSource : function(grid, source) {
        var standardsGrid = this.getComponent('west').getComponent('standardsgrid');
        standardsGrid.getSelectionModel().deselectAll();

        this.clearCalibrationCurve();
        Ext4.getCmp('deletestandardbtn').hide();
    },

    /**
     * Fired when a user saves a standard
     */
    onStandardSave : function() {
        LABKEY.hplc.StandardCreator.getStandardsStore(this.context).load();
    },

    getDefinitionForm : function() {

        var view = Ext4.create('Ext.view.View', {
            id: 'definitionformview',
            store: LABKEY.hplc.StandardCreator.getSourcesStore(),
            itemSelector: 'tr.item',
            autoScroll: true,
            height: 305,
            tpl: new Ext4.XTemplate(
                '<table style="width: 100%;">',
                    '<tr>',
                        '<th style="text-align: left;">Name</th>',
                        '<th style="text-align: left;">Conc</th>',
                        '<th style="text-align: left;">Left</th>',
                        '<th style="text-align: left;">Right</th>',
                        '<th style="text-align: left;">Base</th>',
                    '</tr>',
                    '<tpl for=".">',
                        '<tr class="item" modelname="{name}">',
                            '<td>{name}</td>',
                            '<td><input value="{concentration}" placeholder="µg/ml" name="concentration" style="width: 50px;"/></td>',
                            '<td><input value="{xleft}" placeholder="xleft" name="xleft" style="width: 40px;"/></td>',
                            '<td><input value="{xright}" placeholder="xright" name="xright" style="width: 40px;"/></td>',
                            '<td><input value="{base}" name="base" style="width: 40px;"/></td>',
                        '</tr>',
                    '</tpl>',
                '</table>'
            ),
            listeners: {
                select: function(view, source) {
                    this.highlighted = source.get('name') + '.' + source.get('fileExt');
                    this.plotTask();
                    this.on('standardsrendered', function() { this.highlighted = undefined; }, this, {single: true});
                },
                scope: this
            },
            scope: this
        });

        this.on('selectsource', function(selects) { view.getStore().loadData(selects); }, this);

        return {
            xtype: 'panel',
            title: 'Standard Definitions',
            region: 'east',
            width: 400,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            items: [{
                xtype: 'box',
                id: 'stdcurveplot',
                height: 250,
                autoEl: {
                    tag: 'div'
                }
            },{
                id: 'stddefform',
                xtype: 'form',
                width: '100%',
                border: false,
                frame: false,
                padding: '5 0 0 3',
                defaults: {
                    labelSeparator: ''
                },
                items: [{
                    id: 'standardname',
                    xtype: 'textfield',
                    name: 'standardname',
                    fieldLabel: 'Standard Name'
                },{
                    id: 'isupdate',
                    xtype: 'hidden',
                    name: 'isupdate'
                }]
            },view],
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'top',
                items: [{
                    text: 'Calibration Curve',
                    handler : this.generateCalibrationCurve,
                    scope: this
                },{
                    text: 'Save',
                    handler: this.saveStandard,
                    scope: this
                },{
                    id: 'deletestandardbtn',
                    text: 'Delete',
                    hidden: true,
                    handler: this.onRequestDelete,
                    scope: this
                },{
                    text: 'Clear Highlight',
                    handler: function() {
                        this.highlighted = undefined;
                        this.plotTask();
                    },
                    scope: this
                }]
            }]
        }
    },

    saveStandard : function() {
        var store = Ext4.getCmp('definitionformview').getStore();

        var standardRow = {
            'Name': Ext4.getCmp('standardname').getValue(),
            'provisionalRun': parseInt(this.context.RunId)
        };

        //
        // First save the standard information
        // Lists.HPLCStandard
        //
        LABKEY.Query.saveRows({
            commands: [{
                command: 'insert',
                schemaName: 'lists',
                queryName: 'HPLCStandard',
                rows: [standardRow]
            }],
            success: function(data) {

                //
                // Second save the standard sources
                //
                var sourceRows = [];
                var sources = store.getRange(), s;

                for (var i=0; i < sources.length; i++) {
                    s = sources[i];
                    sourceRows.push({
                        'standard': data.result[0].rows[0].Key,
                        'name': s.get('name'),
                        'concentration': s.get('concentration'),
                        'auc': s.get('auc'),
                        'peakMax': s.get('peakMax'),
                        'xleft': s.get('xleft'),
                        'xright': s.get('xright'),
                        'fileName': s.get('fileName') || (s.get('name') + '.' + s.get('fileExt')),
                        'filePath': s.get('filePath'),
                        'fileExt': s.get('fileExt')
                    });
                }

                LABKEY.Query.saveRows({
                    commands: [{
                        command: 'insert',
                        schemaName: 'lists',
                        queryName: 'HPLCStandardSource',
                        rows: sourceRows
                    }],
                    success: function(data) { this.fireEvent('standardsave'); },
                    failure: function() {
                        alert('Failed to Save HPLCStandardSource');
                    },
                    scope: this
                });
            },
            failure: function() {
                alert('Failed to Save HPLCStandard: ' + standardRow['Name']);
            },
            scope: this
        });
    },

    onRequestDelete : function() {
        Ext4.Msg.show({
            title: 'Delete Standard Definition',
            modal: true,
            msg: 'Are you sure you want to delete this standard?',
            icon: Ext4.window.MessageBox.INFO,
            buttons: Ext4.Msg.OKCANCEL,
            fn : function(btn) {
                if (btn === "ok") {
                    this.deleteStandard();
                }
            }
        });
    },

    deleteStandard : function(key) {

    },

    getStandardsDisplay : function() {

        var panel = Ext4.create('Ext.panel.Panel', {
            xtype: 'panel',
            title: 'Standards Viewer',
            region: 'center',
            items: [{
                xtype: 'form',
                border: false, frame: false,
                items: [{
                    xtype: 'fieldcontainer',
                    fieldLabel: 'Bounds',
                    layout: 'hbox',
                    items: [{
                        xtype: 'numberfield',
                        width: 75,
                        id: 'calibrateleft',
                        emptyText: 'Left',
                        hideTrigger: true,
                        listeners: {
                            change: this.plotTask,
                            scope: this
                        }
                    },{
                        xtype: 'splitter'
                    },{
                        xtype: 'numberfield',
                        width: 75,
                        id: 'calibrateright',
                        emptyText: 'Right',
                        hideTrigger: true,
                        listeners: {
                            change: this.plotTask,
                            scope: this
                        }
                    },{
                        xtype: 'splitter'
                    },{
                        xtype: 'numberfield',
                        width: 75,
                        emptyText: 'Bottom',
                        hideTrigger: true
                    },{
                        xtype: 'splitter'
                    },{
                        xtype: 'numberfield',
                        width: 75,
                        emptyText: 'Top',
                        hideTrigger: true
                    }],
                    scope: this
                }]
            },{
                xtype: 'box',
                id: 'stdplot',
                height: '100%',
                autoEl: {
                    tag: 'div'
                }
            }]
        });

        this.on('selectsource', this.renderCalibrationStandards, this);

        return panel;
    },

    requestContent : function(def, callback, scope) {
        var sd = def.get('expDataRun');
        if (sd) {
            LABKEY.hplc.QualityControl.FileContentCache(sd, callback, scope);
        }
        else {
            console.error('failed to load expDataRun from definition.');
        }
    },

    renderCalibrationStandards : function(definitions) {

        this.definitions = definitions;
        var expected = definitions.length, recieved = 0;
        var contentMap = {};

        var done = function(content) {
            recieved++;
            contentMap[content.fileName] = content;
            if (recieved == expected) {
                //
                // render the plot
                //
                var layers = [];
                var colorSet = ['#00FE00', '#0100FE', '#FC01FC', '#ff0000'], c=0;
                var useHighlight = (this.highlighted ? true : false), isHighlight = false;
                var xleft = Ext4.getCmp('calibrateleft').getValue();
                var xright = Ext4.getCmp('calibrateright').getValue();

                if (!xleft) {
                    xleft = 0;
                }
                if (!xright) {
                    xright = 0;
                }

                var hold = null;
                for (var filename in contentMap) {
                    if (contentMap.hasOwnProperty(filename)) {
                        //
                        // create point layer
                        //
                        isHighlight = (this.highlighted === filename);
                        var pointLayer = new LABKEY.vis.Layer({
                            data: LABKEY.hplc.QualityControl.getData(contentMap[filename], xleft, xright, 3),
                            aes: {
                                x: function(r) { return r[0]; },
                                y: function(r) { return r[1]; }
                            },
                            geom: new LABKEY.vis.Geom.Path({
                                color: useHighlight ? (isHighlight ? colorSet[c%colorSet.length] : '#A09C9C') : colorSet[c%colorSet.length]
                            })
                        });
                        c++;

                        if (isHighlight) {
                            hold = pointLayer;
                        }
                        else {
                            layers.push(pointLayer);
                        }
                    }
                }

                if (hold) {
                    layers.push(hold);
                }

                if (!this.plotbox) {
                    this.plotbox = Ext4.get('stdplot').getBox();
                }
                this.clearStandardViewer();

                var plot = new LABKEY.vis.Plot({
                    renderTo: 'stdplot',
                    rendererType: 'd3',
                    width: this.plotbox.width,
                    height: this.plotbox.height - 30,  // offset due to top pane
                    margins: {top: 10},
                    clipRect: true,
                    layers: layers,
                    labels: {
                        x: {value: 'Time (m)'},
                        y: {value: 'mV'}
                    },
                    scales: {
                        y: { domain: [0, null] }
                    },
                    legendPos: 'none'
                });

                plot.render();
                this.fireEvent('standardsrendered');
            }
        };

        for (var d=0; d < definitions.length; d++) {
            this.requestContent(definitions[d], done, this);
        }
    },

    generateCalibrationCurve : function() {
        var itemNodes = Ext4.DomQuery.select('.item');
        var store = Ext4.getCmp('definitionformview').getStore();

        var contentMap = {};
        var expected = store.getCount(), recieved = 0;

        var me = this;

        var done = function(content) {
            recieved++;
            contentMap[content.fileName] = content;
            if (expected == recieved) {
                //
                // have content
                //
                for (var n=0; n < itemNodes.length; n++) {
                    var node = Ext4.get(itemNodes[n]);
                    var modelname = node.getAttribute('modelname');
                    var idx = store.findExact('name', modelname);
                    if (idx > -1) {
                        var model = store.getAt(idx);
                        var conc = parseFloat(Ext4.get(node.select('input[name=concentration').elements[0]).getValue());
                        var xleft = parseFloat(Ext4.get(node.select('input[name=xleft').elements[0]).getValue());
                        var xright = parseFloat(Ext4.get(node.select('input[name=xright').elements[0]).getValue());
                        model.set('concentration', conc);
                        model.set('xleft', xleft);
                        model.set('xright', xright);
                    }
                }

                var finish = function() {
                    var data = []; // final array of points containing conc, peak area
                    for (var i=0; i < store.getCount(); i++) {
                        var rec = store.getAt(i);
                        data.push([rec.get('concentration'), rec.get('auc')]);
                    }

                    var doRegression = function(x, terms) {
                        var a = 0, exp = 0, term;
                        for (var i = 0; i < terms.length;i++) {
                            term = terms[i];
                            a += term * Math.pow(x, exp);
                            exp++;
                        }
                        return a;
                    };

                    var stdError = function(data, terms) {
                        var  r = 0;
                        var  n = data.length;
                        if (n > 2) {
                            var a = 0, xy;
                            for (var i = 0;i < data.length;i++) {
                                xy = data[i];
                                a += Math.pow((doRegression(xy[0], terms) - xy[1]), 2);
                            }
                            r = Math.sqrt(a / (n - 2));
                        }
                        return r;
                    };

                    var R = regression('polynomial', data, 2);
                    var eq = R.equation;
                    R.stdError = stdError(data, eq);

                    var getY = function(x) { return (eq[2] * Math.pow(x, 2)) + (eq[1] * x) + eq[0]; };

                    var pointLayer = new LABKEY.vis.Layer({
                        data: data,
                        aes: {
                            x: function(r) { return r[0]; },
                            y: function(r) { return r[1]; }
                        },
                        geom: new LABKEY.vis.Geom.Point({
                            size: 2,
                            color: '#FF0000'
                        })
                    });

                    var pathLayer = new LABKEY.vis.Layer({
                        geom: new LABKEY.vis.Geom.Path({
                            color: '#0000FF'
                        }),
                        data: LABKEY.vis.Stat.fn(getY, 100, 1, 100),
                        aes: {x: 'x', y: 'y'}
                    });

                    me.clearCalibrationCurve();

                    var plot = new LABKEY.vis.Plot({
                        renderTo: 'stdcurveplot',
                        rendererType: 'd3',
                        width: 400,
                        height: 250,
                        clipRect: false,
                        labels: {
                            main: {value: R.string},
                            x: {value: 'Concentration (µg/ml)'},
                            y: {value: 'Response (mV.s)'}
                        },
                        layers: [ pointLayer, pathLayer ],
                        legendPos: 'none'
                    });

                    plot.render();
                };

                //
                // All models are updated
                //
                for (n=0; n < store.getCount(); n++) {
                    var model = store.getAt(n);
                    var fname = model.get('expDataRun').name;
                    var data = LABKEY.hplc.QualityControl.getData(contentMap[fname], model.get('xleft'), model.get('xright'));
                    var aucPeak = LABKEY.hplc.QualityControl.getAUC(data, 0);
                    model.set('auc', aucPeak.auc);
                    model.set('peakMax', aucPeak.peakMax);
                }
                finish();
            }
        };

        for (var d=0; d < store.getCount(); d++) {
            this.requestContent(store.getAt(d), done, this);
        }
    },

    clearCalibrationCurve : function() {
        var el = Ext4.get('stdcurveplot');
        el.update('');
    },

    clearStandardViewer : function() {
        Ext4.get('stdplot').update('');
    }
});
