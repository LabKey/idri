package org.labkey.idri.query;

import org.labkey.api.data.Container;
import org.labkey.api.data.TableInfo;
import org.labkey.api.query.AbstractQueryUpdateService;
import org.labkey.api.query.DefaultQueryUpdateService;
import org.labkey.api.query.DuplicateKeyException;
//import org.labkey.api.query.DefaultQueryUpdateService;
import org.labkey.api.query.FilteredTable;
import org.labkey.api.query.InvalidKeyException;
import org.labkey.api.query.QueryUpdateService;
import org.labkey.api.query.QueryUpdateServiceException;
import org.labkey.api.query.ValidationException;
import org.labkey.api.security.User;
import org.labkey.api.security.permissions.Permission;

import java.sql.SQLException;
import java.util.Map;

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
        return (table != null && table.getTableType() == TableInfo.TABLE_TYPE_TABLE ?
                new DefaultQueryUpdateService(this, table):
                null);
    }

    @Override
    public boolean hasPermission(User user, Class<? extends Permission> perm)
    {
        return getContainer().hasPermission(user, perm);
    }
}