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

import org.junit.Test;
import org.junit.experimental.categories.Category;
import org.labkey.test.BaseWebDriverTest;
import org.labkey.test.Locator;
import org.labkey.test.TestFileUtils;
import org.labkey.test.categories.Git;
import org.labkey.test.util.ApiPermissionsHelper;
import org.labkey.test.util.DataRegionTable;
import org.labkey.test.util.LabKeyExpectedConditions;
import org.labkey.test.util.LogMethod;
import org.openqa.selenium.WebElement;

import java.io.File;
import java.io.FilenameFilter;
import java.util.Collections;
import java.util.List;

@Category({Git.class})
public class FormulationsTest extends BaseWebDriverTest
{
    private ApiPermissionsHelper _permissionsHelper = new ApiPermissionsHelper(this);

    private static final String COMPOUNDS_NAME = "Compounds";
    private static final String RAW_MATERIALS_NAME = "Raw Materials";
    private static final String FORMULATIONS_NAME = "Formulations";
    private static final String PROJECT_NAME = "FormulationsTest";

    private static final String CATALOG_LIST = "Catalog";
    private static final String GRANT_LIST = "Grants";
    private static final String TEMPERATURE_LIST = "Temperatures";
    private static final String TIME_LIST = "Timepoints";
    private static final String TYPES_LIST = "FormulationTypes";
    private static final String MATERIAL_TYPES_LIST = "MaterialTypes";
    private static final String VIS_OPTIONS_LIST = "VisualOptions";

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

    private static final String CATALOG_HEADER = "catalogId\n";
    private static final String CATALOG_DATA_1 = "EM081";
    private static final String CATALOG_DATA   = CATALOG_DATA_1 + "\n";

    private static final String GRANT_HEADER = "grant\n";
    private static final String GRANT_DATA_1 = "KL9090";
    private static final String GRANT_DATA   = GRANT_DATA_1 + "\n";

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

    private static final String VIS_INSPEC_ASSAY = "VisualInspection";
    private static final String VIS_INSPEC_ASSAY_DESC = "Improved IDRI Visual Data.";

    private static final String VIS_OPTIONS_HEADER = "Item\tCategory\tPass\tFail\n";
    private static final String VIS_OPTIONS_DATA = "White\tColor\ttrue\ttrue\nOpaque\tOpacity\ttrue\ttrue\nColorless\tColor\ttrue\ttrue\nGrowth/Contaminate\tPhase\tfalse\ttrue\n";

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

    @Test
    public void testSteps()
    {
        setupFormulationsProject();
        setupLists();
        setupCompounds();
        setupRawMaterials();

        insertFormulation();
        defineParticleSizeAssay();
        uploadParticleSizeData();

        defineVisualAssay();
        uploadVisualAssayData();
        validateVisualAssayData();

        defineVisualInspectionAssay();
        uploadVisualInspectionAssayData();
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

        loadList(CATALOG_LIST, CATALOG_HEADER + CATALOG_DATA);
        loadList(GRANT_LIST, GRANT_HEADER + GRANT_DATA);
        loadList(TEMPERATURE_LIST, TEMPERATURE_HEADER + TEMPERATURE_DATA);
        loadList(TIME_LIST, TIME_HEADER + TIME_DATA);
        loadList(TYPES_LIST, TYPES_HEADER + TYPES_DATA);
        loadList(MATERIAL_TYPES_LIST, MTYPES_HEADER + MTYPES_DATA);
        loadList(VIS_OPTIONS_LIST, VIS_OPTIONS_HEADER + VIS_OPTIONS_DATA);
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
        DataRegionTable table = new DataRegionTable("Material", this);

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
                "Notebook Page*",
                "Catalog");

        // Describe Formulation
        setFormElement(Locator.name("Batch"), FORMULATION);
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
    protected void defineVisualInspectionAssay()
    {
        goToProjectHome();

        log("Defining Visual Inspection Assay");
        clickAndWait(Locator.linkWithText("Manage Assays"));
        clickButton("New Assay Design");

        assertTextPresent("Visual Formulation Time-Point Data");
        checkCheckbox(Locator.radioButtonByNameAndValue("providerName", "Visual Inspection"));
        clickButton("Next");

        waitForElement(Locator.xpath("//input[@id='AssayDesignerName']"), WAIT_FOR_JAVASCRIPT);
        setFormElement(Locator.xpath("//input[@id='AssayDesignerName']"), VIS_INSPEC_ASSAY);
        setFormElement(Locator.xpath("//textarea[@id='AssayDesignerDescription']"), VIS_INSPEC_ASSAY_DESC);
        fireEvent(Locator.xpath("//input[@id='AssayDesignerName']"), SeleniumEvent.blur);

        assertTextPresent(
                // Batch Properties
                "No fields have been defined.",
                // Run Properties
                "LotNumber",
                // Result Properties
                "Pass",
                "Color",
                "Phase");

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
    protected void uploadVisualInspectionAssayData()
    {
        goToProjectHome();

        log("Uploading Visual Inspection Data");
        clickAndWait(Locator.linkWithText(VIS_INSPEC_ASSAY));
        clickButton("Import Data");
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
}
