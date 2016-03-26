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
<%@ page import="org.labkey.api.util.PageFlowUtil"%>
<%@ page import="org.labkey.api.view.template.ClientDependencies"%>
<%@ page import="org.labkey.idri.idriManager" %>
<%@ page import="org.labkey.idri.model.Formulation" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%!
    public void addClientDependencies(ClientDependencies dependencies)
    {
        dependencies.add("formulations/formulation.css");
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
    <div id="aps-report" style="float: left; margin-right: 15px;"></div>
    <div id="nano-report"></div>
</div>
<script type="text/javascript">


    Ext4.onReady(function() {

        var stabilityTpl = new Ext4.XTemplate(
            '<table class="stabilitytable">',
                '{[ this.renderHeaders() ]}',
                '<tpl for=".">',
                    '<tr class="temprow">',
                        '{[ this.renderDatas(values) ]}',
                    '</tr>',
                '</tpl>',
            '</table>',
                {
                    renderDatas : function(values) {
                        var model = Ext4.create('IDRI.Stability', {});
                        var html = '';
                        var compare = values['ZAveMean'] * 1.5;
                        Ext4.each(model.fields.items, function(f) {
                            if (f.name != 'id') {
                                var style = '';
                                if (f.name.indexOf('::Average') > -1) {
                                    style += 'style="color: white; ';
                                    var data = values[f.name];
                                    if (compare !== 0 && data === 0) {
                                        /* do nothing */
                                    }
                                    else if (compare > data) {
                                        style += 'background-color: green;';
                                    }
                                    else if (compare < data) {
                                        style += 'background-color: red;';
                                    }
                                    style += '"';
                                }
                                html += '<td ' + style + '>' + values[f.name] + '</td>';
                            }
                        });
                        return html;
                    },
                    renderHeaders : function() {
                        var model = Ext4.create('IDRI.Stability', {});
                        var html = '';
                        Ext4.each(model.fields.items, function(f) {
                            if (f.name != 'id') {
                                html += '<th>' + (f.header ? f.header : f.name) + '</th>';
                            }
                        });
                        return html;
                    }
                }
        );

        var processStabilityQuery = function(selectRowsData) {

            // Iterate over all the columns to determine the set of timepoint columns
            var columns = selectRowsData.columnModel;
            var columnSet = [{name: 'Temperature'}];
            Ext4.each(columns, function(colModel) {
                if (colModel.dataIndex.indexOf('::Average') > -1) {
                    columnSet.push({
                        name: colModel.dataIndex,
                        header: colModel.header,
                        type: 'int'
                    });
                }
            });
            columnSet.push({name: 'ZAveMean', header: 'Mean', type: 'int'});

            // Redefine model based on available columns
            Ext4.define('IDRI.Stability', {
                extend: 'Ext.data.Model',
                fields: columnSet
            });

            var store = Ext4.create('Ext.data.Store', {
                model: 'IDRI.Stability',
                data: selectRowsData.rows
            });

            var el = Ext4.get('owngrid');
            if (el) {
                el.update('');

                Ext4.create('Ext.view.View', {
                    renderTo: el,
                    tpl: stabilityTpl,
                    itemSelector: 'tr.temprow',
                    store: store
                });
            }
        };

        var assayId = <%=PageFlowUtil.jsString(formulation.getBatch())%>;

        buildPSReports('5C', assayId, 'aps', 'aps-report');
        buildPSReports('5C', assayId, 'nano', 'nano-report');
    });

</script>
<%
    }
%>
