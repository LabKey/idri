<%
/*
 * Copyright (c) 2011-2015 LabKey Corporation
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
<%@ page import="org.labkey.api.util.PageFlowUtil"%>
<%@ page import="org.labkey.api.view.template.ClientDependency" %>
<%@ page import="org.labkey.idri.idriManager" %>
<%@ page import="org.labkey.idri.model.Formulation" %>
<%@ page import="org.labkey.idri.model.Material" %>
<%@ page import="java.util.LinkedHashSet" %>
<%@ page import="java.util.List" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%!
  public LinkedHashSet<ClientDependency> getClientDependencies()
  {
      LinkedHashSet<ClientDependency> resources = new LinkedHashSet<>();
      resources.add(ClientDependency.fromPath("clientapi/ext3"));
      resources.add(ClientDependency.fromPath("clientapi/ext4"));
      resources.add(ClientDependency.fromPath("FileUploadField.js"));
      resources.add(ClientDependency.fromPath("formulations/FormulationForm.js"));
      resources.add(ClientDependency.fromPath("formulations/TaskForm.js"));
      return resources;
  }
%>
<%
    Container container = getContainer();
    
    List<Material> materials = idriManager.getMaterials(container);
    List<Formulation> formulations = idriManager.getFormulations(container);
%>
<style type="text/css">
    .x-panel-noborder .x-panel-body-noborder {
        background: transparent;
    }

    .material-xtra {
        float : left;
        padding: 0 4px;
    }

</style>
<div id ="formulation-upload"></div>
<div id="formulation-panel"></div>
<div id="form-example"></div>
<div id="ext-taskList-panel"></div>
<script type="text/javascript">

    Ext.onReady(function(){

        Ext.QuickTips.init();

        var _materials = [];
        var _formulations = [];

    <%  for (Material material : materials) { %>
        _materials.push([<%=PageFlowUtil.jsString(material.getMaterialName())%>]);
    <%  }
        for (Formulation formulation : formulations) { %>
        _formulations.push(<%=formulation.toJSON()%>);
    <%  } %>

        var panel = new LABKEY.idri.FormulationPanel({
            id : 'ext-formulation-panel',
            materials : _materials,
            formulations : _formulations,
            renderTo  : 'formulation-panel'            
        });
    });

</script>