<%@ page import="org.labkey.api.view.HttpView"%>
<%@ page import="org.labkey.api.view.ViewContext"%>
<%@ page import="org.labkey.idri.model.Material" %>
<%@ page import="java.util.List" %>
<%@ page import="org.labkey.idri.idriManager" %>
<%@ page import="org.labkey.api.util.PageFlowUtil" %>
<%@ page import="org.labkey.idri.model.Formulation" %>
<%@ page import="org.labkey.api.data.Container" %>
<%@ page import="org.labkey.api.view.JspView" %>
<%@ page import="org.labkey.idri.idriController.CompoundForm" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%
    JspView<CompoundForm> me = (JspView<CompoundForm>) HttpView.currentView();
    ViewContext ctx = HttpView.currentContext();
    Container container = ctx.getContainer();
%>
<script type="text/javascript">
</script>