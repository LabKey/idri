/*
 * Copyright (c) 2012 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('HPLC.view.SampleEntry', {

    extend : 'Ext.panel.Panel',

    alias : 'widget.sampleentry',

    layout : 'border',

    border : false,

    frame  : false,

    initComponent : function() {

        this.sample   = this.samples.getAt(this.idx).data;
        this.sampleid = this.sample.name; // needs to be more unique

        Ext4.define('HPLC.data.Formulation', {
            extend : 'Ext.data.Model',
            fields : [
                {name : 'RowId', type : 'int'},
                {name : 'Batch'},
                {name : 'Comments'},
                {name : 'DM', type : 'date'},
                {name : 'Name'},
                {name : 'Raw Materials'},
                {name : 'Type'},
                {name : 'batchsize', type : 'int'},
                {name : 'npbg'}
            ]
        });

        Ext4.define('HPLC.data.Temperature', {
            extend : 'Ext.data.Model',
            fields : [
                {name : 'temperature', type : 'int'}
            ]
        });

        Ext4.define('HPLC.data.Timepoint', {
            extend : 'Ext.data.Model',
            fields : [
                {name : 'sort', type : 'int'},
                {name : 'time'}
            ]
        });

        this.sampleTitle = Ext4.create('Ext.Component', {
            region : 'north',
            height : 60,
            autoEl : {
                tag : 'span',
                cls : 'sample-header',
                html: 'Sample ' + this._parseSampleName(this.sampleid)
            }
        });

        this.items = [this.sampleTitle, {
            xtype  : 'panel',
            region : 'center',
            flex : 3,
            border: false,
            items : [this.getFormPanel()]
        },{
            xtype  : 'panel',
            region : 'east',
            border: false, frame : false,
            flex : 3,
            items : [this.generatePreview()]
        }];

        this.callParent();
    },

    getForm : function() {
        return this.getFormPanel().getValues();
    },

    getFormPanel : function() {

        if (this.formPanel)
            return this.formPanel;

        var stdItems = [];

        for (var i=0; i < this.standards.getCount(); i++)
        {
            stdItems.push({
                boxLabel : this._parseSampleName(this.standards.getAt(i).data.name),
                name : 'std',
                checked  : true,
                width : 100,
                uncheckedValue : '0'
            });
        }

        this.formPanel = Ext4.create('Ext.form.Panel', {
            flex : 1,
            border : false,
            height : 350,
            bodyStyle: 'padding-left: 27px; border: none;',
            fieldDefaults : {
                labelSeparator : '',
                validateOnBlur: false,
                validateOnChange : false,
                allowBlank : false
            },
            items : [{
                xtype : 'textfield',
                fieldLabel : 'Name',
                value : this._parseSampleName(this.sampleid),
                name : 'name'
            },{
                xtype : 'displayfield',
                fieldLabel : 'File',
                value : this.sample.path
            },{
                xtype : 'hidden',
                name : 'uri',
                value : this.sample.uri
            },{
                xtype : 'hidden',
                name : 'filepath',
                value : this.sample.path
            },{
                xtype : 'hidden',
                name : 'TestType',
                value : 'sample'
            },{
                xtype : 'combo',
                fieldLabel : 'Formulation',
                name : 'formulation',
                store : this.initializeFormulationStore(),
                editable : false,
                queryMode : 'local',
                displayField : 'Batch',
                valueField : 'Batch', // 'RowId'
                emptyText : 'None'
            },{
                xtype : 'textfield',
                fieldLabel : 'Diluent',
                name : 'Diluent'
            },{
                xtype : 'numberfield',
                fieldLabel : 'Dilution',
                name : 'Dilution',
                hideTrigger : true
            },{
                xtype : 'combo',
                fieldLabel : 'Temperature',
                name : 'temp',
                store : this.initializeTemperatureStore(),
                editable : false,
                queryMode : 'local',
                displayField : 'temperature',
                valueField : 'temperature',
                emptyText : 'Storage Temp.'
            },{
                xtype : 'combo',
                fieldLabel : 'Time',
                name : 'time',
                store : this.initializeTimepointStore(),
                editable : false,
                queryMode : 'local',
                displayField : 'time',
                valueField : 'time',
                emptyText : 'Batch Timepoint'
            },{
                xtype : 'checkboxgroup',
                fieldLabel : 'Standards',
                labelAlign : 'top',
                colspan    : 1,
                columns    : 2,
                flex       : 1,
                items : stdItems
            }]
        });

        return this.formPanel;
    },

    generatePreview : function() {

        var loadImgPath = LABKEY.contextPath + '/' + LABKEY.extJsRoot_41 + '/resources/themes/images/default/grid/loading.gif';

        this.previewPanel = Ext4.create('Ext.panel.Panel', {
            border: false,
            frame : false,
            layout: {
                type: 'vbox',
                align: 'center'
            },
            items : [{
                xtype : 'box',
                autoEl: {
                    tag : 'div',
                    style: 'margin-top: 90px; height: 200px; width: 400px; text-align: center;',
                    children : [{
                        tag : 'img',
                        src : loadImgPath,
                        style: 'vertical-align: middle; padding-right: 3px;',
                        height: 20,
                        width: 20
                    },{
                        tag : 'span',
                        style : 'font-size: 7pt;',
                        html : 'Loading Preview'
                    }]
                },
                listeners : {
                    afterrender : this.renderPreview,
                    scope : this
                },
                scope : this
            }]
        });

        return this.previewPanel;
    },

    // private
    renderPreview : function(box) {

        var path = LABKEY.ActionURL.decodePath(this.sample.uri.replace(LABKEY.ActionURL.getBaseURL(), '').replace("_webdav", ''));

        var me = this;

        var partConfig = {
            reportId    : 'module:idri/schemas/assay/HPLC Data/Preview.r',
            file        : path,
            showSection : 'peaks_png',
            beforeRender : function(resp) {
                var text = resp.responseText;
                if (text.indexOf('error') > -1) {
                    box.update('<p style="margin-top: 35px;">Preview not Available</p>');
                }
                else {
                    var id = Ext4.id();
                    box.update('<img id="' + id + '" style="margin-top: -35px;" height="200" width="400" src="' + text.split('src')[1].replace('=', '').split('"')[1] + '"><p style="text-align: center; font-size: 7pt;">Click Image to Enlarge</p>');
                    Ext4.get(id).on('click', function(el) {
                        this.fireEvent('preview', Ext4.get(id).dom.src);
                    }, me);
                    me.doComponentLayout();
                }
                return false;
            }
        };

        var wp = new LABKEY.WebPart({
            renderTo : box.getEl().id,
            partName : 'Report',
            frame   : 'none',
            partConfig : partConfig,
            success : function() {
            },
            failure : function() {
            }
        });
        wp.render();

    },

    initReplicateForm : function() {

        var panel = Ext4.create('Ext.panel.Panel', {
            items : [{
                xtype : 'checkboxfield',
                fieldLabel : 'Replicate',
                name : 'replicate'
            },{
                xtype : 'combo',
                name : 'replicatechoice',
                store : this.samples,
                displayField : ''
            }]
        });

        return panel;
    },

    initializeFormulationStore : function() {

        return this._buildStore({
            model : 'HPLC.data.Formulation',
            schema: 'Samples',
            query : 'Formulations'
        });

    },

    initializeTemperatureStore : function() {

        return this._buildStore({
            model : 'HPLC.data.Temperature',
            schema: 'lists',
            query : 'Temperatures',
            sort  : {
                field : 'temperature',
                direction: 'ASC'
            }
        });

    },

    initializeTimepointStore : function() {

        return this._buildStore({
            model : 'HPLC.data.Timepoint',
            schema: 'lists',
            query : 'Timepoints',
            sort  : {
                field : 'sort',
                direction: 'ASC'
            }
        });
    },

    _buildStore : function(config) {

        var storeConfig = {
            model   : config.model,
            autoLoad: true,
            pageSize: 10000,
            proxy   : {
                type   : 'ajax',
                url : LABKEY.ActionURL.buildURL('query', 'selectRows.api'),
                extraParams : {
                    schemaName  : config.schema,
                    queryName   : config.query
                },
                reader : {
                    type : 'json',
                    root : 'rows'
                }
            }
        };

        var store = Ext4.create('Ext.data.Store', storeConfig);

        // Add sorter if sort was provided
        if (config.sort) {
            store.on('load', function(s) {
                s.sort(config.sort.field, config.sort.direction);
            }, null, {single: true});
        }

        return store;
    },

    _parseSampleName : function(name) {
        return name.split('.')[0];
    }
});