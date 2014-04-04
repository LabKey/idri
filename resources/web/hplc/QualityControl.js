/*
 * Copyright (c) 2014 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('LABKEY.hplc.QualityControl', {
    extend: 'Ext.panel.Panel',

    layout: 'card',

    minWidth: 650,

    height: 700,

    statics: {
        Cache : {},
        FileContentCache : function(model, callback, scope) {
            var path = model['pipelinePath'];

            var content = LABKEY.hplc.QualityControl.Cache[path];
            if (content) {
                callback.call(scope || this, content);
            }
            else {
                model.getContent({
                    format: 'jsonTSV',
                    success: function(c) {
                        LABKEY.hplc.QualityControl.Cache[path] = c;
                        callback.call(scope || this, c);
                    },
                    failure: function(error) {
                        alert('Failed to Load File Contents');
                    }
                });
            }
        },
//        getAUC : function(data, callback, scope, configs) {
        getAUC : function(data, ybase) {

            //
            // Calculate AUC
            //
            var sum = 0.0, area = 0.0, peakMax = 0.0;
            var x1, x0, y1, y0, i;

            for (i=1; i < data.length; i++) {
                x0 = data[i-1][0] * 60;
                x1 = data[i][0] * 60;
                y0 = data[i-1][1] - ybase;
                y1 = data[i][1] - ybase;
                peakMax = Math.max(y0, peakMax);
                area = ((y1 + y0) / 2) * (x1 - x0);
                sum += area;
            }

            return {
                'auc': sum,
                'peakMax': peakMax
            };
        },
        getData : function(datacontent, xleft, xright, mod) {
            var data = [];
            if (datacontent) {
                var _data = datacontent.sheets[0].data;
                _data.shift(); // get rid of column headers
                var newData = [];

                //
                // check modulus
                //
                if (!mod || !Ext4.isNumber(mod)) {

                    //
                    // check for bounds
                    //
                    if (xleft == 0 && xright == 0) {
                        for (var d=0; d < _data.length; d++) {
                            var xy = _data[d][0].split(' ');
                            xy[0] = parseFloat(xy[0]);
                            xy[1] = parseFloat(xy[1]);
                            newData.push(xy);
                        }
                    }
                    else {
                        //
                        // using bounds
                        //
                        for (var d=0; d < _data.length; d++) {
                            var xy = _data[d][0].split(' ');
                            xy[0] = parseFloat(xy[0]);
                            xy[1] = parseFloat(xy[1]);
                            if (xy[0] > xleft && xy[0] < xright)
                                newData.push(xy);
                        }
                    }
                }
                else {
                    //
                    // using modulus
                    //

                    //
                    // check for bounds
                    //
                    if (xleft == 0 && xright == 0) {
                        for (var d=0; d < _data.length; d++) {
                            if (d%mod == 0) {
                                var xy = _data[d][0].split(' ');
                                xy[0] = parseFloat(xy[0]);
                                xy[1] = parseFloat(xy[1]);
                                newData.push(xy);
                            }
                        }
                    }
                    else {
                        //
                        // using bounds
                        //
                        for (var d=0; d < _data.length; d++) {
                            if (d%mod == 0) {
                                var xy = _data[d][0].split(' ');
                                xy[0] = parseFloat(xy[0]);
                                xy[1] = parseFloat(xy[1]);
                                if (xy[0] > xleft && xy[0] < xright)
                                    newData.push(xy);
                            }
                        }
                    }
                }

                data = newData;
            }
            return data;
        }
    },

    initComponent : function() {

        this.items = [];

        this.callParent();

        this.getRunContext(function(context) {
            this.loadContext(context);
        }, this);
    },

    loadContext : function(context) {
        this.context = context;
        this.add(this.getSampleCreator());
    },

    getStandardCreator : function() {
        if (!this.stdCreator) {
            this.stdCreator = Ext4.create('LABKEY.hplc.StandardCreator', {
                context: this.context,
                listeners: {
                    complete: function() {
                        this.getLayout().setActiveItem(this.getSampleCreator());
                    },
                    scope: this
                },
                scope: this
            });
        }
        return this.stdCreator;
    },

    getSampleCreator : function() {
        if (!this.sampleCreator) {
            this.sampleCreator = Ext4.create('LABKEY.hplc.SampleCreator', {
                context: this.context,
                listeners: {
                    requeststandards: function() {
                        this.getLayout().setActiveItem(this.getStandardCreator());
                    },
                    scope: this
                },
                scope: this
            });
        }
        return this.sampleCreator;
    },

    getListingStore : function() {
        if (!this.listingStore) {
            this.listingStore = Ext4.create('Ext.data.Store', {
                model: 'LABKEY.hplc.ProvisionalRun'
            });
        }
        return this.listingStore;
    },

    getRunContext : function(callback, scope) {
        LABKEY.DataRegion.getSelected({
            selectionKey: LABKEY.ActionURL.getParameter('selectionKey'),
            success: function(runSelection) {

                // clear the active context
                this.Context = {
                    RunId: runSelection.selected[0]
                };

                var me = this;

                var pp = function() {
                    if (me.Context.pipe && me.Context.AssayDefinition && me.Context.RunDefinition) {

                        //
                        // Load the expected batch/run
                        //
                        LABKEY.Experiment.loadBatch({
                            assayId: me.Context.AssayDefinition.id,
                            batchId: me.Context.RunDefinition.Batch.value,
                            success: function(RunGroup) {
                                me.Context.batch = RunGroup;

                                //
                                // Transform select rows result into a structure the Ext store can accept
                                //
                                var d = [];
                                var runs = RunGroup.runs, runIdentifier, run;

                                //
                                // Find the associated run
                                //
                                for (var r=0; r < runs.length; r++) {
                                    if (runs[r].id == me.Context.RunId) {
                                        runIdentifier = runs[r].name;
                                        run = runs[r];
                                        break;
                                    }
                                }

                                for (r=0; r < run.dataRows.length; r++) {
                                    var name = run.dataRows[r]['Name'].split('.');
                                    var fileExt = name[1];
                                    name = name[0];
                                    var filePath = "";
                                    var dataFile = run.dataRows[r]['DataFile'];
                                    filePath = me.Context.pipe + "/" + runIdentifier + "/" + dataFile;

                                    //
                                    // Link the associated LABKEY.Exp.Data object (the data file)
                                    //
                                    var ExpDataRun;
                                    for (var i=0; i < run.dataInputs.length; i++) {
                                        if (run.dataInputs[i].name == dataFile) {
                                            ExpDataRun = run.dataInputs[i];
                                        }
                                    }

                                    d.push({
                                        name: name,
                                        fileExt: fileExt,
                                        filePath: filePath,
                                        expDataRun: ExpDataRun
                                    });
                                }

                                me.Context.rawInputs = d;



                                callback.call(scope || me, me.Context);
                            }
                        });
                    }
                };

                //
                // Get the associated HPLC configuration
                //
                Ext4.Ajax.request({
                    url: LABKEY.ActionURL.buildURL('idri', 'getHPLCPipelineContainer.api'),
                    success: function(response) {
                        var data = Ext4.decode(response.responseText);
                        me.Context.pipe = data.webDavURL;
                        pp();
                    },
                    scope: this
                });

                //
                // Get the associated Assay information
                //
                LABKEY.Assay.getByType({
                    type: 'Provisional HPLC',
                    success: function(defs) {
                        me.Context.AssayDefinition = defs[0];
                        pp();
                    },
                    scope: this
                });

                //
                // Get the associated Batch information
                //
                LABKEY.Query.selectRows({
                    schemaName: LABKEY.ActionURL.getParameter('schemaName'),
                    queryName: LABKEY.ActionURL.getParameter('queryName'),
                    requiredVersion: 13.2,
                    filterArray: [
                        LABKEY.Filter.create('RowId', this.Context.RunId)
                    ],
                    success: function(data) {
                        me.Context.RunDefinition = data.rows[0]; // LABKEY.Query.Row
                        pp();
                    },
                    scope: this
                });
            },
            scope: this
        });
    }
});
