/*
 * Copyright (c) 2014 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('LABKEY.SignalData.QualityControl', {
    extend: 'Ext.panel.Panel',

    layout: 'card',

    minWidth: 650,

    height: 700,

    initComponent : function() {

        this.items = [];

        this.callParent();

        this.getRunContext(function(context) {
            this.loadContext(context);
        }, this);
    },

    loadContext : function(context) {
        this.context = context;
        this.add(this.getSampleCreator());
    },

    getStandardCreator : function() {
        if (!this.stdCreator) {
            this.stdCreator = Ext4.create('LABKEY.SignalData.StandardCreator', {
                context: this.context,
                listeners: {
                    complete: function() {
                        this.getLayout().setActiveItem(this.getSampleCreator());
                    },
                    scope: this
                },
                scope: this
            });
        }
        return this.stdCreator;
    },

    getSampleCreator : function() {
        if (!this.sampleCreator) {
            this.sampleCreator = Ext4.create('LABKEY.SignalData.SampleCreator', {
                context: this.context,
                listeners: {
                    requeststandards: function() {
                        this.getLayout().setActiveItem(this.getStandardCreator());
                    },
                    scope: this
                },
                scope: this
            });
        }
        return this.sampleCreator;
    },

    getSelectedRuns:function(callback,scope){
        LABKEY.DataRegion.getSelected({
            selectionKey: LABKEY.ActionURL.getParameter('selectionKey'),
            success: function (resultSelection) {
                SignalDataService.getRun(LABKEY.ActionURL.getParameter('schemaName'), resultSelection.selected, null, callback, scope);
            },
            error:function(){
                console.log("Failed to get anything from server: Bad Selection Key");
            },
            scope: this
        });
    },

    getSelectedResults:function(callback, scope) {
        LABKEY.DataRegion.getSelected({
            selectionKey: LABKEY.ActionURL.getParameter('selectionKey'),
            success: function (resultSelection) {
                LABKEY.Query.selectRows({
                    schemaName: LABKEY.ActionURL.getParameter('schemaName'),
                    queryName: 'Data',
                    requiredVersion: 13.2,
                    filterArray: [LABKEY.Filter.create('RowId', resultSelection.selected.join(';'), LABKEY.Filter.Types.IN)],
                    success: function (result) {
                        var runNames = [];
                        var dataNames = [];
                        if (result.rows.length > 0) {

                            Ext4.each(result.rows, function (row) {
                                runNames.push(row['Run/RunIdentifier'].value);
                                dataNames.push(row['Name'].value);
                            });

                            LABKEY.Query.selectRows({
                                schemaName: LABKEY.ActionURL.getParameter('schemaName'),
                                queryName: 'Runs',
                                requiredVersion: 13.2,
                                columns: 'RowId',
                                filterArray: [
                                    LABKEY.Filter.create('RunIdentifier', runNames.join(';'), LABKEY.Filter.Types.IN)
                                ],
                                success: function (runs) {
                                    var runIds = [];

                                    Ext.each(runs.rows, function (row) {
                                        runIds.push(row['RowId'].value);
                                    });

                                    SignalDataService.getRun(LABKEY.ActionURL.getParameter('schemaName'), runIds, dataNames, callback, scope);
                                },
                                scope: this
                            });
                        }
                    },
                    scope: this
                });
            },
            scope: this
        });
    },

    getRunContext: function(callback, scope) {
        if(LABKEY.ActionURL.getParameter('selectionKey').includes('$Runs$'))
            this.getSelectedRuns(callback, scope || this);
        else
            this.getSelectedResults(callback, scope || this);
    }
});
