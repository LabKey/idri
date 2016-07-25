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
<%@ page import="org.labkey.api.util.PageFlowUtil" %>
<%@ page import="org.labkey.api.util.UniqueID" %>
<%@ page import="org.labkey.api.view.ActionURL" %>
<%@ page import="org.labkey.api.view.HttpView" %>
<%@ page import="org.labkey.api.view.template.ClientDependencies" %>
<%@ page import="org.labkey.idri.idriController" %>
<%@ taglib prefix="labkey" uri="http://www.labkey.org/taglib" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%!
    @Override
    public void addClientDependencies(ClientDependencies dependencies)
    {
        dependencies.add("Ext3");
        dependencies.add("/formulations/SearchFormulation.js");
        dependencies.add("/formulations/FormulationForm.js");
    }
%>
<%
    String searchID = "idri-search-" + UniqueID.getRequestScopedUID(HttpView.currentRequest());
%>
<form method="GET" action="../formulations" onsubmit="getRunIdIfUnique(<%=PageFlowUtil.jsString(searchID)%>); return false;">
    <table cols="3">
        <tr>
            <td>Search (e.g. QF325)</td>
            <td colspan="1">
                <input type="text" id="<%=text(searchID)%>" style="font-size: 18px; font-weight:lighter;" name="nameContains" value="">
            </td>
            <td colspan="1">
                <%= PageFlowUtil.button("Search").href("javascript:void(0);").onClick("getRunIdIfUnique(" + PageFlowUtil.jsString(searchID) + "); return false;") %>
            </td>
        </tr>
    </table>
</form>
<div id="SearchStatusDiv"></div>
<div id="SearchStatusDiv2"></div>
<div style="padding-bottom:2px;"><%=PageFlowUtil.textLink("Create/Update a Formulation", new ActionURL(idriController.CreateFormulationAction.class, getContainer()))%></div>
<div id="topDiv"></div>
<div id="errorDiv"></div>
<div id="dataRegionDiv" style="float: left;"></div>
<div id="resultsDiv" style="float: left;"></div>
<div id="resultsDiv2" style="float: left;"></div>
<img id="hemoImage" style="display: none" src="" alt="">
<div id="hemoSearch"></div>
<div id="bottomDiv"></div>
<div id="windowDiv"></div>