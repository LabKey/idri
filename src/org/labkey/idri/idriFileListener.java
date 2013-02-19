/*
 * Copyright (c) 2013 LabKey Corporation
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
import org.labkey.api.exp.api.ExpProtocol;
import org.labkey.api.files.FileListener;
import org.labkey.api.security.User;
import org.labkey.api.study.assay.AssayService;
import org.labkey.api.view.HttpView;
import org.labkey.idri.assay.HPLCManager;

import java.io.File;
import java.util.List;

/**
 * User: Nick Arnold
 * Date: 1/16/13
 */
public class idriFileListener implements FileListener
{
    @Override
    public void fileCreated(@NotNull File created, @Nullable User user, @Nullable Container container)
    {
        HPLCManager.get().load(created, HttpView.getRootContext());
    }

    @Override
    public void fileMoved(@NotNull File src, @NotNull File dest, @Nullable User user, @Nullable Container container)
    {
    }
}
