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
package org.labkey.idri.query;

import org.labkey.api.data.Container;
import org.labkey.api.data.DatabaseTableType;
import org.labkey.api.data.TableInfo;
import org.labkey.api.query.DefaultQueryUpdateService;
//import org.labkey.api.query.DefaultQueryUpdateService;
import org.labkey.api.query.FilteredTable;
import org.labkey.api.query.QueryUpdateService;
import org.labkey.api.security.User;
import org.labkey.api.security.permissions.Permission;

/**
 * Created by IntelliJ IDEA.
 * User: dave
 * Date: Apr 28, 2010
 * Time: 1:50:31 PM
 */
public class EditableFilteredTable extends FilteredTable
{
    public EditableFilteredTable(TableInfo table, Container container)
    {
        super(table, container);
    }

    @Override
    public QueryUpdateService getUpdateService()
    {
        TableInfo table = getRealTable();
        return (table != null && table.getTableType() == DatabaseTableType.TABLE ?
                new DefaultQueryUpdateService(this, table):
                null);
    }

    @Override
    public boolean hasPermission(User user, Class<? extends Permission> perm)
    {
        return getContainer().hasPermission(user, perm);
    }
}