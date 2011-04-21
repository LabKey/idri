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
import org.labkey.api.data.TableInfo;
import org.labkey.api.query.FieldKey;
import org.labkey.api.query.FilteredTable;

import java.util.Arrays;

/**
 * Created by IntelliJ IDEA.
 * User: jNicholas
 * Date: Aug 26, 2010
 * Time: 3:43:28 PM
 */
public class ConcentrationsTable extends EditableFilteredTable
{
    private static final FieldKey[] defaultCols = new FieldKey[] {FieldKey.fromString("Compound"),
            FieldKey.fromString("Lot"),
            FieldKey.fromString("Concentration"),
            FieldKey.fromString("Unit")};

    public ConcentrationsTable(TableInfo tInfo, Container container)
    {
        super(tInfo, container);

        addColumn(wrapColumn("Compound", getRealTable().getColumn("Compound")));
        addColumn(wrapColumn("Lot", getRealTable().getColumn("Lot")));
        addColumn(wrapColumn("Concentration", getRealTable().getColumn("Concentration")));
        addColumn(wrapColumn("Unit", getRealTable().getColumn("Unit")));
        addColumn(wrapColumn("Material", getRealTable().getColumn("Material")));
        addColumn(wrapColumn("IsTop", getRealTable().getColumn("istop")));

        /* Create lookup column that displays Lot - Lot Number */
        setDefaultVisibleColumns(Arrays.asList(defaultCols));
    }
}
