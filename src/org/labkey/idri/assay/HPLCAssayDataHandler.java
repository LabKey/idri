package org.labkey.idri.assay;

import org.labkey.api.exp.api.DataType;
import org.labkey.api.study.assay.AbstractAssayTsvDataHandler;
import org.labkey.api.study.assay.AssayDataType;
import org.labkey.api.util.FileType;

/**
 * User: Nick Arnold
 * Date: 2/14/13
 */
public class HPLCAssayDataHandler extends AbstractAssayTsvDataHandler
{
    public static final String NAMESPACE = "HPLCAssayData";
    private static final AssayDataType DATA_TYPE = new AssayDataType(NAMESPACE, new FileType(".hplcmeta"));

    @Override
    public DataType getDataType()
    {
        return DATA_TYPE;
    }

    @Override
    protected boolean allowEmptyData()
    {
        return true;
    }

    @Override
    protected boolean shouldAddInputMaterials()
    {
        return false;
    }
}
