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
    <table>
        <thead></thead>
            <tr>
                 <div id="machine-select"></div>
                 <td style="float: right;">
                     <div id="stabilityDiv" style="float: right;">
                         <div id="owngrid"></div>
                     </div>
                 </td>
             </tr>
    </table>
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
                                    else {
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

        var assayId = <%=PageFlowUtil.jsString(formulation.getBatch())%>;

        var panel = new Ext.Panel({
            renderTo : 'machine-select',
            bodyStyle : 'background-color: transparent;',
            border: false,
            frame : false,
            items : [{
                xtype: 'combo',
                mode: 'local',
                width: 80,
                editable: false,
                store : new Ext.data.ArrayStore({
                    fields : [ 'machine' ],
                    data : [['aps'],['nano']]
                }),
                valueField : 'machine',
                displayField : 'machine',
                triggerAction : 'all',
                listeners : {
                    afterrender : function(cb) {
                        cb.setValue('aps');
                        cb.fireEvent('select', cb);
                    },
                    select : function(cb) {
                        var grid = Ext.getCmp('query-assay-grid');
                        if (grid) {
                            grid.destroy();
                            var el = Ext.get('testdiv');
                            if (el) {
                                el.mask('Loading ' + cb.getValue());
                            }
                        }
                        lookupAssayId(assayId, cb.getValue());
                    }
                }
            }]
        });


    });

</script>
<%
    }
%>
