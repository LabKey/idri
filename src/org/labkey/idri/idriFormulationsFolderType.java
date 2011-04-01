package org.labkey.idri;

import org.labkey.api.data.Container;
import org.labkey.api.module.DefaultFolderType;
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
                "Manage formulations data, modeling, and assays. One per site.",
                Arrays.asList(
                        Portal.getPortalPart("Formulation Search").createWebPart()                       
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
    public void configureContainer(Container c)
    {
        super.configureContainer(c);

        idriManager.initializeSampleSets(c);
    }
}
