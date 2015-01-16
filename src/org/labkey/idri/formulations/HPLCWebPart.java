package org.labkey.idri.formulations;

import org.labkey.api.view.JspView;

public class HPLCWebPart extends JspView
{
    public static final String NAME = "Formulation HPLC";

    public HPLCWebPart()
    {
        super("/org/labkey/idri/view/formulations/hplcWebPart.jsp");
        setViewName(NAME);
        setTitle("HPLC");
    }
}
