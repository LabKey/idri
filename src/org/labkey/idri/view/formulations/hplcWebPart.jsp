<%
/*
 * Copyright (c) 2014-2015 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
%>
<%@ page import="org.labkey.api.util.PageFlowUtil"%>
<%@ page import="org.labkey.api.view.template.ClientDependencies"%>
<%@ page import="org.labkey.idri.idriManager" %>
<%@ page import="org.labkey.idri.model.Formulation" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%!
    @Override
    public void addClientDependencies(ClientDependencies dependencies)
    {
        dependencies.add("formulations/formulation.css");
        dependencies.add("clientapi/ext3");
        dependencies.add("Ext4");
        dependencies.add("formulations/SearchFormulation.js"); // buildPSReports
        dependencies.add("spectrum");
    }
%>
<%
    String rowId = getActionURL().getParameter("rowId");
    Formulation formulation = null;

    if (rowId != null)
    {
        formulation = idriManager.getFormulation(Integer.parseInt(rowId));
    }

    if (formulation == null)
    {
%>
<div>A formulation has not been selected.</div>
<%
    }
    else
    {
%>
<div>
    <table>
        <tr>
            <td style="vertical-align:top;">
                <table>
                    <thead><h3>Provisional HPLC</h3></thead>
                    <tr>
                        <td>
                            <div id="phplc-grid"></div>
                        </td>
                    </tr>
                </table>
            </td>
            <td style="vertical-align:top;">
                <table>
                    <thead><h3>HPLC Quality Control</h3></thead>
                    <tr>
                        <td>
                            <div id="HPLCQCDiv"></div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</div>
<script type="text/javascript">


    Ext4.onReady(function() {

        //
        // Provisional HPLC
        //

        var assayId = <%=PageFlowUtil.jsString(formulation.getBatch())%>;

        function viewSpectrum(runId) {
            SignalDataService.getRun("assay.signalData.pHPLC", [runId], null, function(context) {

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
                                    model: 'LABKEY.SignalData.ProvisionalRun',
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
                                        var received = 0, expected = provisionalRuns.length, allContent = [], contentMap = {};

                                        var done = function(content) {
                                            received++;
                                            allContent.push(content);
                                            contentMap[content.fileName] = content;
                                            if (received == expected) {
                                                g.allContent = allContent;
                                                g.contentMap = contentMap;
                                                renderPlot(allContent);
                                            }
                                        };

                                        for (var d=0; d < provisionalRuns.length; d++) {
                                            var pr = provisionalRuns[d].get('expDataRun');
                                            if (pr) {
                                                SignalDataService.FileContentCache(pr, done, g);
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
                    var links = Ext4.DomQuery.select('a.labkey-text-link', qwp.getDataRegion().domId);
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
    });

</script>
<%
    }
%>
