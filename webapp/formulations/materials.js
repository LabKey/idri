/*
 * Copyright (c) 2011-2012 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * materials.js - helper functions to add a formulation ID if it doesn't exist.
 * Requires the following to be in scope:
 * - LABKEY.page.assay
 * - LABKEY.page.batch
 * - saveBatch()
 */

/*
Removed the following from Markup:

            <tr>\
                <td>Adjuvant:</td>\
                <td><input name="adjuvant"></td>\
            </tr>\
            <tr>\
                <td>Squalene/Oil:</td>\
                <td><input name="squalene_oil"></td>\
            </tr>\
            <tr>\
                <td>PC:</td>\
                <td><input name="pc"></td>\
            </tr>\
 */

var _materialWindow;
LABKEY.addMarkup('\
    <div id="material" class="x-hidden">\
        An existing sample for this run could not be found. Please enter the formulation information below:\
        <table>\
            <tr>\
                <td>Batch:</td>\
                <td><input name="batch" id="materialBatch" disabled></td>\
            </tr>\
            <tr>\
                <td>DM:</td>\
                <td><input name="dm"></td>\
            </tr>\
            <tr>\
                <td>Batch size:</td>\
                <td><input name="batchSize"></td>\
            </tr>\
            <tr>\
                <td>NB/Pg#:</td>\
                <td><input name="NB_Pg"></td>\
            </tr>\
            <tr>\
                <td>Failure:</td>\
                <td><input name="failure"></td>\
            </tr>\
            <tr>\
                <td>Experiments:</td>\
                <td><input name="usedInExperiments"></td>\
            </tr>\
            <tr>\
                <td>Comments:</td>\
                <td><textarea rows="2" cols="20" name="comments" id="materialComments"></textarea></td>\
            </tr>\
            <tr>\
                <td colspan="2" align="right">\
                    <a href=javascript:submitMaterial(); class="labkey-button"><span>Submit</span></a>\
                </td>\
            </tr>\
        </table>\
    </div>\
');

function submitMaterial()
{
    var materialConfig = new Object();
    materialConfig.properties = new Object();
    var materialDiv = document.getElementById("material");
    var materialInputs = materialDiv.getElementsByTagName("input");
    for (var index = 0; index < materialInputs.length; index++)
    {
        var materialInput = materialInputs[index];
        materialConfig.properties[materialInput.name] = materialInput.value;
    }
    var commentsField = document.getElementById("materialComments");
    materialConfig.properties.comments = commentsField.value;
    var material = new LABKEY.Exp.Material(materialConfig);
    var materials = [];
    materials.push(material);
    Ext.Msg.wait("Uploading...");
    LABKEY.Experiment.saveMaterials(
    {
        name : "Formulations",
        materials : materials,
        successCallback : function (material, response)
        {
            _materialWindow.hide();
            var run = LABKEY.page.batch.runs[LABKEY.page.batch.runs.length - 1];
            fetchMaterialRowIdAndSave(run, false, _saveBatchFn);
        },
        failureCallback : function (error, format)
        {
            _materialWindow.hide();
            Ext.Msg.hide();
            // Break up this string in the source so that it's easier to tell when there's been an actual error -
            // we can look for the concatenated version in the page
            Ext.Msg.alert("Failure when communicating " + " with the server: " + error.exception);
        }
    });
}


var _batchName;
var _saveBatchFn;

function fileNameToBatchNumber(filename)
{
    // Edits the suffix of the filename
    if (/\.xls$/.test(filename))
    {
        filename = filename.substring(0, filename.length - 4);
    }

    // This checks the first part of the filename for specific run names.
    /* TODO: Change this check to a regular expression. The batchNumber might need to be rethought. */
    if (/^TD/.test(filename))
    {
        filename = filename.substring(2, filename.length);
    }
    else if (/^QF/.test(filename))
    {
        // QF is used as 1000-1999 test runs. HARD CODED.
        filename = filename.substring(2, filename.length);
        filename = '1' + filename;
    }

    return filename;
}

function fetchMaterialRowIdAndSave(run, isNewRun, saveBatchFn)
{
    function onFailure(errorInfo, options, responseObj)
    {
        Ext.Msg.hide();
        Ext.Msg.alert("Couldn't find matching sample", "An error occurred while fetching the contents of the data file: " + errorInfo.exception);

    }

    function onSuccess(data)
    {
        if (data.rows.length > 0)
        {
            // We have a matching sample
            var run = LABKEY.page.batch.runs[LABKEY.page.batch.runs.length - 1];
            run.materialInputs = [ { rowId: data.rows[0].RowId } ];

            saveBatchFn();
        }
        else
        {
            // Need to create the sample material -- no longer do this
            Ext.Msg.hide();
            Ext.Msg.alert("Failed to Save", "This formulation does not exist.");
            return false;
            /*var batchInput = document.getElementById("materialBatch");
            batchInput.value = _batchName;
            Ext.Msg.hide();
            _materialWindow = new Ext.Window({
                contentEl: "material",
                title: "New Formulation",
                width: 400,
                autoHeight: true,
                modal: true,
                resizable: true,
                closeAction: 'hide'
            });

            _materialWindow.show("material");*/
        }
    }

    var filename = run.name;
    var batchNumber = fileNameToBatchNumber(filename);
    run.properties.IDRIBatchNumber = batchNumber;
    if (filename.indexOf(".xls") > 0) {
        _batchName = filename.substring(0, filename.length - 4); // removes the .xls
    }
    else {
        _batchName = filename;
    }
    _batchName = _batchName.toUpperCase();

    // Study related fields

    // stash the saveBatchFn away for saveMaterial callback in submitMaterial.
    _saveBatchFn = saveBatchFn;

    LABKEY.page.batch.runs = LABKEY.page.batch.runs || [];
    if (isNewRun)
        LABKEY.page.batch.runs.push(run);

    LABKEY.setDirty(true);

    LABKEY.Query.selectRows({
        schemaName: 'Samples',
        queryName: 'Formulations',
        successCallback: onSuccess,
        failureCallback: onFailure,
        filterArray: [LABKEY.Filter.create('Batch', _batchName)]
    });

}
