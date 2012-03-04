<%
/*
 * Copyright (c) 2011-2012 LabKey Corporation
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
<%@ page import="org.labkey.api.view.ViewContext" %>
<%@ page import="org.labkey.api.view.HttpView" %>
<%@ page import="org.labkey.api.data.Container" %>
<%@ page import="java.util.List" %>
<%@ page import="org.labkey.idri.idriController" %>
<%@ page import="org.labkey.idri.idriManager" %>
<%@ page import="org.labkey.idri.model.Material" %>
<%@ page import="org.labkey.idri.model.Formulation" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%
    ViewContext ctx = HttpView.getRootContext();
    Container c = ctx.getContainer();
    ActionURL createURL = new ActionURL(idriController.CreateFormulationAction.class, c);

    List<Material> materials = idriManager.getMaterials(c);
    List<Formulation> formulations = idriManager.getFormulations(c);
%>
<script type="text/javascript">
    LABKEY.requiresClientAPI();
    LABKEY.requiresScript("formulations/SearchFormulation.js");
    LABKEY.requiresScript("formulations/FormulationForm.js");
</script>
<script type="text/javascript">
    function makeFormulation() {

        var _materials = [];
        var _formulations = [];

        <%  for (Material material : materials) { %>
            _materials.push([<%=PageFlowUtil.jsString(material.getMaterialName())%>]);
        <%  }
            for (Formulation formulation : formulations) { %>
            _formulations.push(<%=formulation.toJSON()%>);
        <%  } %>

        var _panel = new LABKEY.idri.FormulationPanel({
            materials : _materials,
            formulations: _formulations
        });

        var formwindow = new Ext.Window({
            id : 'form-window',
            modal: true,
            plain: true,
            layout: 'card',
            layoutConfig:{deferredRender:true},
            height: 425,
            width: 625,
            activeItem: 0,
            width: 600,
            height: 400,
            defaults : {
                autoScroll : true
            },
            items : [_panel]
        });
        formwindow.show();
    }
</script>

<form method="get" action="../formulations" onsubmit="getRunIdIfUnique(document.getElementById('IdriSearchStr').value.toUpperCase(),document.getElementById('IdriPSAssayName').value); return false;">

<table cols="3">
<tr>
	<td>Search (e.g. QF325)</td>
    <td colspan=1>

     <input type="text" id="IdriSearchStr" style="font-size: 18px; font-weight:lighter;" name="nameContains" value="" >
     <input type="hidden" id="IdriPSAssayName" name="assayName" value="Particle Size" >

     </td>
    <td colspan=1>
     <input type="submit" style="display: none;" id="IdriSearchSubmit"><a class="labkey-button" href="#" onclick="getRunIdIfUnique(document.getElementById('IdriSearchStr').value.toUpperCase(),document.getElementById('IdriPSAssayName').value); return false;" ><span>Search</span></a></td>
</tr>

</table>

</form>
<div id="SearchStatusDiv"></div>
<div id="SearchStatusDiv2"></div>
<div style="padding-bottom:2px;"><%=PageFlowUtil.textLink("Create/Update a Formulation", createURL)%></div>
<!--<div style="padding-bottom:2px;"><%=PageFlowUtil.generateButton("Create/Update a Formulation", "#", "makeFormulation(); return false;")%></div>-->
<div id="topDiv"></div>
<div id="errorDiv"></div>
<div id="dataRegionDiv" style="float: left;"></div>
<div id="resultsDiv" style="float: left;"></div>
<div id="resultsDiv2" style="float: left;"></div>
<img id="hemoImage" style="display: none" src="" alt="">
<div id="hemoSearch"></div>
<div id="bottomDiv"></div>
<div id="windowDiv"></div>