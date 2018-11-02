<%
/*
 * Copyright (c) 2011-2016 LabKey Corporation
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
<%@ page import="org.labkey.api.view.template.ClientDependencies" %>
<%@ page import="org.labkey.idri.idriController" %>
<%@ page import="org.labkey.idri.idriController.ExpObjectForm" %>
<%@ page import="org.labkey.idri.idriManager" %>
<%@ page import="org.labkey.idri.model.Formulation" %>
<%@ page import="org.labkey.api.security.permissions.InsertPermission" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%!
    @Override
    public void addClientDependencies(ClientDependencies dependencies)
    {
        dependencies.add("clientapi/ext3");
        dependencies.add("Ext4");
        dependencies.add("spectrum");
        dependencies.add("formulations/SearchFormulation.js"); // buildPSReports
        dependencies.add("formulations/FormulationDetails.js");
    }
%>
<%
    JspView<ExpObjectForm> me = (JspView<ExpObjectForm>) HttpView.currentView();
    ExpObjectForm form = me.getModelBean();
    Container c = getContainer();

    Formulation formulation = idriManager.getFormulation(form.getRowId());
    ExpSampleSet ss = ExperimentService.get().getSampleSet(c, "Formulations");
%>
<div style="padding: 20px 0 0 20px;">
    <%=textLink("Home Page", PageFlowUtil.urlProvider(ProjectUrls.class).getBeginURL(c))%>
    <% if (c.hasPermission(getUser(), InsertPermission.class)) { %>
    <%=textLink("Edit " + formulation.getBatch(), new ActionURL(idriController.CreateFormulationAction.class, c).addParameter("RowId", formulation.getRowID()))%>
    <% } %>
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
                        <td class="labkey-form-label">Catalog</td><td><%=h(formulation.getCatalog())%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Grant</td><td><%=h(formulation.getGrant())%></td>
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
        initFormulationDetails(<%=PageFlowUtil.jsString(formulation.getBatch())%>);
    });

    function getOldView() {
        window.location = LABKEY.ActionURL.buildURL("experiment", "showMaterial", null, { "rowId" : <%=formulation.getRowID()%> });
    }
</script>