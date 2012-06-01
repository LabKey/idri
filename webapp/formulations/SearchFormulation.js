/*
 * Copyright (c) 2011-2012 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

var _searchStatus = 'SearchStatusDiv';

function resolveView(queryString)
{
    if(queryString.length > 0)
    {
        if(/^IRM\-?\s*\d{1,4}\s*$/.test(queryString))
        {
            return "RM";
        }
        else if(/(TD|QF)\d{1,3}\s*$/.test(queryString))
        {
            return "FORMULATION";
        }
        else{
            return "COMPOUND";
        }
    }
    return "";
}

/* formatQueryString */
function formatQueryString(queryString, resolvedView)
{
    var newString = queryString;
    if(resolvedView == "RM")
    {
        /* Means it matched on ^IRM */
        newString = newString.replace(" ","");
        newString = newString.replace("-","");
        newString = newString.replace("IRM","IRM-");
        var buffer = "-0";
        while(newString.length < 8)
        {
            newString = newString.replace(/\-[0]*/, buffer);
            buffer += "0";
        }
    }
    return newString;
}

function showInSearchView(resolvedView, data)
{
    document.getElementById(_searchStatus).innerHTML = "";

    // This is what is displayed when a Formulation search is performed.
    if(data.rowCount == 1 && resolvedView == "FORMULATION")
    {
        var row = data.rows[0];
        var runId = row["RowId"].toString();
        document.getElementById('topDiv').style.display = "block";
        if (parseInt(row["RunProperties/ZAveMean"]) >= 0)
        {
            var stability_url = getSummaryViewURL(runId);
            buildPSReports('5C', globalQueryConfig.srchstr);
            document.getElementById('topDiv').innerHTML = "<p style='float: left;'>[<a href=" + stability_url + ">Stability report</a>]&nbsp</p>";
        }
        else
            document.getElementById('topDiv').innerHTML = "<span style='color:red;'>" + row["Name"] + " contains errors. No stability report available.</span>";

        var hemoDiv = document.getElementById('hemoSearch');
        if (hemoDiv)
            buildHemoReport(hemoDiv);
    }

    var qwp = new LABKEY.QueryWebPart({
        renderTo   : _searchStatus,
        title      : 'Search Results',
        schemaName : globalQueryConfig.schemaName,
        queryName  : globalQueryConfig.queryName,
        filters    : globalQueryConfig.filterArray,
        buttonBarPosition: 'none'
    });
}

var globalQueryConfig = {};

function getRunIdIfUnique(srchstr, assayName)
{
    var ss = Ext.get(_searchStatus);

    if (srchstr.length > 0)
    {
        if(ss)
            ss.update('Searching...');

        /* Establish what view we want based on the search string */
        var view = resolveView(srchstr.replace(" ","").toUpperCase());

        /* Reformat the search string to find results in the database. */
        srchstr = formatQueryString(srchstr, view);
        globalQueryConfig.srchstr = srchstr;
        globalQueryConfig.resolvedView = "";

        document.getElementById('errorDiv').style.display      = "none";
        document.getElementById('topDiv').style.display        = "none";
        document.getElementById('dataRegionDiv').style.display = "none";
        document.getElementById('resultsDiv').style.display    = "none";

        if(view == "RM")
        {
            globalQueryConfig.schemaName = 'exp';
            globalQueryConfig.queryName = 'Materials';
            globalQueryConfig.controller = 'experiment';
            globalQueryConfig.action = 'showMaterial';
            globalQueryConfig.filterArray = [ LABKEY.Filter.create("Name",srchstr, LABKEY.Filter.Types.CONTAINS)];
        }
        else if(view == "FORMULATION")
        {
            globalQueryConfig.schemaName = 'Samples';
            globalQueryConfig.queryName = 'Formulations';
            globalQueryConfig.controller = 'idri';
            globalQueryConfig.action = 'formulationDetails';
            globalQueryConfig.filterArray = [ LABKEY.Filter.create("Name",srchstr, LABKEY.Filter.Types.CONTAINS)];
            globalQueryConfig.resolvedView = view;
        }
        else if(view == "COMPOUND")
        {
            globalQueryConfig.schemaName = 'Samples';
            globalQueryConfig.queryName = 'Compounds';
            globalQueryConfig.controller = 'experiment';
            globalQueryConfig.action = 'showMaterial';
            globalQueryConfig.filterArray = [ LABKEY.Filter.create("Name",srchstr, LABKEY.Filter.Types.CONTAINS)];
            globalQueryConfig.resolvedView = view;
        }
        else
        {
            if(ss)
                ss.update("Search failed.");
            return false;
        }

        LABKEY.Query.selectRows(
        {
            schemaName      : globalQueryConfig.schemaName,
            queryName       : globalQueryConfig.queryName,
            successCallback : onSuccess,
            errorCallback   : onFailure,
            filterArray     : globalQueryConfig.filterArray
        });
    }
    return false;
}

function onFailure(errorInfo, options, responseObj)
{
    if(errorInfo && errorInfo.exception)
        alert("Failure: " + errorInfo.exception);
    else
        alert("Failure: " + responseObj.statusText);
}

function onSuccess(data)
{
    if(data.rowCount == 0)
    {
        if(document.getElementById(_searchStatus))
            document.getElementById(_searchStatus).innerHTML = "Search failed. No matches found.";
        return false;
    }
    else if(data.rowCount > 1)
    {
        if(globalQueryConfig.resolvedView)
            showInSearchView(globalQueryConfig.resolvedView, data);
        else
            document.getElementById(_searchStatus).innerHTML = "Search failed.";
        return false;
    }

    var row = data.rows[0];
    var runId = row["RowId"].toString();

    // There is only one data result
    if(globalQueryConfig.resolvedView)
    {
        if(globalQueryConfig.resolvedView == "assay")
        {
            showInSearchView("assay", data);
            return false;
        }
    }

    // Successfully moving to the requested page.
    window.location = getSummaryViewURL(runId);
}

function getSummaryViewURL(rowId)
{
    var params = {};
    params['rowId'] = rowId;

    var searchString = document.getElementById('IdriSearchStr');
    if (searchString != undefined)
        params['nameContains'] = searchString.value;

    return LABKEY.ActionURL.buildURL(globalQueryConfig.controller, globalQueryConfig.action, LABKEY.ActionURL.getContainer() ,params);
}

var reportObjects = {};

function registerReportObject(name, newObject)
{
    reportObjects[name] = newObject;
}

function getReportObject(name)
{
    if(reportObjects[name])
        return reportObjects[name];
    return null;
}

function showValues(reportStore,reportRecords,opts)
{
    alert(reportRecords.length);
    for(i=0;i<reportRecords.length;i++)
    {
        alert(reportRecords[i].get("RowId") + " " + reportRecords[i].get("StorageTemperature"));
    }
}

function buildPSReports(tempstr, name, machine, renderto, renderimg)
{
    /* Clear out what is currently in the div */
    if (renderto) {
        if(reportObjects[renderto])
            getReportObject(renderto).destroy();
    }

    // Configuration for Ext.Grid
    var config = {};
    config.schemaName = 'assay';
    config.queryName = 'ReportSummary';

    var nameCont = "";
    if(name)
        nameCont = name;
    else
        nameCont = LABKEY.ActionURL.getParameter('nameContains');

    var dataRegionDivObj = null;

    mystore = new LABKEY.ext.Store({
        schemaName: config.schemaName,
        queryName: config.queryName,
        filterArray: [ LABKEY.Filter.create('Name', nameCont, LABKEY.Filter.Types.CONTAINS),
            LABKEY.Filter.create('StorageTemperature',tempstr,LABKEY.Filter.Types.EQUAL),
            LABKEY.Filter.create('AnalysisTool', machine, LABKEY.Filter.Types.EQUAL)
        ]
    });

    if (renderto) {
        dataRegionDivObj = new LABKEY.ext.EditorGridPanel({
            store: mystore,
            renderTo: renderto,
            autoHeight: true,
            width: 1000,
            title: 'Summary ',
            editable: false,
            lookups: false,
            enableFilters: false,
            header: false,
            fbar: [],
            bbar: [],
            tbar: [],
            footer: true
        });

        registerReportObject(renderto,dataRegionDivObj);
    }

    displayGraphic(nameCont, tempstr, machine, machine+"-image", renderimg);
}

// Specifically Displays the PS charts
function displayGraphic(name, temp, tool, imageElement, divElement)
{
    var filters = [];
    filters.push(LABKEY.Filter.create("name", name, LABKEY.Filter.Types.CONTAINS));
    filters.push(LABKEY.Filter.create("StorageTemperature", temp, LABKEY.Filter.Types.EQUAL));
    filters.push(LABKEY.Filter.create("AnalysisTool", tool, LABKEY.Filter.Types.EQUAL));

    /* First check to make sure there are results for the given params */
    LABKEY.Query.selectRows({
        schemaName     : 'assay',
        queryName      : 'R_ReportSummary',
        filterArray    : filters,
        successCallback: function(data) {
            if (data.rowCount > 0)
            {
                /* Check if there is a cached image */
                var date = new Date(); // bypass browser cache
                var _url = LABKEY.ActionURL.buildURL("_webdav", "%40files/PSData/" + name + "_" + tool  + "PS.png?" + date.getTime());
                Ext.Ajax.request({
                    url : _url,
                    method : 'GET',
                    success : function(result, response)
                    {
                        var _img = new Image();
                        _img.src = _url;
                        document.getElementById(divElement).innerHTML = "<img src='' alt='ps image' id='" + imageElement + "' style='display: none;'/>";
                        document.getElementById(imageElement).style.display = "inline";
                        document.getElementById(imageElement).src = _img.src;
                    },
                    failure : function(result, response)
                    {
                        document.getElementById(divElement).innerHTML = "<br/><span style='text-decoration: blink;'>Generating " + tool +" Report...   </span>";
                        var wp = new LABKEY.WebPart({
                            partName: 'Report',
                            renderTo: divElement,
                            frame   : 'none',
                            partConfig : {
                                reportId      :'module:idri/schemas/assay/Particle Size Data/Z-Ave Graph.r',
                                showSection   :'labkey' + tool + '_png',
                                'nameContains': name,
                                'storageTemp' : temp,
                                'analysisTool': tool
                            }
                        });
                        wp.render();
                    }
                });
            }
            else
            {
                document.getElementById(divElement).innerHTML = "";
            }
        },
        errorCallback  : function() {
            document.getElementById(divElement).innerHTML = "";
        }
    });
}

function buildHPLCReports(tempStr)
{
    if(reportObjects['dataRegionDiv2Obj'])
    {
        getReportObject('dataRegionDiv2Obj').destroy();
    }

    // Configuration for Ext.Grid2
    var config2 = {};
    config2.schemaName = 'assay';
    config2.queryName = 'HPLCReportSummary';
    var nameCont2 = LABKEY.ActionURL.getParameter('nameContains');

    var dataRegionDiv2Obj = null;

    Ext.onReady(function()
    {
        nextstore = new LABKEY.ext.Store({
            schemaName: config2.schemaName,
            queryName: config2.queryName,
            filterArray: [    LABKEY.Filter.create('Name', nameCont2, LABKEY.Filter.Types.CONTAINS)]
        });

        nextstore.on('load',validateHPLCReport);

        // The concentrations EditorGridPanel is defined here. See the 'HPLCReportSummary' query
        // for the structure of the data.
        dataRegionDiv2Obj = new LABKEY.ext.EditorGridPanel({
            store: nextstore,
            renderTo: 'dataRegionDiv2',
            width: 1000,
            title: 'Concentrations ',
            autoHeight: true,
            editable: false,
            lookups: false,
            enableFilters: false,
            header: false,
            fbar: [],
            bbar: [],
            tbar: [],
            footer: true
        });

        registerReportObject('dataRegionDiv2Obj',dataRegionDiv2Obj);

        // This is filtered using the URL -- need to change how it is searched.
        var concentrationWebPartRenderer = new LABKEY.WebPart({
            partName: 'Report',
            renderTo: 'concentrationDiv',
            frame: 'none',
            partConfig: {
                reportId:'module:idri/schemas/assay/HPLC Data/Concentration Graph.r',
                showSection:'labkey2_png'
            }});

        concentrationWebPartRenderer.render();
    });
}

function validatePSReport(reportStore,reportRecords,opts)
{
    if(reportRecords.length > 0)
    {
        document.getElementById("dataRegionDiv").style.display = "inline";
        document.getElementById("resultsDiv").style.display = "inline";
    }
    else
    {
        document.getElementById('errorDiv').innerHTML += "<br/><span style='color:red;'>WARNING: No Particle Size Data Present for current temperature of " + LABKEY.ActionURL.getParameter('nameContains') + "</span>";
        document.getElementById("dataRegionDiv").style.display = "none";
        document.getElementById("resultsDiv").style.display = "none";
    }
}

function validateHPLCReport(reportStore,reportRecords,opts)
{
    if(reportRecords.length > 0)
    {
        document.getElementById("dataRegionDiv2").style.display = "inline";
        document.getElementById("concentrationDiv").style.display = "inline";
    }
    else
    {
        document.getElementById('errorDiv').innerHTML += "<br/><span style='color:red;'>WARNING: No HPLC Data Present for current temperature of " + LABKEY.ActionURL.getParameter('nameContains') + "</span>";
        document.getElementById("dataRegionDiv2").style.display = "none";
        document.getElementById("concentrationDiv").style.display = "none";
    }
}

function buildHemoReport(element)
{
    var caps = globalQueryConfig.srchstr.toUpperCase();
    
    LABKEY.Query.selectRows({
        schemaName : 'assay',
        queryName  : 'AssayList',
        filterArray: [ LABKEY.Filter.create("Type", "Hemolysis", LABKEY.Filter.Types.CONTAINS) ],
        columns : ["Name", "RowId"],
        successCallback : function(data, ops, response)
        {
            if (data.rows && data.rows.length == 1)
            {
                var existingAssayId = data.rows[0]["RowId"];
                LABKEY.Query.selectRows({
                    schemaName : 'assay',
                    queryName  : data.rows[0]["Name"] + ' Runs',
                    filterArray: [ LABKEY.Filter.create("Name", caps) ],
                    columns    : ["Batch/RowId"],
                    successCallback : function(data, ops, response)
                    {
                        if (data.rows && data.rows.length > 0)
                        {
                            var existingBatchId = data.rows[0]["Batch/RowId"];
                            LABKEY.page = {};
                            LABKEY.page.assay = {};
                            LABKEY.page.assay.id = existingAssayId;
                            LABKEY.Experiment.loadBatch({
                                assayId : existingAssayId,
                                batchId : existingBatchId,
                                successCallback : function(batch, response)
                                {
                                    LABKEY.page = {};
                                    LABKEY.page.batch = batch;
                                    hemoRender(element, existingAssayId, caps, false);
                                },
                                errorCallback : function(response)
                                {
                                    console.info("Something weird happened.");
                                }
                            });
                        }
                        else
                        {
                            console.info("This is a new batch. No hemo data.");
                            LABKEY.page = {};
                            LABKEY.page.batch = {};
                            hemoRender(element, existingAssayId, caps, true);
                        }
                    },
                    failureCallback : function(error, ops, response)
                    {
                        console.info("Actually failed");
                    }
                });
            }
            else
                alert("More or less than 1 hemolysis assay found.");
        }
    });
}

function hemoRender(element, assayId, lot, isNew)
{
    var params = {};
    params["rowId"] = assayId;
    params["Lot"]   = lot;
    var hemo_url = LABKEY.ActionURL.buildURL("assay", "moduleAssayUpload",
            LABKEY.ActionURL.getContainer(), params);

    if (!isNew)
    {
        new LABKEY.hemolysis.HemolysisPanel({
            graphTo  : 'hemoImage',
            id       : 'hemo-panel',
            frame    : false,
            formulation : lot,
            donorInfo: LABKEY.page.batch.runs[0].dataRows
        });
        document.getElementById('topDiv').innerHTML += "<p style='float: left;'>[<a href=" + hemo_url +">View Hemolysis Data</a>]</p><br/>";
    }
    else
        document.getElementById('topDiv').innerHTML += "<p style='float: left;'>[<a href=" + hemo_url +">Enter Hemolysis Data</a>]</p><br/>";
}