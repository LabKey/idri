package org.labkey.idri;

import org.labkey.api.data.Container;
import org.labkey.api.module.Module;
import org.labkey.api.security.User;
import org.labkey.api.webdav.WebdavResource;
import org.labkey.api.webdav.WebdavService.WebdavListener;

/**
 * User: Nick Arnold
 * Date: 1/16/13
 */
public class idriWebdavListener implements WebdavListener
{
    @Override
    public void webdavCreated(WebdavResource resource, Container container, User user)
    {
        for (Module m : container.getActiveModules())
        {
            if (m instanceof idriModule)
            {
            }
        }
    }

    @Override
    public void webdavDeleted(WebdavResource resource, Container container, User user)
    {
    }
}
