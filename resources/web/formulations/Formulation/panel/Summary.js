/*
 * Copyright (c) 2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('Formulation.panel.Summary', {

    extend : 'Ext.panel.Panel',

    initComponent : function() {

        Ext4.apply(this, {
            layout: 'border',
            bodyStyle : 'background-color: transparent;',
            border : false,
            items : [this.getTabPanel()]
        });

        this.callParent();

        // Lookup the Assay ID for Particle Size
        this.lookupParticleSizeAssay('Particle Size');
    },

    getTabPanel : function() {

        if (this.tabPanel)
            return this.tabPanel;

        this.tabPanel = Ext4.create('Ext.tab.Panel', {
            region: 'center',
            activeTab : 0,
            autoHeight: false,
            deferredRender : false,
            border : true,
            plain  : true,
            items  : this.getTabItems()
        });

        return this.tabPanel;
    },

    getTabItems : function() {
        return [
            this.getSummaryView(),
            this.getParticleSizeView()
        ];
    },

    getFormulation : function() {
        return this.formulation;
    },

    getSummaryView : function() {

        if (this.summaryView) {
            return this.summaryView;
        }

        Ext4.define('Model.Formulation', {
            extend : 'Ext.data.Model',
            fields : [
                {name : 'rowID', type : 'int'},
                {name : 'batch'},
                {name : 'dm', type : 'date'},
                {name : 'type'},
                {name : 'batchsize'},
                {name : 'nbpg'},
                {name : 'catalog'},
                {name : 'grant'},
                {name : 'comments'},
                {name : 'materials'},
                {name : 'materialsString'}
            ],
            proxy : {
                type : 'ajax',
                url  : LABKEY.ActionURL.buildURL('idri', 'getFormulation'),
                extraParams : {
                    materialName : this.getFormulation()
                },
                reader : {
                    root : 'formulation'
                }
            }
        });

        var me = this;
        var loadFormulation = function(batch) {
            Model.Formulation.getProxy().setExtraParam('materialName', batch);
            Model.Formulation.load(batch, {
                success : function(d) {
                    me.summaryStore.loadRecords([d]);
                },
                scope : me
            });
        };

        this.summaryStore = Ext4.create('Ext.data.Store', {
            model : 'Model.Formulation',
            loadFormulation : loadFormulation,
            scope : this
        });

        // Initially load the formulation -- could just allow a user to type one otherwise
        this.summaryStore.loadFormulation(this.formulation);

        var summaryTpl = new Ext4.XTemplate(
            '<tpl for=".">',
                '<table>',
                    '<tr>',
                        '<td class="labkey-form-label">Date of Manufacture</td><td>{dm:this.customDate}</td>',
                    '</tr><tr>',
                        '<td class="labkey-form-label">Type</td><td>{type:this.renderData}</td>',
                    '</tr><tr>',
                        '<td class="labkey-form-label">Lot Size</td><td>{batchsize:this.renderData}</td>',
                    '</tr><tr>',
                        '<td class="labkey-form-label">Notebook Page</td><td>{nbpg:this.renderData}</td>',
                    '</tr><tr>',
                        '<td class="labkey-form-label">Catalog</td><td>{catalog:this.renderData}</td>',
                    '</tr><tr>',
                    '</tr><tr>',
                        '<td class="labkey-form-label">Grant</td><td>{grant:this.renderData}</td>',
                    '</tr><tr>',
                        '<td class="labkey-form-label">Comments</td><td>{comments:this.renderData}</td>',
                    '</tr><tr>',
                        '<td class="labkey-form-label">Raw Materials</td><td>{materialsString:this.renderData}</td>',
                    '</tr>',
                '</table>',
            '</tpl>',
            {
                compiled : true,
                renderData : function(data) {
                    if (data != null) {
                        return Ext4.String.htmlEncode(data);
                    }
                    return 'N/A';
                },
                customDate : function(date) {
                    return Ext4.util.Format.date(date, 'F j, Y');
                }
            }
        );


        this.summaryView = Ext4.create('Ext.view.View', {
            border : false,
            tpl : summaryTpl,
            store : this.summaryStore
        });

        this.summaryPanel = Ext4.create('Ext.panel.Panel', {
            title : 'Summary',
            layout : 'vbox',
            defaults : {
                border : false, frame : false,
                padding: '3 0 3 10'
            },
            items : [{
                xtype : 'container',
                layout : 'hbox',
                defaults : {
                    margin: '3 0 3 10'
                },
                items : [{
                    xtype : 'button',
                    margin: '3 0 3 0',
                    text : 'Edit',
                    handler : function() {
                        window.location = LABKEY.ActionURL.buildURL('idri', 'createFormulation', null, {
                            RowId : this.summaryStore.getAt(0).data.rowID
                        });
                    },
                    scope: this
                },{
                    xtype : 'button',
                    text : 'Browse',
                    handler : function() {
                        window.location = this.formulationSetURL;
                    },
                    scope : this
                },{
                    xtype : 'button',
                    text : 'Sample View',
                    handler : function() {
                        window.location = LABKEY.ActionURL.buildURL("experiment", "showMaterial", null, {
                            rowId : this.summaryStore.getAt(0).data.rowID
                        });
                    },
                    scope : this
                }]
            },{
                html : '<h3>Information</h3>'
            }, this.summaryView, {
                html : '<h3>Concentrations</h3>'
            },{
                xtype : 'box',
                autoEl : {
                    tag : 'div'
                },
                listeners : {
                    afterrender : function(box) {
                        this.renderConcentrations(box.getEl().id);
                    },
                    scope : this
                }
            }]
        });

        return this.summaryPanel;
    },

    load : function(formulation) {
        this.formulation = formulation;

        // load information
        this.summaryStore.loadFormulation(formulation);

        // load concentrations
        if (this.qwp) {
            this.renderConcentrations(this.qwp.renderTo, true);
        }
    },

    renderConcentrations : function(targetEl, clear) {
        if (clear)
            Ext4.get(targetEl).update('');
        this.qwp = new LABKEY.QueryWebPart({
            renderTo : targetEl,
            schemaName : 'idri',
            queryName  : 'concentrations',
            buttonBarPosition : 'none',
            showPagination : false,
            frame : false,
            filters : [
                LABKEY.Filter.create('Lot/Name', this.formulation, LABKEY.Filter.Types.EQUAL)
            ]
        });
    },

    getParticleSizeView : function() {
        if (this.psView) {
            return this.psView;
        }

        var nanoId = Ext4.id();
        var _nanoId = Ext4.id();
        var apsId  = Ext4.id();
        var _apsId  = Ext4.id();
        this.psView = Ext4.create('Ext.panel.Panel', {
            title : 'Particle Size',
            border : false,
            defaults : {
                border : false, frame : false,
                padding: '3 0 3 10'
            },
            items : [{
                html : '<h3>Failure Comparison</h3>'
            },{
                xtype : 'container',
                layout : 'hbox',
                width : '100%',
                defaults : {
                    border : false, frame : false,
                    padding: '3 0 3 10',
                    flex : 1
                },
                items : [{
                    id    : nanoId,
                    xtype : 'box',
                    autoEl : {
                        tag : 'div',
                        html : 'Nano Machine'
                    }
                },{
                    id    : apsId,
                    xtype : 'box',
                    autoEl : {
                        tag : 'div',
                        html : 'APS Machine'
                    }
                }]
            },{
                html : '<h3>Stability Charts</h3>'
            },{
                xtype : 'container',
                layout : 'hbox',
                width : '100%',
                defaults : {
                    border : false, frame : false,
                    padding: '3 0 3 10',
                    flex : 1
                },
                items : [{
                    id    : _nanoId,
                    xtype : 'box',
                    autoEl : {
                        tag : 'div',
                        html : 'Nano Machine'
                    }
                },{
                    id    : _apsId,
                    xtype : 'box',
                    autoEl : {
                        tag : 'div',
                        html : 'APS Machine'
                    }
                }]
            }],
            listeners : {
                afterrender : function() {
                    if (this.psAssayId) {
                        this.renderPSGrid(nanoId, 'nano');
                        this.renderPSGrid(apsId, 'aps');
                    }
                    else {
                        this.on('assayready', function(id) {
                            this.renderPSGrid(nanoId, 'nano');
                            this.renderPSGrid(apsId, 'aps');
                        }, this, {single: true});
                    }
                    this.displayGraphic(_nanoId, '5C', 'nano');
                    this.displayGraphic(_apsId, '5C', 'aps');
                },
                scope : this
            }
        });

        return this.psView;
    },

    displayGraphic : function(targetEl, temp, tool) {
        var _name = this.formulation;

        var parameters = {
            'RunName': _name,
            'StoreTemp': temp,
            'Tool': tool
        };

        /* First check to make sure there are results for the given params */
        LABKEY.Query.selectRows({
            schemaName : 'assay.particleSize.Particle Size',
            queryName  : 'R_ReportSummary',
            parameters : parameters,
            success    : function(data) {
                this._onGraphicSuccess(data, targetEl, temp, tool);
            },
            failure    : function(error) {
                console.warn('Failed to Query for Particle Size Report.');
            },
            scope      : this
        });
    },

    _onGraphicSuccess : function(data, targetEl, temp, tool) {

        if (data.rows.length > 0) {

            var el = Ext4.get(targetEl);
            if (el) {
                var me = this;
                var wp = new LABKEY.WebPart({
                    partName : 'Report',
                    renderTo : targetEl,
                    frame    : 'none',
                    partConfig : {
                        reportId      :'module:idri/schemas/assay/Particle Size Data/Z-Ave Graph.r',
                        showSection   :'labkey' + tool + '_png',
                        'nameContains': this.formulation,
                        'exactName'   : this.formulation,
                        'storageTemp' : temp,
                        'analysisTool': tool
                    },
                    success : this.doLayout,
                    scope : this
                });
                wp.render();
            }

            /* Check if there is a cached image */
//            var date = new Date(); // bypass browser cache
//            var imgURLSuffix = '%40files/PSData/' + this.formulation + '_' + tool + 'PS.png?' + date.getTime();
//            var url  = LABKEY.ActionURL.buildURL('_webdav', imgURLSuffix);
        }
        else {
            console.log('no data found.');
        }
    },

    renderPSGrid : function(targetEl, machine) {
        if (!this.psAssayId) {
            this.psGridConfig = arguments;
            return;
        }
        var sql = 'SELECT CASE WHEN psbasepivot.StorageTemperature = \'5C\' THEN \'05C\' ELSE psbasepivot.StorageTemperature END AS Temperature, ' +
                'MIN(psbasepivot."T=0") AS "DM", ' +
                'MIN(psbasepivot."1 wk") AS "1 wk", ' +
                'MIN(psbasepivot."2 wk") AS "2 wk", ' +
                'MIN(psbasepivot."1 mo") AS "1 mo", ' +
                'MIN(psbasepivot."3 mo") AS "3 mo", ' +
                'MIN(psbasepivot."6 mo") AS "6 mo", ' +
                'MIN(psbasepivot."12 mo") AS "12 mo", ' +
                'MIN(psbasepivot.ZAveMean) AS "Mean" ' +
                'FROM psbasepivot ' +
                'WHERE psbasepivot.RowId=' + this.psAssayId + ' AND psbasepivot.AnalysisTool=\'' + machine + '\'' +
                'GROUP BY psbasepivot.StorageTemperature';

        var store = new LABKEY.ext.Store({
            schemaName : 'assay',
            sql : sql
        });

        var grid = new LABKEY.ext.EditorGridPanel({
            renderTo : targetEl,
            store : store,
            showExportButton : false,
            autoHeight : true,
            width : 400,
            editable : false,
            enableHdMenu : false,
            lookups : false,
            selModel: null,
            listeners : {
                afterrender : function(grid) {
                    grid.getTopToolbar().hide();
                    grid.getBottomToolbar().hide();
                },
                columnmodelcustomize : function(cm, idx) {
                    if (!cm || cm.length < 1) {
                        return;
                    }
                    cm[cm.length-1].hidden = true;
                    cm[0].width = 50;
                    for (var tp in idx) {
                        idx[tp].renderer = this._particleSizeColumnRenderer;
                    }
                },
                scope : this
            }
        });

        Ext4.EventManager.onWindowResize(function() {
            var width = this.psView.getSize().width;
            var _w = Math.floor(width * .5) - 20;
            grid.setWidth(_w);
        }, this);
    },

    _particleSizeColumnRenderer : function(data, cellMetaData, record) {
        var mean = record.get("Mean");
        if (!data || cellMetaData.css.search("x-grid3-cell-last") != -1) {
            return data;
        }
        if (mean * 1.5 > data) {
            cellMetaData.attr = 'style="background:green; color: white;"';
        }
        else if (mean * 1.5 < data) {
            cellMetaData.attr = 'style="background:red; color: white;"';
        }
        return data;
    },

    lookupParticleSizeAssay : function(assayName) {
        if (this.psAssayId)
            return this.psAssayId;

        // Lookup the Assay ID for Particle Size
        LABKEY.Query.selectRows({
            schemaName : 'assay',
            queryName  : assayName + ' Runs',
            filterArray: [
                LABKEY.Filter.create('Name', this.formulation, LABKEY.Filter.Types.STARTS_WITH)
            ],
            success : function(data) {
                if (data.rows.length < 1) {
                    console.log('no PS information available');
                    return;
                }
                this.psAssayId = data.rows[0].RowId;
                this.fireEvent('assayready', this.psAssayId);
            },
            scope : this
        });
    }
});