/*
 * Copyright (c) 2012 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('HPLC.controller.AssayResolver', {
    extend : 'Ext.app.Controller',

    views  : ['Review'],

    init : function() {

        this.control('hplcreview', {
            show : function(v) {
                v.updateRuns(this.buildAssayRuns());
            },
            save : this.onSave
        });
    },

    createReviewView : function() {

        if (this.review) {
            this.review.updateRuns(this.buildAssayRuns());
            return this.review;
        }

        this.review = Ext4.create('HPLC.view.Review', {});

        return this.review;

    },

    _processStandard : function(standards, idx, sets, run) {

        if (Ext4.isArray(standards) && standards.length > 0)
        {
            if (Ext4.isArray(sets.std)) {
                for (var i=0; i < sets.std.length; i++) {

                    if (sets.std[i] == "on") {
                        /* Add file dependency */
                        if (standards[i].filepath) {
                            run.dataInputs.push(new LABKEY.Exp.Data({pipelinePath: standards[i].filepath}));
                        }

                        /* Add standard to Assay Result */
                        run.dataRows.push(standards[i]);
                    }
                }
            }
            else if (Ext4.isString(sets.std) && sets.std == "on") {
                /* Add file dependency */
                if (standards[idx].filepath) {
                    run.dataInputs.push(new LABKEY.Exp.Data({pipelinePath: standards[idx].filepath}));
                }

                /* Add standard to Assay Result */
                run.dataRows.push(standards[idx]);
            }
        }

        return run;
    },

    buildAssayRuns : function() {

        /* Run(s) Info */
        var samples   = this._getSampleForms(),
            standards = this._getStandardForms(),
            sets      = this._getUniqueRunSet(samples),
            runs = [], run, methodFile, s, j, x;

        for (s in sets)
        {
            if (sets.hasOwnProperty(s))
            {
                run = this._ensureRun(true);

                run.name = sets[s][0].formulation;

                run.properties['LotNumber']          = run.name;
                run.properties['StorageTemperature'] = sets[s][0].temp;
                run.properties['Time']               = sets[s][0].time;

                methodFile = Ext4.getCmp(this.application.tab.items.keys[0]).mthdStore.getAt(0);
                if (methodFile) {
                    run.properties['Method'] = methodFile.data.uri;
                }

                run.dataInputs  = [];
                run.dataOutputs = [];

                for (j=0; j < sets[s].length; j++) {

                    /* fulfill runoutputs using PipelinePath */
                    run.dataInputs.push(new LABKEY.Exp.Data({pipelinePath: sets[s][j].filepath}));

                    /* map associated standards */
                    if (Ext4.isArray(sets[s][j])) {

                        for (x=0; x < sets[s][j].std.length; x++) {
                            run = this._processStandard(standards, x, sets[s][j], run);
                        }
                    }
                    else {
                        run = this._processStandard(standards, 0, sets[s][j], run);
                    }

                    /* fulfill Assay Results */
                    run.dataRows.push(sets[s][j]);

                    for (var i=0; i < run.dataRows.length; i++) {
                        if (run.dataRows[i]['TestType'] == 'standard') {
                            run.dataRows[i]['Sample'] = sets[s][j]['name'];
                        }
                    }
                }

                runs.push(run);
            }
        }

        return runs;
    },

    onSave : function() {

        LABKEY.page.batch.runs = this.buildAssayRuns();

        var me = this;

        LABKEY.Experiment.saveBatch({
            assayId : LABKEY.page.assay.id,
            batch   : LABKEY.page.batch,
            success : function(batch) {
                LABKEY.page.batch = batch;

                me.application.win.hide();
                Ext.Msg.hide();
                Ext.Msg.alert('Save Batch', 'Save Successful', function(){
                    window.location.reload();
                });
            },
            failure : function(error) {
                me.application.win.hide();
                Ext.Msg.hide();
                Ext.Msg.alert('Failure', error.exception, function(){
                     me.application.win.show();
                });
            }
        });
    },

    // Returns an object containing batch, run, result information
    getAssayDomains : function() {

        if (this._domains)
            return this._domains;

        var assay = LABKEY.page.assay,
            _name = assay.name;

        this._domains = {
            batch : assay.domains[_name + ' Batch Fields'],
            run   : assay.domains[_name + ' Run Fields'],
            result: assay.domains[_name + ' Result Fields']
        };

        return this._domains;

    },

    // private
    _ensureRun : function(clear) {

        var batch = LABKEY.page.batch;
        if (!batch.runs || batch.runs.length == 0 || clear)
            batch.runs = [ new LABKEY.Exp.Run() ];
        var run = batch.runs[0];

        if (!run.properties || clear)
            run.properties = {};

        if (!run.dataRows || clear)
            run.dataRows = [];
        return run;

    },

    _getUniqueRunSet : function(samples) {

        var _set = {}, id, s;

        for (s=0; s < samples.length; s++)
        {
            id = this.getUniqueID(samples[s]);
            if (!_set[id])
                _set[id] = [];
            _set[id].push(samples[s]);
        }

        return _set;
    },

    getUniqueID : function(sample) {
        return sample.formulation + '_' + sample.time + '_' + sample.temp;
    },

    // private
    _getSampleForms : function() {
        return this.application.getController('State').getSampleForms();
    },

    // private
    _getStandardForms : function() {
        return this.application.getController('State').getStandardForms();
    }
});
