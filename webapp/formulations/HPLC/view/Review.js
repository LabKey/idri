/*
 * Copyright (c) 2012 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('HPLC.view.Review', {
    extend : 'Ext.panel.Panel',

    alias : 'widget.hplcreview',

    border : false,

    frame  : false,

    initComponent : function() {

        this.summary = Ext4.create('Ext.Component', {
            border: false, frame : false,
            margin: 5,
            autoEl : {
                tag : 'div',
                html : 'Run Information'
            }
        });

        this.items = [this.summary];

        this.buttons = [Ext4.create('Ext.Button', {
            text : 'Save',
            handler : this.onSave,
            scope : this
        })];

        this.callParent();
    },

    onSave : function(btn) {
        this.fireEvent('save');
    },

    updateRuns : function(runs) {
        this.runs = runs;

        var loaded = this.isLoaded();

        // Just update grids if they are already loaded
        if (loaded) {
            var rawRuns = this._processRawRuns(this.runs);
            this.runGrid.getStore().loadRawData(rawRuns.runs);
            this.resultGrid.getStore().loadRawData(rawRuns.results)
        }
        else {
            this.loadGrid();
        }
    },

    isLoaded : function() {
        // don't want to return the runGrid
        return (this.runGrid ? true : false);
    },

    loadGrid : function() {

        if (this.runGrid) {
            return;
        }

        Ext4.define('HPLC.model.Run', {
            extend : 'Ext.data.Model',
            fields : [
                {name : 'LotNumber'},
                {name : 'StorageTemperature'},
                {name : 'Time'}
            ]
        });

        Ext4.define('HPLC.model.Result', {
            extend : 'Ext.data.Model',
            fields : [
                {name : 'formulation'},
                {name : 'TestType'},
                {name : 'name'}
            ]
        });

        var rawRuns = this._processRawRuns(this.runs);

        var runStore = Ext4.create('Ext.data.Store', {
            model : 'HPLC.model.Run',
            proxy : {
                type : 'memory'
            },
            data  : rawRuns.runs
        });

        var resultStore = Ext4.create('Ext.data.Store', {
            model : 'HPLC.model.Result',
            proxy : {
                type: 'memory'
            },
            data  : rawRuns.results
        });

        this.runGrid = Ext4.create('Ext.grid.Panel', {
            store : runStore,
            columns : [
                {
                    text : 'Formulation',
                    flex : 1,
                    dataIndex : 'LotNumber'
                },{
                    text : 'Temperature',
                    flex : 1,
                    dataIndex : 'StorageTemperature'
                },{
                    text : 'Time',
                    flex : 1,
                    dataIndex : 'Time'
                }
            ]
        });

        this.resultGrid = Ext4.create('Ext.grid.Panel', {
            store : resultStore,
            columns : [
                {
                    text : 'Type',
                    flex : 1,
                    dataIndex : 'TestType'
                },{
                    text : 'Name',
                    flex : 1,
                    dataIndex : 'name'
                }
            ]
        });

        this.add(this.runGrid);

        this.add(Ext4.create('Ext.Component', {
            border: false, frame : false,
            margin: 5,
            autoEl : {
                tag : 'div',
                html : 'Result Information'
            }
        }));

        this.add(this.resultGrid);
    },

    _processRawRuns : function(runs) {
        var _runs = [], results = [];
        for (var r=0; r < runs.length; r++) {

            /* populate runs */
            _runs.push(runs[r].properties);

            /* populate results */
            for (var d=0; d < runs[r].dataRows.length; d++) {
                results.push(runs[r].dataRows[d]);
            }
        }

        return {
            runs    : _runs,
            results : results
        };
    }
});