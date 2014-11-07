package org.labkey.idri.formulations;

import org.labkey.api.view.JspView;

public class ParticleSizeWebPart extends JspView
{
    public static final String NAME = "Formulation Particle Size";

    public ParticleSizeWebPart()
    {
        super("/org/labkey/idri/view/formulations/particleSize.jsp");
        setViewName(NAME);
        setTitle("Particle Size");
    }
}
