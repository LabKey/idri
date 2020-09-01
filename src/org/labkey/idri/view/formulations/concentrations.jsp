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
        dependencies.add("clientapi/ext3");
        dependencies.add("Ext4");
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
    <table>
        <thead></thead>
            <tr>
                <td colspan="2">
                    <div id="concentrationDiv"></div>
                </td>
            </tr>
    </table>
</div>
<script type="text/javascript">


    Ext4.onReady(function() {

        var lookupAssayId = function(name, machine) {

            LABKEY.Query.selectRows({
                schemaName: 'assay',
                queryName : 'Particle Size Runs',
                filterArray: [ LABKEY.Filter.create('Name', name, LABKEY.Filter.Types.STARTS_WITH) ],
                maxRows: 1,
                success : function(data) {
                    if (data.rows.length < 1) {
                        var el = Ext4.get('testdiv');
                        if (el) {
                            el.update('No Particle Size results available for ' + name);
                        }
                        return;
                    }

                    LABKEY.Query.selectRows({
                        schemaName: 'assay',
                        queryName: 'MachineAssayStability',
                        parameters: {
                            'AssayRowId': data.rows[0].RowId,
                            'MachineType': machine
                        },
                        success: processStabilityQuery
                    });
                }
            });
        };

        var assayId = <%=q(formulation.getBatch())%>;

        new LABKEY.QueryWebPart({
            renderTo   : 'concentrationDiv',
            schemaName : 'idri',
            queryName  : 'concentrations',
            buttonBarPosition: 'none',
            frame: 'none',
            showPagination : false,
            filters    : [ LABKEY.Filter.create('Lot/Name', assayId, LABKEY.Filter.Types.CONTAINS) ]
        });

    });

</script>
<%
    }
%>
