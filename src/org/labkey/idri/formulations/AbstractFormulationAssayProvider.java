package org.labkey.idri.formulations;

import org.labkey.api.pipeline.PipelineProvider;
import org.labkey.api.study.actions.AssayRunUploadForm;
import org.labkey.api.study.assay.AbstractAssayProvider;
import org.labkey.api.study.assay.AssayDataType;
import org.labkey.api.study.assay.AssayTableMetadata;
import org.labkey.api.study.assay.ParticipantVisitResolverType;
import org.labkey.api.view.HttpView;

import java.util.List;

/**
 * Created by IntelliJ IDEA.
 * User: jNicholas
 * Date: Sep 29, 2010
 * Time: 2:29:18 PM
 */
public abstract class AbstractFormulationAssayProvider extends AbstractAssayProvider implements FormulationAssayProvider
{
    public AbstractFormulationAssayProvider(String protocolLSIDPrefix, String runLSIDPrefix, AssayDataType dataType, AssayTableMetadata tableMetadata)
    {
        super(protocolLSIDPrefix, runLSIDPrefix, dataType, tableMetadata);
    }

    @Override
    public String getName()
    {
        return null;  //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    public HttpView getDataDescriptionView(AssayRunUploadForm form)
    {
        return null;  //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    public List<ParticipantVisitResolverType> getParticipantVisitResolverTypes()
    {
        return null;  //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    public PipelineProvider getPipelineProvider()
    {
        return null;  //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    public String getDescription()
    {
        return null;  //To change body of implemented methods use File | Settings | File Templates.
    }

    @Override
    public void foo(int x, int y)
    {
        //To change body of implemented methods use File | Settings | File Templates.
    }
}
