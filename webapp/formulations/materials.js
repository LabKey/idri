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

function fileNameToBatchNumber(filename)
{
    // Edits the suffix of the filename
    filename = filename.split('.')[0];

    // This checks the first part of the filename for specific run names.
    /* TODO: Change this check to a regular expression. The batchNumber might need to be rethought. */
    if (/^TD/.test(filename))
    {
        filename = filename.substring(2, filename.length);
    }
    else if (/^QF/.test(filename))
    {
        // QF is used as 1000-1999 test runs.
        filename = filename.substring(2, filename.length);
        filename = '1' + filename;
    }
    else if (/^QD/.test(filename))
    {
        // QD is used as 2000-2999 test runs.
        filename = filename.substring(2, filename.length);
        filename = '2' + filename;
    }

    return filename;
}

function fetchMaterialRowIdAndSave(run, isNewRun, saveBatchFn)
{
    var onSuccess = function(data)
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
            Ext.Msg.hide();
            Ext.Msg.alert("Failed to Save", "This formulation does not exist.");
            return false;
        }
    }

    var filename = run.name,
            _batchName = filename;

    run.properties.IDRIBatchNumber = fileNameToBatchNumber(filename);

    _batchName = filename.split('.')[0].toUpperCase();

    // Study related fields

    LABKEY.page.batch.runs = LABKEY.page.batch.runs || [];
    if (isNewRun)
        LABKEY.page.batch.runs.push(run);

    LABKEY.setDirty(true);

    LABKEY.Query.selectRows({
        schemaName: 'Samples',
        queryName: 'Formulations',
        successCallback: onSuccess,
        failureCallback: function(errorInfo) {
            Ext.Msg.hide();
            Ext.Msg.alert("Couldn't find matching sample", "An error occurred while fetching the contents of the data file: " + errorInfo.exception);
        },
        filterArray: [LABKEY.Filter.create('Batch', _batchName)]
    });

}
