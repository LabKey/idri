<%
/*
 * Copyright (c) 2014 LabKey Corporation
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
<%@ page import="org.labkey.api.exp.api.ExpMaterial"%>
<%@ page import="org.labkey.api.exp.api.ExperimentService" %>
<%@ page import="org.labkey.api.exp.api.ExperimentUrls" %>
<%@ page import="org.labkey.api.util.PageFlowUtil" %>
<%@ page import="org.labkey.api.view.ActionURL" %>
<%@ page import="org.labkey.api.view.template.ClientDependency" %>
<%@ page import="org.labkey.idri.idriController" %>
<%@ page import="org.labkey.idri.idriManager" %>
<%@ page import="org.labkey.idri.model.Formulation" %>
<%@ page import="java.util.LinkedHashSet" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%!
    public LinkedHashSet<ClientDependency> getClientDependencies()
    {
        LinkedHashSet<ClientDependency> resources = new LinkedHashSet<>();
        resources.add(ClientDependency.fromPath("formulations/formulation.css"));
        resources.add(ClientDependency.fromPath("clientapi/ext3"));
        resources.add(ClientDependency.fromPath("Ext4"));
        resources.add(ClientDependency.fromPath("formulations/SearchFormulation.js")); // buildPSReports
        return resources;
    }
%>
<%
    Container c = getContainer();
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
        ExpMaterial formulationMaterial = ExperimentService.get().getExpMaterial(formulation.getRowID());
%>
<div>
    <h3><%=h(formulation.getBatch())%></h3>
    <%=textLink("Edit " + formulation.getBatch(), new ActionURL(idriController.CreateFormulationAction.class, c).addParameter("RowId", formulation.getRowID()))%>
    <%=textLink("Browse Formulations", PageFlowUtil.urlProvider(ExperimentUrls.class).getShowSampleSetURL(idriManager.getFormulationSampleSet(getContainer())))%>
    <%=textLink("Sample View", PageFlowUtil.urlProvider(ExperimentUrls.class).getMaterialDetailsURL(formulationMaterial))%>
    <table>
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
</div>
<%
    }
%>