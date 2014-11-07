package org.labkey.idri.formulations;

import org.labkey.api.view.JspView;

public class StabilityWebPart extends JspView
{
    public static final String NAME = "Formulation Stability";

    public StabilityWebPart()
    {
        super("/org/labkey/idri/view/formulations/stability.jsp");
        setViewName(NAME);
        setTitle("Stability Reports");
    }
}
