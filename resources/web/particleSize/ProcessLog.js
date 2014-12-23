/*
 * Copyright (c) 2014 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('LABKEY.particlesize.ProcessLog', {

    extend: 'Ext.panel.Panel',
    modelClass:'LABKEY.particlesize.model.Process',

    initComponent : function() {

        if (!Ext4.ModelManager.isRegistered(this.modelClass)) {

            Ext4.define(this.modelClass, {
                extend: 'Ext.data.Model',

                fields: [
                    { name: 'formulationId', type: 'int' },
                    { name: 'formulationName', type: 'string' },
                    { name: 'formulationSampleId', type: 'int' },
                    { name: 'formulationSampleURL', type: 'string' },
                    { name: 'fileName', type: 'string' },
                    { name: 'uploadFileURL', type: 'string' },
                    {
                        name: 'messages',
                        convert: function(raw) {
                            var value = [];

                            if (Ext4.isArray(raw)) {
                                value = raw;
                            }
                            else if (!Ext4.isEmpty(raw)) {
                                value.push(raw);
                            }

                            return value;
                        }
                    },
                    { name: 'uploadTime', type: 'date' },
                    { name: 'assayResultText', type: 'string', defaultValue: 'view run' },
                    { name: 'assayResultURL', type: 'string' }
                ],

                publishMessage : function(message) {
                    var oldMsgs = this.get("messages");
                    oldMsgs.push(message);
                    this.setCommit("messages", oldMsgs);
                },

                setCommit : function(fieldName, newValue) {
                    this.set(fieldName, newValue);
                    this.commit();
                }
            });

        }

        this.items = [ this.getGrid() ];

        this.callParent();
    },

    getGrid : function() {
        if (!this._grid) {
            this._grid = Ext4.create('Ext.grid.Panel', {
                height: 300,
                store: this.getStore(),
                columns: this.getColumns()
            });
        }

        return this._grid;
    },

    getColumns : function() {
        return [
            {
                xtype: 'templatecolumn',
                text: 'Formulation',
                width: 125,
                tpl: [
                    '<tpl if="formulationSampleURL !== undefined && formulationSampleURL.length &gt; 0">',
                        '<a href="{formulationSampleURL}">{formulationName:htmlEncode}</a>',
                    '</tpl>'
                ]
            },
            {
                xtype: 'templatecolumn',
                text: 'File Name',
                width: 125,
                tpl: [
                    '<tpl if="uploadFileURL !== undefined && uploadFileURL.length &gt; 0">',
                        '<a href="{uploadFileURL}">{fileName:htmlEncode}</a>',
                    '<tpl else>',
                        '<span>{fileName:htmlEncode}</span>',
                    '</tpl>'
                ]
            },
            {
                xtype: 'templatecolumn',
                text: 'Messages',
                dataIndex: 'messages',
                width: 400,
                tpl: [
                    '<ul>',
                        '<tpl for="messages">',
                            '<li>{.}</li>',
                        '</tpl>',
                    '</ul>'
                ]
            },
            { text: 'Upload Time', dataIndex: 'uploadTime',renderer: Ext4.util.Format.dateRenderer('m/d/y g:i'), width: 150 },
            {
                xtype: 'templatecolumn',
                text: 'Assay Result',
                width: 130,
                tpl: [
                    '<tpl if="assayResultURL !== undefined && assayResultURL.length &gt; 0">',
                        '<a href="{assayResultURL}">{assayResultText:htmlEncode}</a>',
                    '</tpl>'
                ]
            }
        ];
    },

    getStore : function() {
        if (!this._store) {
            this._store = Ext4.create('Ext.data.Store', {
                model: this.modelClass,
                autoLoad: true,
                autoSync: true,
                proxy : {
                    type: 'sessionstorage',
                    id: 'pSizeProxy'
                }
            });

            // let the user see the most recent uploads at the top
            this._store.sort('uploadTime', 'DESC');
        }

        return this._store;
    },

    getModelInstance : function(config) {
        return Ext4.create(this.modelClass, config);
    }
});