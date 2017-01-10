/*
 * Copyright (c) 2015-2016 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('LABKEY.idri.TaskListPanel', {

    extend: 'Ext4.panel.Panel',

    alias: 'widget.idri-tasklistpanel',

    buttonAlign: 'left',

    layout: 'fit',

    taskMode: 'weektasks',

    initComponent : function() {
        this.ids = {
            oldTasks: Ext4.id(),
            taskDate: Ext4.id()
        };

        this.getTaskStore();

        this.items = [this.getGrid()];

        this.callParent();
    },

    getGrid : function() {
        if (!this.grid) {
            var taskStore = this.getTaskStore();

            this.grid = Ext4.create('Ext4.grid.Panel', {
                store: taskStore,
                columns: this.storeColumns(),
                frame: false,
                border: false,
                height: 500,
                tbar: [{
                    text: 'Save Changes',
                    tooltip: 'Click to save all changes to the database',
                    handler: this.saveChanges.bind(this)
                },'-',{
                    text: 'Export',
                    tooltip: 'Click to Export the data to Excel',
                    handler: this.exportExcel.bind(this)
                },'-',{
                    text: 'Refresh',
                    tooltip: 'Click to refresh the table',
                    handler: this.reloadTasks.bind(this)
                },'-',{
                    xtype: 'radiogroup',
                    id: this.ids.oldTasks,
                    columns: [135, 165],
                    width: 300,
                    items: [
                        {
                            boxLabel: 'Show overdue tasks',
                            checked: this.taskMode === 'overduetasks',
                            inputValue: 'overduetasks',
                            name: 'taskMode'
                        },{
                            boxLabel: 'Show tasks for the week of:',
                            checked: this.taskMode === 'weektasks',
                            inputValue: 'weektasks',
                            name: 'taskMode'
                        }
                    ],
                    listeners: {
                        change: function(rbg, newValue) {
                            this.taskMode = newValue.taskMode;
                            this.reloadTasks();

                            Ext4.getCmp(this.ids.taskDate).setDisabled(this.taskMode === 'overduetasks');
                        },
                        scope: this
                    }
                },{
                    xtype: 'datefield',
                    id: this.ids.taskDate,
                    disabled: this.taskMode === 'overduetasks',
                    value: new Date(),
                    listeners: {
                        change: this.reloadTasks.bind(this)
                    }
                }],
                bbar: Ext4.create('Ext.PagingToolbar', {
                    store: taskStore,
                    displayInfo: true,
                    emptyMsg: 'No data to display'
                }),
                selModel: {
                    selType: 'cellmodel'
                },
                plugins: [Ext4.create('Ext.grid.plugin.CellEditing', { clicksToEdit: 2 })]
            });
        }

        return this.grid;
    },

    exportExcel : function() {

        var rows = [];

        // headers
        rows.push([
            'Category', 'Lot', 'Temp', 'Timepoint', 'Date Due',
            'Type', 'Adjuvant', 'Comment', 'Importance', 'Complete',
            'Fail'
        ]);

        // rows
        this.taskStore.each(function(rec) {
            rows.push([
                rec.get('cat'), rec.get('lotNum/Name'), rec.get('temperature'),rec.get('timepoint'), rec.get('date'),
                rec.get('type'), rec.get('adjuvant'), rec.get('comment'), rec.get('importance'), rec.get('complete'),
                rec.get('failed')
            ]);
        });

        LABKEY.Utils.convertToExcel({
            fileName: 'TaskList.xlsx',
            sheets: [{
                name: 'TaskList',
                data: rows
            }]
        });
    },

    generateTaskFilters : function(date) {

        var week;

        if (this.taskMode === 'overduetasks') {

            // set the filter to the current week
            week = this.getWeek();

            return [
                // Use NOT_EQUAL true since value not being set is considered false (but may actually be NULL)
                LABKEY.Filter.create('complete', true, LABKEY.Filter.Types.NOT_EQUAL),
                LABKEY.Filter.create('failed', true, LABKEY.Filter.Types.NOT_EQUAL),
                LABKEY.Filter.create('date', week[1], LABKEY.Filter.Types.DATE_LESS_THAN_OR_EQUAL)
            ];
        }
        else if (this.taskMode === 'weektasks') {

            // set the filter to the specified week
            week = this.getWeek(date);

            return [
                LABKEY.Filter.create('date', week[0], LABKEY.Filter.Types.DATE_GREATER_THAN_OR_EQUAL),
                LABKEY.Filter.create('date', week[1], LABKEY.Filter.Types.DATE_LESS_THAN_OR_EQUAL)
            ];
        }

        return [];
    },

    getTaskStore : function() {
        if (!this.taskStore) {
            this.taskStore = Ext4.create('LABKEY.ext4.Store', {
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
                columns: [ 'lotNum/Name', '*' /* The rest of the columns */],
                filterArray: this.generateTaskFilters(),
                autoLoad: true,
                maxRows: 40,
                remoteSort: true
            });
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
            { text: 'Timepoint', dataIndex: 'timepoint', width: 80, editable: false },
            { text: 'Date Due', dataIndex: 'date', renderer: Ext4.util.Format.dateRenderer('m/d/y'), width: 90, editable: false },
            { text: 'Type', dataIndex: 'type', width: 90, editable: false },
            { text: 'Adjuvant', dataIndex: 'adjuvant', width: 100, editable: false },
            { text: 'Importance',  dataIndex: 'importance', width: 90, editable: false },
            {
                xtype: 'checkcolumn',
                header: 'Complete',
                dataIndex: 'complete',
                width: 80
            },{
                xtype: 'checkcolumn',
                header: 'Fail',
                dataIndex: 'failed',
                width: 50
            },{
                text: 'Comment',
                header: 'Comment',
                dataIndex: 'comment',
                editable: true,
                flex: 1,
                field: {
                    type: 'textfield'
                }
            },
        ];
    },

    reloadTasks : function() {
        var taskStore = this.getTaskStore();
        taskStore.filterArray = this.generateTaskFilters(Ext4.getCmp(this.ids.taskDate).getValue());
        taskStore.reload();
    },

    removeFutureTasks : function(failedTasks, cb, scope) {

        var me = this;
        var callback = function() {
            if (Ext4.isFunction(cb)) {
                cb.call(scope || me);
            }
        };

        var filterSets = [];
        Ext4.each(failedTasks, function(task) {
            var category = task.cat;

            var filters = [
                LABKEY.Filter.create('lotNum', task.lotNum),
                LABKEY.Filter.create('cat', category),
                LABKEY.Filter.create('date', task.date, LABKEY.Filter.Types.DATE_GREATER_THAN)
            ];

            category = category.toLowerCase();
            if (category === 'nano' || category === 'aps') {
                filters.push(LABKEY.Filter.create('temperature', task.temperature));
            }

            filterSets.push(filters);
        });

        if (filterSets.length > 0) {
            this.aggregateTasks(filterSets, function(futureTasks) {

                var rows = [];
                for (var key in futureTasks) {
                    if (futureTasks.hasOwnProperty(key)) {
                        rows.push({
                            Key: key
                        });
                    }
                }

                if (rows.length > 0) {
                    LABKEY.Query.deleteRows({
                        schemaName: 'lists',
                        queryName: 'TaskList',
                        rows: rows,
                        success: callback
                    });
                }
                else {
                    callback();
                }
            }, this);
        }
        else {
            callback();
        }
    },

    aggregateTasks : function(filterSets, cb, scope) {

        var taskKeys = {};
        var requestCount = 0;
        var totalRequests = filterSets.length;

        Ext4.each(filterSets, function(filterSet) {
            LABKEY.Query.selectRows({
                schemaName: 'lists',
                queryName: 'TaskList',
                filterArray: filterSet,
                requiredVersion: 16.2,
                columns: 'Key',
                success: function(data) {
                    Ext4.each(data.rows, function(row) {
                        taskKeys[row['Key'].value] = true;
                    });

                    requestCount++;
                    if (requestCount === totalRequests) {
                        if (Ext4.isFunction(cb)) {
                            cb.call(scope || this, taskKeys);
                        }
                    }
                }
            });
        });
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

        var taskStore = this.getTaskStore();
        var modified = taskStore.getModifiedRecords();

        if (modified.length === 0) {
            return;
        }

        // determine which tasks have been marked as failed, later used
        // to determine which future tasks to clean up.
        var failedTasks = [];
        Ext4.each(modified, function(task) {
            if (task.get('failed') === true) {
                failedTasks.push(Ext4.clone(task.data));
            }
        });

        var me = this;
        var removeTasks = false;

        var doSave = function() {
            me.getEl().mask('Saving...');

            var onCommitException = function(store) {
                // remove write listener
                me.un('write', onSaveSuccess, me);

                // store handles displaying error to the user
                me.getEl().unmask();
            };

            var onSaveSuccess = function(store) {
                // remove commit exception listener
                me.un('commitexception', onCommitException, me);

                if (removeTasks) {
                    me.removeFutureTasks(failedTasks, function() {
                        me.getEl().unmask();
                        me.reloadTasks();
                    }, me);
                }
                else {
                    me.getEl().unmask();
                    me.reloadTasks();
                }
            };

            // write event fired once changes are successfully committed
            taskStore.on('write', onSaveSuccess, me, {single: true});

            // commitexception event fired if there is an error when committing
            taskStore.on('commitexception', onCommitException, me, {single: true});

            taskStore.commitChanges();
        };

        if (failedTasks.length > 0) {
            var checkboxId = Ext4.id();
            var windowId = Ext4.id();

            Ext4.create('Ext.window.Window', {
                id: windowId,
                title: 'Task List - Save Changes',
                autoShow: true,
                height: 200,
                width: 350,
                bodyPadding: 10,
                resizable: false,
                constrain: true,
                constrainTo: this.getRegion(),
                modal: true,
                items: [{
                    xtype: 'box',
                    html: 'Some lots were marked as failing. Would you like to remove future tasks for these Lots at the failed temperatures?'
                },{
                    xtype: 'checkboxfield',
                    id: checkboxId,
                    boxLabel: 'Remove future tasks (recommended)',
                    checked: true,
                    style: 'margin-top: 10px'
                },{
                    xtype: 'container',
                    style: 'margin-top: 25px',
                    layout: {
                        type: 'hbox',
                        pack: 'center'
                    },
                    items: [{
                        xtype: 'button',
                        text: 'OK',
                        handler: function() {
                            removeTasks = Ext4.getCmp(checkboxId).getValue() === true;
                            doSave();
                            Ext4.getCmp(windowId).close();
                        }
                    },{
                        xtype: 'box',
                        html: '&nbsp;&nbsp;'
                    },{
                        xtype: 'button',
                        text: 'Cancel',
                        handler: function() {
                            Ext4.getCmp(windowId).close();
                        }
                    }]
                }]
            });
        }
        else {
            doSave();
        }
    }
});

