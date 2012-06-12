Ext4.define('HPLC.view.StandardEntry', {

    extend : 'Ext.panel.Panel',

    alias : 'widget.standardentry',

    layout : 'border',

    border : false,

    frame  : false,

    initComponent : function() {

        Ext4.define('HPLC.data.Compound', {
            extend : 'Ext.data.Model',
            fields : [
                {name : 'RowId', type : 'int'},
                {name : 'Name'},
                {name : 'Full Name'},
                {name : 'DM', type : 'date'},
                {name : 'CAS Number'}
            ]
        });

        this.items = [{
            xtype : 'panel',
            region: 'center',
            flex : 1,
            items : this.initializeForms()
        }];

        this.callParent();
    },

    getForm : function() {
        if (this.formItems)
        {
            var ret = [];
            for (var f=0; f < this.formItems.length; f++)
            {
                ret.push(this.formItems[f].getValues());
            }
            return ret;
        }
        return [];
    },

    initializeForms : function() {

        var formItems = [];

        for (var i=0; i < this.standards.getCount(); i++) {
            formItems.push(this.generateStandardForm(this.standards.getAt(i), i));
        }

        this.formItems = formItems;

        return this.formItems;
    },

    generateStandardForm : function(standard, idx) {

        return Ext4.create('Ext.form.Panel', {
            flex : 1,
            border : false,
            layout : 'hbox',
            bodyStyle: 'padding-left: 27px; border: none;',
            fieldDefaults : {
                labelAlign: 'top',
                labelSeparator : '',
                validateOnBlur: false,
                validateOnChange : false,
                allowBlank : false,
                hideLabel : idx > 0
            },
            items : [{
                xtype : 'textfield',
                fieldLabel : 'Name',
                name : 'stdname',
                value : this._parseStandardName(standard.data.name)
            },{
                xtype : 'combo',
                fieldLabel : 'Compound',
                name : 'Compound',
                store : this.initializeCompoundStore(),
                editable : false,
                queryMode : 'local',
                displayField : 'Name',
                valueField : 'Name', //'RowId',
                emptyText : 'None'
            },{
                xtype : 'numberfield',
                fieldLabel : 'Concentration',
                name : 'Concentration'
            },{
                xtype : 'textfield',
                fieldLabel : 'Dilutent',
                name : 'dilutent'
            },{
                xtype : 'hidden',
                name : 'TestType',
                value : 'standard'
            },{
                xtype : 'hidden',
                name : 'uri',
                value : standard.data.uri
            },{
                xtype : 'hidden',
                name : 'filepath',
                value : standard.data.path
            }]
        });

    },

    initializeCompoundStore : function() {

        var config = {
            model   : 'HPLC.data.Compound',
            autoLoad: true,
            pageSize: 10000,
            proxy   : {
                type   : 'ajax',
                url : LABKEY.ActionURL.buildURL('query', 'selectRows.api'),
                extraParams : {
                    schemaName  : 'Samples',
                    queryName   : 'Compounds'
                },
                reader : {
                    type : 'json',
                    root : 'rows'
                }
            }
        };

        return Ext4.create('Ext.data.Store', config);
    },

    _parseStandardName : function(name) {
        return name.split('.')[0];
    }
});