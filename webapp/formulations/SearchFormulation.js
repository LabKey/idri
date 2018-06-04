/*
 * Copyright (c) 2011-2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
var _searchStatus = 'SearchStatusDiv';

function getPrefixes() {
    var prefixes = LABKEY.moduleContext.idri.FormulationPrefixes;
    if (prefixes) {
        return prefixes.split(',');
    }
    return [];
}

function resolveView(queryString)
{
    if (queryString.length) {
        if (/^IRM\-?\s*\d{1,4}\s*$/.test(queryString)) {
            return "RM";
        }
        else {
            var prefixes = getPrefixes();
            if (prefixes.length) {
                var expr = '(' + prefixes.join('|') + ')\\d{1,3}\\s*$';
                if (new RegExp(expr).test(queryString)) {
                    return "FORMULATION";
                }
            }
        }

        return "COMPOUND";
    }
    return "";
}

/* formatQueryString */
function formatQueryString(queryString, resolvedView)
{
    var newString = queryString;
    if (resolvedView === "RM") {
        /* Means it matched on ^IRM */
        newString = newString.replace(" ","");
        newString = newString.replace("-","");
        newString = newString.replace("IRM","IRM-");
        var buffer = "-0";
        while (newString.length < 8) {
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
    if (data.rowCount === 1 && resolvedView === "FORMULATION") {
        var row = data.rows[0];
        var runId = row["RowId"].toString();
        var topEl = document.getElementById('topDiv');
        topEl.style.display = "block";
        if (parseInt(row["RunProperties/ZAveMean"]) >= 0) {
            buildPSReports('5C', globalQueryConfig.srchstr);
            topEl.innerHTML = "<p style='float: left;'>[<a href=" + getSummaryViewURL(runId) + ">Stability report</a>]&nbsp</p>";
        }
        else
            topEl.innerHTML = "<span style='color:red;'>" + row["Name"] + " contains errors. No stability report available.</span>";
    }

    new LABKEY.QueryWebPart({
        renderTo: _searchStatus,
        title: 'Search Results',
        schemaName: globalQueryConfig.schemaName,
        queryName: globalQueryConfig.queryName,
        filters: globalQueryConfig.filterArray,
        buttonBarPosition: 'none'
    });
}

var globalQueryConfig = {};

function getRunIdIfUnique(searchElementId)
{
    var srchstr = document.getElementById(searchElementId).value.toUpperCase();

    var ss = Ext.get(_searchStatus);

    if (srchstr.length > 0)
    {
        if (ss)
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

        var filters = [LABKEY.Filter.create("Name",srchstr, LABKEY.Filter.Types.CONTAINS)];

        if (view === "RM") {
            globalQueryConfig.schemaName = 'exp';
            globalQueryConfig.queryName = 'Materials';
            globalQueryConfig.controller = 'experiment';
            globalQueryConfig.action = 'showMaterial';
            globalQueryConfig.filterArray = filters;
        }
        else if (view === "FORMULATION") {
            globalQueryConfig.schemaName = 'Samples';
            globalQueryConfig.queryName = 'Formulations';
            globalQueryConfig.controller = 'project';
            globalQueryConfig.action = 'begin';
            globalQueryConfig.filterArray = filters;
            globalQueryConfig.resolvedView = view;
            globalQueryConfig.params = { pageId: 'idri.LOT_SUMMARY' };
        }
        else if (view === "COMPOUND") {
            globalQueryConfig.schemaName = 'Samples';
            globalQueryConfig.queryName = 'Compounds';
            globalQueryConfig.controller = 'experiment';
            globalQueryConfig.action = 'showMaterial';
            globalQueryConfig.filterArray = filters;
            globalQueryConfig.resolvedView = view;
        }
        else {
            if (ss)
                ss.update("Search failed.");
            return false;
        }

        LABKEY.Query.selectRows({
            schemaName: globalQueryConfig.schemaName,
            queryName: globalQueryConfig.queryName,
            success: onSuccess,
            failure: onFailure,
            filterArray: globalQueryConfig.filterArray
        });
    }
    return false;
}

function onFailure(errorInfo, options, responseObj)
{
    if (errorInfo && errorInfo.exception)
        LABKEY.Utils.alert("Failure: " + errorInfo.exception);
    else
        LABKEY.Utils.alert("Failure: " + responseObj.statusText);
}

function onSuccess(data)
{
    if (data.rowCount === 0) {
        if (document.getElementById(_searchStatus))
            document.getElementById(_searchStatus).innerHTML = "Search failed. No matches found.";
        return false;
    }
    else if (data.rowCount > 1) {
        if (globalQueryConfig.resolvedView)
            showInSearchView(globalQueryConfig.resolvedView, data);
        else
            document.getElementById(_searchStatus).innerHTML = "Search failed.";
        return false;
    }

    var row = data.rows[0];
    var runId = row["RowId"].toString();

    // There is only one data result
    if (globalQueryConfig.resolvedView && globalQueryConfig.resolvedView === 'assay') {
        showInSearchView('assay', data);
        return false;
    }

    // Successfully moving to the requested page.
    window.location = getSummaryViewURL(runId);
}

function getSummaryViewURL(rowId)
{
    var params = { rowId: rowId };

    if (Ext.isObject(globalQueryConfig.params)) {
        Ext.iterate(globalQueryConfig.params, function(k, v) { params[k] = v; });
    }

    return LABKEY.ActionURL.buildURL(globalQueryConfig.controller, globalQueryConfig.action, null, params);
}

function buildPSReports(tempstr, name, machine, renderImage)
{
    var nameCont = (name ? name : LABKEY.ActionURL.getParameter('nameContains'));

    displayGraphic(nameCont, tempstr, machine, machine+"-image", renderImage);
}

// Specifically Displays the PS charts
function displayGraphic(name, temp, tool, imageElement, divElement)
{
    // Check if there is a cached image
    // Cannot use LABKEY.ActionURL.buildURL for _webdav URLs as it does not conform to new URL pattern
    // (e.g. controller-action.view)
    var _url = [
        LABKEY.contextPath,
        '/_webdav',
        LABKEY.ActionURL.getContainer(),
        '/%40files/PSData/',
        name, '_', tool, 'PS.png?', new Date().getTime()
    ].join('');

    LABKEY.Ajax.request({
        url: _url,
        success : function() {
            // cached image found
            var _img = new Image();
            _img.src = _url;
            document.getElementById(divElement).innerHTML = "<img src='' alt='ps image' id='" + imageElement + "' style='display: none;'/>";
            document.getElementById(imageElement).style.display = "inline";
            document.getElementById(imageElement).src = _img.src;
        },
        failure : function() {
            // cached image not found -- check if there are results for the given params
            LABKEY.Query.selectRows({
                schemaName: 'assay.particleSize.Particle Size',
                queryName: 'R_ReportSummary',
                maxRows: 1,
                parameters: {
                    'RunName': name,
                    'StoreTemp': temp,
                    'Tool': tool
                },
                success : function(data) {
                    if (data.rowCount > 0) {
                        document.getElementById(divElement).innerHTML = "<br/><span style='text-decoration: blink;'>Generating " + tool +" Report...   </span>";
                        new LABKEY.WebPart({
                            partName: 'Report',
                            renderTo: divElement,
                            frame: 'none',
                            partConfig: {
                                reportId:'module:idri/schemas/assay/Particle Size Data/Z-Ave Graph.r',
                                showSection: 'labkey' + tool + '_png',
                                nameContains: name,
                                exactName: name,
                                storageTemp: temp,
                                analysisTool: tool
                            }
                        }).render();
                    }
                    else {
                        document.getElementById(divElement).innerHTML = '';
                    }
                },
                failure : function() {
                    document.getElementById(divElement).innerHTML = '';
                }
            });
        }
    });
}
