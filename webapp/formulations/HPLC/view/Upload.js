/*
 * Copyright (c) 2012 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('HPLC.view.Upload', {

    extend : 'Ext.panel.Panel',

    alias : 'widget.hplcupload',

    constructor : function(config) {

        // Requirements
        if (!config.targetFile) {
            console.error('HPLCUploadPanel not initialized properly. Provide a targetFile.');
        }
        else {
            this.targetFile = config.targetFile;
        }

        if (!config.fileSystem) {
            console.error('HPLCUploadPanel not initialized properly. Provide a fileSystem.');
        }
        else {
            this.fileSystem = config.fileSystem;
        }

        Ext4.applyIf(config, {
            layout: 'card'
        });

        this._defineModels();

        this.callParent([config]);

        this.addEvents('fileload');
    },

    initComponent : function() {

        this.on('fileload', this.onFileLoad, this);

        this.items = [this.getFileUploadPanel()];

        // Once this handler is called the models are in a correct state to be used
        var handler = function(data) {
            this._initDataStores(data);
        };

        this.getConfiguration(handler, this);

        this.callParent();
    },

    getFileUploadPanel : function() {

        if (this.fileUploadPanel)
            return this.fileUploadPanel;

        this.fileUploadPanel = Ext4.create('Ext.panel.Panel', {
            itemId : 'fileInfo',
            layout : 'border',
            border : false, frame: false,
            defaults : {
                layout : 'fit',
                border : false, frame: false
            },
            items  : [{
                itemId : 'grid',
                region : 'west',
                items  : []
            },{
                itemId : 'targets',
                region : 'center',
                items  : []
            }]
        });

        return this.fileUploadPanel;
    },

    renderDataView : function(p) {

        if (this.stdStore && this.smpStore) {

            var resultsStore = Ext4.create('Ext.data.Store', {
                model : 'HPLC.model.Result',
                proxy    : {
                    type : 'memory',
                    reader : {
                        type : 'json',
                        root : 'results'
                    }
                },
                listeners : {
                    load : function(s) {
                        console.log('results store loaded: ' + s.getCount());
                    }
                }
            });

            var imgPath = LABKEY.contextPath + '/formulations';

            // this template knows too much about Assay Result
            var imageTpl = Ext4.create('Ext.XTemplate',
                    '<tpl for=".">',
                    '<div style="width: 120px; height: 120px; padding: 5px;" class="sample-preview">',
                    '<span style="margin: auto;"><strong>{TestType}</strong></span>',
                    '<img style="margin-left: auto; margin-right: auto;" src="',
                    imgPath,
                    '/{TestType}.png" height="48" width="72"/>',
                    '</div>',
                    '</tpl>'
            );

            this.dataView = Ext4.create('Ext.view.View', {
                itemId : 'smpDataView',
                height : 300,
                tpl : imageTpl,
                itemSelector : 'div.sample-preview',
                emptyText : 'No Samples Specified',
                border : false, frame : false,
                store : resultsStore,
                autoScroll : true,
                deferInitialRefresh : true,
                scope : this
            });

            return this.dataView;
        }

        return Ext4.create('Ext.panel.Panel', {
            border : false, frame : false,
            html : 'Stores not loaded in time'
        });
    },

    onFileLoad : function(a, b, c, d, e, f)
    {
        // grid columns
        var columns = [
            {
                xtype    : 'templatecolumn',
                width    : 30,
                sortable : false,
                dataIndex: 'type',
                tdCls    : 'type-column',
                tpl      : '<tpl if="iconHref == undefined || iconHref == \'\'">{type}</tpl><tpl if="iconHref != undefined && iconHref != \'\'">' +
                        '<img height="16px" width="16px" src="{iconHref}" alt="{type}">' + // must set height/width explicitly for layout engine to work properly
                        '</tpl>'
            },
            { header : 'Name', dataIndex : 'name', flex : 1 }
        ];

        var sampleCols = [columns[0], columns[1]];
        sampleCols.push({
            xtype    : 'actioncolumn',
            width    : 50,
            align    : 'center',
            sortable : false,
            items : [{
                icon : LABKEY.contextPath + '/visualization/report/timechart.gif',
                tooltip : 'Preview',
                handler : function(grid, ridx, cidx) {
                    this.seePreviewVis(grid.getStore().getAt(ridx));
                },
                scope : this
            }]
        });

        var leftGrid = Ext4.create('Ext.grid.Panel', {
            /* panel configs */
            itemId  : 'selGrid',
            title   : 'Selected Subfiles',
            width   : 325,
            border  : false, frame : false,

            /* grid configurations */
            viewConfig : {
                plugins : {
                    ddGroup : 'FileSelection',
                    ptype   : 'gridviewdragdrop',
                    enableDrop : true
                }
            },
            columns  : columns,
            store    : this.fileStore,
            selModel : Ext4.create('Ext.selection.RowModel', {mode : 'MULTI'}),
            scope : this
        });

        var rightPanel = Ext4.create('Ext.panel.Panel', {
//            margins : '0 0 0 3',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            defaults: {
                xtype : 'grid',
                border : false, frame: false,
                viewConfig : {
                    plugins : {
                        ddGroup : 'FileSelection',
                        ptype   : 'gridviewdragdrop',
                        enableDrop : true
                    }
                },
                columns : columns,
                width : '100%',
                flex : 1,
                scope : this
            },
            items   : [{
                itemId: 'smpGrid',
                title : 'Samples',
                store : this.smpStore,
                columns : sampleCols
            },{
                itemId: 'stdGrid',
                title : 'Standards',
                store : this.stdStore
            },{
                itemId: 'mthdGrid',
                title : 'Methods',
                store : this.mthdStore
            }],
            scope : this
        });

        this.getFileUploadPanel().getComponent('grid').add(leftGrid);
        this.getFileUploadPanel().getComponent('targets').add(rightPanel);
    },

    seePreviewVis : function(record) {
        this.plotRegion = Ext4.create('Ext.Component', {
            autoEl: {
                tag : 'div',
                cls : 'emptyplot plot'
            },
            listeners : {
                afterrender : function(c){
                    console.log(c.getId());
                    this.plotid = c.getId();
                },
                scope : this
            },
            scope : this
        });
        this.add(this.plotRegion);
        this.getLayout().setActiveItem(this.plotRegion);
        console.log(record);
    },

    seePreview : function(record) {
        var r = record;
        var preview = Ext4.create('Ext.panel.Panel', {
            region : 'center',
            layout: {
                type: 'vbox',
                align: 'center'
            },
            border : false,
            frame  : false,
            bodyStyle : 'margin-top: 100px',
            items: [{
                border: false,
                frame : false,
                html  : '',
                width : 800,
                height: 400,
                listeners : {
                    afterrender : function(p) {
                        p.getEl().mask('Generating HPLC Preview...');
                        console.log('rendering to ' + p.getEl().id);
                        console.log(LABKEY.ActionURL.decodePath(r.data.uri.replace(LABKEY.ActionURL.getBaseURL(), '').replace("_webdav", ''))); // Ext4.htmlDecode does not seem to work
                        var wp = new LABKEY.WebPart({
                            renderTo : p.getEl().id,
                            partName : 'Report',
                            frame   : 'none',
                            partConfig : {
                                reportId : 'module:idri/schemas/assay/HPLC Data/Preview.r',
                                'file'   : LABKEY.ActionURL.decodePath(r.data.uri.replace(LABKEY.ActionURL.getBaseURL(), '').replace("_webdav", '')), // container is a hack
                                showSection : 'peaks_png'
                            },
                            success : function(x, y, z){
                                p.getEl().unmask();
                            },
                            failure : function(){
                                p.getEl().unmask();
                            }
                        });
                        wp.render();
                    }
                }
            },{
                xtype : 'button',
                text  : 'Close Preview',
                handler : function() {
                    this.getLayout().setActiveItem(0);
                    this.remove(preview);
                },
                scope : this
            }]
        });
        this.add(preview);
        this.getLayout().setActiveItem(preview);
    },

    getConfiguration : function(handler, scope) {

        if (!this.targetFile || !this.targetFile.treeNode)
        {
            Ext4.Msg.alert('No Files', 'Please select a directory or file to import.');
            return;
        }

        var fileConfig = {
            path : this.targetFile.treeNode.id,
            success : function(fs, path, files){
                var _data = {}, _files = [];
                for (var i = 0; i < files.length; i++){
                    _files.push(files[i].data);
                }
                _data['files'] = _files;
                handler.call(scope || this, _data);
            },
            scope : this
        };

        this.fileSystem.listFiles(fileConfig);
    },

    // This will save the assay run in it's current state
    save : function() {
        /* Validate */
        if (this.dataView) {
            var resultStore = this.dataView.getStore();
            var errors;
            for (i=0; i < resultStore.getCount(); i++) {
                errors = resultStore.getAt(i).validate();
                if (errors && !errors.isValid()) {
                    this.dataView.select(i);

                    return false;
                }
            }
            if (!errors)
                console.log('everything is valid');
        }
        else {
            console.log('unable to find data view');
            return;
        }

        /* Run info */
//        var form = this.runInfoPanel.getComponent('runForm');
//        form = form.getForm();
//        if (!form.isValid || !form.store.getAt(0)) {
//            console.log('the form is invalid');
//            form.markInvalid();
//            return false;
//        }
        return false;


        var run = this._ensureRun(true);

        var _rec = Ext4.create('HPLC.model.Run', form.store.getAt(0).data);

        /* map run properties */
        for (var i=0; i < _rec.fields.keys.length; i++)
            run.properties[_rec.fields.keys[i]] = _rec.get(_rec.fields.keys[i]);
        run.name = run.properties['LotNumber'];

        run.properties["Method"] = this.mthdStore.getAt(0).get('uri');

        /* fulfill runoutputs using PipelinePath */
        for (i=0; i < this.smpStore.getCount(); i++)
            run.dataOutputs.push(new LABKEY.Exp.Data({pipelinePath: this.smpStore.getAt(i).data.path}));

        /* fulfill Assay Results */
        if (this.dataView) {
            for (i=0; i < resultStore.getCount(); i++) {
                run.dataRows.push(resultStore.getAt(i).data);
            }
        }

        //LABKEY.page.batch.runs[0] = run;
        run.dataInputs = [ new LABKEY.Exp.Data() ];

        Ext4.Ajax.request({
            url: LABKEY.ActionURL.buildURL("assay", "assayFileUpload"),
            params: { fileName: run.name + '.txt', fileContent: 'Placeholder' },
            success: function(response, options) {
                var data = new LABKEY.Exp.Data(Ext4.JSON.decode(response.responseText));

                // now add the data as a dataInput to a LABKEY.Exp.Run
                run.dataInputs = [ data ];

                // add the new run to a LABKEY.Exp.Batch object here
                LABKEY.Experiment.saveBatch({
                    assayId : LABKEY.page.assay.id,
                    batch   : LABKEY.page.batch,
                    success : function(batch, response) {
                        LABKEY.page.batch = batch;
                        console.log('saved successfully.');
                    },
                    failure : function(error, opts, response) {
                        var msg = error.exception;
                        Ext.Msg.hide();
                        console.log('error');
                        alert(msg);
                    }
                });
            }
        });
    },

    /* private */
    _defineModels : function() {

        // resolves the field type of a value (e.g 123 -> 'int', etc)
        var resolveType = function(val)
        {
            if (Ext4.isString(val))
                return 'string';
            if (Ext4.isDate(val))
                return 'date';
            if (Ext4.isNumber(val))
                return 'int';
            if (Ext4.isNumeric(val))
                return 'double';
            if (Ext4.isBoolean(val))
                return 'boolean';
            console.error('Unable to resolve the type of \'' + val + '\'');
        }

        // Returns an array of properties and their associated type
        var mapFolderRecord = function(record) {
            var _results = [];

            if (record && record.data) {
                for (var i in record.data) {
                    if (record.data.hasOwnProperty(i)) {
                        if (!Ext4.isFunction(record.data[i])) {
                            _results.push({
                                name : i,
                                type : resolveType(record.data[i])
                            });
                        }
                    }
                }
            }
            else {
                console.warn('Record does not exist.');
            }

            return _results;
        }

        var mapAssayRun = function()
        {
            var fields = [], field;
            var domain = LABKEY.page.assay.domains;
            var name = LABKEY.page.assay.name;
            var run = domain[name + ' Run Fields'];
            for (var i=0; i < run.length; i++) {
                field = {
                    name : run[i].name,
                    type : run[i].typeName
                };
                fields.push(field);
            }
            return fields;
        }

        // creates an array of {name, type} objects used to define fields in model
        var mapAssayResult = function()
        {
            var fields = [], field;
            var domain = LABKEY.page.assay.domains;
            var name = LABKEY.page.assay.name;
            var run = domain[name + ' Result Fields'];
            for (var i=0; i < run.length; i++) {
//                console.log(run[i]);
                field = {
                    name : run[i].name,
                    type : run[i].typeName,
                    required : run[i].required
                };
                fields.push(field);
            }

            // add file field
            fields.push({
                name : 'fileName',
                type : 'file',
                required : true
            });

            return fields;
        }

        // TODO: This should extend OR be a model of the standard labkey ajax file object
        // reexamine this after fileBrowser has been updated to Ext4
        Ext4.define('HPLC.model.File', {
            extend : 'Ext.data.Model',
            fields : mapFolderRecord(this.targetFile)
        });

        Ext4.define('HPLC.model.Run', {
            extend : 'Ext.data.Model',
            fields : mapAssayRun()
        });

        Ext4.define('HPLC.model.Result', {
            extend : 'Ext.data.Model',
            fields : mapAssayResult(),
            validations : [
                {type : 'presence', field : 'TestType'}, //, list : ['SMP', 'STD', 'smp', 'std']},
                {type : 'presence',  field : 'Diluent'},
                {type : 'presence',  field : 'Dilution'}
            ]
        });
    },

    /* private */
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

    /* private */
    _initDataStores : function(fileData) {

        // There are a set of file stores used for each category
        var fileStoreConfig = {
            model    : 'HPLC.model.File',
            proxy    : {
                type : 'memory',
                reader : {
                    type : 'json',
                    root : 'files'
                }
            }
        };

        this.smpStore  = Ext4.create('Ext.data.Store', fileStoreConfig);
        this.stdStore  = Ext4.create('Ext.data.Store', fileStoreConfig);
        this.mthdStore = Ext4.create('Ext.data.Store', fileStoreConfig);
        this.fileStore = Ext4.create('Ext.data.Store', Ext.apply({
            autoLoad : true,
            data : fileData,
            listeners : {
                load : function() {
                    Ext4.defer(function(){
                        this.fireEvent('fileload', arguments);
                    }, 10, this);
                },
                scope : this
            },
            scope : this
        }, fileStoreConfig));
    },

    /* private */
    _navigate : function(direction) {
        var layout = this.getLayout();
        var active = layout.getActiveItem();
        if (direction > 0) {
            var id = active.nextCard.call(this);
            var lastActive = active.itemId;
            if (id) {
                layout.setActiveItem(id);
                layout.getActiveItem().prevCard = lastActive;
                console.log('prevCard set to ' + layout.getActiveItem().prevCard);
                return false;
            }
        }
        else {
            if (active.prevCard) {
                layout.setActiveItem(active.prevCard);
                return !layout.getActiveItem().prevCard;
            }
        }
        return true;
    }
});