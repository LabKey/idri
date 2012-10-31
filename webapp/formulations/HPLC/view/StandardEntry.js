/*
 * Copyright (c) 2012 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
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
        var ret = [];
        if (this.formItems) {

            for (var f=0; f < this.formItems.length; f++) {
                ret.push(this.formItems[f].getValues());
            }

        }
        return ret;
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
                name : 'name',
                value : this._parseStandardName(standard.data.name)
            },{
                xtype : 'combo',
                fieldLabel : 'Compound',
                name : 'Compound',
                store : this.getCompoundStore(),
                editable : true,
                queryMode : 'local',
                displayField : 'Name',
                valueField : 'RowId',
                emptyText : 'None',
                typeAhead : true,
                minChars : 1,
                autoSelect : false,
                typeAheadDelay : 75
            },{
                xtype : 'numberfield',
                fieldLabel : 'Concentration',
                name : 'Concentration',
                hideTrigger : true
            },{
                xtype : 'textfield',
                fieldLabel : 'Diluent',
                name : 'Diluent'
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

    getCompoundStore : function() {

        if (this.compoundStore) {
            return this.compoundStore;
        }

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

        this.compoundStore = Ext4.create('Ext.data.Store', config);

        return this.compoundStore;
    },

    _parseStandardName : function(name) {
        return name.split('.')[0];
    }
});