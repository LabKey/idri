/*
 * Copyright (c) 2015 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('LABKEY.idri.TaskListPanel', {

    extend: 'Ext4.panel.Panel',

    alias: 'widget.idri-tasklistpanel',

    buttonAlign: 'left',

    width: 900,

    initComponent : function() {
        this.getTaskStore();

        this.taskPanel = this.getGridItems();

        this.items = [this.taskPanel];

        this.callParent();
    },

    getGridItems : function() {
        return Ext4.create('Ext4.grid.Panel', {
            store: this.getTaskStore(),
            columns: this.storeColumns(),
            frame: false,
            border: false,
            height: 500,
            width: 900,
            tbar: [{
                text: 'Save Changes',
                tooltip: 'Click to save all changes to the database',
                id: 'save-button',
                handler: this.saveChanges,
                scope: this
            },'-',{
                text: 'Export',
                tooltip: 'Click to Export the data to Excel',
                id: 'export-records-button',
                handler: function() {
                   this.exportExcel();
                },
                scope: this
            },'-',{
                text: 'Refresh',
                tooltip: 'Click to refresh the table',
                id: 'refresh-button',
                handler: this.onRefresh,
                scope: this
            },'-',{
                xtype: 'checkbox',
                boxLabel: 'Include Overdue Tasks',
                id: 'oldTasks',
                name: 'oldTasks',
                listeners: {
                    change: function() {
                        this.getTasks();
                    },
                    scope: this
                }
            },'-',{
                xtype : 'datefield',
                id : 'taskDate',
                value: new Date(),
                listeners: {
                    change: function() {
                        this.getTasks();
                    },
                    scope : this
                }
            }],
            bbar: Ext4.create('Ext.PagingToolbar',{
                pageSize: this.pageSize, //default is 20
                store: this.taskStore,
                displayInfo: true,
                emptyMsg: "No data to display"
            }),
            selModel: {
                selType: 'cellmodel'
            },
            plugins: [Ext4.create('Ext.grid.plugin.CellEditing', { clicksToEdit: 2 })]
        });
    },

    exportExcel : function() {

        var rows = [];
        var gridData = [];

        rows.push(['Category', 'Lot', 'Temp', 'Timepoint',
            'Date Due', 'Type', 'Adjuvant', 'Comment', 'Complete','Fail']);

        this.taskStore.each(function(rec) {
            rows.push([rec.get('cat'), rec.get('lotNum/Name'), rec.get('temperature'),rec.get('timepoint'), rec.get('date'), rec.get('type'),
                    rec.get('adjuvant'), rec.get('comment'), rec.get('complete'), rec.get('failed')]);
        });

        var workbook = {fileName:"TaskList.xlsx", sheets:[{name:"TaskList", data:rows}]};
        LABKEY.Utils.convertToExcel(workbook);

    },

    getTaskStore : function() {
        if (!this.taskStore) {
            var week = this.getWeek();

            this.taskStore = new LABKEY.ext4.Store({
                schemaName: 'lists',
                queryName: 'TaskList',
                groupField: 'cat',
                groupDir: 'ASC',
                sorters: [{
                    property: 'temperature',
                    direction: 'ASC'
                },{
                    property: 'lotNum/Name',
                    direction: 'ASC'
                }],
                columns : [ 'lotNum/Name', '*' /* The rest of the columns */],
                filters:  function(rec) {
                    if (rec.get('date') >= week[0] && rec.get('date') <= week[1]) {
                        return true;
                    }
                }
            });


            this.taskStore.load();
        }

        return this.taskStore;
    },

    storeColumns : function() {
        return [
            { text: 'Category',  dataIndex: 'cat', width: 70, editable: false },
            {
                text: 'Lot',
                dataIndex: 'lotNum',
                width: 60,
                editable: false,
                renderer: function(lotNum, metadata, rec) {
                    var url = LABKEY.ActionURL.buildURL('project', 'begin.view', null, {
                        rowId: lotNum,
                        pageId: 'idri.LOT_SUMMARY'
                    });
                    return '<a href="' + url + '" target="_blank">' + Ext4.htmlEncode(rec.get('lotNum/Name')) + '</a>';
                }
            },
            {
                text: 'Temp',
                dataIndex: 'temperature',
                width: 55,
                editable: false
            },
            { text: 'Timepoint',  dataIndex: 'timepoint', width: 80, editable: false },
            { text: 'Date Due',  dataIndex: 'date', renderer: Ext4.util.Format.dateRenderer('m/d/y'),width: 90, editable: false },
            { text: 'Type',  dataIndex: 'type', width: 90, editable: false },
            { text: 'Adjuvant',  dataIndex: 'adjuvant', width: 100, editable: false },
            {
                text: 'Comment',
                header: 'Comment',
                dataIndex: 'comment',
                editable: true,
                width: 200,
                field: {
                    type: 'textfield'
                }
            },{
                xtype: 'checkcolumn',
                header: 'Complete',
                dataIndex: 'complete',
                width: 80
            },{
                xtype: 'checkcolumn',
                header: 'Fail',
                dataIndex: 'failed',
                listeners: {
                    checkchange : function(column, recordIndex, checked, item) {
                        if (checked == true) {
                            this.getMessage(recordIndex);
                        }
                    },
                    scope:this
                },
                width: 50
            }
        ];
    },

    getTasks : function() {
        var date = Ext4.getCmp('taskDate').getValue();
        var week = this.getWeek(date);
        this.taskStore.filters.clear();

        if (Ext4.getCmp('oldTasks').getValue()) {
            this.taskStore.filter(function(rec) {
                if ((rec.get('date') >= week[0] && rec.get('date') <= week[1]) ||  (rec.get('date') < week[0] && !rec.get('complete') && !rec.get('failed'))) {
                    return true;
                }
            });

        }
        else {
            this.taskStore.filter(function(rec) {
                if (rec.get('date') >= week[0] && rec.get('date') <= week[1]) {
                    return true;
                }
            });

        }

        this.onRefresh();
    },

    getWeek : function(date) {
        // If no date object supplied, use current date
        // Copy date so don't modify supplied date
        var now = date ? new Date(date) : new Date();

        // set time to some convenient value
        now.setHours(0,0,0,0);

        // Get the previous Monday
        var monday = new Date(now);
        monday.setDate(monday.getDate() - monday.getDay() + 1);

        // Get next Sunday
        var sunday = new Date(now);
        sunday.setDate(sunday.getDate() - sunday.getDay() + 7);

        // Return array of date objects
        return [monday, sunday];
    },

    saveChanges : function() {

        this.taskStore.commitChanges();
        var updatedRecords = this.taskStore.getModifiedRecords();
        var deleteRecord =  [];
        Ext4.each(updatedRecords, function(record) {
            if (record.get('failed') == true) {
                this.taskStore.clearFilter(true);
                if (record.get('cat') == 'nano' || record.get('cat') == 'aps') {
                    this.taskStore.each(function(rec) {
                        if (rec.get('cat') == record.get('cat') &&
                            rec.get('lotNum') == record.get('lotNum') &&
                            rec.get('temperature') == record.get('temperature') &&
                            rec.get('date') > record.get('date')) {
                            deleteRecord.push(rec);
                        }
                    });
                }
                else if (record.get('cat') == 'HPLC' || record.get('cat') == 'UV') {
                    this.taskStore.each(function(rec) {
                        if (rec.get('cat') == record.get('cat') &&
                            rec.get('lotNum') == record.get('lotNum') &&
                            rec.get('date') > record.get('date')) {
                            deleteRecord.push(rec);
                        }
                    });
                }
            }
        }, this);

        if (Ext4.isEmpty(deleteRecord)) {
            this.getTasks();
        }
        else {
            this.taskStore.remove(deleteRecord);
            this.taskStore.sync({
                success: function() {
                    this.getTasks();
                },
                scope: this
            });
        }
    },

    onRefresh : function() {
        this.taskStore.reload();
    },

    getMessage : function(recordIndex) {

        var record = this.taskPanel.getView().getRecord(this.taskPanel.getView().getNode(recordIndex));

        if (record.get('cat') == 'nano' || record.get('cat') == 'aps') {
            Ext4.Msg.show({
                title: 'Delete Future Tasks?',
                msg: 'Once you click "Save Changes" all future timepoints at Temperature ' + record.get('temperature') + 'C for ' + record.get('lotNum/Name') + ' will be removed!',
                buttons: Ext4.Msg.OK,
                scope: this
            });
        }
        else {
            Ext4.Msg.show({
                title: 'Delete Future Tasks?',
                msg: 'Once you click "Save Changes" all future timepoints for ' + record.get('lotNum/Name') + ' will be removed!',
                buttons: Ext4.Msg.OK,
                scope: this
            });
        }
    }
});

