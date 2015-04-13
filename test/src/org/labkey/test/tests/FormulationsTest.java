/*
 * Copyright (c) 2011-2015 LabKey Corporation
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
package org.labkey.test.tests;

import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.labkey.test.BaseWebDriverTest;
import org.labkey.test.Locator;
import org.labkey.test.TestFileUtils;
import org.labkey.test.TestTimeoutException;
import org.labkey.test.categories.Assays;
import org.labkey.test.categories.CustomModules;
import org.labkey.test.categories.IDRI;
import org.labkey.test.util.DataRegionTable;
import org.labkey.test.util.Ext4Helper;
import org.labkey.test.util.LabKeyExpectedConditions;
import org.labkey.test.util.ListHelper;
import org.labkey.test.util.ListHelper.ListColumn;
import org.labkey.test.util.LogMethod;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.io.File;
import java.io.FilenameFilter;
import java.util.List;

import static org.junit.Assert.assertEquals;

@Category({CustomModules.class, Assays.class, IDRI.class})
public class FormulationsTest extends BaseWebDriverTest
{
    private static final String COMPOUNDS_NAME = "Compounds";
    private static final String RAW_MATERIALS_NAME = "Raw Materials";
    private static final String FORMULATIONS_NAME = "Formulations";

    private final static ListHelper.ListColumnType LIST_KEY_TYPE = ListHelper.ListColumnType.String;
    private final ListColumn LIST_COL_SORT = new ListColumn(
            "sort",
            "Sort Order",
            ListHelper.ListColumnType.Integer,
            "Used to sort ambigiously named timepoints based on day.");
    private static final String PROJECT_NAME = "FormulationsTest";
    private static final String FOLDER_NAME = "My Study";

    private static final String TEMPERATURE_LIST = "Temperatures";
    private static final String TIME_LIST = "Timepoints";
    private static final String TYPES_LIST = "FormulationTypes";
    private static final String MATERIAL_TYPES_LIST = "MaterialTypes";
    private final ListColumn MATERIAL_COL_TYPE = new ListColumn(
            "type",
            "Type",
            ListHelper.ListColumnType.String,
            "Type of Compound.");
    private final ListColumn MATERIAL_COL_UNITS = new ListColumn(
            "units",
            "Units",
            ListHelper.ListColumnType.String,
            "Measure of Units for given type.");

    private static final String COMPOUNDS_HEADER = "Compound Name\tFull Name\tCAS Number\tDensity\tMolecular Weight\n";
    private static final String COMPOUNDS_DATA_1 = "Alum\tAluminum Hydroxide\t21645-51-2\t\t78.0\n";  // adjuvant
    private static final String COMPOUNDS_DATA_2 = "Squawk\tBean Oil\t21235-51-3\t\t7.0\n";           // oil
    private static final String COMPOUNDS_DATA_3 = "Cholesterol\tCholesterol\t29935-53-9\t\t123.6\n"; // sterol
    private static final String COMPOUNDS_DATA_4 = "SPD\tSPD\t2313-23-1\t\t32.23\n";                  // buffer

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

    private static final String TEMPERATURE_HEADER = "Temperature\n";
    private static final String TEMPERATURE_DATA   = "5\n25\n37\n60\n";

    private static final String TIME_HEADER = "Time\tSort\n";
    private static final String TIME_DATA   = "T=0\t0\n1 wk\t7\n2 wk\t14\n1 mo\t30\n3 mo\t90\n6 mo\t180\n9 mo\t270\n12 mo\t360\n24 mo\t720\n36 mo\t1080\n";

    private static final String TYPES_HEADER = "Type\n";
    private static final String TYPES_DATA   = "Emulsion\nAqueous\nPowder\nLiposome\nAlum\nNiosomes\n";

    private static final String MTYPES_HEADER = "Type\tUnits\n";
    private static final String MTYPES_DATA   = "adjuvant\t%w/vol\nsterol\t%w/vol\noil\t%v/vol\nbuffer\tmM\n";

    private static final String PS_ASSAY      = "Particle Size";
    private static final String PS_ASSAY_DESC = "IDRI Particle Size Data as provided by Nano and APS machine configurations.";

    private static final String VIS_ASSAY      = "Visual";
    private static final String VIS_ASSAY_DESC = "IDRI Visual Data.";

    private static final String HPLC_ASSAY = "HPLC";
    private static final String PROVISIONAL_HPLC_ASSAY = "pHPLC";
    private static final String PROVISIONAL_HPLC_RUN = "2014_9_19_15_53_20";
    private static final String HPLC_PIPELINE_PATH = TestFileUtils.getLabKeyRoot() + "/server/customModules/idri/test/sampledata/pHPLC";
    private static final String HPLC_ASSAY_DESC = "IDRI HPLC Assay Data";
    private static final String PROVISIONAL_HPLC_ASSAY_DESC = "IDRI Provisional HPLC Assay Data";

    private static final String HPLC_STANDARD_LIST = "HPLCStandard";
    private final ListColumn HPLC_STANDARD_NAME_COL = new ListColumn(
            "Name",
            "Name",
            ListHelper.ListColumnType.String,
            "Name of the Standard.");
    private final ListColumn HPLC_STANDARD_PROVRUN_COL = new ListColumn(
            "provisionalRun",
            "provisionalRun",
            ListHelper.ListColumnType.Integer,
            "Provisional HPLC Assay Run ID.");
    private final ListColumn HPLC_RSQUARED_COL = new ListColumn(
            "rsquared",
            "rsquared",
            ListHelper.ListColumnType.Double,
            "Standard's calculated R-Squared value.");
    private final ListColumn HPLC_STANDARD_B0_COL = new ListColumn(
            "b0",
            "b0",
            ListHelper.ListColumnType.Double,
            "b0 part of the standard equation.");
    private final ListColumn HPLC_STANDARD_B1_COL = new ListColumn(
            "b1",
            "b1",
            ListHelper.ListColumnType.Double,
            "b1 part of the standard equation.");
    private final ListColumn HPLC_STANDARD_B2_COL = new ListColumn(
            "b2",
            "b2",
            ListHelper.ListColumnType.Double,
            "b2 part of the standard equation.");
    private final ListColumn HPLC_STANDARD_ERROR_COL = new ListColumn(
            "error",
            "error",
            ListHelper.ListColumnType.Double,
            "Expected error.");

    private static final String HPLC_STANDARD_SOURCE_LIST = "HPLCStandardSource";
    private final ListColumn HPLC_SS_NAME_COL = new ListColumn(
            "name",
            "name",
            ListHelper.ListColumnType.String,
            "Name of the Standard Source.");
    private final ListColumn HPLC_SS_CONC_COL = new ListColumn(
            "concentration",
            "concentration",
            ListHelper.ListColumnType.Double,
            "Standard Source calculated concentration.");
    private final ListColumn HPLC_SS_XLEFT_COL = new ListColumn(
            "xleft",
            "xleft",
            ListHelper.ListColumnType.Double,
            "Standard Source determined xleft-bound.");
    private final ListColumn HPLC_SS_XRIGHT_COL = new ListColumn(
            "xright",
            "xright",
            ListHelper.ListColumnType.Double,
            "Standard Source determined xright-bound.");
    private final ListColumn HPLC_SS_AUC_COL = new ListColumn(
            "auc",
            "auc",
            ListHelper.ListColumnType.Double,
            "Standard Source calculated area under the curve.");
    private final ListColumn HPLC_SS_PEAKMAX_COL = new ListColumn(
            "peakMax",
            "peakMax",
            ListHelper.ListColumnType.Double,
            "Standard Source calculated peak maximum.");
    private final ListColumn HPLC_SS_PEAKRESPONSE_COL = new ListColumn(
            "peakResponse",
            "peakResponse",
            ListHelper.ListColumnType.Double,
            "Standard Source calculated peak response.");
    private final ListColumn HPLC_SS_FILEPATH_COL = new ListColumn(
            "filePath",
            "filePath",
            ListHelper.ListColumnType.String,
            "Standard Source data file path.");
    private final ListColumn HPLC_SS_FILENAME_COL = new ListColumn(
            "fileName",
            "fileName",
            ListHelper.ListColumnType.String,
            "Standard Source data file name.");
    private final ListColumn HPLC_SS_FILEEXT_COL = new ListColumn(
            "fileExt",
            "fileExt",
            ListHelper.ListColumnType.String,
            "Standard Source data file extension.");
    private final ListColumn HPLC_SS_STD_COL = new ListColumn(
            "standard",
            "standard",
            ListHelper.ListColumnType.Integer,
            "Standard Source associated standard definition.",
            new ListHelper.LookupInfo(null, "lists", HPLC_STANDARD_LIST));
    private final ListColumn HPLC_SS_BASE_COL = new ListColumn(
            "base",
            "base",
            ListHelper.ListColumnType.Double,
            "Standard Source determined baseline.");

    @Override
    public BrowserType bestBrowser()
    {
        return BrowserType.CHROME;
    }

    @Override
    protected void doCleanup(boolean afterTest) throws TestTimeoutException
    {
        deleteProject(getProjectName(), afterTest);
    }

    @Test
    public void testSteps()
    {
        setupFormulationsProject();
        setupTimeTemperature();
        setupCompounds();
        setupRawMaterials();

        insertFormulation();
        defineParticleSizeAssay();
        uploadParticleSizeData();
//        validateParticleSizeCopyToStudy();

        defineVisualAssay();
        uploadVisualAssayData();
        validateVisualAssayData();

        defineProvisionalHPLCAssay();
        defineHPLCAssay();

        uploadProvisionalHPLCData();
        qualityControlHPLCData();
    }

    @LogMethod
    protected void setupFormulationsProject()
    {
        enableEmailRecorder();
        _containerHelper.createProject(PROJECT_NAME, "IDRI Formulations");
//        _containerHelper.createSubfolder(PROJECT_NAME, FOLDER_NAME, "Study");
//        createDefaultStudy();

        clickProject(PROJECT_NAME);

        // Sample Sets should already exist
        assertElementPresent(Locator.linkWithText(COMPOUNDS_NAME));
        assertElementPresent(Locator.linkWithText(RAW_MATERIALS_NAME));
        assertElementPresent(Locator.linkWithText(FORMULATIONS_NAME));
    }

    @LogMethod
    protected void setupTimeTemperature()
    {
        clickProject(PROJECT_NAME);
        assertTextPresent("There are no user-defined lists in this folder");

        log("Add list -- " + TEMPERATURE_LIST);
        _listHelper.createList(PROJECT_NAME, TEMPERATURE_LIST, LIST_KEY_TYPE, "temperature");
        assertTextPresent(TEMPERATURE_LIST);

        log("Upload temperature data");
        _listHelper.clickImportData();
        _listHelper.submitTsvData(TEMPERATURE_HEADER + TEMPERATURE_DATA);

        clickAndWait(Locator.linkWithText("Lists"));

        log("Add list -- " + TIME_LIST);
        _listHelper.createList(PROJECT_NAME, TIME_LIST, LIST_KEY_TYPE, "time", LIST_COL_SORT);
        _listHelper.clickImportData();
        _listHelper.submitTsvData(TIME_HEADER + TIME_DATA);

        clickAndWait(Locator.linkWithText("Lists"));

        log("Add list -- " + TYPES_LIST);
        _listHelper.createList(PROJECT_NAME, TYPES_LIST, LIST_KEY_TYPE, "type");
        _listHelper.clickImportData();
        setFormElement(Locator.id("tsv3"), TYPES_HEADER + TYPES_DATA);
        clickButton("Submit", 0);
        _extHelper.waitForExtDialog("Success");
        assertTextPresent("6 rows inserted.");

        waitForElement(Locator.id("query"));
        assertTextPresent(TYPES_DATA.split("\n"));
        clickAndWait(Locator.linkWithText("Lists"));

        log("Add list -- " + MATERIAL_TYPES_LIST);
        _listHelper.createList(PROJECT_NAME, MATERIAL_TYPES_LIST, ListHelper.ListColumnType.AutoInteger, "key", MATERIAL_COL_TYPE, MATERIAL_COL_UNITS);
        _listHelper.clickImportData();
        _listHelper.submitTsvData(MTYPES_HEADER + MTYPES_DATA);

        log("Add list -- " + HPLC_STANDARD_LIST);
        _listHelper.createList(PROJECT_NAME, HPLC_STANDARD_LIST, ListHelper.ListColumnType.AutoInteger, "Key",
                HPLC_STANDARD_NAME_COL, HPLC_STANDARD_PROVRUN_COL, HPLC_RSQUARED_COL, HPLC_STANDARD_B0_COL,
                HPLC_STANDARD_B1_COL, HPLC_STANDARD_B2_COL, HPLC_STANDARD_ERROR_COL);

        log("Add list -- " + HPLC_STANDARD_SOURCE_LIST);
        _listHelper.createList(PROJECT_NAME, HPLC_STANDARD_SOURCE_LIST, ListHelper.ListColumnType.AutoInteger, "Key",
                HPLC_SS_NAME_COL, HPLC_SS_CONC_COL, HPLC_SS_XLEFT_COL, HPLC_SS_XRIGHT_COL, HPLC_SS_AUC_COL,
                HPLC_SS_PEAKMAX_COL, HPLC_SS_PEAKRESPONSE_COL, HPLC_SS_FILEPATH_COL, HPLC_SS_FILENAME_COL,
                HPLC_SS_FILEEXT_COL, HPLC_SS_STD_COL, HPLC_SS_BASE_COL);
    }

    @LogMethod
    protected void setupCompounds()
    {
        clickProject(PROJECT_NAME);

        log("Entering compound information");
        clickAndWait(Locator.linkWithText(COMPOUNDS_NAME));

        // Add compound lookup
        clickAndWait(Locator.linkWithText("Edit Fields"));

        _listHelper.addField(new ListColumn("CompoundLookup", "Type of Material", null, null, new ListHelper.LookupInfo(PROJECT_NAME, "lists", "MaterialTypes")));
        clickButton("Save");

        clickButton("Import More Samples");
        click(Locator.radioButtonById("insertOnlyChoice"));
        setFormElement(Locator.name("data"), COMPOUNDS_HEADER + COMPOUNDS_DATA_1 + COMPOUNDS_DATA_2 + COMPOUNDS_DATA_3 + COMPOUNDS_DATA_4);
        clickButton("Submit");

        this.setCompoundMaterial("adjuvant", 0);
        this.setCompoundMaterial("oil", 1);
        this.setCompoundMaterial("sterol", 2);
        this.setCompoundMaterial("buffer", 3);
    }

    private void setCompoundMaterial(String materialName, int rowIdx)
    {
        DataRegionTable table = new DataRegionTable("Material", this);

        clickAndWait(table.link(rowIdx, 0));
        selectOptionByText(Locator.tagWithName("select", "quf_CompoundLookup"), materialName);
        clickButton("Submit");
    }

    @LogMethod
    protected void setupRawMaterials()
    {
        clickProject(PROJECT_NAME);

        log("Enterting raw material information");
        clickAndWait(Locator.linkWithText(RAW_MATERIALS_NAME));
        clickButton("Import More Samples");
        click(Locator.radioButtonById("insertOnlyChoice"));
        setFormElement(Locator.id("textbox"), RAWMATERIALS_HEADER + RAWMATERIALS_DATA_1 + RAWMATERIALS_DATA_2 + RAWMATERIALS_DATA_3 + RAWMATERIALS_DATA_4);
        clickButton("Submit");
    }

    @LogMethod
    protected void insertFormulation()
    {
        String addButton = "Add Another Material";

        clickProject(PROJECT_NAME);

        log("Inserting a Formulation");
        clickAndWait(Locator.linkWithText("Sample Sets"));
        clickAndWait(Locator.linkWithText(FORMULATIONS_NAME));
        clickButton("New Formulation");

        assertTextPresent(
                "Formulation Type*",
                "Stability Watch",
                "Notebook Page*");

        // Describe Formulation
        setFormElement(Locator.name("batch"), FORMULATION);
        _extHelper.selectComboBoxItem(Locator.xpath("//input[@name='type']/.."), "Alum");
        setFormElement(Locator.name("dm"), "8/8/2008");
        setFormElement(Locator.name("batchsize"), "100");
        setFormElement(Locator.name("comments"), "This might fail.");
        setFormElement(Locator.name("nbpg"), "549-87");

        clickButton(addButton, 0);
        _extHelper.selectComboBoxItem(this.getRawMaterialLocator(0), RAW_MATERIAL_1);
        waitForText(WAIT_FOR_JAVASCRIPT, "%w/vol");
        setFormElement(Locator.name("concentration"), "25.4");

        // Test Duplicate Material
        log("Test Duplicate Material");
        clickButton(addButton, 0);
        _extHelper.selectComboBoxItem(this.getRawMaterialLocator(1), RAW_MATERIAL_1);
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
        _extHelper.selectComboBoxItem(this.getRawMaterialLocator(2), RAW_MATERIAL_2);
        waitForText(WAIT_FOR_JAVASCRIPT, "%v/vol");
        clickButton("Create", 0);
        waitForText(WAIT_FOR_JAVASCRIPT, "Invalid material.");

        // Remove duplicate material
        log("Remove duplicate material");
        click(Locator.xpath("//a[text() = 'Remove'][1]")); // remove

        // Add final material
        clickButton(addButton, 0);
        _extHelper.selectComboBoxItem(this.getRawMaterialLocator(3), RAW_MATERIAL_4);
        waitForText(WAIT_FOR_JAVASCRIPT, "mM");

        // Create        
        setFormElements("input", "concentration", new String[]{"25.4", "66.2", "12.91"});
        clickButton("Create", 0);
        waitForText(WAIT_FOR_JAVASCRIPT, "has been created.");
    }

    private Locator.XPathLocator getRawMaterialLocator(Integer index)
    {
        return Locator.xpath("//div[./input[@id='material" + index + "']]");
    }

    @LogMethod
    protected void defineParticleSizeAssay()
    {
        clickProject(PROJECT_NAME);

        log("Defining Particle Size Assay");
        clickAndWait(Locator.linkWithText("Manage Assays"));
        clickButton("New Assay Design");

        assertTextPresent("Particle Size Data");
        checkCheckbox(Locator.radioButtonByNameAndValue("providerName", "Particle Size"));
        clickButton("Next");

        waitForElement(Locator.xpath("//input[@id='AssayDesignerName']"), WAIT_FOR_JAVASCRIPT);
        setFormElement(Locator.xpath("//input[@id='AssayDesignerName']"), PS_ASSAY);
        setFormElement(Locator.xpath("//textarea[@id='AssayDesignerDescription']"), PS_ASSAY_DESC);
        fireEvent(Locator.xpath("//input[@id='AssayDesignerName']"), SeleniumEvent.blur);


        assertTextPresent(
                // Batch Properties
                "No fields have been defined.",
                // Run Properties
                "IDRIBatchNumber",
                // Result Properties
                "MeasuringTemperature",
                "meanCountRate",
                "AnalysisTool");

        clickButton("Save", 0);
        waitForText(10000, "Save successful.");
    }

    @LogMethod
    protected void uploadParticleSizeData()
    {
        clickProject(PROJECT_NAME);

        log("Uploading Particle Size Data");
        clickAndWait(Locator.linkWithText(PS_ASSAY));
        clickButton("Import Data");

        assertTextPresent("Must have working sets of size");

        File dataRoot = TestFileUtils.getSampleData("particleSize");
        File[] allFiles = dataRoot.listFiles(new FilenameFilter()
        {
            public boolean accept(File dir, String name)
            {
                return name.matches("^TD789.xls");
            }
        });

        for (File file : allFiles)
        {
            log("uploading " + file.getName());
            setFormElement(Locator.id("upload-run-field-file-button-fileInputEl"), file);
            waitForElement(Locator.linkWithText(file.getName().split("\\.")[0])); // Strip file extension
        }
    }

    @LogMethod
    private void validateParticleSizeCopyToStudy()
    {
        clickProject(PROJECT_NAME);
        clickAndWait(Locator.linkWithText(PS_ASSAY));

        DataRegionTable runs = new DataRegionTable("Runs", this);
        assertEquals("Wrong number of " + PS_ASSAY + " runs", 1, runs.getDataRowCount());
        runs.checkCheckbox(0);

        clickButton("Copy to Study");
        selectOptionByText(Locator.name("targetStudy"), "/" + getProjectName() + "/" + FOLDER_NAME + " (" + FOLDER_NAME + " Study)");
        clickButton("Next", 0);
        Locator.name("participantId").waitForElement(getDriver(), WAIT_FOR_JAVASCRIPT);

        List<WebElement> ptidFields = getDriver().findElements(By.name("participantId"));
        List<WebElement> visitFields = getDriver().findElements(By.name("visitId"));
        for (WebElement el: ptidFields)
        {
            el.sendKeys("placeholder");
        }
        for (WebElement el: visitFields)
        {
            el.sendKeys("1");
        }

        waitAndClick(WAIT_FOR_JAVASCRIPT, getButtonLocator("Copy to Study"), 0);

        waitAndClick(Locator.linkWithText(FORMULATION));

        waitForElement(Locator.id("folderBar").withText(PROJECT_NAME));
        assertElementPresent(Locator.linkWithText("copied"), 99);
    }

    @LogMethod
    protected void defineVisualAssay()
    {
        clickProject(PROJECT_NAME);

        log("Defining Visual Assay");
        clickAndWait(Locator.linkWithText("Manage Assays"));
        clickButton("New Assay Design");

        assertTextPresent("Visual Formulation Time-Point Data");
        checkCheckbox(Locator.radioButtonByNameAndValue("providerName", "Visual"));
        clickButton("Next");

        waitForElement(Locator.xpath("//input[@id='AssayDesignerName']"), WAIT_FOR_JAVASCRIPT);
        setFormElement(Locator.xpath("//input[@id='AssayDesignerName']"), VIS_ASSAY);
        setFormElement(Locator.xpath("//textarea[@id='AssayDesignerDescription']"), VIS_ASSAY_DESC);
        fireEvent(Locator.xpath("//input[@id='AssayDesignerName']"), SeleniumEvent.blur);

        assertTextPresent(
                // Batch Properties
                "No fields have been defined.",
                // Run Properties
                "LotNumber",
                // Result Properties
                "PhaseSeparation",
                "ColorChange",
                "ForeignObject");

        clickButton("Save", 0);
        waitForText(10000, "Save successful.");
    }

    @LogMethod
    protected void uploadVisualAssayData()
    {
        clickProject(PROJECT_NAME);

        log("Uploading Visual Data");
        clickAndWait(Locator.linkWithText(VIS_ASSAY));
        clickButton("Import Data");

        waitForText(WAIT_FOR_JAVASCRIPT, "What is the Lot Number?");
        waitForElement(Locator.id("lot-field"));
        setFormElement(Locator.name("lot"), FORMULATION);
        clickButton("Next", 0);

        waitForText("What temperatures are you examining?");
        WebElement radio = Locator.radioButtonByNameAndValue("time", "1 mo").findElement(getDriver());
        shortWait().until(LabKeyExpectedConditions.animationIsDone(Locator.css(("#card-1-fieldset-2"))));
        radio.click();
        clickButton("Next", 0);
        waitForText("Please complete this page to continue.");

        checkCheckbox(Locator.checkboxByNameAndValue("temp", "5C"));
        checkCheckbox(Locator.checkboxByNameAndValue("temp", "60C"));
        clickButton("Next", 0);

        waitForText("State of " + FORMULATION + " at 1 mo");
        checkCheckbox(Locator.radioButtonByNameAndValue("5C", "fail"));
        checkCheckbox(Locator.radioButtonByNameAndValue("60C", "pass"));
        clickButton("Next", 0);

        waitForText("Additional Comments for passing");
        setFormElement(Locator.name("comment60C"), "This is a passing comment.");
        clickButton("Next", 0);

        waitForText("Failure Criteria for 5C");
        clickButton("Next", 0);
        waitForText("At least one criteria must be marked as a failure.");

        checkCheckbox(Locator.checkboxByName("failed"));
        checkCheckbox(Locator.checkboxByName("failed").index(2));

        setFormElement(Locator.name("color"), "Color changed.");
        setFormElement(Locator.name("foreign"), TRICKY_CHARACTERS);
        clickButton("Next", 0);

        waitForText("Visual Inspection Summary Report");
        assertElementPresent(Locator.css("p").withText("Color: Color changed."));
        assertTextBefore("5C", "60C");
        assertTextBefore("Failed", "Passed");
        clickButton("Submit", 0);

        waitForText("Updated successfully.");
        waitAndClick(Locator.linkWithText("MORE VISUAL INSPECTION"));
        waitForText("Formulation Lot Information");
        waitAndClick(Locator.xpath("//div[@id='wizard-window']//div[contains(@class,'x-tool-close')]"));
    }

    @LogMethod
    protected void validateVisualAssayData()
    {
        // Assumes starting where uploadVisualAssayData left
        clickAndWait(Locator.linkWithText("Visual Batches"));
        clickAndWait(Locator.linkWithText("view runs"));
        clickAndWait(Locator.linkWithText(FORMULATION));

        assertTextPresent(
                "Color changed.",
                TRICKY_CHARACTERS,
                "This is a passing comment.");
    }

    @LogMethod
    protected void defineProvisionalHPLCAssay()
    {
        clickProject(PROJECT_NAME);

        log("Defining Provisional HPLC Assay");
        clickAndWait(Locator.linkWithText("Manage Assays"));
        clickButton("New Assay Design");

        assertTextPresent("High performance liquid chromotography assay");
        checkCheckbox(Locator.radioButtonByNameAndValue("providerName", "Provisional HPLC"));
        clickButton("Next");

        waitForElement(Locator.xpath("//input[@id='AssayDesignerName']"), WAIT_FOR_JAVASCRIPT);
        setFormElement(Locator.xpath("//input[@id='AssayDesignerName']"), PROVISIONAL_HPLC_ASSAY);
        setFormElement(Locator.xpath("//textarea[@id='AssayDesignerDescription']"), PROVISIONAL_HPLC_ASSAY_DESC);
        fireEvent(Locator.xpath("//input[@id='AssayDesignerName']"), SeleniumEvent.blur);

        assertTextPresent(
                // Batch Properties
                "No fields have been defined.",
                // Run Properties
                "RunIdentifier",
                "Method",
                // Result Properties
                "Dilution",
                "DataFile");

        // Make Runs/Results editable
        checkCheckbox(Locator.checkboxByName("editableRunProperties"));
        checkCheckbox(Locator.checkboxByName("editableResultProperties"));

        clickButton("Save", 0);
        waitForText(10000, "Save successful.");
        clickButton("Save & Close");

        // Set pipeline path
        setPipelineRoot(HPLC_PIPELINE_PATH);
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
        clickProject(PROJECT_NAME);

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
        sleep(2000); // let the view animate

        _ext4Helper.selectComboBoxItem(Locator.id("compoundlist"), "Squawk");
        _ext4Helper.selectComboBoxItem(Locator.id("standardslist"), standardName);
        _ext4Helper.selectComboBoxItem(Locator.id("formulationlist"), FORMULATION);
        _ext4Helper.selectComboBoxItem(Locator.id("temperaturelist"), "5");
        _ext4Helper.selectComboBoxItem(Locator.id("timelist"), "T=0");

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

        waitAndClick(Ext4Helper.Locators.ext4Button("Submit Analysis").enabled());
        waitForText("successfully");
        waitForElementToDisappear(Ext4Helper.Locators.ext4Button("Submit Analysis").enabled());
    }

    @LogMethod
    protected void defineHPLCAssay()
    {
        clickProject(PROJECT_NAME);

        log("Defining HPLC Assay");
        clickAndWait(Locator.linkWithText("Manage Assays"));
        clickButton("New Assay Design");

        assertTextPresent("High performance liquid chromotography assay");
        checkCheckbox(Locator.radioButtonByNameAndValue("providerName", "HPLC"));
        clickButton("Next");

        waitForElement(Locator.xpath("//input[@id='AssayDesignerName']"), WAIT_FOR_JAVASCRIPT);
        setFormElement(Locator.xpath("//input[@id='AssayDesignerName']"), HPLC_ASSAY);
        setFormElement(Locator.xpath("//textarea[@id='AssayDesignerDescription']"), HPLC_ASSAY_DESC);
        fireEvent(Locator.xpath("//input[@id='AssayDesignerName']"), SeleniumEvent.blur);

        assertTextPresent(
                // Batch Properties
                "No fields have been defined.",
                // Run Properties
                "LotNumber",
                "CompoundNumber",
                // Result Properties
                "Dilution", "FilePath",
                "Concentration");

        // Make Runs/Results editable
        checkCheckbox(Locator.checkboxByName("editableRunProperties"));
        checkCheckbox(Locator.checkboxByName("editableResultProperties"));

        clickButton("Save", 0);
        waitForText(10000, "Save successful.");
        clickButton("Save & Close");
    }

    @LogMethod
    protected void performSearch()
    {
        clickProject(PROJECT_NAME);

        log("Using Formulation search");
        setFormElement(Locator.name("nameContains"), FORMULATION);
        clickButton("Search");
    }

    @Override
    public List<String> getAssociatedModules()
    {
        return null;
    }

    @Override
    protected String getProjectName()
    {
        return PROJECT_NAME;
    }
}
