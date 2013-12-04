<%
/*
 * Copyright (c) 2011-2013 LabKey Corporation
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
<%@ page import="org.labkey.api.view.HttpView"%>
<%@ page import="org.labkey.api.view.ViewContext"%>
<%@ page import="org.labkey.idri.idriManager" %>
<%@ page import="org.labkey.api.util.PageFlowUtil" %>
<%@ page import="org.labkey.idri.model.Formulation" %>
<%@ page import="org.labkey.api.data.Container" %>
<%@ page import="org.labkey.idri.idriController.ExpObjectForm" %>
<%@ page import="org.labkey.api.view.JspView" %>
<%@ page import="org.labkey.api.view.ActionURL" %>
<%@ page import="org.labkey.idri.idriController" %>
<%@ page import="org.labkey.api.exp.api.ExpSampleSet" %>
<%@ page import="org.labkey.api.exp.api.ExperimentService" %>
<%@ page import="org.labkey.api.portal.ProjectUrls" %>
<%@ page import="org.labkey.api.view.template.ClientDependency" %>
<%@ page import="java.util.LinkedHashSet" %>
<%@ page import="org.labkey.api.exp.api.ExperimentUrls" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%!
    public LinkedHashSet<ClientDependency> getClientDependencies()
    {
        LinkedHashSet<ClientDependency> resources = new LinkedHashSet<>();
        resources.add(ClientDependency.fromFilePath("Ext3"));
        resources.add(ClientDependency.fromFilePath("formulations/SearchFormulation.js")); // buildPSReports
        return resources;
    }
%>
<%
    JspView<ExpObjectForm> me = (JspView<ExpObjectForm>) HttpView.currentView();
    ExpObjectForm form = me.getModelBean();
    ViewContext ctx = me.getViewContext();
    Container c = ctx.getContainer();

    Formulation formulation = idriManager.getFormulation(form.getRowId());
    ExpSampleSet ss = ExperimentService.get().getSampleSet(c, "Formulations");
%>
<div style="padding: 20px 0px 0px 20px;">
    <%=textLink("Home Page", PageFlowUtil.urlProvider(ProjectUrls.class).getBeginURL(c))%>
    <%=textLink("Edit " + formulation.getBatch(), new ActionURL(idriController.CreateFormulationAction.class, c).addParameter("RowId", formulation.getRowID()))%>
    <%=textLink("Browse Formulations", PageFlowUtil.urlProvider(ExperimentUrls.class).getShowSampleSetURL(ss))%>
    <%=textLink("Sample View", "#", "getOldView();", null)%>
</div>
<div style="padding: 5px 0px 0px 20px;">
    <table>
        <tr>
            <td style="vertical-align:top;">
                <table>
                    <thead><h3>Information</h3></thead>
                    <tr>
                        <td class="labkey-form-label">Date of Manufacture</td><td><%=formulation.getDm()%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Type</td><td><%=formulation.getType()%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Lot Size</td><td><%=formulation.getBatchsize()%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Notebook Page</td><td><%=(formulation.getNbpg() != null ? formulation.getNbpg() : "[Not provided]")%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Comments</td><td><%=(formulation.getComments() != null ? formulation.getComments() : "[Not provided]")%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Raw Materials</td><td><%=formulation.getMaterialsString()%></td>
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
                                <div id="testdiv" style="height: 190px; width: 600px;"></div>
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
</div>
<script type="text/javascript">


    Ext.onReady(function() {

        var lookupAssayId = function(name, machine) {

            LABKEY.Query.selectRows({
                schemaName: 'assay',
                queryName : 'Particle Size Runs',
                filterArray: [ LABKEY.Filter.create('Name', name, LABKEY.Filter.Types.STARTS_WITH) ],
                maxRows: 1,
                success : function(data) {
                    if (data.rows.length < 1) {
                        Ext.get('testdiv').update('No Particle Size results available for ' + name);
                        return;
                    }

                    return new LABKEY.QueryWebPart({
                        renderTo: 'testdiv',
                        schemaName: 'assay',
                        queryName: 'MachineAssayStability',
                        parameters: {
                            'AssayRowId': data.rows[0].RowId,
                            'MachineType': machine
                        },
                        frame: 'none',
                        buttonBar: {
                            position: 'none'
                        }
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
                            el.mask('Loading ' + cb.getValue());
                        }
                        lookupAssayId(assayId, cb.getValue());
                    }
                }
            }]
        });
        
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
    });

    function getOldView() {
        window.location = LABKEY.ActionURL.buildURL("experiment", "showMaterial", null, { "rowId" : <%=formulation.getRowID()%> });
    }
</script>