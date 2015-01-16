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
package org.labkey.idri;

import org.jetbrains.annotations.NotNull;
import org.labkey.api.data.Container;
import org.labkey.api.data.ContainerManager;
import org.labkey.api.exp.api.ExperimentService;
import org.labkey.api.files.FileContentService;
import org.labkey.api.module.DefaultModule;
import org.labkey.api.module.ModuleContext;
import org.labkey.api.module.ModuleLoader;
import org.labkey.api.services.ServiceRegistry;
import org.labkey.api.view.BaseWebPartFactory;
import org.labkey.api.view.JspView;
import org.labkey.api.view.Portal;
import org.labkey.api.view.ViewContext;
import org.labkey.api.view.WebPartFactory;
import org.labkey.api.view.WebPartView;
import org.labkey.idri.assay.hplc.HPLCAssayDataHandler;
import org.labkey.idri.assay.hplc.HPLCManager;
import org.labkey.idri.formulations.ConcentrationsWebPart;
import org.labkey.idri.formulations.FormulationSummaryWebPart;
import org.labkey.idri.formulations.HPLCWebPart;
import org.labkey.idri.formulations.ParticleSizeWebPart;
import org.labkey.idri.formulations.FormulationSearchWebPart;
import org.labkey.idri.formulations.StabilityWebPart;
import org.labkey.idri.query.ConcentrationsQueryView;
import org.labkey.idri.query.idriSchema;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
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
        return 14.30;
    }

    public boolean hasScripts()
    {
        return true;
    }

    @NotNull
    protected Collection<WebPartFactory> createWebPartFactories()
    {
        return new ArrayList<WebPartFactory>(Arrays.asList(

            new BaseWebPartFactory(FormulationSearchWebPart.NAME)
            {
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
                {
                    return new FormulationSearchWebPart();
                }
            },
            new BaseWebPartFactory(FormulationSummaryWebPart.NAME)
            {
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
                {
                    return new FormulationSummaryWebPart();
                }
            },
            new BaseWebPartFactory(ConcentrationsWebPart.NAME)
            {
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
                {
                    return new ConcentrationsWebPart();
                }
            },
            new BaseWebPartFactory(ParticleSizeWebPart.NAME)
            {
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
                {
                    return new ParticleSizeWebPart();
                }
            },
            new BaseWebPartFactory(StabilityWebPart.NAME)
            {
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
                {
                    return new StabilityWebPart();
                }
            },
            new BaseWebPartFactory(HPLCWebPart.NAME)
            {
                public WebPartView getWebPartView(ViewContext portalCtx, Portal.WebPart webPart)
                {
                    return new HPLCWebPart();
                }
            },
            new BaseWebPartFactory(WEBPART_CONCENTRATIONS)
            {
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
                {
                    ConcentrationsQueryView view = new ConcentrationsQueryView(new idriSchema(portalCtx.getUser(), portalCtx.getContainer()));
                    view.setTitle(WEBPART_CONCENTRATIONS);
                    view.setFrame(WebPartView.FrameType.PORTAL);
                    return view;
                }
            },
            new BaseWebPartFactory(WEBPART_CREATE_FORMULATION)
            {
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
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
    }

    public void doStartup(ModuleContext moduleContext)
    {
        // add a container listener so we'll know when our container is deleted:
        ContainerManager.addContainerListener(new idriContainerListener());

        idriSchema.register(this);

        // add folder types
        ModuleLoader.getInstance().registerFolderType(this, new idriFormulationsFolderType(this));

        // listen for webdav events
        ServiceRegistry.get(FileContentService.class).addFileListener(new idriFileListener());

        // HPLC Assay Support
        ExperimentService.get().registerExperimentDataHandler(new HPLCAssayDataHandler());
    }

    @NotNull
    @Override
    public Collection<String> getSummary(Container c)
    {
        return Collections.emptyList();
    }

    @Override
    @NotNull
    public Set<String> getSchemaNames()
    {
        return Collections.singleton(idriSchema.NAME);
    }

    @NotNull
    @Override
    public Set<Class> getUnitTests()
    {
        return new HashSet<Class>(Arrays.asList(
                HPLCManager.HPLCImportTestCase.class
        ));
    }
}
