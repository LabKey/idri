package org.labkey.idri.formulations;

import org.labkey.api.study.assay.AssayProvider;

/**
 * Created by IntelliJ IDEA.
 * User: jNicholas
 * Date: Sep 29, 2010
 * Time: 2:27:59 PM
 */
public interface FormulationAssayProvider extends AssayProvider
{
    /* Formulation assay specific methods (e.g. failures) */
    public void foo(int x, int y);
}
