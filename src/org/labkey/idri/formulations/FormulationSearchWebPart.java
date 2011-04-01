package org.labkey.idri.formulations;

import org.labkey.api.view.JspView;

/**
 * Created by IntelliJ IDEA.
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
