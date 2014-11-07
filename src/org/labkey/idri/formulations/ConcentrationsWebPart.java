package org.labkey.idri.formulations;

import org.labkey.api.view.JspView;

public class ConcentrationsWebPart extends JspView
{
    public static final String NAME = "Formulation Concentrations";

    public ConcentrationsWebPart()
    {
        super("/org/labkey/idri/view/formulations/concentrations.jsp");
        setViewName(NAME);
        setTitle("Concentrations");
    }
}
