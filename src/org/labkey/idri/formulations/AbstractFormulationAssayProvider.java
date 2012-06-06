/*
 * Copyright (c) 2011-2012 LabKey Corporation
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
    public AbstractFormulationAssayProvider(String protocolLSIDPrefix, String runLSIDPrefix, AssayDataType dataType)
    {
        super(protocolLSIDPrefix, runLSIDPrefix, dataType);
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
