/*
 * Copyright (c) 2014-2016 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
(function(){

    // CONSTANTS
    var STANDARD_DATE_OF_MANUFACTURE = "T=0",
            STANDARD_TEMPERATURE = "5C",
            MAXIMAL_FULL_SET = 9,
            WORKING_SET_SIZE = 3,
            MAX_PDI = 1.0,
            MIN_ZAVE = 1.0;

    var getPrefixes = function() {
        var prefixes = LABKEY.moduleContext.idri.FormulationPrefixes;
        if (prefixes) {
            return prefixes.split(',');
        }
        return [];
    };

    var fileNameToBatchNumber = function(filename) {
        // Edits the suffix of the filename
        filename = filename.split('.')[0];

        var prefixes = getPrefixes();

        // This checks the first part of the filename for specific run names.
        for (var i = 0; i < prefixes.length; i++) {
            if (new RegExp('^' + prefixes[i]).test(filename)) {
                filename = filename.substring(prefixes[i].length, filename.length);
                if (i > 0) {
                    filename = '' + i + filename;
                }
                break;
            }
        }

        return filename;
    };

    var handleDataUpload = function(f, action, process) {

        if (!action || !action.result)
        {
            process.publishMessage("Something went horribly wrong when uploading.");
            return;
        }
        if (!action.result.id)
        {
            process.publishMessage("Failed to upload the data file. This file appears to not be valid.");
            return;
        }

        Ext4.Msg.wait("Uploading...");

        var data = new LABKEY.Exp.Data(action.result);

        var run = new LABKEY.Exp.Run({
            name: data.name.split('.')[0] || "[New]",
            dataInputs: [data]
        });

        if (!data.content)
        {
            data.getContent({
                format: 'jsonTSV',
                success: function (content, format)
                {
                    data.content = content;
                    handleRunContent(run, content, process);
                },
                failure: function (error, format)
                {
                    Ext4.Msg.hide();
                    process.publishMessage(error.exception);
                }
            });
        }
        else
        {
            Ext4.Msg.hide();
        }
    };

    // Return array of:
    // 0 - storage temperature:  "XXC" where X is a digit, and "RT" for room temp, default 5C
    // 1 - time label ("T=0", "4 dy", "1 wk", "6 mo")
    // 3 - extraction number
    // 4 - Machine Type
    var parseSampleNameAdvanced = function(sampleText) {
        // Argument - sampleText is equivalent to one row in the file.

        // Possible pattern types recognized
        // 1. [ TIME PERIOD ] [ SAMPLE # ]              nano -- Missing TEMP
        // 2. [ TEMP ] [ TIME PERIOD ] [ SAMPLE # ]     nano
        // 3. [ TIME PERIOD ] [ TEMP ] [ WELL INFO ]    aps  -- Missing SAMPLE #
        // TIME PERIOD = DM, T=0, 1 wk, 2 wk, 3mo, 6mo, etc.
        // SAMPLE #    = 1, 2, 3, ..., n samples
        // TEMP        = 5C, 25C, 37C, etc
        // WELL INFO   = "QF145 (well F7)", "TD336 (well G11)", etc
        // For (1) the temperature must be assumed. For (3) the Sample number must be
        // derived.

        var temperature = "",
                timeLabel = "",
                check = true,
                dateManufactureFound = false,
                returnValue = true,
                extractionNum = 1, // If we don't find an extraction number
                machineType = "",
                patternAPS = /(WELL|Well|well)+/,
                pattern2 = /(\d+[Cc])+/,
                pattern1 = /((T\s*=\s*0)\s+\d+|[a-zA-Z]+\s+\d+)/,
                patternFiltered = /T\s*=\s*0\s+\([F|f][a-zA-Z]+ed\)\s+\d+/,
                patternTemp = /\d+[Cc]/,
                patternTime = /(T\s*=\s*0)|[Dd][Mm]|(\s+[Dd]\d+\s+)|(\d+\s*[a-zA-Z]+)/; // Currently, this will match on Temp too

        // Change all DM times to T=0
        sampleText = sampleText.replace(/[Dd][Mm]/, STANDARD_DATE_OF_MANUFACTURE);

        if (sampleText.search(/(T\s*=\s*0)/) > 0)
        {
            // Found a T=0
            dateManufactureFound = true;
        }

        // Convert weeks, months
        sampleText = sampleText.replace(/([W|w]eek)/, 'wk').replace(/([M|m]onth)/, 'mo');

        // replace '-' with ' '
        sampleText = sampleText.replace((/-/), " ");

        // Check for time labels that should be in days (e.g. DM+1)
        if (sampleText.match(/\+\s*\d+/))
        {
            var day = sampleText.match(/\+\s*\d+/)[0];
            day = parseInt(day.replace(/\+\s*/,""));
            sampleText = sampleText.replace(/T=0\+\s*\d+/, day + " dy");
        }
        else if (sampleText.match(/(\s+[Dd]\d+\s+)/))
        {
            // Converts D1, D2, etc to 1 dy, 2 dy, etc
            var dayMatch = sampleText.match(/(\s+[Dd]\d+\s+)/)[0];
            dayMatch = dayMatch.replace(/(\s+[Dd])/, " ").replace(/\s+/g, "");

            var dayNum = parseInt(dayMatch);
            sampleText = sampleText.replace(/(\s+[Dd]\d+\s+)/, " " + dayNum + " dy");
        }

        if (sampleText.match(patternFiltered))
        {
            temperature = STANDARD_TEMPERATURE;

            timeLabel = sampleText.match(patternTime)[0];
            sampleText = sampleText.replace(timeLabel,"");

            extractionNum = sampleText.split(" ");
            extractionNum = parseInt(extractionNum[extractionNum.length-1]);
            machineType = "nano";
        }
        else {
            if (sampleText.match(patternAPS))
            {
                // Work with type 3
                if (sampleText.match(patternTemp) != null)
                {
                    temperature = sampleText.match(patternTemp)[0];
                    sampleText = sampleText.replace(temperature,"");
                }
                else
                {
                    temperature = STANDARD_TEMPERATURE;
                }

                timeLabel = sampleText.match(patternTime)[0];
                sampleText = sampleText.replace(timeLabel,"");
                machineType = "aps";
                // we don't know extraction number in this case,
                // might be able to calculate it based on temp, timelabel
            }
            else if (sampleText.match(pattern2))
            {
                // Work with type 2
                temperature = sampleText.match(patternTemp)[0];
                sampleText = sampleText.replace(temperature,"");

                if (!(sampleText.match(patternTime)))
                {
                    returnValue = -2;
                }
                else
                {
                    timeLabel = sampleText.match(patternTime)[0];
                    sampleText = sampleText.replace(timeLabel,"");
                    extractionNum = parseInt(sampleText.replace(/\s/g,""));
                    machineType = "nano";
                }
            }
            else if (sampleText.match(pattern1))
            {
                temperature = STANDARD_TEMPERATURE;

                if (!(sampleText.match(patternTime)))
                {
                    returnValue = -2;
                }
                else
                {
                    timeLabel = sampleText.match(patternTime)[0];
                    sampleText = sampleText.replace(timeLabel,"");
                    extractionNum = parseInt(sampleText.replace(/\s/g,""));
                    machineType = "nano";
                }
            }
            else
            {
                // Check if it is only the time point given
                var tp = sampleText.match(patternTime);
                if (tp && (tp[0].length == sampleText.length))
                {
                    temperature = STANDARD_TEMPERATURE;
                    timeLabel = tp[0];
                    extractionNum = 1;
                    machineType = "nano";
                    check = false;
                }
                else
                {
                    // Check for patterns we know about, but we do not want to include
                    if (sampleText.match(/([B|b]efore)/))
                    {
                        returnValue = -1;
                    }
                    else
                    {
                        // This row does not match any known pattern.
                        returnValue = null;
                    }
                }
            }

            if (returnValue && check)
            {
                // WARNING: Very hard to read...this puts spaces in-between time number and label.
                // e.g. "6mo" -> "6 mo"
                if (timeLabel.match(/T\s*=\s*0/) == null)
                {
                    if (timeLabel.match(/\d+/) && (timeLabel.match(/\d+\s/) == null))
                    {
                        timeLabel = timeLabel.replace(/\d+/,timeLabel.match(/\d+/) + " ");
                    }
                }
                temperature = temperature.toUpperCase();
            }
        }

        return {
            value: returnValue,
            temperature: temperature,
            timeLabel: timeLabel,
            extractionNum: extractionNum,
            machineType: machineType,
            dateManufactureFound: dateManufactureFound
        };
    };

    var handleRunContent = function(run, content, process) {
        if (!content)
        {
            Ext4.Msg.hide();
            process.publishMessage("Upload Failed: The data file has no content");
            return;
        }

        if (!content.sheets || content.sheets.length == 0)
        {
            // expected the data file to be parsed as jsonTSV
            Ext4.Msg.hide();
            process.publishMessage("Upload Failed: The data file has no sheets of data");
            return;
        }

        var sheet = content.sheets[0];
        // If there's one called "Data" or "PS data", use that instead
        for (var index = 0; index < content.sheets.length; index++)
        {
            if (content.sheets[index].name == "Data" || content.sheets[index].name == "PS data")
                sheet = content.sheets[index];
        }

        var data = sheet.data;
        if (!data.length)
        {
            process.publishMessage("Upload Failed: The data file " + run.name + " contains no rows");
            return;
        }

        var onSuccess = function(queryData) {
            if (queryData.rows.length > 0)
            {
                var oldRun = new LABKEY.Exp.Run({rowId: queryData.rows[0]["RowId"]});
                oldRun.deleteRun({
                    success: function() { processRunData(run, data, process) },
                    failure: function() {
                        process.publishMessage("Upload Failed: Failed to delete old run.");
                    }
                });
            }
            else
            {
                processRunData(run, data, process);
            }
        };

        // Need to check if there is already a run that we need to replace.
        var selectRowsConfig = {
            schemaName: 'assay',
            queryName: LABKEY.page.assay.name + " Runs",
            success: onSuccess,
            failure: function(errorInfo) {
                Ext4.Msg.hide();
                process.publishMessage("Upload Failed: An error occurred while querying the assay: " + errorInfo.exception);
            },
            filterArray: [ LABKEY.Filter.create('name', run.name) ],
            columns: 'name,batch/rowId,rowId'
        };

        LABKEY.Query.selectRows(selectRowsConfig);
    };

    var processRunData = function(_run, data, process) {

        var run = processRun(_run, data, process);
        var filename = run.name;
        process.data.formulationId = fileNameToBatchNumber(filename);
        run.properties.IDRIBatchNumber = fileNameToBatchNumber(filename);
        var _batchName = filename.split('.')[0].toUpperCase();

        var batch = new LABKEY.Exp.RunGroup({
            batchProtocolId: LABKEY.page.batch.batchProtocolId, // only place that should reference the "page" batch
            loaded: true,
            runs: [run]
        });

        LABKEY.Query.selectRows({
            schemaName: 'Samples',
            queryName: 'Formulations',
            success: function(d) {
                if (d.rows.length > 0) {
                    // We have a matching sample
                    run.materialInputs = [ { rowId: d.rows[0].RowId } ];
                    process.setCommit('formulationName', d.rows[0].Name);
                    process.setCommit('formulationSampleId', d.rows[0].RowId);
                    saveBatch(batch, process);
                }
                else {
                    Ext4.Msg.hide();
                    process.publishMessage("Failed to Save, This formulation does not exist.");
                }
            },
            failure: function(errorInfo) {
                Ext4.Msg.hide();
                process.publishMessage("Couldn't find matching sample, An error occurred while fetching the contents of the data file: " + errorInfo.exception);
            },
            filterArray: [LABKEY.Filter.create('Batch', _batchName)]
        });
    };

    var processRun = function(run, data, process) {
        // test numbers are 1-3 like extraction numbers, but they get incremented
        // when the extraction number resets, and reset when the time label changes.
        var testNum = 1,
                workingSet = [], // We store the working set as soon as we have all three tests
                lastTimeLabel = STANDARD_DATE_OF_MANUFACTURE,
                lastMachineType = "",
                zAveMean = 0,
                zAveNum = 0,
                header = data[0],
                error = false,
                gapFound = false,
                fullGrpLength = 0,
                row, sampleText, i,
                dateManufactureFound = false;

        run.dataRows = [];

        // skip header row
        for (i=1; i < data.length; i++)
        {
            row = data[i];

            // This is where it is assumed the 2nd column is the Sample Information
            sampleText = row[1];

            if (sampleText == null)
            {
                if (i == 1)
                {
                    run.properties.ZAveMean = -888;
                    run.properties.Error = "Patricle Size Data sheet was empty.";
                    process.publishMessage(run.properties.Error);
                    error = true;
                    break;
                }
                else
                {
//                    process.publishMessage(run.properties.Error);
                    gapFound = true;
                    continue;
                }
            }
            else if ((sampleText != null) && (gapFound == true))
            {
                error = true;
                run.properties.ZAveMean = -889;
                run.properties.Error = "Gap between rows containing data.";
                process.publishMessage(run.properties.Error);
            }

            var parseResult = parseSampleNameAdvanced(sampleText);

            if (parseResult.dateManufactureFound === true)
            {
                dateManufactureFound = true;
            }

            if (parseResult.value == null)
            {
                run.properties.Error = "Error on Sample name column in row " + (i+1);
                process.publishMessage(run.properties.Error);
                run.properties.ZAveMean = -(i+1);
                error = true;
                break;
            }
            else if (parseResult.value == -1)
            {
                // Known row that we should skip. (e.g. 'Before filtered')
                continue;
            }
            else if (parseResult.value == -2)
            {
                run.properties.Error = "Invalid timepoint given on row " + (i+1);
                process.publishMessage(run.properties.Error);
                run.properties.ZAveMean = -(i+1);
                error = true;
                break;
            }

            if (!equalsIgnoresCase(lastTimeLabel, parseResult.timeLabel) || !equalsIgnoresCase(lastMachineType, parseResult.machineType))
            {
                testNum = 1;

                if (fullGrpLength % WORKING_SET_SIZE != 0)
                {
                    run.properties.Error = "Error: Improperly sized Working Set ending on row " + i;
                    run.properties.ZAveMean = -(i);
                    process.publishMessage(run.properties.Error);
                    error = true;
                    break;
                }

                fullGrpLength = 1;

                if (fullGrpLength > MAXIMAL_FULL_SET)
                {
                    run.properties.Error = "Error: There are multiple Working Sets that result in more than the allowed (" +
                            MAXIMAL_FULL_SET + ") contigious rows for " + lastTimeLabel + "/" + lastMachineType + ".";
                    process.publishMessage(run.properties.Error);
                    run.properties.ZAveMean = -(i+1);
                    error = true;
                    break;
                }

                lastTimeLabel = parseResult.timeLabel;
                lastMachineType = parseResult.machineType;
            }
            else
            {
                fullGrpLength++;
            }

            var zAve = row[2];

            if (equalsIgnoresCase(STANDARD_DATE_OF_MANUFACTURE, parseResult.timeLabel))
            {
                zAveMean += zAve;
                zAveNum++;
            }

            var dataRow = {
                Record: row[0],
                SampleName: row[1],
                ExtractionNumber: parseResult.extractionNum,
                TestNumber: testNum,
                TimeLabel: parseResult.timeLabel,
                ZAve: zAve,
                Pdl: row[3],
                meanCountRate: row[4],
                Cumulants: row[5],
                Date: row[6],
                StorageTemperature: parseResult.temperature,
                MeasuringTemperature: row[7],
                AnalysisTool: parseResult.machineType
            };

            // data constraints - introduced 12.17.2010
            if (dataRow.Pdl >= MAX_PDI)
            {
                run.properties.Error = "Error: The pdI value for row " + (i+1) + " is 1.0 or more.";
                process.publishMessage(run.properties.Error);
                run.properties.ZAveMean = -(i+1);
                error = true;
                break;
            }
            else if (dataRow.ZAve < MIN_ZAVE)
            {
                run.properties.Error = "Error: The Z-Average for row " + (i+1) + " is less than 1.0";
                process.publishMessage(run.properties.Error);
                run.properties.ZAveMean = -(i+1);
                error = true;
                break;
            }

            // any extra columns over the required first 8 will be included in the uploaded run data
            // to support the scenario where IDRI may want to customize their assay and start uploading
            // additional fields

            if (row.length > 8)
            {
                for (var col=8; col < row.length; col++)
                {
                    if (header[col] != undefined)
                        dataRow[header[col]] = row[col];
                }
            }
            workingSet.push(dataRow);

            if (workingSet.length == WORKING_SET_SIZE)
            {
                // This is a little funny. The machine can produce odd results.
                // The extraction number can vary, indicating potential errors
                // Valid: 1, 2, 3 or 1 ,1, 1
                // If we have 1, 2, 1, then 1 and 2 are bad and need to be re-run
                // If we have 1, 1, 2, then 1 needs to be re-run
                if ((workingSet[0].ExtractionNumber == 1 &&
                        workingSet[1].ExtractionNumber == 2 &&
                        workingSet[2].ExtractionNumber == 3) ||
                        (workingSet[0].ExtractionNumber == 1 &&
                                workingSet[1].ExtractionNumber == 1 &&
                                workingSet[2].ExtractionNumber == 1))
                {
                    copyWorkingSet(workingSet, run);
                    testNum++;
                    workingSet = [];
                }
                else if (workingSet[0].ExtractionNumber == 1)
                {
                    workingSet.shift();
                    if (workingSet[0].ExtractionNumber == 2)
                    {
                        workingSet.shift();
                    }
                }
            }
        }

        if (zAveNum > 0 && !(error))
        {
            zAveMean = zAveMean / zAveNum;
            run.properties.ZAveMean = zAveMean;
        }

        if (!(run.properties.ZAveMean))
        {
            if (dateManufactureFound)
            {
                run.properties.Error = "Unrecognized Error. See Sample Name Column.";
                process.publishMessage(run.properties.Error);
            }
            else
            {
                run.properties.ZAveMean = 0;
            }
        }

        return run;
    };

    var saveBatch = function(batch, process) {
        LABKEY.Experiment.saveBatch({
            assayId: LABKEY.page.assay.id,
            batch: batch,
            success : function(_batch) { onSaveBatch.call(this, _batch, process); },
            failure : function (error) {
                Ext4.Msg.hide();
                // Break up this string in the source so that it's easier to tell when there's been an actual error -
                // we can look for the concatenated version in the page
                process.publishMessage("Failure when communicating " + "with the server: " + error.exception);
            }
        });
    };

    var onSaveBatch = function(batch, process)
    {
        Ext4.Msg.hide();

        var batchId = batch.runs[0].id;
        process.setCommit('formulationSampleURL', LABKEY.ActionURL.buildURL('project', 'begin', null, {
            rowId: process.get('formulationSampleId'),
            pageId: 'idri.LOT_SUMMARY'
        }));
        process.setCommit('uploadFileURL', LABKEY.ActionURL.buildURL('experiment', 'showRunGraph', null, {rowId: batchId}));

        if (Ext4.isEmpty(process.get('messages')))
        {
            var params = {
                rowId: LABKEY.page.assay.id
            };

            var filter = LABKEY.Filter.create('Run/RowId', batchId);
            var prefix = filter.getURLParameterName().replace('query.', 'Data.');
            params[prefix] = filter.getURLParameterValue();

            process.setCommit('assayResultURL', LABKEY.ActionURL.buildURL('assay', 'assayResults.view', null, params));
            process.publishMessage("Success");
            clearCachedReports(process.get('formulationName'));
        }
    };

    var clearCachedReports = function(formulationName) {
        if (!Ext4.isEmpty(formulationName)) {

            var folder = '%40files/PSData/';
            var _ext = 'PS.png?';

            var fileURLs = [
                LABKEY.ActionURL.buildURL('_webdav', folder + formulationName + '_nano' + _ext),
                LABKEY.ActionURL.buildURL('_webdav', folder + formulationName + '_aps' + _ext)
            ];

            Ext4.each(fileURLs, function(url) {
                Ext4.Ajax.request({
                    url: url,
                    method: 'DELETE',
                    success: function() { console.log('cleared cache:', formulationName); },
                    failure: function(response) {
                        if (response.status !== 404) {
                            console.log('failed to clear cache:', formulationName);
                        }
                    }
                })
            });
        }
    };

    var dropInit = function() {
        var dropTarget = document.getElementById('particlesize-drop');

        if (!window.Dropzone.isBrowserSupported()) {
            Ext4.get(dropTarget).update('This browser does not support file drop. Consider using a newer browser.');
            return;
        }

        return LABKEY.internal.FileDrop.registerDropzone({

            url: LABKEY.ActionURL.buildURL("assay", "assayFileUpload"),
            uploadMultiple: false,
            maxFiles: 5000,
            // Allow uploads of 100GB files
            maxFilesize: 100*(1024*1024),

            peer: function() {
                return dropTarget;
            },

            /**
             * If the user is allowed to drop
             * @param file
             * @param done
             */
            accept: function(file, done) {
                // Filter out folder drag-drop on unsupported browsers (Firefox)
                // See: https://github.com/enyo/dropzone/issues/528
                if ( (!file.type && file.size == 0 && file.fullPath == undefined)) {
                    done("Drag-and-drop upload of folders is not supported by your browser. Please consider using Google Chrome or an external WebDAV client.");
                    return;
                }

                done();
            }
        });
    };

    var init = function() {

        var form = Ext4.create('Ext.form.Panel', {
            renderTo: 'upload-run-form',
            url: LABKEY.ActionURL.buildURL("assay", "assayFileUpload"),
            width: 200,
            border: false,
            bodyStyle: 'background-color: transparent',
            items: [{
                xtype: 'filefield',
                id: 'upload-run-field-file', // tests
                buttonOnly: true,
                buttonText: 'Add Excel File...',
                allowBlank: false,
                listeners: {
                    change: function(field, file) { form.submit(); }
                }
            }, {
                xtype: 'hidden',
                name: 'X-LABKEY-CSRF',
                value: LABKEY.CSRF
            }],
            listeners: {
                actioncomplete : function(_form, action, eOpts){
                    var process = processLog.getModelInstance({
                        uploadTime: new Date(),
                        fileName: action.result.name
                    });
                    processLog.getStore().add(process);
                    processLog.getStore().sync();
                    handleDataUpload.call(this, action.result, action, process);
                },
                actionfailed : function(_form, action, eOpts){ alert("Server Failed"); }
            }
        });

        var processLog = Ext4.create('LABKEY.particlesize.ProcessLog', {
            renderTo: 'processLog',
            width: 934
        });

        var drop = dropInit();
        if (drop) {
            drop.on('success', function(file, response, evt) {
                var process = processLog.getModelInstance({
                    uploadTime: new Date(),
                    fileName: file.name
                });
                processLog.getStore().add(process);
                processLog.getStore().sync();
                // mimic an Ext.form.action.Submit
                var action = {result: Ext4.decode(response)};
                handleDataUpload(file, action, process);

            });
        }

        var clearButton  = Ext4.create('Ext.Button', {
            renderTo: 'clearButton',
            text: 'Clear',
            handler: function(){
                processLog.getStore().removeAll();
                processLog.getStore().sync();
            }

        })
    };

    var equalsIgnoresCase = function(str1, str2) {
        return str1.toLowerCase() == str2.toLowerCase();
    };

    var copyWorkingSet = function(workingSet, run) {
        for (var i=0; i<WORKING_SET_SIZE; i++)
        {
            workingSet[i].ExtractionNumber = i + 1;
            run.dataRows.push(workingSet[i]);
        }
    };

    Ext4.onReady(init);
})();