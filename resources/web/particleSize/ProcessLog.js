Ext4.define('LABKEY.particlesize.ProcessLog', {

    extend: 'Ext.panel.Panel',

    initComponent : function() {

        if (!Ext4.ModelManager.isRegistered('LABKEY.particlesize.model.Process')) {

            Ext4.define('LABKEY.particlesize.model.Process', {
                extend: 'Ext.data.Model',

                fields: [
                    { name: 'formulationId', type: 'int' },
                    { name: 'messages', defaultValue: [] },
                    { name: 'uploadTime', type: 'date' }
                ]
            });

        }

        this.items = [ this.getGrid() ];

        this.callParent();
    },

    getGrid : function() {
        if (!this._grid) {
            this._grid = Ext4.create('Ext.grid.Panel', {
                width: 500,
                height: 600,
                store: this.getStore(),
                columns: this.getColumns()
            });
        }

        return this._grid;
    },

    getColumns : function() {
        return [
            { text: 'Formulation', dataIndex: 'formulationId' },
            { text: 'Message Log', dataIndex: 'messages' }
        ];
    },

    getStore : function() {
        if (!this._store) {
            this._store = Ext4.create('Ext.data.Store', {
                model: 'LABKEY.particlesize.model.Process',
                autoLoad: true,
                proxy : {
                    type: 'sessionstorage',
                    id: 'pSizeProxy'
                }
            });
        }

        return this._store;
    }
});

// TODO: These are for testing purposes, remove them before feature complete
DATAS = [
    { formulationId: 1, messages: ['You', 'Screwed', 'Up!'], uploadTime: new Date() },
    { formulationId: 12, messages: ['You', 'Are', 'Awesome!'], uploadTime: '11/14/2014' }
];