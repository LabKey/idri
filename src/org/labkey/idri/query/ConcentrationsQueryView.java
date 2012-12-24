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
