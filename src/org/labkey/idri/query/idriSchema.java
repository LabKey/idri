/*
 * Copyright (c) 2011-2012 LabKey Corporation
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
import org.labkey.api.data.DbSchema;
import org.labkey.api.data.SchemaTableInfo;
import org.labkey.api.data.TableInfo;
import org.labkey.api.query.DefaultSchema;
import org.labkey.api.query.FilteredTable;
import org.labkey.api.query.QuerySchema;
import org.labkey.api.query.UserSchema;
import org.labkey.api.security.User;
import org.labkey.idri.idriModule;

import java.util.HashSet;
import java.util.Set;

public class idriSchema extends UserSchema
{
    public static final String NAME = "idri";
    public static final String DESCRIPTION = "Container IDRI Formulations Data.";
    
    public static final String TABLE_COMPOUNDS = "Compounds";
    public static final String TABLE_RAW_MATERIALS = "Raw Materials";
    public static final String TABLE_FORMULATIONS = "Formulations";
    public static final String TABLE_CONCENTRATIONS = "Concentrations";

    public static final String LIST_MATERIAL_TYPES = "MaterialTypes";

    public static void register(final idriModule module)
    {
        DefaultSchema.registerProvider(NAME, new DefaultSchema.SchemaProvider()
        {
            @Override
            public QuerySchema getSchema(DefaultSchema schema)
            {
                if (schema.getContainer().getActiveModules().contains(module))
                    return new idriSchema(schema.getUser(), schema.getContainer());
                return null;
            }
        });
    }

    public idriSchema(User user, Container container)
    {
        super(NAME, DESCRIPTION, user, container, DbSchema.get(NAME));
    }
    
    @Override
    protected TableInfo createTable(String name)
    {
        if (TABLE_CONCENTRATIONS.equalsIgnoreCase(name))
        {
            return new ConcentrationsTable(getDbSchema().getTable(TABLE_CONCENTRATIONS), getContainer());
        }
        else
        {
            //just return a filtered table over the db table if it exists
            SchemaTableInfo tinfo = getDbSchema().getTable(name);
            if (null == tinfo)
                return null;

            FilteredTable ftable = new FilteredTable(tinfo, getContainer());
            ftable.wrapAllColumns(true);
            return ftable;
        }
    }

    @Override
    public Set<String> getTableNames()
    {
        return new HashSet<String>(getDbSchema().getTableNames());
    }
}
