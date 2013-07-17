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
<%@ page import="org.labkey.api.util.PageFlowUtil" %>
<%@ page import="org.labkey.api.view.ActionURL" %>
<%@ page import="org.labkey.api.view.template.ClientDependency" %>
<%@ page import="org.labkey.idri.idriController" %>
<%@ page import="java.util.LinkedHashSet" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%!

  public LinkedHashSet<ClientDependency> getClientDependencies()
  {
      LinkedHashSet<ClientDependency> resources = new LinkedHashSet<>();
      resources.add(ClientDependency.fromFilePath("/formulations/SearchFormulation.js"));
      resources.add(ClientDependency.fromFilePath("/formulations/FormulationForm.js"));
      return resources;
  }
%>
<form method="get" action="../formulations" onsubmit="getRunIdIfUnique(document.getElementById('IdriSearchStr').value.toUpperCase(),document.getElementById('IdriPSAssayName').value); return false;">
    <table cols="3">
        <tr>
            <td>Search (e.g. QF325)</td>
            <td colspan=1>
                <input type="text" id="IdriSearchStr" style="font-size: 18px; font-weight:lighter;" name="nameContains" value="" >
                <input type="hidden" id="IdriPSAssayName" name="assayName" value="Particle Size" >
            </td>
            <td colspan=1>
                <input type="submit" style="display: none;" id="IdriSearchSubmit"><a class="labkey-button" href="#" onclick="getRunIdIfUnique(document.getElementById('IdriSearchStr').value.toUpperCase(),document.getElementById('IdriPSAssayName').value); return false;" ><span>Search</span></a>
            </td>
        </tr>
    </table>
</form>
<div id="SearchStatusDiv"></div>
<div id="SearchStatusDiv2"></div>
<div style="padding-bottom:2px;"><%=PageFlowUtil.textLink("Create/Update a Formulation", new ActionURL(idriController.CreateFormulationAction.class, getViewContext().getContainer()))%></div>
<div id="topDiv"></div>
<div id="errorDiv"></div>
<div id="dataRegionDiv" style="float: left;"></div>
<div id="resultsDiv" style="float: left;"></div>
<div id="resultsDiv2" style="float: left;"></div>
<img id="hemoImage" style="display: none" src="" alt="">
<div id="hemoSearch"></div>
<div id="bottomDiv"></div>
<div id="windowDiv"></div>