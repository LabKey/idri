package org.labkey.idri.formulations;

import org.labkey.api.view.JspView;

public class FormulationSummaryWebPart extends JspView
{
    public static final String NAME = "Formulation Information";

    public FormulationSummaryWebPart()
    {
        super("/org/labkey/idri/view/formulations/summary.jsp");
        setViewName(NAME);
        setTitle("Summary");
    }
}
