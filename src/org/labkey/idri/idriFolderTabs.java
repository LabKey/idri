package org.labkey.idri;

import org.labkey.api.data.Container;
import org.labkey.api.portal.ProjectUrls;
import org.labkey.api.security.User;
import org.labkey.api.util.PageFlowUtil;
import org.labkey.api.view.ActionURL;
import org.labkey.api.view.FolderTab;
import org.labkey.api.view.Portal;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by Nick Arnold on 9/25/2014.
 */
public class idriFolderTabs
{
    public static class OverviewPage extends FolderTab
    {
        public OverviewPage(String caption)
        {
            super(caption);
        }

        @Override
        public ActionURL getURL(Container container, User user)
        {
            return PageFlowUtil.urlProvider(ProjectUrls.class).getBeginURL(container);
        }
    }

    public static class FormulationSummaryPage extends FolderTab.PortalPage
    {
        public static final String PAGE_ID = "idri.LOT_SUMMARY";

        public FormulationSummaryPage(String caption)
        {
            super(PAGE_ID, caption);
        }

        @Override
        public List<Portal.WebPart> createWebParts()
        {
            List<Portal.WebPart> parts = new ArrayList<>();
//            parts.add(Portal.getPortalPart("Formulation Search").createWebPart());
            // TODO: This is where we'll add the new webparts
            return parts;
        }
    }
}
