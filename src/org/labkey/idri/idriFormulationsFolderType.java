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

import org.labkey.api.data.Container;
import org.labkey.api.module.MultiPortalFolderType;
import org.labkey.api.security.User;
import org.labkey.api.view.FolderTab;
import org.labkey.api.view.Portal;
import org.labkey.api.view.ViewContext;

import java.util.Arrays;
import java.util.List;

/**
 * User: jNicholas
 * Date: Aug 25, 2010
 * Time: 3:51:22 PM
 */
public class idriFormulationsFolderType extends MultiPortalFolderType
{
    public static final String NAME = "IDRI Formulations";

    private static final List<FolderTab> TABS = Arrays.asList(
            new idriFolderTabs.OverviewPage("Overview"),
            new idriFolderTabs.FormulationSummaryPage("Formulation Summary")
    );

    public idriFormulationsFolderType(idriModule module)
    {
        super(NAME,
                "Manage formulations data, modeling, and assays. One per site.",
                Arrays.asList(
                        Portal.getPortalPart("Formulation Search").createWebPart(),
                        Portal.getPortalPart("Sample Sets").createWebPart(),
                        Portal.getPortalPart("Assay List").createWebPart(),
                        Portal.getPortalPart("Lists").createWebPart()
                ),
                null,
                getDefaultModuleSet(module, getModule("Experiment"), getModule("Study")),
                module);
    }

    @Override
    public String getStartPageLabel(ViewContext ctx)
    {
        return "Formulations";
    }

    @Override
    public void configureContainer(Container c, User user)
    {
        super.configureContainer(c, user);

        idriManager.initializeSampleSets(c);
    }

    @Override
    public List<FolderTab> getDefaultTabs()
    {
        return TABS;
    }
}
