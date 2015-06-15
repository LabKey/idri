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
<%@ page import="org.labkey.api.view.template.ClientDependency"%>
<%@ page import="java.util.LinkedHashSet"%>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%!
  public LinkedHashSet<ClientDependency> getClientDependencies()
  {
      LinkedHashSet<ClientDependency> resources = new LinkedHashSet<>();
      resources.add(ClientDependency.fromPath("Ext4"));
      resources.add(ClientDependency.fromPath("formulations/TaskForm.js"));
      return resources;
  }
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

<div id="ext-taskList-panel"></div>
<script type="text/javascript">
    Ext4.onReady(function(){
        var panel = new LABKEY.idri.TaskPanel({
            id : 'ext-taskList-panel'
        });
    });
</script>