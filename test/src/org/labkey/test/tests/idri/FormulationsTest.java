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
        package org.labkey.test.tests.idri;

        import com.google.common.base.Function;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.labkey.test.BaseWebDriverTest;
import org.labkey.test.Locator;
import org.labkey.test.TestFileUtils;
import org.labkey.test.categories.Git;
import org.labkey.test.categories.SignalData;
import org.labkey.test.components.PropertiesEditor;
import org.labkey.test.pages.AssayDesignerPage;
import org.labkey.test.params.FieldDefinition;
import org.labkey.test.util.ApiPermissionsHelper;
import org.labkey.test.util.DataRegionTable;
import org.labkey.test.util.Ext4Helper;
import org.labkey.test.util.LabKeyExpectedConditions;
import org.labkey.test.util.LogMethod;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.io.File;
import java.util.Collections;
import java.util.List;

@Category({SignalData.class, Git.class})
public class FormulationsTest extends BaseWebDriverTest
{
    private ApiPermissionsHelper _permissionsHelper = new ApiPermissionsHelper(this);

    private static final String COMPOUNDS_NAME = "Compounds";
    private static final String RAW_MATERIALS_NAME = "Raw Materials";
    private static final String FORMULATIONS_NAME = "Formulations";
    private static final String PROJECT_NAME = "FormulationsTest";

    private static final String TEMPERATURE_LIST = "Temperatures";
    private static final String TIME_LIST = "Timepoints";
    private static final String TYPES_LIST = "FormulationTypes";
    private static final String MATERIAL_TYPES_LIST = "MaterialTypes";

    // Name must be same as what is used as target stability group
    private static final String STABILITY_GROUP = "Stability";

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

    @BeforeClass
    public static void initTest()
    {
        FormulationsTest init = (FormulationsTest)getCurrentTest();
        init.doSetup();
    }

    private void doSetup()
    {
        setupFormulationsProject();
        setupLists();
        setupCompounds();
        setupRawMaterials();
        insertFormulation();
    }

    @Test
    public void testParticleSize()
    {
        defineParticleSizeAssay();
        uploadParticleSizeData();
    }

    @Test
    public void testVisualAssay()
    {
        defineVisualAssay();
        uploadVisualAssayData();
        validateVisualAssayData();
    }

    @Test
    public void testProvisionalHPLC()
    {
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

        goToProjectHome();

        // Create 'Stability' Group
        _permissionsHelper.createPermissionsGroup(STABILITY_GROUP, getCurrentUser());

        goToProjectHome();

        // Sample Sets should already exist
        assertElementPresent(Locator.linkWithText(COMPOUNDS_NAME));
        assertElementPresent(Locator.linkWithText(RAW_MATERIALS_NAME));
        assertElementPresent(Locator.linkWithText(FORMULATIONS_NAME));
    }

    @LogMethod
    protected void setupLists()
    {
        goToProjectHome();

        loadList(TEMPERATURE_LIST, TEMPERATURE_HEADER + TEMPERATURE_DATA);
        loadList(TIME_LIST, TIME_HEADER + TIME_DATA);
        loadList(TYPES_LIST, TYPES_HEADER + TYPES_DATA);
        loadList(MATERIAL_TYPES_LIST, MTYPES_HEADER + MTYPES_DATA);
    }

    private void loadList(String name, String tsvData)
    {
        log("Upload " + name + " data");
        clickAndWait(Locator.linkWithText(name));
        _listHelper.clickImportData();
        _listHelper.submitTsvData(tsvData);
        clickAndWait(Locator.linkWithText("Lists"));
    }

    @LogMethod
    protected void setupCompounds()
    {
        goToProjectHome();

        log("Entering compound information");
        clickAndWait(Locator.linkWithText(COMPOUNDS_NAME));

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
        DataRegionTable table = new DataRegionTable("Material", this.getDriver());

        clickAndWait(table.link(rowIdx, 0));
        selectOptionByText(Locator.tagWithName("select", "quf_CompoundLookup"), materialName);
        clickButton("Submit");
    }

    @LogMethod
    protected void setupRawMaterials()
    {
        goToProjectHome();

        log("Entering raw material information");
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

        goToProjectHome();

        log("Inserting a Formulation");
        clickAndWait(Locator.linkWithText("Sample Sets"));
        clickAndWait(Locator.linkWithText(FORMULATIONS_NAME));
        clickButton("New Formulation");

        _ext4Helper.waitForMaskToDisappear();

        assertTextPresent(
                "Formulation Type*",
                "Stability Watch",
                "Notebook Page*");

        // Describe Formulation
        setFormElement(Locator.name("Batch"), FORMULATION);
        _extHelper.selectComboBoxItem(Locator.xpath("//input[@name='Type']/.."), "Alum");
        setFormElement(Locator.name("DM"), "8/8/2008");
        setFormElement(Locator.name("batchsize"), "100");
        setFormElement(Locator.name("Comments"), "This might fail.");
        setFormElement(Locator.name("nbpg"), "549-87");

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
    protected void defineParticleSizeAssay()
    {
        goToProjectHome();

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
        goToProjectHome();

        log("Uploading Particle Size Data");
        clickAndWait(Locator.linkWithText(PS_ASSAY));
        clickButton("Import Data");

        assertTextPresent("Must have working sets of size");

        File dataRoot = TestFileUtils.getSampleData("particleSize");
        File[] allFiles = dataRoot.listFiles((dir, name) -> name.matches("^TD789.xls"));

        assert allFiles != null;  //Verify files found
        for (File file : allFiles)
        {
            log("uploading " + file.getName());
            setFormElement(Locator.id("upload-run-field-file-button-fileInputEl"), file);
            waitForElement(Locator.linkWithText(file.getName().split("\\.")[0])); // Strip file extension
        }
    }

    @LogMethod
    protected void defineVisualAssay()
    {
        goToProjectHome();

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
        goToProjectHome();

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
        goToProjectHome();

        log("Defining Provisional HPLC Assay");
        clickAndWait(Locator.linkWithText("Manage Assays"));
        clickButton("New Assay Design");

        assertTextPresent("High performance liquid chromatography assay");
        checkCheckbox(Locator.radioButtonByNameAndValue("providerName", "Signal Data"));
        clickButton("Next");

        waitForElement(Locator.xpath("//input[@id='AssayDesignerName']"), WAIT_FOR_JAVASCRIPT);
        setFormElement(Locator.xpath("//input[@id='AssayDesignerName']"), PROVISIONAL_HPLC_ASSAY);
        setFormElement(Locator.xpath("//textarea[@id='AssayDesignerDescription']"), PROVISIONAL_HPLC_ASSAY_DESC);
        fireEvent(Locator.xpath("//input[@id='AssayDesignerName']"), SeleniumEvent.blur);

        //Add assay field
        AssayDesignerPage page = new AssayDesignerPage(this.getDriver());
        addProvisionalHPLCDataFields(page);
        addProvisionalHPLCRunFields(page);

        //Verify pre-configured fields are present
        assertTextPresent(
                // Run Properties
                "RunIdentifier",
                // Result Properties
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

    private void addProvisionalHPLCDataFields(AssayDesignerPage page)
    {
        PropertiesEditor resultFields = page.fields("Result Fields");

        resultFields.addField(
                new FieldDefinition("Sample")
                        .setLabel("Related Sample")
                        .setRequired(false)
                        .setType(FieldDefinition.ColumnType.String)
        );

        resultFields.addField(
                new FieldDefinition("Dilution")
                        .setLabel("Dilution Factor")
                        .setRequired(false)
                        .setType(FieldDefinition.ColumnType.Integer)
        );

        resultFields.addField(
                new FieldDefinition("Diluent")
                        .setRequired(false)
                        .setType(FieldDefinition.ColumnType.String)
        );

        resultFields.addField(
                new FieldDefinition("TestType")
                        .setLabel("Type")
//                        .setRequired(true)
//                        .setDescription("'SMP' for samples, 'STD' for standards")
                        .setType(FieldDefinition.ColumnType.String)
        );

    }

    private void addProvisionalHPLCRunFields(AssayDesignerPage page)
    {
        page.runFields().addField(
                new FieldDefinition("Machine")
                        .setLabel("Machine Name")
                        .setRequired(false)
                        .setType(FieldDefinition.ColumnType.String)
        );

        page.runFields().addField(
                new FieldDefinition("Published")
                        .setLabel("Published")
                        .setRequired(false)
                        .setType(FieldDefinition.ColumnType.Boolean)
        );

        page.runFields().addField(
                new FieldDefinition("Method")
                        .setRequired(false)
                        .setType(FieldDefinition.ColumnType.File)
        );
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

        DataRegionTable runs = new DataRegionTable("aqwp101", this.getDriver());
//        runs.checkCheckbox(0);
        runs.checkAll();
        clickButton("View Selected Runs");

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
        clickButton("New Assay Design");

        assertTextPresent("High performance liquid chromatography assay");
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
}