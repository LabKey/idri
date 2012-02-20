/*
 * Copyright (c) 2011 LabKey Corporation
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
import org.labkey.api.module.DefaultFolderType;
import org.labkey.api.security.User;
import org.labkey.api.view.Portal;
import org.labkey.api.view.ViewContext;

import java.util.Arrays;

/**
 * Created by IntelliJ IDEA.
 * User: jNicholas
 * Date: Aug 25, 2010
 * Time: 3:51:22 PM
 */
public class idriFormulationsFolderType extends DefaultFolderType
{
    public idriFormulationsFolderType(idriModule module)
    {
        super("IDRI Formulations Folder",
                "Manage formulations data, modeling, and assays. One per site. (Requires the Formulations Module)",
                Arrays.asList(
                        Portal.getPortalPart("Formulation Search").createWebPart(),
                        Portal.getPortalPart("Sample Sets").createWebPart(),
                        Portal.getPortalPart("Assay List").createWebPart(),
                        Portal.getPortalPart("Lists").createWebPart()
                ),
                null,
                getDefaultModuleSet(module, getModule("Experiment"), getModule("Study"), getModule("Formulations")), // Formulations is an external module.
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
}
