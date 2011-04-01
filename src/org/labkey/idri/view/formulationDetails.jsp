<%@ page import="org.labkey.api.view.HttpView"%>
<%@ page import="org.labkey.api.view.ViewContext"%>
<%@ page import="org.labkey.idri.idriManager" %>
<%@ page import="org.labkey.api.util.PageFlowUtil" %>
<%@ page import="org.labkey.idri.model.Formulation" %>
<%@ page import="org.labkey.api.data.Container" %>
<%@ page import="org.labkey.idri.idriController.ExpObjectForm" %>
<%@ page import="org.labkey.api.view.JspView" %>
<%@ page import="org.labkey.api.security.User" %>
<%@ page import="org.labkey.api.view.ActionURL" %>
<%@ page import="org.labkey.idri.idriController" %>
<%@ page import="org.labkey.api.exp.api.ExpSampleSet" %>
<%@ page import="org.labkey.api.exp.api.ExperimentService" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%
    JspView<ExpObjectForm> me = (JspView<ExpObjectForm>) HttpView.currentView();
    ExpObjectForm form = me.getModelBean();
    ViewContext ctx = me.getViewContext();
    Container c = ctx.getContainer();
    User user = ctx.getUser();

    Formulation formulation = idriManager.getFormulation(form.getRowId());
    ExpSampleSet ss = ExperimentService.get().getSampleSet(c, "Formulations");
%>
<script type="text/javascript">
    LABKEY.requiresScript("formulations/failure/GridQuery.js");
    LABKEY.requiresScript("formulations/SearchFormulation.js");
</script>
<script type="text/javascript">

    Ext.onReady(function(){

        var cb = new Ext.form.ComboBox({
            mode: 'local',
            width: 80,
            store : new Ext.data.ArrayStore({
                fields : [ 'machine' ],
                data : [['aps'],['nano']]
            }),
            valueField : 'machine',
            displayField : 'machine',
            triggerAction : 'all',
            listeners : {
                select : function(cb, rec, idx) {
                    var grid = Ext.getCmp('query-assay-grid');
                    if (grid) {
                        grid.destroy();
                        var el = Ext.get('testdiv');
                        el.mask('Loading ' + cb.getValue());
                    }
                    lookupAssayId(<%=PageFlowUtil.jsString(formulation.getBatch())%>, cb.getValue(), function(grid){});
                }
            }
        });

        new Ext.Panel({
            renderTo : 'machine-select',
            border: false,
            frame : false,
            items : [ cb ]
        });

        cb.setValue('aps');
        lookupAssayId(<%=PageFlowUtil.jsString(formulation.getBatch())%>, cb.getValue(), function(grid){});
        
        new LABKEY.QueryWebPart({
            renderTo   : 'concentrationDiv',
            schemaName : 'idri',
            queryName  : 'concentrations',
            buttonBarPosition: 'none',
            showPagination : false,
            filters    : [ LABKEY.Filter.create("Lot/Name", <%=PageFlowUtil.jsString(formulation.getBatch())%>, LABKEY.Filter.Types.CONTAINS)] 
        });

        buildPSReports('5C', <%=PageFlowUtil.jsString(formulation.getBatch())%>, 'aps', null, 'aps-report');
        buildPSReports('5C', <%=PageFlowUtil.jsString(formulation.getBatch())%>, 'nano', null, 'nano-report');
    });

    function getOldView() {
        var params = {};
        params["rowId"] = <%=formulation.getRowID()%>;
        var oldUrl = LABKEY.ActionURL.buildURL("experiment", "showMaterial", LABKEY.ActionURL.getContainer(), params);
        window.location = oldUrl;
    }
</script>
<div style="padding: 20px 0px 0px 20px;">
    <%=textLink("Formulations Home Page", ctx.getContextPath() + "/project/Formulations/begin.view?")%>
    <%=textLink("Edit " + formulation.getBatch(), new ActionURL(idriController.CreateFormulationAction.class, c).addParameter("RowId", formulation.getRowID()))%>
    <%=textLink("Formulations Sample Set", ctx.getContextPath() + "/experiment/Formulations/showMaterialSource.view?rowId=" + ss.getRowId())%>
    <%=textLink("Old Sample View", "#", "getOldView();", "")%>
</div>
<div id="formulationInformation" style="padding: 5px 0px 0px 20px;">
    <table>
        <tr>
            <td style="vertical-align:top;">
                <table>
                    <thead><h3>Information</h3></thead>
                    <tr>
                        <td class="labkey-form-label">Date of Manufacture</td><td><%=formulation.getDm()%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Type</td><td><%=formulation.getType()%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Lot Size</td><td><%=formulation.getBatchsize()%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Notebook Page</td><td><%=(formulation.getNbpg() != null ? formulation.getNbpg() : "[Not provided]")%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Comments</td><td><%=(formulation.getComments() != null ? formulation.getComments() : "[Not provided]")%></td>
                    </tr>
                    <tr>
                        <td class="labkey-form-label">Raw Materials</td><td><%=formulation.getMaterialsString()%></td>
                    </tr>
                </table>
            </td>
            <td style="vertical-align:top;" rowspan="2">
                <table>
                    <thead><h3>Concentrations</h3></thead>
                    <tr>
                        <td colspan="2">
                            <div id="concentrationDiv"></div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="vertical-align:top;">
                <table>
                    <thead><h3>Particle Size Stability</h3></thead>
                    <tr>
                        <div id="machine-select"></div>
                        <td style="float: right;">
                            <div id="stabilityDiv" style="float: right;">
                                <div id="testdiv" style="height: 190px; width: 600px;"></div>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
<h3>Stability Charts</h3>
<table>
    <tr>
        <td>
            <div id="aps-report"></div>
        </td>
        <td>
            <div id="nano-report"></div>
        </td>
    </tr>
</table>
</div>