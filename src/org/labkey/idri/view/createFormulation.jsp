<%@ page import="org.labkey.api.view.HttpView"%>
<%@ page import="org.labkey.api.view.ViewContext"%>
<%@ page import="org.labkey.idri.model.Material" %>
<%@ page import="java.util.List" %>
<%@ page import="org.labkey.idri.idriManager" %>
<%@ page import="org.labkey.api.util.PageFlowUtil" %>
<%@ page import="org.labkey.idri.model.Formulation" %>
<%@ page import="org.labkey.api.data.Container" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%
    ViewContext context = HttpView.currentContext();
    Container container = context.getContainer();
    
    List<Material> materials = idriManager.getMaterials(container);
    List<Formulation> formulations = idriManager.getFormulations(container);
%>
<style type="text/css">
    .x-panel-noborder .x-panel-body-noborder {
        background: transparent;
    }
</style>
<script type="text/javascript">
    LABKEY.requiresClientAPI(true);
    LABKEY.requiresScript("FileUploadField.js");
    LABKEY.requiresScript("formulations/FormulationForm.js");
</script>
<script type="text/javascript">

    var _upload;
    var _panel;

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

        _panel = new LABKEY.idri.FormulationPanel({
            id : 'ext-formulation-panel',
            materials : _materials,
            formulations : _formulations,
            renderTo  : 'formulation-panel'            
        });
    });

</script>
<div id ="formulation-upload"></div>
<div id="formulation-panel"></div>
<div id="form-example"></div>