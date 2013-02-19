package org.labkey.idri.assay;

import org.apache.log4j.Logger;
import org.jetbrains.annotations.NotNull;
import org.labkey.api.exp.ExperimentException;
import org.labkey.api.exp.XarContext;
import org.labkey.api.exp.api.DataType;
import org.labkey.api.exp.api.ExpData;
import org.labkey.api.exp.api.ExpExperiment;
import org.labkey.api.exp.api.ExpProtocol;
import org.labkey.api.exp.api.ExpRun;
import org.labkey.api.qc.DataLoaderSettings;
import org.labkey.api.query.ValidationException;
import org.labkey.api.study.assay.AssayProvider;
import org.labkey.api.study.assay.AssayService;
import org.labkey.api.study.assay.AssayUploadXarContext;
import org.labkey.api.study.assay.DefaultAssayRunCreator;
import org.labkey.api.view.ViewBackgroundInfo;
import org.labkey.api.view.ViewContext;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * User: Nick Arnold
 * Date: 2/18/13
 */
public class HPLCManager
{
    static Logger _log = Logger.getLogger(HPLCManager.class);

    private static final HPLCManager _instance = new HPLCManager();

    private HPLCManager()
    {
        // prevent external construction with a private default constructor
    }

    public static HPLCManager get()
    {
        return _instance;
    }

    public static void load(@NotNull File file, ViewContext context)
    {
        // Listen for metadata file
        if (checkMetaFile(file))
        {
            List<ExpProtocol> protocols = AssayService.get().getAssayProtocols(context.getContainer());

            // Check only for HPLC assay
            for (ExpProtocol protocol : protocols)
            {
                if (protocol.getName().equalsIgnoreCase("HPLC"))
                {
                    _instance.generateRun(protocol, file, context);
                }
            }
        }
    }

    public static void generateRun(ExpProtocol protocol, File metadata, ViewContext ctx)
    {
        AssayProvider provider = AssayService.get().getProvider(protocol);

        if (null != provider)
        {
            String runName = getRunName(metadata);
            if (runName.length() > 0)
            {
                // Create Run
                ExpRun run = AssayService.get().createExperimentRun(runName, ctx.getContainer(), protocol, null);
                Map<String, String> runProps = new HashMap<String, String>();
                Map<String, String> batchProps = new HashMap<String, String>();

                // Populate Upload Context
                HPLCRunUploadContext context = new HPLCRunUploadContext(protocol,  provider, ctx,  runName, "",  runProps,  batchProps);

                // Create ExpData and Data Handler for parsing Metadata file into maps
                ExpData hplcData = DefaultAssayRunCreator.createData(
                        run.getContainer(), metadata, "Analysis Result", provider.getDataType(), true
                );
                HPLCAssayDataHandler dataHandler = new HPLCAssayDataHandler();
                XarContext xarContext = new AssayUploadXarContext("HPLC Run Creation", context);
                ViewBackgroundInfo info = new ViewBackgroundInfo(ctx.getContainer(), ctx.getUser(), ctx.getActionURL());

                try
                {
                    // Save the run in order to allow linking the hplcData result
                    ExpExperiment exp = provider.getRunCreator().saveExperimentRun(context, null, run, true);
                    if (exp.getRuns().length > 0)
                    {
                        hplcData.setRun(run);
                        hplcData.save(ctx.getUser());
                        Map<DataType, List<Map<String, Object>>> validationMap = dataHandler.getValidationDataMap(hplcData, metadata, info, _log, xarContext, new DataLoaderSettings());
                        List<Map<String, Object>> rawData = validationMap.get(dataHandler.getDataType());
                        dataHandler.importRows(hplcData, ctx.getUser(), run, protocol, provider, rawData);
                    }
                }
                catch (ValidationException x)
                {
                    _log.error(x.getMessage(), x);
                }
                catch (ExperimentException e)
                {
                    _log.error(e.getMessage(), e);
                }
            }
            else
            {
                _log.error("Unable to find proper name of HPLC metadata. Path: " + metadata.getPath());
            }
        }
    }

    private static String getRunName(@NotNull File metadata)
    {
        String[] splitPath = metadata.getName().split("[.]");
        if (splitPath.length > 0)
        {
            return splitPath[0]; // assumes name.hplcmeta
        }
        return "";
    }

    private static boolean checkMetaFile(@NotNull File meta)
    {
        String[] splitPath = meta.getPath().split("[.]");
        return splitPath.length > 0  && splitPath[splitPath.length-1].equals("hplcmeta");
    }
}
