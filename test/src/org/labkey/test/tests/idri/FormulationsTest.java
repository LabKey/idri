/*
 * Copyright (c) 2016-2019 LabKey Corporation
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
package org.labkey.test.tests.idri;

import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.labkey.test.BaseWebDriverTest;
import org.labkey.test.Locator;
import org.labkey.test.TestFileUtils;
import org.labkey.test.categories.Git;
import org.labkey.test.components.domain.DomainFormPanel;
import org.labkey.test.components.ext4.ComboBox;
import org.labkey.test.pages.ImportDataPage;
import org.labkey.test.pages.ReactAssayDesignerPage;
import org.labkey.test.pages.list.BeginPage;
import org.labkey.test.util.ApiPermissionsHelper;
import org.labkey.test.util.DataRegionTable;
import org.labkey.test.util.Ext4Helper;
import org.labkey.test.util.LogMethod;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.io.File;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static org.hamcrest.CoreMatchers.hasItems;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThat;

@Category({Git.class})
public class FormulationsTest extends BaseWebDriverTest
{
    private ApiPermissionsHelper _permissionsHelper = new ApiPermissionsHelper(this);

    private static final String COMPOUNDS_NAME = "Compounds";
    private static final String RAW_MATERIALS_NAME = "Raw Materials";
    private static final String FORMULATIONS_NAME = "Formulations";
    private static final String PROJECT_NAME = "FormulationsTest";

    private static final File LIST_DATA = TestFileUtils.getSampleData("idri/FormulationsTest.lists.zip");

    // Name must be same as what is used as target stability group
    private static final String STABILITY_GROUP = "Stability";

    private static final String COMPOUNDS_HEADER = "Compound Name\tFull Name\tCAS Number\tDensity\tMolecular Weight\tType of Material\n";
    private static final String COMPOUNDS_DATA_1 = "Alum\tAluminum Hydroxide\t21645-51-2\t\t78.0\t1\n";  // adjuvant (rowId 1)
    private static final String COMPOUNDS_DATA_2 = "Squawk\tBean Oil\t21235-51-3\t\t7.0\t3\n";           // oil (rowId 3)
    private static final String COMPOUNDS_DATA_3 = "Cholesterol\tCholesterol\t29935-53-9\t\t123.6\t2\n"; // sterol (rowId 2)
    private static final String COMPOUNDS_DATA_4 = "SPD\tSPD\t2313-23-1\t\t32.23\t4\n";                  // buffer (rowId 4)

    private static final String RAWMATERIALS_HEADER = "Identifier\tMaterial Name\tSupplier\tSource\tCatalogue ID\tLot ID\n";
    private static final String RAW_MATERIAL_1 = "IRM-0456";
    private static final String RAW_MATERIAL_2 = "IRM-0016";
    private static final String RAW_MATERIAL_3 = "IRM-0023";
    private static final String RAW_MATERIAL_4 = "IRM-0234";
    private static final String RAWMATERIALS_DATA_1 = RAW_MATERIAL_1 + "\tAlum\tAlum Supplier\tsynthetic\t\t99999\n";
    private static final String RAWMATERIALS_DATA_2 = RAW_MATERIAL_2 + "\tSquawk\tAlpha\tanimal\t\t123456\n";
    private static final String RAWMATERIALS_DATA_3 = RAW_MATERIAL_3 + "\tCholesterol\tFresh Supplies\tanimal\t\t314159265\n";
    private static final String RAWMATERIALS_DATA_4 = RAW_MATERIAL_4 + "\tSPD\tSPD Supplier\tsynthetic\t9123D-AS\t12331-CC\n";

    private static final String FORMULATION = "TD789";
    private static final String PS_FORMULATION = "QH123";

    private static final String CATALOG_DATA_1 = "EM081";
    private static final String GRANT_DATA_1 = "KL9090";

    private static final String PS_ASSAY      = "Particle Size";
    private static final String PS_ASSAY_DESC = "IDRI Particle Size Data as provided by Nano and APS machine configurations.";

    private static final String HPLC_ASSAY = "HPLC";
    private static final String PROVISIONAL_HPLC_ASSAY = "pHPLC";
    private static final String PROVISIONAL_HPLC_RUN = "2014_9_19_15_53_20";
    private static final File HPLC_PIPELINE_PATH = TestFileUtils.getSampleData(PROVISIONAL_HPLC_ASSAY);
    private static final String HPLC_ASSAY_DESC = "IDRI HPLC Assay Data";
    private static final String PROVISIONAL_HPLC_ASSAY_DESC = "IDRI Provisional HPLC Assay Data";

    private static final String VIS_INSPEC_ASSAY = "VisualInspection";
    private static final String VIS_INSPEC_ASSAY_DESC = "Improved IDRI Visual Data.";

    @BeforeClass
    public static void setupProject()
    {
        FormulationsTest init = (FormulationsTest) getCurrentTest();
        init.doSetup();
    }

    private void doSetup()
    {
        _userHelper.createUser("ops@labkey.com", false, false);
        enableEmailRecorder();
        _containerHelper.createProject(PROJECT_NAME, "IDRI Formulations");

        goToProjectHome();

        // Create 'Stability' Group
        _permissionsHelper.createPermissionsGroup(STABILITY_GROUP, getCurrentUser());

        // Sample Sets should already exist
        assertElementPresent(Locator.linkWithText(COMPOUNDS_NAME));
        assertElementPresent(Locator.linkWithText(RAW_MATERIALS_NAME));
        assertElementPresent(Locator.linkWithText(FORMULATIONS_NAME));

        setupLists();
        setupCompounds();
        setupRawMaterials();

        // Insert Formulation that the test cases rely on
        // TODO: Separate depended on formulation data from testing of formulation creation
        insertFormulation();
    }

    @Override
    protected void doCleanup(boolean afterTest)
    {
        _userHelper.deleteUser("ops@labkey.com");
        super.doCleanup(afterTest);
    }

    @Test
    public void testParticleSizeAssay()
    {
        defineParticleSizeAssay();
        createParticleSizeFormulations();
        uploadParticleSizeData();
    }

    @Test
    public void testHPLCAssay()
    {
        defineProvisionalHPLCAssay();
        defineHPLCAssay();

        uploadProvisionalHPLCData();
        qualityControlHPLCData();
    }

    @Test
    public void testVisualInspectionAssay()
    {
        defineVisualInspectionAssay();
        uploadVisualInspectionAssayData();
    }

    @LogMethod
    protected void setupLists()
    {
        BeginPage listBegin = goToManageLists();
        List<String> formulationsLists = listBegin.getGrid().getColumnDataAsText("Name");
        listBegin = listBegin.importListArchive(LIST_DATA);
        Assert.assertEquals("List archive doesn't match initial Formulations lists", formulationsLists, listBegin.getGrid().getColumnDataAsText("Name"));
    }

    @LogMethod
    protected void setupCompounds()
    {
        goToProjectHome();

        log("Entering compound information");
        clickAndWait(Locator.linkWithText(COMPOUNDS_NAME));
        clickButton("Import More Samples");
        ImportDataPage importDataPage = new ImportDataPage(getDriver());
        importDataPage.setText(COMPOUNDS_HEADER + COMPOUNDS_DATA_1 + COMPOUNDS_DATA_2 + COMPOUNDS_DATA_3 + COMPOUNDS_DATA_4);
        importDataPage.submit();
    }

    @LogMethod
    protected void setupRawMaterials()
    {
        goToProjectHome();

        log("Entering raw material information");
        clickAndWait(Locator.linkWithText(RAW_MATERIALS_NAME));
        clickButton("Import More Samples");
        ImportDataPage importDataPage = new ImportDataPage(getDriver());
        importDataPage.setText(RAWMATERIALS_HEADER + RAWMATERIALS_DATA_1 + RAWMATERIALS_DATA_2 + RAWMATERIALS_DATA_3 + RAWMATERIALS_DATA_4);
        importDataPage.submit();
    }

    @LogMethod
    protected void insertFormulation()
    {
        String addButton = "Add Another Material";

        goToProjectHome();

        log("Inserting a Formulation");
        clickAndWait(Locator.linkWithText("Sample Sets"));
        clickAndWait(Locator.linkWithText(FORMULATIONS_NAME));
        new DataRegionTable("Material",this).clickInsertNewRow();
        _ext4Helper.waitForMaskToDisappear();

        assertTextPresent(
                "Formulation Type*",
                "Stability Watch",
                "Notebook Page*",
                "Catalog");

        // Describe Formulation
        setFormElement(Locator.name("Batch"), FORMULATION);
        _ext4Helper.waitForMaskToDisappear();
        _extHelper.selectComboBoxItem(Locator.xpath("//input[@name='Type']/.."), "Alum");
        setFormElement(Locator.name("DM"), "8/8/2008");
        setFormElement(Locator.name("batchsize"), "100");
        setFormElement(Locator.name("Comments"), "This might fail.");
        setFormElement(Locator.name("nbpg"), "549-87");
        _extHelper.selectComboBoxItem(Locator.xpath("//input[@name='Catalog']/.."), CATALOG_DATA_1);
        _extHelper.selectComboBoxItem(Locator.xpath("//input[@name='Grant']/.."), GRANT_DATA_1);

        clickButton(addButton, 0);
        _extHelper.selectComboBoxItem(getRawMaterialLocator(0), RAW_MATERIAL_1);
        waitForText(WAIT_FOR_JAVASCRIPT, "%w/vol");
        setFormElement(Locator.name("concentration"), "25.4");

        // Test Duplicate Material
        log("Test Duplicate Material");
        clickButton(addButton, 0);
        _extHelper.selectComboBoxItem(getRawMaterialLocator(1), RAW_MATERIAL_1);
        sleep(2000);
        setFormElements("input", "concentration", new String[]{"25.4", "66.2"});
        clickButton("Create", 0);
        waitForText(WAIT_FOR_JAVASCRIPT, "Duplicate source materials are not allowed.");

        // Test empty combo
        log("Test empty combo");
        clickButton(addButton, 0);
        _extHelper.waitForExt3MaskToDisappear(WAIT_FOR_JAVASCRIPT);
        clickButton("Create", 0);
        _extHelper.waitForExt3MaskToDisappear(WAIT_FOR_JAVASCRIPT);
        waitForText(WAIT_FOR_JAVASCRIPT, "Invalid material");

        // Test empty concentration
        log("Test empty concentration");
        _extHelper.selectComboBoxItem(getRawMaterialLocator(2), RAW_MATERIAL_2);
        waitForText(WAIT_FOR_JAVASCRIPT, "%v/vol");
        clickButton("Create", 0);
        waitForText(WAIT_FOR_JAVASCRIPT, "Invalid material.");

        // Remove duplicate material
        log("Remove duplicate material");
        click(Locator.xpath("//a[text() = 'Remove'][1]")); // remove

        // Add final material
        clickButton(addButton, 0);
        _extHelper.selectComboBoxItem(getRawMaterialLocator(3), RAW_MATERIAL_4);
        waitForText(WAIT_FOR_JAVASCRIPT, "mM");

        // Place on stability watch
        checkCheckbox(Locator.id("stability-check"));

        // Create        
        setFormElements("input", "concentration", new String[]{"25.4", "66.2", "12.91"});
        clickButton("Create", 0);
        waitForText(WAIT_FOR_JAVASCRIPT, "has been created.");

        // Confirm stability email
        _ext4Helper.waitForMaskToDisappear();
        goToModule("Dumbster");
        click(Locator.linkWithText("Formulation added on LabKey"));
        assertElementPresent(Locator.linkWithText(FORMULATION));
    }

    private Locator.XPathLocator getRawMaterialLocator(int index)
    {
        return Locator.xpath("//div[./input[@id='material" + index + "']]");
    }

    @LogMethod
    protected void createParticleSizeFormulations()
    {
        goToProjectHome();

        log("Create Formulations used in runs of Particle Size Assay");
        clickAndWait(Locator.linkWithText("Create/Update a Formulation"));
        _extHelper.waitForExt3MaskToDisappear(WAIT_FOR_JAVASCRIPT);

        // Describe Formulation
        setFormElement(Locator.name("Batch"), PS_FORMULATION);
        _extHelper.selectComboBoxItem(Locator.xpath("//input[@name='Type']/.."), "Alum");
        setFormElement(Locator.name("DM"), "9/14/2016");
        setFormElement(Locator.name("batchsize"), "100");
        setFormElement(Locator.name("Comments"), "Lost used for Particle Size");
        setFormElement(Locator.name("nbpg"), "123-33");
        _extHelper.selectComboBoxItem(Locator.xpath("//input[@name='Catalog']/.."), CATALOG_DATA_1);
        _extHelper.selectComboBoxItem(Locator.xpath("//input[@name='Grant']/.."), GRANT_DATA_1);

        clickButton("Add Another Material", 0);
        _extHelper.selectComboBoxItem(getRawMaterialLocator(0), RAW_MATERIAL_2);
        waitForText(WAIT_FOR_JAVASCRIPT, "%v/vol");
        setFormElement(Locator.name("concentration"), "15");

        // Create
        clickButton("Create", 0);
        waitForText(WAIT_FOR_JAVASCRIPT, "has been created.");
    }

    @LogMethod
    protected void defineParticleSizeAssay()
    {
        goToProjectHome();

        log("Defining Particle Size Assay");
        clickAndWait(Locator.linkWithText("Manage Assays"));
        ReactAssayDesignerPage assayDesignerPage = _assayHelper.createAssayDesign("Particle Size", PS_ASSAY)
            .setDescription(PS_ASSAY_DESC);

        DomainFormPanel batchPanel = assayDesignerPage.goToBatchFields();
        assertEquals("Batch fields", Collections.emptyList(), batchPanel.fieldNames());

        DomainFormPanel runPanel = assayDesignerPage.goToRunFields();
        assertThat("Run fields", runPanel.fieldNames(), hasItems("IDRIBatchNumber"));

        DomainFormPanel resultPanel = assayDesignerPage.expandFieldsPanel("Result");
        assertThat("Results fields", resultPanel.fieldNames(), hasItems("MeasuringTemperature", "meanCountRate", "AnalysisTool"));

        assayDesignerPage.clickFinish();
    }

    @LogMethod
    protected void uploadParticleSizeData()
    {
        goToProjectHome();

        log("Uploading Particle Size Data");
        clickAndWait(Locator.linkWithText(PS_ASSAY));
        clickButton("Import Data");

        assertTextPresent("pdI value for each entry must be");

        File[] allFiles = TestFileUtils
                .getSampleData("particleSize")
                .listFiles((dir, name) -> name.matches("^(" + FORMULATION + "|" + PS_FORMULATION + ").xlsx?"));

        for (File file : allFiles)
        {
            log("uploading " + file.getName());
            setFormElement(Locator.id("upload-run-field-file-button-fileInputEl"), file);
            waitForElement(Locator.linkWithText(file.getName().split("\\.")[0])); // Strip file extension
        }

        log("navigate back to assay batches then runs");
        clickAndWait(Locator.linkWithText("Particle Size Batches"));
        clickAndWait(Locator.linkWithText("view runs"));

        clickAndWait(Locator.linkWithText(FORMULATION));
        DataRegionTable resultsTable = new DataRegionTable("Data", this);

        // validate calculated columns
        Map<String, String> dataRow = resultsTable.getRowDataAsMap(0);
        assertEquals("Unexpected Measuring Temperature", "22", dataRow.get("MeasuringTemperature"));
        assertEquals("Unexpected Storage Temperature", "5C", dataRow.get("StorageTemperature"));
        assertEquals("Unexpected Run/ZAveMean", "114", dataRow.get("Run/ZAveMean"));

        clickAndWait(Locator.linkWithText("view runs"));
        clickAndWait(Locator.linkWithText(PS_FORMULATION));
        resultsTable = new DataRegionTable("Data", this);

        dataRow = resultsTable.getRowDataAsMap(99);
        assertEquals("Unexpected Measuring Temperature", "25", dataRow.get("MeasuringTemperature"));
        assertEquals("Unexpected Storage Temperature", "37C", dataRow.get("StorageTemperature"));
        assertEquals("Unexpected Run/ZAveMean", "66", dataRow.get("Run/ZAveMean"));
    }

    @LogMethod
    protected void defineVisualInspectionAssay()
    {
        goToProjectHome();

        log("Defining Visual Inspection Assay");
        clickAndWait(Locator.linkWithText("Manage Assays"));
        ReactAssayDesignerPage assayDesignerPage = _assayHelper.createAssayDesign("Visual Inspection", VIS_INSPEC_ASSAY)
            .setDescription(VIS_INSPEC_ASSAY_DESC);

        DomainFormPanel batchPanel = assayDesignerPage.goToBatchFields();
        assertEquals("Batch fields", Collections.emptyList(), batchPanel.fieldNames());

        DomainFormPanel runPanel = assayDesignerPage.goToRunFields();
        assertEquals("Run fields", Arrays.asList("LotNumber"), runPanel.fieldNames());

        DomainFormPanel resultPanel = assayDesignerPage.expandFieldsPanel("Result");
        assertThat("Results fields", resultPanel.fieldNames(), hasItems("Pass", "Color", "Phase"));

        assayDesignerPage.clickFinish();
    }

    @LogMethod
    protected void uploadVisualInspectionAssayData()
    {
        goToProjectHome();

        log("Uploading Visual Inspection Data");
        clickAndWait(Locator.linkWithText(VIS_INSPEC_ASSAY));
        clickButton("Import Data");
    }

    @LogMethod
    protected void defineProvisionalHPLCAssay()
    {
        goToProjectHome();

        log("Defining Provisional HPLC Assay");
        clickAndWait(Locator.linkWithText("Manage Assays"));
        ReactAssayDesignerPage assayDesignerPage = _assayHelper.createAssayDesign("Provisional HPLC", PROVISIONAL_HPLC_ASSAY)
            .setDescription(PROVISIONAL_HPLC_ASSAY_DESC)
            .setEditableRuns(true)
            .setEditableResults(true);

        DomainFormPanel batchPanel = assayDesignerPage.goToBatchFields();
        assertEquals("Batch fields", Collections.emptyList(), batchPanel.fieldNames());

        DomainFormPanel runPanel = assayDesignerPage.goToRunFields();
        assertThat("Run fields", runPanel.fieldNames(), hasItems("RunIdentifier", "Method"));

        DomainFormPanel resultPanel = assayDesignerPage.expandFieldsPanel("Result");
        assertThat("Results fields", resultPanel.fieldNames(), hasItems("Dilution", "DataFile"));

        assayDesignerPage.clickFinish();

        // Set pipeline path
        setPipelineRoot(HPLC_PIPELINE_PATH.getAbsolutePath());
    }

    @LogMethod
    protected void uploadProvisionalHPLCData()
    {
        beginAt("/" + getProjectName() + "/idri-mockHPLCWatch.view");
        waitForText("Ready to Load");
        click(Locator.tagWithClass("input", "idri-run-btn"));
        waitForText("Test Run Upload Complete");
        sleep(1500);
    }

    @LogMethod
    protected void qualityControlHPLCData()
    {
        String standardName = "LGCTest";
        String[] standards = {"LGC20371", "LGC40060", "LGC60342", "LGC80021", "LGC10030"};
        String[] concs = {"20", "40", "60", "80", "100"};
        String left = "12"; String right = "15"; String base = "40";

        String[] samples = {"QD123-11", "QD123-24", "QD123-31"};
        String sleft = "14.5"; String sright = "16"; String sbase = "45";

        //
        // Start QC Process
        //
        goToProjectHome();

        click(Locator.linkWithText(PROVISIONAL_HPLC_ASSAY));
        waitForElement(Locator.linkWithText(PROVISIONAL_HPLC_RUN));

        DataRegionTable runs = new DataRegionTable("Runs", this);
        runs.checkCheckbox(0);
        clickButton("QC Selected Run");

        log("Start the Qualitative Analysis");
        waitForElement(Locator.tagWithClass("div", "x4-grid-cell-inner").withText(samples[0]));
        clickButton("Define Standards", 0);
        sleep(1000);
        waitForElement(Locator.tagWithClass("div", "x4-grid-cell-inner").withText(standards[0]));

        for (String std : standards)
        {
            // check in concentration order
            _ext4Helper.checkGridRowCheckbox(std);
        }

        for (int i=0; i < standards.length; i++)
        {
            Locator.XPathLocator runRow = Locator.tagWithAttribute("tr", "modelname", standards[i]);
            setFormElement(runRow.append(Locator.input("concentration")), concs[i]);
            if (i == 0)
            {
                setFormElement(runRow.append(Locator.input("xleft")), left);
                setFormElement(runRow.append(Locator.input("xright")), right);
                setFormElement(runRow.append(Locator.input("base")), base);
            }
        }

        click(Locator.button("C").index(0));
        waitForText("to all other selections?");
        clickButton("Yes", 0);

        // ensure the copy gets all the way to the last row
        waitForElement(Locator.tagWithAttribute("tr", "modelname", standards[standards.length-1]).append(Locator.input("base").withAttribute("value", base)));

        setFormElement(Locator.input("standardname"), standardName);
        clickButton("Calibration Curve", 0);
        waitForElement(Locator.id("standardrsquared-inputEl").containing("0.99"));

        clickButton("Save", 0);
        waitForElement(Locator.tagWithClass("div", "x4-grid-cell-inner").withText(standardName));

        log("Quality Control Samples");
        clickButton("Return to Samples", 0);
        waitForElement(Locator.tagWithClass("div", "x4-grid-cell-inner").withText(samples[0]));

        for (String samp : samples)
        {
            _ext4Helper.checkGridRowCheckbox(samp);
        }

        clickButton("Start QC", 0);
        waitForElementToDisappear(Locator.id("sampleinputs").notHidden());

        new ComboBox.ComboBoxFinder(getDriver()).withIdPrefix("compoundlist").find(getDriver()).selectComboBoxItem("Squawk");
        new ComboBox.ComboBoxFinder(getDriver()).withIdPrefix("standardslist").find(getDriver()).selectComboBoxItem(standardName);
        new ComboBox.ComboBoxFinder(getDriver()).withIdPrefix("formulationlist").find(getDriver()).selectComboBoxItem(FORMULATION);
        new ComboBox.ComboBoxFinder(getDriver()).withIdPrefix("temperaturelist").find(getDriver()).selectComboBoxItem("5");
        new ComboBox.ComboBoxFinder(getDriver()).withIdPrefix("timelist").find(getDriver()).selectComboBoxItem("T=0");

        Locator.XPathLocator firstSampleRow = Locator.tagWithAttribute("tr", "modelname", samples[0]);
        setFormElement(firstSampleRow.append(Locator.input("xleft")), sleft);
        setFormElement(firstSampleRow.append(Locator.input("xright")), sright);
        setFormElement(firstSampleRow.append(Locator.input("base")), sbase);
        click(Locator.button("C").index(0));
        waitForText("to all other selections?");
        clickButton("Yes", 0);

        // ensure the copy gets all the way to the last row
        waitForElement(Locator.tagWithAttribute("tr", "modelname", samples[samples.length-1]).append(Locator.input("base").withAttribute("value", sbase)));

        clickButton("Calculate", 0);
        shortWait().until(ExpectedConditions.textToBePresentInElementValue(By.name("avgconc"), "-24.")); // -24.76
        shortWait().until(ExpectedConditions.textToBePresentInElementValue(By.name("stddev"), "10.")); // 10.69

        waitForSampleFormValidation();
        waitAndClick(Ext4Helper.Locators.ext4Button("Submit Analysis").enabled());
        waitForText("successfully");
        waitForElementToDisappear(Ext4Helper.Locators.ext4Button("Submit Analysis").enabled());
    }

    private void waitForSampleFormValidation()
    {
        shortWait().until(new Function<WebDriver, Boolean>()
        {
            @Override
            public Boolean apply(WebDriver webDriver)
            {
                return (Boolean)executeScript("return Ext4.getCmp('sampleform').isValid();");
            }

            @Override
            public String toString()
            {
                return "sample form to be valid";
            }
        });
    }

    @LogMethod
    protected void defineHPLCAssay()
    {
        goToProjectHome();

        log("Defining HPLC Assay");
        clickAndWait(Locator.linkWithText("Manage Assays"));
        ReactAssayDesignerPage assayDesignerPage = _assayHelper.createAssayDesign("HPLC", HPLC_ASSAY)
            .setDescription(HPLC_ASSAY_DESC)
            .setEditableRuns(true)
            .setEditableResults(true);

        DomainFormPanel batchPanel = assayDesignerPage.goToBatchFields();
        assertEquals("Batch fields", Collections.emptyList(), batchPanel.fieldNames());

        DomainFormPanel runPanel = assayDesignerPage.goToRunFields();
        assertThat("Run fields", runPanel.fieldNames(), hasItems("LotNumber", "CompoundNumber"));

        DomainFormPanel resultPanel = assayDesignerPage.expandFieldsPanel("Result");
        assertThat("Result fields", resultPanel.fieldNames(), hasItems("Dilution", "Concentration"));

        assayDesignerPage.clickFinish();
    }

    @Override
    public List<String> getAssociatedModules()
    {
        return Collections.singletonList("idri");
    }

    @Override
    protected String getProjectName()
    {
        return PROJECT_NAME;
    }

    @Override
    public BrowserType bestBrowser()
    {
        return BrowserType.CHROME;
    }
}
