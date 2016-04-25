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
<%@ page import="org.labkey.api.view.template.ClientDependencies" %>
<%@ page import="org.labkey.idri.idriManager" %>
<%@ page import="org.labkey.idri.model.Formulation" %>
<%@ page import="org.labkey.idri.model.Material" %>
<%@ page import="java.util.List" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%!
    public void addClientDependencies(ClientDependencies dependencies)
    {
        dependencies.add("clientapi/ext3");
        dependencies.add("clientapi/ext4");
        dependencies.add("FileUploadField.js");
        dependencies.add("formulations/FormulationForm.js");
        dependencies.add("formulations/TaskForm.js");
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
<div id="formulation-panel"></div>
<script type="text/javascript">

    Ext.onReady(function(){

        Ext.QuickTips.init();

        var panel = new LABKEY.idri.FormulationPanel({
            renderTo: 'formulation-panel'
        });
    });

</script>
