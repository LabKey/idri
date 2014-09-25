<%
/*
 * Copyright (c) 2011-2014 LabKey Corporation
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
<%@ page import="org.labkey.api.data.Container"%>
<%@ page import="org.labkey.api.exp.api.ExpSampleSet"%>
<%@ page import="org.labkey.api.exp.api.ExperimentService" %>
<%@ page import="org.labkey.api.exp.api.ExperimentUrls" %>
<%@ page import="org.labkey.api.portal.ProjectUrls" %>
<%@ page import="org.labkey.api.util.PageFlowUtil" %>
<%@ page import="org.labkey.api.view.ActionURL" %>
<%@ page import="org.labkey.api.view.HttpView" %>
<%@ page import="org.labkey.api.view.JspView" %>
<%@ page import="org.labkey.api.view.template.ClientDependency" %>
<%@ page import="org.labkey.idri.idriController" %>
<%@ page import="org.labkey.idri.idriController.ExpObjectForm" %>
<%@ page import="org.labkey.idri.idriManager" %>
<%@ page import="org.labkey.idri.model.Formulation" %>
<%@ page import="java.util.LinkedHashSet" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%!
    public LinkedHashSet<ClientDependency> getClientDependencies()
    {
        LinkedHashSet<ClientDependency> resources = new LinkedHashSet<>();
        resources.add(ClientDependency.fromFilePath("clientapi/ext3"));
        resources.add(ClientDependency.fromFilePath("Ext4"));
        resources.add(ClientDependency.fromFilePath("formulations/SearchFormulation.js")); // buildPSReports
        return resources;
    }
%>
<%
    JspView<ExpObjectForm> me = (JspView<ExpObjectForm>) HttpView.currentView();
    ExpObjectForm form = me.getModelBean();
    Container c = getContainer();

    Formulation formulation = idriManager.getFormulation(form.getRowId());
    ExpSampleSet ss = ExperimentService.get().getSampleSet(c, "Formulations");
%>
<style type="text/css">
    table.stabilitytable,
    table.stabilitytable th,
    table.stabilitytable td
    {
        border: 1px solid #a9a9a9;
        border-collapse: collapse;
        background-color: #ffffff;
        padding: 5px;
        white-space: nowrap;
    }

</style>
<div style="padding: 20px 0 0 20px;">
    <%=textLink("Home Page", PageFlowUtil.urlProvider(ProjectUrls.class).getBeginURL(c))%>
    <%=textLink("Edit " + formulation.getBatch(), new ActionURL(idriController.CreateFormulationAction.class, c).addParameter("RowId", formulation.getRowID()))%>
    <%=textLink("Browse Formulations", PageFlowUtil.urlProvider(ExperimentUrls.class).getShowSampleSetURL(ss))%>
    <%=textLink("Sample View", "#", "getOldView();", null)%>
</div>
<div style="padding: 5px 0 0 20px;">
    <table>
        <tr>
            <td style="vertical-align:top;">
                <table>
                    <thead><h3>Information</h3></thead>
                    <tr>
                        <td class="labkey-form-label">Date of Manufacture</td><td><%=formulation.getDm()%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Type</td><td><%=h(formulation.getType())%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Lot Size</td><td><%=h(formulation.getBatchsize())%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Notebook Page</td><td><%=h((formulation.getNbpg() != null ? formulation.getNbpg() : "[Not provided]"))%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Comments</td><td><%=h((formulation.getComments() != null ? formulation.getComments() : "[Not provided]"))%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Raw Materials</td><td><%=h(formulation.getMaterialsString())%></td>
                    </tr>
                </table>
            </td>
            <td style="vertical-align:top;" rowspan="2">
                <table>
                    <thead><h3>Concentrations</h3></thead>
                    <tr>
                        <td colspan="2">
                            <div id="concentrationDiv"></div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="vertical-align:top;">
                <table>
                    <thead><h3>Particle Size Stability</h3></thead>
                    <tr>
                        <div id="machine-select"></div>
                        <td style="float: right;">
                            <div id="stabilityDiv" style="float: right;">
                                <div id="owngrid"></div>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
<h3>Stability Charts</h3>
<table>
    <tr>
        <td>
            <div id="aps-report"></div>
        </td>
        <td>
            <div id="nano-report"></div>
        </td>
    </tr>
</table>
<table>
    <tr>
        <td style="vertical-align:top;">
            <table>
                <thead><h3>Provisional HPLC</h3></thead>
                <tr>
                    <td>
                        <div id="pHPLCDiv"></div>
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

        var stabilityTpl = new Ext4.XTemplate(
            '<table class="stabilitytable">',
                '{[ this.renderHeaders() ]}',
                '<tpl for=".">',
                    '<tr class="temprow">',
                        '{[ this.renderDatas(values) ]}',
                    '</tr>',
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

        var assayId = <%=PageFlowUtil.jsString(formulation.getBatch())%>;

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
        new LABKEY.QueryWebPart({
            renderTo: 'pHPLCDiv',
            schemaName: 'idri',
            queryName: 'pHPLCSummary',
            frame: 'none',
            buttonBarPosition: 'none',
            showPagination: false,
            showRecordSelectors: true,
            suppressRenderErrors: !LABKEY.devMode,
            parameters: {
                Formulation: assayId
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
            showRecordSelectors: true,
            suppressRenderErrors: !LABKEY.devMode,
            parameters: {
                Formulation: assayId
            }
        });
    });

    function getOldView() {
        window.location = LABKEY.ActionURL.buildURL("experiment", "showMaterial", null, { "rowId" : <%=formulation.getRowID()%> });
    }
</script>