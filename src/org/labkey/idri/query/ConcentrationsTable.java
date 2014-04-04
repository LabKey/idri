/*
 * Copyright (c) 2011-2014 LabKey Corporation
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

import org.labkey.api.data.ColumnInfo;
import org.labkey.api.data.DatabaseTableType;
import org.labkey.api.data.TableInfo;
import org.labkey.api.exp.query.ExpSchema;
import org.labkey.api.query.*;
import org.labkey.api.security.UserPrincipal;
import org.labkey.api.security.permissions.Permission;

import java.util.Arrays;

/**
 * User: jNicholas
 * Date: Aug 26, 2010
 * Time: 3:43:28 PM
 */
public class ConcentrationsTable extends FilteredTable<idriSchema>
{
    private static final FieldKey[] defaultCols = new FieldKey[] {FieldKey.fromString("Compound"),
            FieldKey.fromString("Lot"),
            FieldKey.fromString("Concentration"),
            FieldKey.fromString("Unit")};

    public ConcentrationsTable(idriSchema schema)
    {
        super(schema.getDbSchema().getTable(idriSchema.TABLE_CONCENTRATIONS), schema);

        addColumn(wrapColumn("rowId", getRealTable().getColumn("rowId")));
        ColumnInfo compoundCol = addColumn(wrapColumn("Compound", getRealTable().getColumn("Compound")));
        compoundCol.setFk(new LookupForeignKey("rowid")
        {
            @Override
            public TableInfo getLookupTableInfo()
            {
                return new ExpSchema(_userSchema.getUser(), _userSchema.getContainer()).getTable("materials");
            }
        });
        ColumnInfo lotCol = addColumn(wrapColumn("Lot", getRealTable().getColumn("Lot")));
        lotCol.setFk(new LookupForeignKey("rowid")
        {
            @Override
            public TableInfo getLookupTableInfo()
            {
                return new ExpSchema(_userSchema.getUser(), _userSchema.getContainer()).getTable("materials");
            }
        });
        addColumn(wrapColumn("Concentration", getRealTable().getColumn("Concentration")));
        addColumn(wrapColumn("Unit", getRealTable().getColumn("Unit")));
        ColumnInfo matCol = addColumn(wrapColumn("Material", getRealTable().getColumn("Material")));
        matCol.setFk(new LookupForeignKey("rowid")
        {
            @Override
            public TableInfo getLookupTableInfo()
            {
                return new ExpSchema(_userSchema.getUser(), _userSchema.getContainer()).getTable("materials");
            }
        });
        addColumn(wrapColumn("IsTop", getRealTable().getColumn("istop")));

        /* Create lookup column that displays Lot - Lot Number */
        setDefaultVisibleColumns(Arrays.asList(defaultCols));
    }

    @Override
    public QueryUpdateService getUpdateService()
    {
        TableInfo table = getRealTable();
        if (table != null && table.getTableType() == DatabaseTableType.TABLE)
            return new DefaultQueryUpdateService(this, table);
        return null;
    }

    @Override
    public boolean hasPermission(UserPrincipal user, Class<? extends Permission> perm)
    {
        return getContainer().hasPermission(user, perm);
    }
}
