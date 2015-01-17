/*
 * Copyright (c) 2014-2015 LabKey Corporation
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
import org.labkey.api.portal.ProjectUrls;
import org.labkey.api.security.User;
import org.labkey.api.util.PageFlowUtil;
import org.labkey.api.view.ActionURL;
import org.labkey.api.view.FolderTab;
import org.labkey.api.view.Portal;
import org.labkey.idri.formulations.ConcentrationsWebPart;
import org.labkey.idri.formulations.FormulationSearchWebPart;
import org.labkey.idri.formulations.FormulationSummaryWebPart;
import org.labkey.idri.formulations.HPLCWebPart;
import org.labkey.idri.formulations.ParticleSizeWebPart;
import org.labkey.idri.formulations.StabilityWebPart;

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
            parts.add(Portal.getPortalPart(FormulationSearchWebPart.NAME).createWebPart());
            parts.add(Portal.getPortalPart(FormulationSummaryWebPart.NAME).createWebPart());
            parts.add(Portal.getPortalPart(ConcentrationsWebPart.NAME).createWebPart());
            parts.add(Portal.getPortalPart(ParticleSizeWebPart.NAME).createWebPart());
            parts.add(Portal.getPortalPart(StabilityWebPart.NAME).createWebPart());
            parts.add(Portal.getPortalPart(HPLCWebPart.NAME).createWebPart());
            return parts;
        }
    }
}
