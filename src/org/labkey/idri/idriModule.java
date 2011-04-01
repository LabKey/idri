package org.labkey.idri;

import org.labkey.api.data.Container;
import org.labkey.api.data.ContainerManager;
import org.labkey.api.data.DbSchema;
import org.labkey.api.data.SimpleFilter;
import org.labkey.api.module.DefaultModule;
import org.labkey.api.module.ModuleContext;
import org.labkey.api.module.ModuleLoader;
import org.labkey.api.util.PageFlowUtil;
import org.labkey.api.view.BaseWebPartFactory;
import org.labkey.api.view.JspView;
import org.labkey.api.view.Portal;
import org.labkey.api.view.ViewContext;
import org.labkey.api.view.WebPartFactory;
import org.labkey.api.view.WebPartView;
import org.labkey.idri.formulations.FormulationSearchWebPart;
import org.labkey.idri.query.ConcentrationsQueryView;
import org.labkey.idri.query.idriSchema;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;

public class idriModule extends DefaultModule
{
    public static final String WEBPART_CONCENTRATIONS = "Concentrations";
    public static final String WEBPART_CREATE_FORMULATION = "Formulation Creation";
    
    public String getName()
    {
        return "idri";
    }

    public double getVersion()
    {
        return 10.39;
    }

    public boolean hasScripts()
    {
        return true;
    }

    protected Collection<WebPartFactory> createWebPartFactories()
    {
        return new ArrayList<WebPartFactory>(Arrays.asList(

                new BaseWebPartFactory(FormulationSearchWebPart.NAME)
                {
                    public WebPartView getWebPartView(ViewContext portalCtx, Portal.WebPart webPart)
                    {
                        return new FormulationSearchWebPart();
                    }
                },
                new BaseWebPartFactory(WEBPART_CONCENTRATIONS)
                {
                    public WebPartView getWebPartView(ViewContext portalCtx, Portal.WebPart webPart)
                    {
                        ConcentrationsQueryView view = new ConcentrationsQueryView(new idriSchema(portalCtx.getUser(), portalCtx.getContainer()));
                        view.setTitle(WEBPART_CONCENTRATIONS);
                        view.setFrame(WebPartView.FrameType.PORTAL);
                        return view;
                    }
                },
                new BaseWebPartFactory(WEBPART_CREATE_FORMULATION)
                {
                    public WebPartView getWebPartView(ViewContext portalCtx, Portal.WebPart webPart)
                    {
                        JspView view = new JspView("/org/labkey/idri/view/createFormulation.jsp");
                        view.setTitle(WEBPART_CREATE_FORMULATION);                       
                        view.setFrame(WebPartView.FrameType.PORTAL);
                        return view;
                    }
                }
        ));
    }

    protected void init()
    {
        addController("idri", idriController.class);
        idriSchema.register();
    }

    public void startup(ModuleContext moduleContext)
    {
        // add a container listener so we'll know when our container is deleted:
        ContainerManager.addContainerListener(new idriContainerListener());

        // add folder types
        ModuleLoader.getInstance().registerFolderType(this, new idriFormulationsFolderType(this));
    }

    @Override
    public Collection<String> getSummary(Container c)
    {
        return Collections.emptyList();
    }

    @Override
    public Set<String> getSchemaNames()
    {
        return Collections.singleton("idri");
    }

    @Override
    public Set<DbSchema> getSchemasToTest()
    {
        return PageFlowUtil.set(DbSchema.get(idriSchema.NAME));
    }
}