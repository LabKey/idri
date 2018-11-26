/*
 * Copyright (c) 2014-2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
(function() {

    // CONSTANTS
    var ASSAY_SCHEMA = 'assay',
        STANDARD_DATE_OF_MANUFACTURE = 'T=0',
        STANDARD_TEMPERATURE = '5C',
        MAX_PDI = 1.0,
        MIN_ZAVE = 1.0,
        QUERY_INFO;

    var getAssayQueryName = function(queryName) {
        return [LABKEY.page.assay.name, queryName].join(' ');
    };

    var getPrefixes = function() {
        var prefixes = LABKEY.moduleContext.idri.FormulationPrefixes;
        if (prefixes) {
            return prefixes.split(',');
        }
        return [];
    };

    var getQueryInfo = function() {
        return QUERY_INFO;
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

        if (!action || !action.result) {
            process.publishMessage('Something went horribly wrong when uploading.');
            return;
        }
        if (!action.result.id) {
            process.publishMessage('Failed to upload the data file. This file appears to not be valid.');
            return;
        }

        Ext4.Msg.wait('Uploading...');

        var data = new LABKEY.Exp.Data(action.result);

        var run = new LABKEY.Exp.Run({
            name: data.name.split('.')[0] || '[New]',
            dataInputs: [data]
        });

        if (!data.content) {
            data.getContent({
                format: 'jsonTSV',
                success: function(content) {
                    data.content = content;
                    handleRunContent(run, content, process);
                },
                failure: function(error) {
                    Ext4.Msg.hide();
                    process.publishMessage(error.exception);
                }
            });
        }
        else {
            Ext4.Msg.hide();
        }
    };

    var parseQueryInfo = function(queryInfo) {
        var columnMap = {};

        Ext4.each(queryInfo.columns, function(column, i) {
            columnMap[column.fieldKey.toLowerCase()] = i;
            if (column.caption) {
                columnMap[column.caption.toLowerCase()] = i;
            }
        });

        queryInfo.getColumns = function() {
            return Ext4.clone(queryInfo.columns);
        };

        queryInfo.getColumn = function(identifier) {
            if (identifier && columnMap.hasOwnProperty(identifier.toLowerCase())) {
                return Ext4.clone(queryInfo.columns[columnMap[identifier.toLowerCase()]]);
            }
        };

        return queryInfo;
    };

    // Return array of:
    // 0 - storage temperature:  "XXC" where X is a digit, and "RT" for room temp, default 5C
    // 1 - time label ("T=0", "4 dy", "1 wk", "6 mo")
    // 3 - extraction number
    // 4 - Machine Type
    var parseSampleNameAdvanced = function(sampleText) {
        // Argument - sampleText is equivalent to one row in the file.

        // Possible pattern types recognized
        // 1. [ TIME PERIOD ] [ SAMPLE # ]                      nano -- Missing TEMP
        // 2. [ TEMP ] [ TIME PERIOD ] [ SAMPLE # ]             nano
        // 3. [ TIME PERIOD ] [ TEMP ] [ WELL INFO ]            aps  -- Missing SAMPLE #
        // 4. [ LOT # ] [ TEMP ] [ TIME PERIOD ] [ SAMPLE # ]   nano -- auto-sampling
        // LOT #       = QF145, TD336, etc (we don't record or use this, just given a slot for clarity)
        // TIME PERIOD = DM, T=0, 1 wk, 2 wk, 3mo, 6mo, etc.
        // SAMPLE #    = 1, 2, 3, ..., n samples
        // TEMP        = 5C, 25C, 37C, etc
        // WELL INFO   = "QF145 (well F7)", "TD336 (well G11)", etc
        // For (1) the temperature must be assumed. For (3) the Sample number must be
        // derived.

        var temperature = '',
            timeLabel = '',
            check = true,
            dateManufactureFound = false,
            returnValue = true,
            extractionNum = -1, // If we don't find an extraction number
            machineType = '',
            well = '',
            patternAPS = /(WELL|Well|well)+/,
            pattern2 = /(\d+[Cc])+/,
            pattern1 = /((T\s*=\s*0)\s+\d+|[a-zA-Z]+\s+\d+)/,
            patternFiltered = /T\s*=\s*0\s+\([F|f][a-zA-Z]+ed\)\s+\d+/,
            patternTemp = /\d+[Cc]/,
            patternTime = /(T\s*=\s*0)|[Dd][Mm]|(\s+[Dd]\d+\s+)|(\d+\s*[a-zA-Z]+)/; // Currently, this will match on Temp too

        // Change all DM times to T=0
        sampleText = sampleText.replace(/[Dd][Mm]/, STANDARD_DATE_OF_MANUFACTURE);

        if (sampleText.search(/(T\s*=\s*0)/) > 0) {
            // Found a T=0
            dateManufactureFound = true;
        }

        // Convert weeks, months
        sampleText = sampleText.replace(/([W|w]eek)/, 'wk').replace(/([M|m]onth)/, 'mo');

        // replace '-' with ' '
        sampleText = sampleText.replace((/-/), " ");

        // Check for time labels that should be in days (e.g. DM+1)
        if (sampleText.match(/\+\s*\d+/)) {
            var day = sampleText.match(/\+\s*\d+/)[0];
            day = parseInt(day.replace(/\+\s*/, ''));
            sampleText = sampleText.replace(/T=0\+\s*\d+/, day + " dy");
        }
        else if (sampleText.match(/(\s+[Dd]\d+\s+)/)) {
            // Converts D1, D2, etc to 1 dy, 2 dy, etc
            var dayMatch = sampleText.match(/(\s+[Dd]\d+\s+)/)[0];
            dayMatch = dayMatch.replace(/(\s+[Dd])/, " ").replace(/\s+/g, "");

            var dayNum = parseInt(dayMatch);
            sampleText = sampleText.replace(/(\s+[Dd]\d+\s+)/, " " + dayNum + " dy");
        }

        if (sampleText.match(patternFiltered)) {
            temperature = STANDARD_TEMPERATURE;

            timeLabel = sampleText.match(patternTime)[0];
            sampleText = sampleText.replace(timeLabel, '');

            extractionNum = sampleText.split(' ');
            extractionNum = parseInt(extractionNum[extractionNum.length-1]);
            machineType = 'nano';
        }
        else {
            if (sampleText.match(patternAPS)) {
                // Work with type 3
                if (sampleText.match(patternTemp) != null) {
                    temperature = sampleText.match(patternTemp)[0];
                    sampleText = sampleText.replace(temperature, '');
                }
                else {
                    temperature = STANDARD_TEMPERATURE;
                }

                timeLabel = sampleText.match(patternTime)[0];
                sampleText = sampleText.replace(timeLabel, '');
                machineType = 'aps';

                var wellTokens = sampleText.toLowerCase().split('(well ');
                well = wellTokens[wellTokens.length - 1].replace(')', '').trim();

                // we don't know extraction number in this case,
                // might be able to calculate it based on temp, timelabel
            }
            else if (sampleText.match(pattern2)) {
                // Work with type 2 and 4
                temperature = sampleText.match(patternTemp)[0];
                sampleText = sampleText.replace(temperature, '');

                if (!(sampleText.match(patternTime))) {
                    returnValue = -2;
                }
                else {
                    timeLabel = sampleText.match(patternTime)[0];
                    sampleText = sampleText.replace(timeLabel, "").trim();
                    machineType = 'nano';

                    // differentiate between patterns 2 and 4
                    var sampleTextParts = sampleText
                            .split(' ')
                            .filter(function(part) { return part !== ''; });

                    if (sampleTextParts.length === 1) {
                        extractionNum = parseInt(sampleText);
                    }
                    else if (sampleTextParts.length > 1) {
                        extractionNum = parseInt(sampleTextParts[1]);
                    }
                }
            }
            else if (sampleText.match(pattern1)) {
                temperature = STANDARD_TEMPERATURE;

                if (!(sampleText.match(patternTime))) {
                    returnValue = -2;
                }
                else {
                    timeLabel = sampleText.match(patternTime)[0];
                    sampleText = sampleText.replace(timeLabel, '');
                    extractionNum = parseInt(sampleText.replace(/\s/g, ''));
                    machineType = 'nano';
                }
            }
            else {
                // Check if it is only the time point given
                var tp = sampleText.match(patternTime);
                if (tp && (tp[0].length === sampleText.length)) {
                    temperature = STANDARD_TEMPERATURE;
                    timeLabel = tp[0];
                    extractionNum = 1;
                    machineType = 'nano';
                    check = false;
                }
                else {
                    // Check for patterns we know about, but we do not want to include
                    if (sampleText.match(/([B|b]efore)/)) {
                        returnValue = -1;
                    }
                    else {
                        // This row does not match any known pattern.
                        returnValue = null;
                    }
                }
            }

            if (returnValue && check) {
                // WARNING: Very hard to read...this puts spaces in-between time number and label.
                // e.g. "6mo" -> "6 mo"
                if (timeLabel.match(/T\s*=\s*0/) == null) {
                    if (timeLabel.match(/\d+/) && (timeLabel.match(/\d+\s/) == null)) {
                        timeLabel = timeLabel.replace(/\d+/,timeLabel.match(/\d+/) + " ");
                    }
                }
                temperature = temperature.toUpperCase();
            }
        }

        return {
            dateManufactureFound: dateManufactureFound,
            extractionNum: extractionNum,
            machineType: machineType,
            temperature: temperature,
            timeLabel: timeLabel,
            value: returnValue,
            well: well
        };
    };

    var handleRunContent = function(run, content, process) {
        if (!content) {
            Ext4.Msg.hide();
            process.publishMessage("Upload Failed: The data file has no content");
            return;
        }

        if (!content.sheets || content.sheets.length === 0) {
            // expected the data file to be parsed as jsonTSV
            Ext4.Msg.hide();
            process.publishMessage("Upload Failed: The data file has no sheets of data");
            return;
        }

        var sheet = content.sheets[0];
        // If there's one called "Data" or "PS data", use that instead
        for (var index = 0; index < content.sheets.length; index++) {
            var _sheet = content.sheets[index];
            if (_sheet.name === 'Data' || _sheet.name === 'PS data') {
                sheet = _sheet;
            }
        }

        var data = sheet.data;
        if (!data.length) {
            process.publishMessage("Upload Failed: The data file " + run.name + " contains no rows");
            return;
        }

        var onSuccess = function(queryData) {
            if (queryData.rows.length > 0) {
                var oldRun = new LABKEY.Exp.Run({
                    rowId: queryData.rows[0]['RowId']
                });

                oldRun.deleteRun({
                    success: function() { processRunData(run, data, process) },
                    failure: function() {
                        process.publishMessage('Upload Failed: Failed to delete old run.');
                    }
                });
            }
            else {
                processRunData(run, data, process);
            }
        };

        // Need to check if there is already a run that we need to replace.
        LABKEY.Query.selectRows({
            schemaName: ASSAY_SCHEMA,
            queryName: getAssayQueryName('Runs'),
            success: onSuccess,
            failure: function(errorInfo) {
                Ext4.Msg.hide();
                process.publishMessage('Upload Failed: An error occurred while querying the assay: ' + errorInfo.exception);
            },
            filterArray: [ LABKEY.Filter.create('name', run.name) ],
            columns: 'name,batch/rowId,rowId'
        });
    };

    var processRunData = function(_run, data, process) {

        var run = processRun(_run, data, process);

        if (!run || run.error === true) {
            Ext4.Msg.hide();
            return;
        }

        delete run.error;

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

    var isLastWorkingSetRow = function(parseResult, data, i, getRowData) {
        var nextIdx = i + 1;

        // last row
        if (data.length <= nextIdx) {
            return true;
        }

        var sampleText = getRowData(data[nextIdx], 'SampleName');

        // next row invalid
        if (!sampleText) {
            return true;
        }

        var nextResult = parseSampleNameAdvanced(sampleText);

        return !(
            equalsIgnoresCase(parseResult.temperature, nextResult.temperature) &&
            equalsIgnoresCase(parseResult.timeLabel, nextResult.timeLabel) &&
            equalsIgnoresCase(parseResult.machineType, nextResult.machineType) &&
            equalsIgnoresCase(parseResult.well, nextResult.well)
        )
    };

    var processError = function(run, process, errorCode, errorMsg) {
        run.error = true;
        if (errorCode !== undefined) {
            run.properties.ZAveMean = errorCode;
        }
        run.properties.Error = errorMsg;
        process.publishMessage(errorMsg);
    };

    var processRun = function(run, data, process) {
        // test numbers are 1-3 like extraction numbers, but they get incremented
        // when the extraction number resets, and reset when the time label changes.
        var workingSet = [], // We store the working set as soon as we have all three tests
            zAveMean = 0,
            zAveNum = 0,
            headers,
            columnByIndex = {},
            columnIndexByFieldKey = {},
            gapFound = false,
            row, sampleText, i,
            dateManufactureFound = false;

        run.error = false;
        run.dataRows = [];
        var queryInfo = getQueryInfo();

        // process headers
        if (data.length > 0) {
            headers = data[0];

            for (var h=0; h < headers.length; h++) {
                var header = headers[h];
                var column = queryInfo.getColumn(header);

                if (column) {
                    columnIndexByFieldKey[column.fieldKey] = h;
                    columnByIndex[h] = column;
                }
                else {
                    console.warn('Unable to find associated assay column for header "' + header + '"');
                }
            }

            // these are columns that are calculated, derived, or automatically fulfilled during upload
            // so they are ignored during required column check
            var calculatedColumns = {
                analysistool: true,
                dataid: true,
                extractionnumber: true,
                rowid: true,
                storagetemperature: true,
                testnumber: true,
                timelabel: true
            };

            // check required columns
            var hasAll = true;
            queryInfo.getColumns().filter(function(col) {
                return col.required === true && calculatedColumns[col.fieldKey.toLowerCase()] !== true;
            }).forEach(function(col) {
                if (columnIndexByFieldKey[col.fieldKey] === undefined) {
                    processError(run, process, -882, 'Missing required column "' + col.caption + ' (' + col.fieldKey + ')"');
                    hasAll = false;
                }
            });

            if (!hasAll) {
                return;
            }
        }
        else {
            processError(run, process, -888, 'Particle Size Data sheet was empty. No header found.');
            return;
        }

        function getRowData(row, columnIdentifier) {
            if (row && columnIdentifier) {
                var col = queryInfo.getColumn(columnIdentifier);
                if (col) {
                    var index = columnIndexByFieldKey[col.fieldKey];
                    if (row.length > index) {
                        return row[index];
                    }
                }
            }
        }

        // skip header row
        for (i=1; i < data.length; i++) {
            row = data[i];

            sampleText = getRowData(row, 'SampleName');

            if (!sampleText) {
                if (i === 1) {
                    processError(run, process, -888, 'Particle Size Data sheet was empty. No data found.');
                    break;
                }
                else {
                    gapFound = true;
                    continue;
                }
            }
            else if (gapFound && sampleText) {
                processError(run, process, -889, 'Gap between rows containing data.');
                break;
            }

            var parseResult = parseSampleNameAdvanced(sampleText);

            if (parseResult.dateManufactureFound === true) {
                dateManufactureFound = true;
            }

            if (parseResult.value == null) {
                processError(run, process, -(i+1), 'Sample name column in row ' + (i+1));
                break;
            }
            else if (parseResult.value === -1) {
                // Known row that we should skip. (e.g. 'Before filtered')
                continue;
            }
            else if (parseResult.value === -2) {
                processError(run, process, -(i+1), 'Invalid timepoint given on row ' + (i+1));
                break;
            }

            var zAve = getRowData(row, 'ZAve');

            if (equalsIgnoresCase(STANDARD_DATE_OF_MANUFACTURE, parseResult.timeLabel)) {
                zAveMean += zAve;
                zAveNum++;
            }

            var dataRow = {
                [queryInfo.getColumn('Record').fieldKey]: getRowData(row, 'Record'),
                [queryInfo.getColumn('SampleName').fieldKey]: getRowData(row, 'SampleName'),
                [queryInfo.getColumn('ExtractionNumber').fieldKey]: parseResult.extractionNum,
                [queryInfo.getColumn('TimeLabel').fieldKey]: parseResult.timeLabel,
                [queryInfo.getColumn('ZAve').fieldKey]: zAve,
                [queryInfo.getColumn('Pdl').fieldKey]: getRowData(row, 'Pdl'),
                [queryInfo.getColumn('meanCountRate').fieldKey]: getRowData(row, 'meanCountRate'),
                [queryInfo.getColumn('Cumulants').fieldKey]: getRowData(row, 'Cumulants'),
                [queryInfo.getColumn('Date').fieldKey]: getRowData(row, 'Date'),
                [queryInfo.getColumn('StorageTemperature').fieldKey]: parseResult.temperature,
                [queryInfo.getColumn('MeasuringTemperature').fieldKey]: getRowData(row, 'MeasuringTemperature'),
                [queryInfo.getColumn('AnalysisTool').fieldKey]: parseResult.machineType
            };

            // we are no longer actively tracking TestNumber
            var testNumberCol = queryInfo.getColumn('TestNumber');
            if (testNumberCol) {
                dataRow[testNumberCol.fieldKey] = -1;
            }

            // data constraints - introduced 12.17.2010
            if (dataRow.Pdl >= MAX_PDI) {
                processError(run, process, -(i+1), 'The pdI value for row ' + (i+1) + ' is 1.0 or more.');
                break;
            }
            else if (dataRow.ZAve < MIN_ZAVE) {
                processError(run, process, -(i+1), 'The Z-Average for row ' + (i+1) + ' is less than 1.0.');
                break;
            }

            // support upload of additional columns
            for (var j=0; j < row.length; j++) {
                var col = columnByIndex[j];
                if (col) {
                    Ext4.applyIf(dataRow, {
                        [col.fieldKey]: row[j]
                    });
                }
            }

            workingSet.push(dataRow);

            if (isLastWorkingSetRow(parseResult, data, i, getRowData)) {
                copyWorkingSet(workingSet, run);
                workingSet = [];
            }
        }

        if (zAveNum > 0 && !run.error) {
            zAveMean = zAveMean / zAveNum;
            run.properties.ZAveMean = zAveMean;
        }

        if (!run.properties.ZAveMean) {
            if (dateManufactureFound) {
                processError(run, process, undefined, 'Unrecognized Error. See Sample Name Column.');
            }
            else {
                run.properties.ZAveMean = 0;
            }
        }

        return run;
    };

    var saveBatch = function(batch, process) {
        LABKEY.Experiment.saveBatch({
            assayId: LABKEY.page.assay.id,
            batch: batch,
            success : function(_batch) {
                onSaveBatch.call(this, _batch, process);
            },
            failure : function(error) {
                Ext4.Msg.hide();
                // Break up this string in the source so that it's easier to tell when there's been an actual error -
                // we can look for the concatenated version in the page
                process.publishMessage("Failure when communicating " + "with the server: " + error.exception);
            }
        });
    };

    var onSaveBatch = function(batch, process) {
        Ext4.Msg.hide();

        var batchId = batch.runs[0].id;
        process.setCommit('formulationSampleURL', LABKEY.ActionURL.buildURL('project', 'begin', undefined, {
            rowId: process.get('formulationSampleId'),
            pageId: 'idri.LOT_SUMMARY'
        }));
        process.setCommit('uploadFileURL', LABKEY.ActionURL.buildURL('experiment', 'showRunGraph', undefined, {rowId: batchId}));

        if (Ext4.isEmpty(process.get('messages'))) {
            var params = {
                rowId: LABKEY.page.assay.id
            };

            var filter = LABKEY.Filter.create('Run/RowId', batchId);
            var prefix = filter.getURLParameterName().replace('query.', 'Data.');
            params[prefix] = filter.getURLParameterValue();

            process.setCommit('assayResultURL', LABKEY.ActionURL.buildURL('assay', 'assayResults.view', undefined, params));
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

            url: LABKEY.ActionURL.buildURL('assay', 'assayFileUpload'),
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
                if ( (!file.type && file.size === 0 && file.fullPath == undefined)) {
                    done("Drag-and-drop upload of folders is not supported by your browser. Please consider using Google Chrome or an external WebDAV client.");
                    return;
                }

                done();
            }
        });
    };

    var init = function() {
        var schemaName = ASSAY_SCHEMA;
        var queryName = getAssayQueryName('Data');

        LABKEY.Query.getQueryDetails({
            schemaName: schemaName,
            queryName: queryName,
            success: function(queryInfo) {
                QUERY_INFO = parseQueryInfo(queryInfo);
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
                            change: function() {
                                form.submit();
                            }
                        }
                    },{
                        xtype: 'hidden',
                        name: 'X-LABKEY-CSRF',
                        value: LABKEY.CSRF
                    }],
                    listeners: {
                        actioncomplete : function(_form, action) {
                            var process = processLog.getModelInstance({
                                uploadTime: new Date(),
                                fileName: action.result.name
                            });
                            processLog.getStore().add(process);
                            processLog.getStore().sync();
                            handleDataUpload.call(this, action.result, action, process);
                        },
                        actionfailed : function() {
                            LABKEY.Utils.alert('Server Failed');
                        }
                    }
                });

                var processLog = Ext4.create('LABKEY.particlesize.ProcessLog', {
                    renderTo: 'processLog',
                    width: 934
                });

                var drop = dropInit();
                if (drop) {
                    drop.on('success', function(file, response) {
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

                Ext4.create('Ext.Button', {
                    renderTo: 'clearButton',
                    text: 'Clear',
                    handler: function() {
                        processLog.getStore().removeAll();
                        processLog.getStore().sync();
                    }
                });
            },
            failure: function() {
                LABKEY.Utils.alert('Initialization Failure', 'Could not find query "' + [schemaName, queryName].join('.') + '". Please ensure the assay is setup properly.');
            }
        });
    };

    var equalsIgnoresCase = function(str1, str2) {
        return str1 !== undefined && str2 !== undefined && str1.toLowerCase() === str2.toLowerCase();
    };

    var copyWorkingSet = function(workingSet, run) {
        for (var i=0; i < workingSet.length; i++) {
            if (workingSet[i].ExtractionNumber === -1) {
                workingSet[i].ExtractionNumber = i + 1;
            }
            run.dataRows.push(workingSet[i]);
        }
    };

    Ext4.onReady(init);
})();