<%
/*
 * Copyright (c) 2014-2016 LabKey Corporation
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
<%@ page import="org.labkey.api.util.PageFlowUtil"%>
<%@ page import="org.labkey.api.view.template.ClientDependencies"%>
<%@ page import="org.labkey.idri.idriManager" %>
<%@ page import="org.labkey.idri.model.Formulation" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%!
    @Override
    public void addClientDependencies(ClientDependencies dependencies)
    {
        dependencies.add("formulations/formulation.css");
        dependencies.add("Ext4");
        dependencies.add("clientapi/ext3"); // required for SearchFormulation.js
        dependencies.add("formulations/SearchFormulation.js"); // buildPSReports
    }
%>
<%
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
%>
<div>
    <div id="aps-report" style="float: left; margin-right: 15px;"></div>
    <div id="nano-report"></div>
</div>
<script type="text/javascript">
    Ext4.onReady(function() {
        buildPSReports('5C', <%=PageFlowUtil.jsString(formulation.getBatch())%>, 'aps', 'aps-report');
        buildPSReports('5C', <%=PageFlowUtil.jsString(formulation.getBatch())%>, 'nano', 'nano-report');
    });
</script>
<%
    }
%>
