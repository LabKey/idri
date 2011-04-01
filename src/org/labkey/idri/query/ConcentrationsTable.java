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
