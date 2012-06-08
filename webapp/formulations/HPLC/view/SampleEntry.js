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

        this.items = [{
            xtype  : 'box',
            region : 'north',
            height : 60,
            autoEl : {
                tag : 'span',
                cls : 'sample-header',
                html: 'Sample ' + this._parseSampleName(this.sampleid)
            }
        },{
            xtype  : 'panel',
            region : 'west',
            border: false, frame : false,
            flex : 3,
            items : [this.initFormPanel()]
        },{
            xtype  : 'panel',
            region : 'center',
            flex : 1,
            hidden : true
//            border: false, frame : false,
//            items : [this.initFormPanel()]
        },{
            xtype  : 'panel',
            region : 'east',
            border: false, frame : false,
            flex : 3
//            items : [this.initReplicateForm()]
        }];

        this.callParent();
    },

    initFormPanel : function() {

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

        console.log(stdItems);

        this.formPanel = Ext4.create('Ext.form.Panel', {
            flex : 1,
            border : false,
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
                value : this.sample.path,
                name : 'file'
            },{
                xtype : 'combo',
                fieldLabel : 'Formulation',
                name : 'formulation',
                store : this.initializeFormulationStore(),
                editable : false,
                queryMode : 'local',
                displayField : 'Batch',
                valueField : 'RowId',
                emptyText : 'None'
            },{
                xtype : 'textfield',
                fieldLabel : 'Diluent',
                name : 'diluent'
            },{
                xtype : 'textfield',
                fieldLabel : 'Dilution',
                name : 'dilution'
            },{
                xtype : 'textfield',
                fieldLabel : 'Temperature',
                name : 'temp',
                allowBlank : true
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

        var config = {
            model   : 'HPLC.data.Formulation',
            autoLoad: true,
            pageSize: 10000,
            proxy   : {
                type   : 'ajax',
                url : LABKEY.ActionURL.buildURL('query', 'selectRows.api'),
                extraParams : {
                    schemaName  : 'Samples',
                    queryName   : 'Formulations'
                },
                reader : {
                    type : 'json',
                    root : 'rows'
                }
            }
        };

        return Ext4.create('Ext.data.Store', config);
    },

    _parseSampleName : function(name) {
        return name.split('.')[0];
    }
});