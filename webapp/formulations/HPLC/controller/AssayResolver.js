Ext4.define('HPLC.controller.AssayResolver', {
    extend : 'Ext.app.Controller',

    views  : ['Review'],

    init : function() {

    },

    createReviewView : function() {

        return Ext4.create('Ext.panel.Panel', {
            html : 'Review Page: Under Construction',
            buttons : [{
                text : 'Save',
                handler : this.save,
                scope : this
            }],
            scope : this
        });

    },

    save : function() {

        /* Run(s) Info */
        var samples = this._getSampleForms();
        var standards = this._getStandardForms();

        var sets = this._getUniqueRunSet(samples);
        var runs = [], run;

        for (var s in sets)
        {
            if (sets.hasOwnProperty(s))
            {
                run = this._ensureRun(true);

                run.name = sets[s][0].formulation;

                run.properties['LotNumber'] = run.name;
                run.properties['Method'] = this.application.tab.items.items[0].mthdStore.getAt(0).data.uri; // TODO: FIX

                run.properties['StorageTemperature'] = sets[s][0].temp;
                run.properties['Time'] = sets[s][0].time;

                run.dataInputs = [];
                run.dataOutputs = [];

                for (var j=0; j < sets[s].length; j++)
                {
                    /* fulfill runoutputs using PipelinePath */
                    run.dataOutputs.push(new LABKEY.Exp.Data({pipelinePath: sets[s][j].filepath}));

                    /* map associated standards */
                    if (Ext4.isArray(sets[s][j]))
                    {
                        for (var x=0; x < sets[s][j].std.length; x++)
                        {
                            if (!standards[x].marked && sets[s][j].std[x] == "on")
                            {
                                run.dataOutputs.push(new LABKEY.Exp.Data({pipelinePath: standards[x].filepath}));
                                standards[x].marked = true;
                            }
                        }
                    }
                    else
                    {
                        if (!standards[0].marked && sets[s][j].std == "on")
                        {
                            run.dataOutputs.push(new LABKEY.Exp.Data({pipelinePath: standards[0].filepath}));
                            standards[0].marked = true;
                        }
                    }

                    /* fulfill Assay Results */
                    run.dataRows.push(sets[s][j]);
                }

                runs.push(run);
            }
        }

        LABKEY.page.batch.runs = runs;

        LABKEY.Experiment.saveBatch({
            assayId : LABKEY.page.assay.id,
            batch   : LABKEY.page.batch,
            success : function(batch, response) {
                LABKEY.page.batch = batch;
                Ext.Msg.hide();
                Ext.Msg.alert('Save Batch', 'Save Successful');
            },
            failure : function(error) {
                Ext.Msg.hide();
                Ext.Msg.alert('Failure', error.exception);
            }
        });
    },

    // Returns an object containing batch, run, result information
    getAssayDomains : function() {

        if (this._domains)
            return this._domains;

        var _domains = {};
        var assay = LABKEY.page.assay;
        var _name = assay.name;

        _domains.batch  = assay.domains[_name + ' Batch Fields'];
        _domains.run    = assay.domains[_name + ' Run Fields'];
        _domains.result = assay.domains[_name + ' Result Fields'];

        this._domains = _domains;

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

        var _set = {}, id;

        for (var s=0; s < samples.length; s++)
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