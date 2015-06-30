/*
 * Copyright (c) 2014-2015 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
function initFormulationDetails(assayId)
{
    var stabilityTpl = new Ext4.XTemplate(
            '<table class="stabilitytable">',
                '{[ this.renderHeaders() ]}',
                '<tpl for=".">',
                    '<tr class="temprow">{[ this.renderDatas(values) ]}</tr>',
                '</tpl>',
            '</table>',
            {
                renderDatas : function(values) {
                    var model = Ext4.create('IDRI.Stability', {});
                    var html = '';
                    var compare = values['ZAveMean'] * 1.5;
                    Ext4.each(model.fields.items, function(f) {
                        if (f.name != 'id') {
                            var style = '';
                            if (f.name.indexOf('::Average') > -1) {
                                style += 'style="color: white; ';
                                var data = values[f.name];
                                if (compare !== 0 && data === 0) {
                                    /* do nothing */
                                }
                                else if (compare > data) {
                                    style += 'background-color: green;';
                                }
                                else if (compare < data) {
                                    style += 'background-color: red;';
                                }
                                style += '"';
                            }
                            html += '<td ' + style + '>' + values[f.name] + '</td>';
                        }
                    });
                    return html;
                },
                renderHeaders : function() {
                    var model = Ext4.create('IDRI.Stability', {});
                    var html = '';
                    Ext4.each(model.fields.items, function(f) {
                        if (f.name != 'id') {
                            html += '<th>' + (f.header ? f.header : f.name) + '</th>';
                        }
                    });
                    return html;
                }
            }
    );

    var processStabilityQuery = function(selectRowsData) {

        // Iterate over all the columns to determine the set of timepoint columns
        var columns = selectRowsData.columnModel;
        var columnSet = [{name: 'Temperature'}];
        Ext4.each(columns, function(colModel) {
            if (colModel.dataIndex.indexOf('::Average') > -1) {
                columnSet.push({
                    name: colModel.dataIndex,
                    header: colModel.header,
                    type: 'int'
                });
            }
        });
        columnSet.push({name: 'ZAveMean', header: 'Mean', type: 'int'});

        // Redefine model based on available columns
        Ext4.define('IDRI.Stability', {
            extend: 'Ext.data.Model',
            fields: columnSet
        });

        var store = Ext4.create('Ext.data.Store', {
            model: 'IDRI.Stability',
            data: selectRowsData.rows
        });

        var el = Ext4.get('owngrid');
        if (el) {
            el.update('');

            Ext4.create('Ext.view.View', {
                renderTo: el,
                tpl: stabilityTpl,
                itemSelector: 'tr.temprow',
                store: store
            });
        }
    };

    var lookupAssayId = function(name, machine) {

        LABKEY.Query.selectRows({
            schemaName: 'assay',
            queryName : 'Particle Size Runs',
            filterArray: [ LABKEY.Filter.create('Name', name, LABKEY.Filter.Types.STARTS_WITH) ],
            maxRows: 1,
            success : function(data) {
                if (data.rows.length < 1) {
                    var el = Ext4.get('testdiv');
                    if (el) {
                        el.update('No Particle Size results available for ' + name);
                    }
                    return;
                }

                LABKEY.Query.selectRows({
                    schemaName: 'assay',
                    queryName: 'MachineAssayStability',
                    parameters: {
                        'AssayRowId': data.rows[0].RowId,
                        'MachineType': machine
                    },
                    success: processStabilityQuery
                });
            }
        });
    };

    var panel = new Ext.Panel({
        renderTo : 'machine-select',
        bodyStyle : 'background-color: transparent;',
        border: false,
        frame : false,
        items : [{
            xtype: 'combo',
            mode: 'local',
            width: 80,
            editable: false,
            store : new Ext.data.ArrayStore({
                fields : [ 'machine' ],
                data : [['aps'],['nano']]
            }),
            valueField : 'machine',
            displayField : 'machine',
            triggerAction : 'all',
            listeners : {
                afterrender : function(cb) {
                    cb.setValue('aps');
                    cb.fireEvent('select', cb);
                },
                select : function(cb) {
                    var grid = Ext.getCmp('query-assay-grid');
                    if (grid) {
                        grid.destroy();
                        var el = Ext.get('testdiv');
                        if (el) {
                            el.mask('Loading ' + cb.getValue());
                        }
                    }
                    lookupAssayId(assayId, cb.getValue());
                }
            }
        }]
    });

    //
    // Concentrations
    //
    new LABKEY.QueryWebPart({
        renderTo   : 'concentrationDiv',
        schemaName : 'idri',
        queryName  : 'concentrations',
        buttonBarPosition: 'none',
        frame: 'none',
        showPagination : false,
        filters    : [ LABKEY.Filter.create('Lot/Name', assayId, LABKEY.Filter.Types.CONTAINS) ]
    });

    buildPSReports('5C', assayId, 'aps', 'aps-report');
    buildPSReports('5C', assayId, 'nano', 'nano-report');

    //
    // Provisional HPLC
    //
    function viewSpectrum(runId) {
        HPLCService.getRun("assay.provisionalHPLC.pHPLC", runId, function(context) {

            var _g;
            var SHOW_ALL = false;

            function doFilters() {
                //
                // Filter to remove PRE_, POST_, and BLANK tags
                //
                var filters = [{
                    filterFn: function(item) {
                        return item.get('name').indexOf('PRE_') == -1 && item.get('name').indexOf('POST_') == -1;
                    }
                },{
                    filterFn: function(item) {
                        return item.get('name').indexOf('BLANK') == -1;
                    }
                }];

                if (!SHOW_ALL) {
                    filters.push({
                        filterFn: function(item) {
                            var name = item.get('name');
                            return name.indexOf('TD') != -1 || name.indexOf('QD') != -1 || name.indexOf('QF') != -1;
                        }
                    });
                }

                _g.getStore().clearFilter();
                _g.getStore().filter(filters);
            }

            var PLOTID = Ext4.id();
            function renderPlot(content) {
                Ext4.getCmp(PLOTID).renderPlot(content);
            }

            Ext4.create('Ext.Window', {
                title: 'Chromatogram View',
                width: 960,
                height: 650,
                modal: true,
                autoShow: true,
                layout: 'fit',
                items: [{
                    xtype: 'panel',
                    layout: {
                        type: 'border',
                        regionWeights: {
                            west: 20,
                            north: 10,
                            south: -10,
                            east: 20
                        }
                    },
                    items: [{
                        region: 'west',
                        header: false,
                        width: 250,
                        border: false, frame: false,
                        style: 'border-right: 1px solid lightgrey; overflow-x: hidden; overflow-y: auto;',
                        bodyStyle: 'overflow-y: auto;',
                        items: [{
                            xtype: 'grid',
                            store: {
                                xtype: 'store',
                                model: 'LABKEY.hplc.ProvisionalRun',
                                data: context.rawInputs
                            },
                            columns: [
                                {text: 'Inputs', dataIndex: 'name', width: 205}
                            ],
                            selModel: {
                                selType: 'checkboxmodel',
                                mode: 'MULTI'
                            },
                            hideHeaders: true,
                            listeners: {
                                viewready: function(g) {
                                    _g = g;
                                    doFilters();
                                },
                                selectionchange : function(g, provisionalRuns) {
                                    //
                                    // load the appropriate content for each selected sample
                                    //
                                    var recieved = 0, expected = provisionalRuns.length, allContent = [], contentMap = {};

                                    var done = function(content) {
                                        recieved++;
                                        allContent.push(content);
                                        contentMap[content.fileName] = content;
                                        if (recieved == expected) {
                                            g.allContent = allContent;
                                            g.contentMap = contentMap;
                                            renderPlot(allContent);
                                        }
                                    };

                                    for (var d=0; d < provisionalRuns.length; d++) {
                                        var pr = provisionalRuns[d].get('expDataRun');
                                        if (pr) {
                                            HPLCService.FileContentCache(pr, done, g);
                                        }
                                        else {
                                            console.error('Failed to load expDataRun from provisional run.');
                                        }
                                    }
                                }
                            }
                        }],
                        dockedItems: [{
                            xtype: 'toolbar',
                            dock: 'top',
                            items: [{
                                id: 'startqcbtn',
                                text: SHOW_ALL ? 'Show Formulations' : 'Show All Data',
                                handler: function(b) {
                                    SHOW_ALL = !SHOW_ALL;
                                    b.setText(SHOW_ALL ? 'Show Formulations' : 'Show All Data');
                                    doFilters();
                                },
                                scope: this
                            },{
                                text: 'Clear Zoom',
                                handler: function(b) {
                                    Ext4.getCmp(PLOTID).resetZoom();
                                }
                            }]
                        }]
                    },{
                        region: 'center',
                        border: false, frame: false,
                        items: [{
                            id: PLOTID,
                            xtype: 'spectrum',
                            xLabel: 'Time (m)',
                            yLabel: 'mV',
                            autoZoom: true
//                            listeners: {
//                                zoom: this.updateZoom,
//                                scope: this
//                            }
                        }]
                    }]
                }]
            });
        });
    }

    new LABKEY.QueryWebPart({
        renderTo: 'phplc-grid',
        schemaName: 'idri',
        queryName: 'pHPLCSummary',
        frame: 'none',
        buttonBarPosition: 'none',
        showPagination: false,
        showDetailsColumn: true,
        suppressRenderErrors: !LABKEY.devMode,
        parameters: {
            Formulation: assayId
        },
        listeners: {
            render: function(qwp) {
                var links = Ext4.DomQuery.select('a.labkey-text-link', 'dataregion_' + qwp.dataRegionName);
                if (!Ext4.isEmpty(links)) {
                    Ext4.each(links, function(linkEl) {
                        var link = Ext4.get(linkEl);
                        var href = link.getAttribute('href');
                        if (!Ext4.isEmpty(href)) {
                            var params = LABKEY.ActionURL.getParameters(href);
                            if (Ext4.isObject(params) && Ext4.isString(params['pHPLCRun'])) {
                                var runId = params['pHPLCRun'];
                                link.on('click', function() { viewSpectrum(runId); });
                                link.dom.removeAttribute('href');
                                link.update('chromatogram');
                            }
                            else {
                                link.hide();
                            }
                        }
                        else {
                            link.hide();
                        }
                    });
                }
                else {
                    console.log("Unable to hijack all the 'details' links for pHPLC chromatograms. There are no rows or the selector might have changed?");
                }
            }
        }
    });

    //
    // HPLC Quality Control
    //
    new LABKEY.QueryWebPart({
        renderTo: 'HPLCQCDiv',
        schemaName: 'idri',
        queryName: 'HPLCSummary',
        frame: 'none',
        buttonBarPosition: 'none',
        showPagination: false,
//        showRecordSelectors: true,
        suppressRenderErrors: !LABKEY.devMode,
        parameters: {
            Formulation: assayId
        }
    });
}
