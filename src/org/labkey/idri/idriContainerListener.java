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

import org.apache.log4j.Logger;
import org.labkey.api.data.Container;
import org.labkey.api.data.ContainerManager.ContainerListener;
import org.labkey.api.data.DbSchema;
import org.labkey.api.data.RuntimeSQLException;
import org.labkey.api.data.SQLFragment;
import org.labkey.api.data.Table;
import org.labkey.api.security.User;

import java.beans.PropertyChangeEvent;
import java.sql.SQLException;

public class idriContainerListener implements ContainerListener
{
    private static final Logger _log = Logger.getLogger(idriContainerListener.class);
    
    @Override
    public void containerCreated(Container c, User user)
    {
    }

    @Override
    public void containerDeleted(Container c, User user)
    {
        try
        {
            DbSchema schema = idriManager.getSchema();
            Table.execute(schema, "DELETE FROM idri.Concentrations WHERE CONTAINER=?", c);
        }
        catch (SQLException e)
        {
            _log.error("Failure cleaning up IDRI data when deleting container " + c.getPath(), e);
            throw new RuntimeSQLException(e);
        }
    }

    @Override
    public void containerMoved(Container c, Container oldParent, User user)
    {        
    }

    @Override
    public void propertyChange(PropertyChangeEvent evt)
    {
    }
}