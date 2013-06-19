/*
 * Copyright (c) 2011-2013 LabKey Corporation
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
package org.labkey.idri.formulations;

import org.labkey.api.view.JspView;

/**
 * User: jNicholas
 * Date: Aug 26, 2010
 * Time: 11:21:39 AM
 */
public class FormulationSearchWebPart extends JspView
{
    public static final String NAME = "Formulation Search";

    public FormulationSearchWebPart()
    {
        super("/org/labkey/idri/view/formulationSearch.jsp");
        setTitle(NAME);
    }
}
