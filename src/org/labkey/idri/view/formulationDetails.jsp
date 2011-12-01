<%
/*
 * Copyright (c) 2011 LabKey Corporation
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
<%@ page import="org.labkey.api.exp.api.ExperimentUrls" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
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
<div id="formulationInformation" style="padding: 5px 0px 0px 20px;">
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
    LABKEY.requiresScript("formulations/failure/GridQuery.js");
    LABKEY.requiresScript("formulations/SearchFormulation.js");
</script>
<script type="text/javascript">

    Ext.onReady(function(){

        <%--Ext.Ajax.request({--%>
            <%--url : LABKEY.ActionURL.buildURL('idri', 'getDerivationGraphDescription.api'),--%>
            <%--params : {--%>
                <%--materialName : <%= PageFlowUtil.jsString(formulation.getBatch()) %>--%>
            <%--},--%>
            <%--success : function(response) {--%>
                <%--var json = Ext.decode(response.responseText);--%>
                <%--console.log('success');--%>
                <%--console.log(json.description);--%>
                <%--Ext.Ajax.request({--%>
                    <%--url    : LABKEY.ActionURL.buildURL('util', 'dotSvg.post'),--%>
                    <%--method : 'POST',--%>
                    <%--params : { dot : json.description },--%>
                    <%--success: function(response, conn) {--%>
                        <%--Ext.get('concentrationDiv').update(response.responseText);--%>
                    <%--}--%>
                <%--});--%>

            <%--},--%>
            <%--failure : function() {--%>
                <%--console.log('failure');--%>
            <%--}--%>
        <%--});--%>

        var cb = new Ext.form.ComboBox({
            mode: 'local',
            width: 80,
            store : new Ext.data.ArrayStore({
                fields : [ 'machine' ],
                data : [['aps'],['nano']]
            }),
            valueField : 'machine',
            displayField : 'machine',
            triggerAction : 'all',
            listeners : {
                select : function(cb, rec, idx) {
                    var grid = Ext.getCmp('query-assay-grid');
                    if (grid) {
                        grid.destroy();
                        var el = Ext.get('testdiv');
                        el.mask('Loading ' + cb.getValue());
                    }
                    lookupAssayId(<%=PageFlowUtil.jsString(formulation.getBatch())%>, cb.getValue(), function(grid){});
                }
            }
        });

        new Ext.Panel({
            renderTo : 'machine-select',
            bodyStyle : 'background-color: transparent;',
            border: false,
            frame : false,
            items : [ cb ]
        });

        cb.setValue('aps');
        lookupAssayId(<%=PageFlowUtil.jsString(formulation.getBatch())%>, cb.getValue(), function(grid){});
        
        new LABKEY.QueryWebPart({
            renderTo   : 'concentrationDiv',
            schemaName : 'idri',
            queryName  : 'concentrations',
            buttonBarPosition: 'none',
            showPagination : false,
            filters    : [ LABKEY.Filter.create("Lot/Name", <%=PageFlowUtil.jsString(formulation.getBatch())%>, LABKEY.Filter.Types.CONTAINS)]
        });

        buildPSReports('5C', <%=PageFlowUtil.jsString(formulation.getBatch())%>, 'aps', null, 'aps-report');
        buildPSReports('5C', <%=PageFlowUtil.jsString(formulation.getBatch())%>, 'nano', null, 'nano-report');
    });

    function getOldView() {
        var params = {};
        params["rowId"] = <%=formulation.getRowID()%>;
        window.location = LABKEY.ActionURL.buildURL("experiment", "showMaterial", LABKEY.ActionURL.getContainer(), params);
    }
</script>