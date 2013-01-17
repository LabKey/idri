package org.labkey.idri;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.labkey.api.data.Container;
import org.labkey.api.files.FileListener;
import org.labkey.api.security.User;

import java.io.File;

/**
 * User: Nick Arnold
 * Date: 1/16/13
 */
public class idriFileListener implements FileListener
{
    @Override
    public void fileCreated(@NotNull File created, @Nullable User user, @Nullable Container container)
    {
        int x = 1;
    }

    @Override
    public void fileMoved(@NotNull File src, @NotNull File dest, @Nullable User user, @Nullable Container container)
    {
        //To change body of implemented methods use File | Settings | File Templates.
    }
}
