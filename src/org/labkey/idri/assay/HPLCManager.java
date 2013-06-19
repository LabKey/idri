/*
 * Copyright (c) 2013 LabKey Corporation
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
package org.labkey.idri.assay;

import org.apache.log4j.Logger;
import org.jetbrains.annotations.NotNull;
import org.junit.After;
import org.junit.Assert;
import org.junit.Test;
import org.labkey.api.data.Container;
import org.labkey.api.exp.ExperimentException;
import org.labkey.api.exp.XarContext;
import org.labkey.api.exp.api.DataType;
import org.labkey.api.exp.api.ExpData;
import org.labkey.api.exp.api.ExpExperiment;
import org.labkey.api.exp.api.ExpProtocol;
import org.labkey.api.exp.api.ExpRun;
import org.labkey.api.files.FileContentService;
import org.labkey.api.qc.DataLoaderSettings;
import org.labkey.api.query.ValidationException;
import org.labkey.api.security.User;
import org.labkey.api.services.ServiceRegistry;
import org.labkey.api.study.assay.AssayProvider;
import org.labkey.api.study.assay.AssayService;
import org.labkey.api.study.assay.AssayUploadXarContext;
import org.labkey.api.study.assay.DefaultAssayRunCreator;
import org.labkey.api.util.FileUtil;
import org.labkey.api.view.ViewBackgroundInfo;

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

    public static void load(@NotNull File file, User user, Container container)
    {
        // Listen for metadata file
        if (checkMetaFile(file))
        {
            List<ExpProtocol> protocols = AssayService.get().getAssayProtocols(container);

            // Check only for HPLC assay
            for (ExpProtocol protocol : protocols)
            {
                if (protocol.getName().equalsIgnoreCase("HPLC"))
                {
                    _instance.generateRun(protocol, file, user, container);
                }
            }
        }
    }

    public static void generateRun(ExpProtocol protocol, File metadata, User user, Container container)
    {
        AssayProvider provider = AssayService.get().getProvider(protocol);

        if (null != provider)
        {
            String runName = getRunName(metadata);
            if (runName.length() > 0)
            {
                // Create Run
                ExpRun run = AssayService.get().createExperimentRun(runName, container, protocol, null); // Try 'metadata' file
                Map<String, String> runProps = new HashMap<>();
                runProps.put("LotNumber", runName);
                Map<String, String> batchProps = new HashMap<>();

                // Populate Upload Context
                HPLCRunUploadContext context = new HPLCRunUploadContext(protocol,  provider, container, user,  runName, "",  runProps,  batchProps);

                // Create ExpData and Data Handler for parsing Metadata file into maps
                ExpData hplcData = DefaultAssayRunCreator.createData(
                        run.getContainer(), metadata, "Analysis Result", provider.getDataType(), true
                );
                HPLCAssayDataHandler dataHandler = new HPLCAssayDataHandler();
                XarContext xarContext = new AssayUploadXarContext("HPLC Run Creation", context);
                ViewBackgroundInfo info = new ViewBackgroundInfo(container, user, null);

                try
                {
                    // Save the run in order to allow linking the hplcData result
                    ExpExperiment exp = provider.getRunCreator().saveExperimentRun(context, null, run, true);
                    if (exp.getRuns().length > 0)
                    {
                        hplcData.setRun(run);
                        hplcData.save(user);
                        Map<DataType, List<Map<String, Object>>> validationMap = dataHandler.getValidationDataMap(hplcData, metadata, info, _log, xarContext, new DataLoaderSettings());
                        List<Map<String, Object>> rawData = validationMap.get(dataHandler.getDataType());
                        dataHandler.importRows(hplcData, user, run, protocol, provider, rawData);
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



    public static class HPLCImportTestCase extends Assert
    {
        private static final String FILE_ROOT_SUFFIX = "_HPLCImportTest";
        private static final String META_FILE = "TD789.hplcmeta";

        private File getTestRoot()
        {
            FileContentService service = ServiceRegistry.get().getService(FileContentService.class);
            File siteRoot = service.getSiteDefaultRoot();
            File testRoot = new File(siteRoot, FILE_ROOT_SUFFIX);
            testRoot.mkdirs();
            Assert.assertTrue("Unable to create test file root", testRoot.exists());

            return testRoot;
        }

        @Test
        public void testFileCheck() throws Exception
        {
            // pre-clean
            cleanup();

            File root = getTestRoot();
            File metaFile = new File(root, META_FILE);
            metaFile.createNewFile();

            Assert.assertTrue("Invalid file name: " + metaFile.getName(), checkMetaFile(metaFile));
            Assert.assertTrue("Invalid Run name: " + metaFile.getName(), getRunName(metaFile).length() > 0);
        }

        @After
        public void cleanup()
        {
            FileContentService svc = ServiceRegistry.get().getService(FileContentService.class);
            Assert.assertNotNull(svc);

            File testRoot = getTestRoot();
            if (testRoot.exists())
            {
                FileUtil.deleteDir(testRoot);
            }
        }
    }
}
