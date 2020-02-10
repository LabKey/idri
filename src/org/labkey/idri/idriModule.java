/*
 * Copyright (c) 2011-2019 LabKey Corporation
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
import org.jetbrains.annotations.Nullable;
import org.labkey.api.data.Container;
import org.labkey.api.data.ContainerManager;
import org.labkey.api.exp.api.ExperimentService;
import org.labkey.api.files.FileContentService;
import org.labkey.api.module.DefaultModule;
import org.labkey.api.module.FolderTypeManager;
import org.labkey.api.module.ModuleContext;
import org.labkey.api.module.ModuleProperty;
import org.labkey.api.view.BaseWebPartFactory;
import org.labkey.api.view.JspView;
import org.labkey.api.view.Portal;
import org.labkey.api.view.ViewContext;
import org.labkey.api.view.WebPartFactory;
import org.labkey.api.view.WebPartView;
import org.labkey.idri.assay.hplc.HPLCAssayDataHandler;
import org.labkey.idri.assay.hplc.HPLCManager;
import org.labkey.idri.formulations.ConcentrationsWebPart;
import org.labkey.idri.formulations.FormulationSearchWebPart;
import org.labkey.idri.formulations.FormulationSummaryWebPart;
import org.labkey.idri.formulations.HPLCWebPart;
import org.labkey.idri.formulations.ParticleSizeWebPart;
import org.labkey.idri.formulations.StabilityWebPart;
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
    public static final String WEBPART_TASKLIST = "Formulations Task List";

    public static final String FORMULATION_PREFIXES = "FormulationPrefixes";
    final ModuleProperty _formulationPrefixes;

    public idriModule()
    {
        _formulationPrefixes = new ModuleProperty(this, FORMULATION_PREFIXES);
        _formulationPrefixes.setDescription("The set of valid prefixes available for creating, searching, and reading Formulation lots.");
        _formulationPrefixes.setCanSetPerContainer(true);
        _formulationPrefixes.setDefaultValue("TD,QF,QD,QG,QH,QI,QJ,QK,QL");
        addModuleProperty(_formulationPrefixes);
    }

    @Override
    public String getName()
    {
        return "idri";
    }

    @Override
    public @Nullable Double getSchemaVersion()
    {
        return 20.000;
    }

    @Override
    public boolean hasScripts()
    {
        return true;
    }

    @Override
    @NotNull
    protected Collection<WebPartFactory> createWebPartFactories()
    {
        return new ArrayList<>(Arrays.asList(

            new BaseWebPartFactory(FormulationSearchWebPart.NAME)
            {
                @Override
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
                {
                    return new FormulationSearchWebPart();
                }
            },
            new BaseWebPartFactory(FormulationSummaryWebPart.NAME)
            {
                @Override
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
                {
                    return new FormulationSummaryWebPart();
                }
            },
            new BaseWebPartFactory(ConcentrationsWebPart.NAME)
            {
                @Override
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
                {
                    return new ConcentrationsWebPart();
                }
            },
            new BaseWebPartFactory(ParticleSizeWebPart.NAME)
            {
                @Override
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
                {
                    return new ParticleSizeWebPart();
                }
            },
            new BaseWebPartFactory(StabilityWebPart.NAME)
            {
                @Override
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
                {
                    return new StabilityWebPart();
                }
            },
            new BaseWebPartFactory(HPLCWebPart.NAME)
            {
                @Override
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
                {
                    return new HPLCWebPart();
                }
            },
            new BaseWebPartFactory(WEBPART_TASKLIST)
            {
                @Override
                public WebPartView getWebPartView(@NotNull ViewContext portalCtx, @NotNull Portal.WebPart webPart)
                {
                    JspView view = new JspView("/org/labkey/idri/view/formulations/taskList.jsp");
                    view.setViewName(WEBPART_TASKLIST);
                    view.setTitle("Task List");
                    return view;
                }
            },
            new BaseWebPartFactory(WEBPART_CONCENTRATIONS)
            {
                @Override
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
                @Override
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

    @Override
    protected void init()
    {
        addController("idri", idriController.class);
    }

    @Override
    public void doStartup(ModuleContext moduleContext)
    {
        // add a container listener so we'll know when our container is deleted:
        ContainerManager.addContainerListener(new idriContainerListener());

        idriSchema.register(this);

        // add folder types
        FolderTypeManager.get().registerFolderType(this, new idriFormulationsFolderType(this));

        // listen for webdav events
        FileContentService.get().addFileListener(new idriFileListener());

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
        return Set.of(HPLCManager.HPLCImportTestCase.class);
    }
}
