package org.labkey.idri.query;

import org.labkey.api.data.Aggregate;
import org.labkey.api.data.ColumnInfo;
import org.labkey.api.data.DisplayColumn;
import org.labkey.api.data.DisplayColumnFactory;
import org.labkey.api.data.SimpleFilter;
import org.labkey.api.data.TableInfo;
import org.labkey.api.query.QuerySettings;
import org.labkey.api.query.QueryView;
import org.labkey.api.view.DataView;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by IntelliJ IDEA.
 * User: jNicholas
 * Date: Aug 26, 2010
 * Time: 3:22:25 PM
 */
public class ConcentrationsQueryView extends QueryView
{
    public static final String DATAREGION_NAME = "concentrations";
    
    public ConcentrationsQueryView(idriSchema schema)
    {
        super(schema);

        QuerySettings settings = new QuerySettings(getViewContext(), DATAREGION_NAME);
        settings.setSchemaName(schema.getSchemaName());
        settings.setQueryName("Concentrations");    
        settings.setAllowChooseQuery(false);

        setSettings(settings);
    }

    public DataView createDataView()
    {
        DataView view = super.createDataView();

        /* Add base sorts here */

        // Filter out sequences which are not the top
        SimpleFilter filter = (SimpleFilter)view.getRenderContext().getBaseFilter();

        if (filter == null)
            filter = new SimpleFilter();
        
        view.getRenderContext().setBaseFilter(filter);
        
        return view;
    }
}
