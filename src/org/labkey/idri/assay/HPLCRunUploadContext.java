package org.labkey.idri.assay;

import org.jetbrains.annotations.NotNull;
import org.labkey.api.action.ApiVersion;
import org.labkey.api.data.Container;
import org.labkey.api.exp.ExperimentException;
import org.labkey.api.exp.api.ExpProtocol;
import org.labkey.api.exp.api.ExpRun;
import org.labkey.api.exp.property.Domain;
import org.labkey.api.exp.property.DomainProperty;
import org.labkey.api.qc.TransformResult;
import org.labkey.api.security.RequiresPermissionClass;
import org.labkey.api.security.User;
import org.labkey.api.security.permissions.InsertPermission;
import org.labkey.api.study.assay.AssayProvider;
import org.labkey.api.study.assay.AssayRunUploadContext;
import org.labkey.api.view.ActionURL;
import org.labkey.api.view.ViewContext;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * User: Nick Arnold
 * Date: 2/17/13
 */
@RequiresPermissionClass(InsertPermission.class)
@ApiVersion(12.3)
public class HPLCRunUploadContext<ProviderType extends AssayProvider> implements AssayRunUploadContext<ProviderType>
{
    private ExpProtocol _protocol;
    private ProviderType _provider;
    private ViewContext _context;
    private Map _uploadedData;
    private String _comments;
    private String _name;

    private Map<String, String> _rawRunProperties;
    private Map<String, String> _rawBatchProperties;
    private Map<DomainProperty, String> _runProperties;
    private Map<DomainProperty, String> _batchProperties;

    public HPLCRunUploadContext(
            @NotNull ExpProtocol protocol, @NotNull ProviderType provider, ViewContext context,
            String name, String comment,
            Map<String, String> runProperties,
            Map<String, String> batchProperties)
    {
        _protocol = protocol;
        _provider = provider;
        _context = context;

        _name = name;
        _comments = comment;

        _rawRunProperties = runProperties;
        _rawBatchProperties = batchProperties;
    }

    @NotNull
    @Override
    public ExpProtocol getProtocol()
    {
        return _protocol;
    }

    @Override
    public Map<DomainProperty, String> getRunProperties() throws ExperimentException
    {
        if (_runProperties == null)
        {
            Map<DomainProperty, String> properties = new HashMap<DomainProperty, String>();
            if (_rawRunProperties != null)
            {
                for (DomainProperty prop : _provider.getRunDomain(_protocol).getProperties())
                {
                    String value = null;
                    if (_rawRunProperties.containsKey(prop.getName()))
                        value = _rawRunProperties.get(prop.getName());
                    else
                        value = _rawRunProperties.get(prop.getPropertyURI());
                    properties.put(prop, value);
                }

            }
            _runProperties = properties;
        }
        return _runProperties;
    }

    @Override
    public Map<DomainProperty, String> getBatchProperties()
    {
        if (_batchProperties == null)
        {
            Map<DomainProperty, String> properties = new HashMap<DomainProperty, String>();
            if (_rawBatchProperties != null)
            {
                for (DomainProperty prop : _provider.getBatchDomain(_protocol).getProperties())
                {
                    String value = null;
                    if (_rawBatchProperties.containsKey(prop.getName()))
                        value = _rawBatchProperties.get(prop.getName());
                    else
                        value = _rawBatchProperties.get(prop.getPropertyURI());
                    properties.put(prop, value);
                }

            }
            _batchProperties = properties;
        }
        return _batchProperties;
    }

    @Override
    public String getComments()
    {
        return _comments;
    }

    @Override
    public String getName()
    {
        return _name;
    }

    @Override
    public User getUser()
    {
        return _context.getUser();
    }

    @Override
    public Container getContainer()
    {
        return _context.getContainer();
    }

    @Override
    public HttpServletRequest getRequest()
    {
        return _context.getRequest();
    }

    @Override
    public ActionURL getActionURL()
    {
        return _context.getActionURL();
    }

    @NotNull
    @Override
    public Map<String, File> getUploadedData() throws ExperimentException
    {
        return Collections.emptyMap();
//        if (_uploadedData == null)
//        {
//            try
//            {
//                AssayDataCollector<HPLCRunUploadContext> collector = new FileUploadDataCollector(1, AssayDataCollector.PRIMARY_FILE);
//                Map<String, File> files = collector.createData(this);
//                // HACK: rekey the map using PRIMARY_FILE instead of FILE_INPUT_NAME
//                _uploadedData = Collections.singletonMap(AssayDataCollector.PRIMARY_FILE, files.get(AssayDataCollector.PRIMARY_FILE));
//            }
//            catch (IOException e)
//            {
//                throw new ExperimentException(e);
//            }
//        }
//        return _uploadedData;
    }

    @Override
    public ProviderType getProvider()
    {
        return _provider;
    }

    @Override
    public Map<DomainProperty, Object> getDefaultValues(Domain domain, String scope) throws ExperimentException
    {
        throw new UnsupportedOperationException("Not Supported");
    }

    @Override
    public Map<DomainProperty, Object> getDefaultValues(Domain domain) throws ExperimentException
    {
        throw new UnsupportedOperationException("Not Supported");
    }

    @Override
    public void saveDefaultValues(Map<DomainProperty, String> values, String scope) throws ExperimentException
    {
        throw new UnsupportedOperationException("Not Supported");
    }

    @Override
    public void saveDefaultBatchValues() throws ExperimentException
    {
        throw new UnsupportedOperationException("Not Supported");
    }

    @Override
    public void saveDefaultRunValues() throws ExperimentException
    {
        throw new UnsupportedOperationException("Not Supported");
    }

    @Override
    public void clearDefaultValues(Domain domain) throws ExperimentException
    {
        throw new UnsupportedOperationException("Not Supported");
    }

    @Override
    public String getTargetStudy()
    {
        return null;
    }

    @Override
    public TransformResult getTransformResult()
    {
        return null;
    }

    @Override
    public void setTransformResult(TransformResult result)
    {
        throw new UnsupportedOperationException();
    }

    @Override
    public Integer getReRunId()
    {
        return null;
    }

    @Override
    public void uploadComplete(ExpRun run) throws ExperimentException
    {
        /* no-op */
    }
}
