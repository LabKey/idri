/*
 * Copyright (c) 2011-2012 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext.namespace("LABKEY.hemolysis");

LABKEY.hemolysis.HemolysisPanel = Ext.extend(Ext.Panel, {

    numRows : undefined,
    numCols : undefined,
    _donorMap : undefined,
    _tps    : undefined,
    _donors : undefined,
    _isNew  : false,
    
    initComponent : function()
    {
        Ext.applyIf(this, {
            border : false
        });

        this.html = "* If you are entering a new month timepoint except 'DM' just enter the number.";
        this.layout = "table";
        this.tableID = "hemolysis-table";

        this.initializeTable();
        var items = [];

        if (!this._isNew && this.graphTo)
            makeChart(this._tps, this._donors, this._donorMap, this.graphTo, this.formulation);
        
        this.layoutConfig = {
            columns : this.numCols,  // this gets initialized in initializeTable
            tableAttrs : {      
                id      : this.tableID,
                cellspacing : 0,
                cellpadding : 0
            }
        };

        // Set up the columns
        var currentDonor = 1;
        for (var col = 0; col < this.numCols; col++)
        {
            if (col == 0)
                items.push({html:"<b>Timepoints</b>", width: "80px", height: "80px", border: false});
            else if (col == 1)
                items.push({html:"<b>Properties</b>", width: "80px", height: "80px", border: false});
            else if (col == this.numCols-1)
            {
                items.push(new Ext.Button({name: row + '-' + col, text:'Add Donor', handler : this.addDonor, scope: this}));
            }
            else
            {
                items.push({
                    html: "<b>Donor " + this._donors[(currentDonor-1)] + "</b>",width: "80px", height: "80px", border: false
                });
                currentDonor = currentDonor + 1;
            }
        }

        // Set up the rows
        currentDonor = 1;
        for (var row = 0; row < this.numRows; row++)
        {
            for (var col = 0; col < this.numCols; col++)
            {
                if (col == 0)
                    items.push({name: row + '-' + col, html:"<b id='tp-" + row + "-val'>" + this._tps[row] + "</b>", border:false});
                else if (col == 1)
                    items.push({name: row + '-' + col, html : "<table id='" + this._tps[row] + "'>" +
                                                              "<tr><td class='donor-known'>Absorbance</td></tr>" +
                                                              "<tr><td class='donor-known'>Positive Control</td></tr>" +
                                                              "<tr><td class='donor-known'>% Positive Control</td></tr>" +
                                                              "<tr><td class='donor-known'>Acquisition Date</td></tr>" +
                                                              "</table>", border: false});
                else if (col == (this.numCols-1))
                    items.push({name: row + '-' + col, html:'&nbsp', border: false});
                else
                {
                    var info = this._donorMap[this._tps[row].toString()][this._donors[(currentDonor-1)]];
                    if (info != null)
                    {
                        items.push({name: row + '-' + col, html : "<table id=\"" + row + '-' + (col-1) + "\"ondblclick=\"helper(this.id);\">" +
                                                                  "<tr><td class='donor-known'>" + info["Absorbance"] + "</td></tr>" +
                                                                  "<tr><td class='donor-known'>" + info["PositiveControl"] + "</td></tr>" +
                                                                  "<tr><td class='donor-known'>" + info["PercentPositiveControl"] + "</td></tr>" +
                                                                  "<tr><td class='donor-known'>" + formatDate(info["AcquisitionDate"]) + "</td></tr>" +
                                                                  "</table>", border: false, scope : this});
                    }
                    else
                        items.push(new Ext.Button({
                            id: row + '-' + (col-1),
                            text: 'Add Information',
                            handler: function(button, event)
                            {
                                this.addDonorEdit(document.getElementById(button.id), false);
                            },
                            width : '134px',
                            scope: this}
                                ));
                    currentDonor = currentDonor + 1;
                }
            }
            currentDonor = 1;  // reset the donor list, moving to next row
        }

        items.push(new Ext.Button({text:'Add Timepoint', handler : this.addTimepoint, scope: this}));
        this.items = items;

        if (this.numRows == 0)
        {
            this.addListener("afterlayout", function() {
                this.addTimepoint();
            });
        }

        LABKEY.hemolysis.HemolysisPanel.superclass.initComponent.apply(this, arguments);
    },
    
    render : function()
    {
        LABKEY.hemolysis.HemolysisPanel.superclass.render.apply(this, arguments);

        if (!this._isNew)
            makeChart(this._tps, this._donors, this._donorMap, this.graphTo, this.formulation);
        else
            this._isNew = false;
    },

    initializeTable : function()
    {
        // This method initializes the Hemolysis Panel with/without Donor information
        if (this.donorInfo)
        {
            // Make sure we have rows
            if (this.donorInfo.length < 1)
                console.info("ERROR: You are passing empty donor info.");

            // Build a map of timepoints
            var tps = {};
            var uniqueTP = [];
            var uniqueDonors = [];
            var donorTP = null;
            var topDonor = 1;
            for (var i = 0; i < this.donorInfo.length; i++)
            {
                donorTP = this.donorInfo[i];
                if (donorTP["Timepoint"] && donorTP["Timepoint"] in tps)
                {
                    if (donorTP["DonorNumber"] in tps[donorTP["Timepoint"]])
                        alert("We have a duplicate!!!");
                    else
                        tps[donorTP["Timepoint"]][donorTP["DonorNumber"]] = donorTP;
                }
                else
                {
                    tps[donorTP["Timepoint"]] = {};
                    tps[donorTP["Timepoint"]][donorTP["DonorNumber"]] = donorTP;
                }

                var found = false;
                for (var j = 0; j < uniqueTP.length; j++)
                {
                    if (uniqueTP[j] == donorTP["Timepoint"])
                        found = true;
                }
                if (!found)
                    uniqueTP.push(donorTP["Timepoint"]);

                found = false;
                for (var k = 0; k < uniqueDonors.length; k++)
                {
                    if (uniqueDonors[k] == donorTP["DonorNumber"])
                        found = true;
                }
                if (!found)
                {
                    uniqueDonors.push(donorTP["DonorNumber"]);
                    if (donorTP["DonorNumber"] > topDonor)
                        topDonor = donorTP["DonorNumber"];
                }
            }

            uniqueDonors = [];
            for (var m = 1; m <= topDonor; m++)
                uniqueDonors.push(m);

            // variable init
            this._donorMap = tps;
            this._tps = uniqueTP;
            this.numRows = uniqueTP.length;
            this._donors = uniqueDonors;
            this.numCols = uniqueDonors.length + 3;
            this._tps.sort(this.DMSort);
        }
        else
        {
            // variable init -- new formulation
            this._donorMap = {};
            this._tps = [];
            this.numRows = 0;
            this._donors = [1];
            this.numCols = this._donors.length + 3;
            this._isNew = true;
        }
    },

    DMSort : function(a, b)
    {
        if (a === b)
            return 0;
        else if (a === "DM")
            return -1;
        else if (b === "DM")
            return 1;
        else
        {
            var a_s = a.split(" ")[0];
            var b_s = b.split(" ")[0];
            return (a.split(" ")[0] - b.split(" ")[0]);
        }
    },
    
    addDonor : function()
    {        
        // Add a column
        var tbl = document.getElementById(this.tableID);

        if (tbl != null)
        {
            // open loop for each row and append cell
            for (var i = 0; i < (tbl.rows.length-1); i++)
            {
                var cell = tbl.rows[i].insertCell(tbl.rows[i].cells.length-1);
                cell.id = "donor-" + (i-1) + "-" + (tbl.rows[i].cells.length-3);
                cell.className = "x-table-layout-cell";
                if (i == 0)
                {
                    new Ext.Panel({
                        renderTo : cell.id,
                        html: "<b>Donor " + (tbl.rows[i].cells.length-3) + "</b>",width: "134px", height: "80px", border: false
                    });
                }
                else
                {
                    // Insert a blank entry form for a donor
                    new LABKEY.hemolysis.Donor({
                        renderTo : cell.id,
                        newDonor : true,
                        formId   : cell.id
                    });
                }
            }

            // Update local stats
            this.numCols = this.numCols + 1;
        }
        else
            console.info(this.tableID + ' could not be found');
    },

    addDonorEdit : function(elem, isLookup)
    {
        var orgElem = elem;

        while(orgElem.nodeName != "TD")  // IE doesn't like localName
            orgElem = orgElem.parentNode;

        orgElem.innerHTML = "";
        
        var Donor = new LABKEY.hemolysis.Donor({
            renderTo : orgElem.id,
            formId   : elem.id,
            newDonor : true,
            border   : false,
            lookup   : isLookup
        });

        this.doLayout(false, true);
    },

    addTimepoint : function()
    {
        // Add a row
        var tbl = document.getElementById(this.tableID);

        if (tbl != null)
        {
            var insertRow = tbl.rows.length-1;
            var row = tbl.insertRow(insertRow);

            // Update local stats.
            this.numRows = this.numRows + 1;

            // Set up the rows
            var currentDonor = 1;
            var cell = null;
            for (var col = 0; col < this.numCols; col++)
            {
                cell = row.insertCell(col);
                if (col == 0)
                {
                    cell.id = "tp-" + (this.numRows-1);
                    var myform = new Ext.FormPanel({
                        renderTo : cell.id,
                        border : false,
                        defaults : {
                            border : false,
                            width: 80,
                            hideLabel : true
                        },
                        cellid : cell.id,
                        defaultType : 'textfield',
                        items : [
                            {
                                name : 'timepoint',
                                emptyText : 'Timepoint',
                                listeners : {
                                    blur : function()
                                    {
                                        var form = myform.getForm();
                                        if (form.isValid())
                                        {
                                            var tp = form.getFieldValues();
                                            if (tp["timepoint"].toUpperCase() != "DM")
                                                tp["timepoint"] = tp["timepoint"].replace(/\s/g,"") + " mo";
                                            else
                                                tp["timepoint"] = "DM";
                                            var elem = document.getElementById(myform.cellid);
                                            elem.innerHTML = "";
                                            new Ext.Panel({
                                                renderTo : myform.cellid,
                                                border: false,
                                                items : [{html:"<b id='tp-" + (this.numRows-1) + "-val'>" + tp["timepoint"] + "</b>", border:false}]
                                            });
                                        }
                                    },
                                    scope : this
                                },
                                validator : function(value)
                                {
                                    if (value.length < 1)
                                        return false;
                                    if (value.toUpperCase() == "DM")
                                        return true;
                                    if (/^\s*\d+\s*$/.test(value))
                                    {
                                        return true;
                                    }
                                    else
                                        return "Must be of the form (number)";
                                }
                            }
                        ],
                        keys : [
                            {
                                key : [Ext.EventObject.ENTER],
                                handler: function()
                                {
                                    var form = myform.getForm();
                                    if (form.isValid())
                                    {
                                        var tp = form.getFieldValues();
                                        // DM Case
                                        if (tp["timepoint"].toUpperCase() != "DM")
                                            tp["timepoint"] = tp["timepoint"].replace(/\s/g,"") + " mo";
                                        else
                                            tp["timepoint"] = "DM";
                                        var elem = document.getElementById(myform.cellid);
                                        elem.innerHTML = "";
                                        new Ext.Panel({
                                            renderTo : myform.cellid,
                                            border: false,
                                            items : [{html:"<b id='tp-" + (this.numRows-1) + "-val'>" + tp["timepoint"] + "</b>", border:false}]
                                        });
                                    }
                                },
                                scope : this
                            }
                        ],
                        scope: this
                    });
                }
                else if (col == 1)
                {
                    cell.id = 'prop-' + (this.numRows-1);
                    new Ext.Panel({
                        renderTo : cell.id,
                        border : false,
                        items : [
                            {
                                html : "<table>" +
                                   "<tr><td class='donor-known'>Absorbance</td></tr>" +
                                   "<tr><td class='donor-known'>Positive Control</td></tr>" +
                                   "<tr><td class='donor-known'>% Positive Control</td></tr>" +
                                   "<tr><td class='donor-known'>Acquisition Date</td></tr>" +
                                   "</table>",
                                border: false
                            }]
                    });
                }
                else if (col != (this.numCols-1))
                {
                    cell.id = 'donor-' + (this.numRows-1) + "-" + currentDonor;
                    new LABKEY.hemolysis.Donor({
                        renderTo : cell.id,
                        newDonor : true,
                        formId   : cell.id
                    });
                    currentDonor = currentDonor + 1;
                }
            }
        }
        else
            console.info(this.tableID + ' could not be found');
    },

    updatePoint : function(tp, donor, args)
    {
        if (this._donorMap[tp])
            this._donorMap[tp][donor] = args;
        else
        {
            this._donorMap[tp] = {};
            this._tps.push(tp);
            this._tps.sort(this.DMSort);
        }

        this._donorMap[tp][donor] = args;
        var found = false;
        for (var i = 0; i < this._donors.length; i++)
            if (this._donors[i] == donor)
                found = true;
        if (!found)
        {
            this._donors.push(donor);
            this._donors.sort();
        }
        makeChart(this._tps, this._donors, this._donorMap, this.graphTo, this.formulation);
    },

    getDonors : function()
    {
        return this._donors;
    },

    getTimepoints : function()
    {
        return this._tps;
    },
    
    getMap : function()
    {
        return this._donorMap;
    }
});

LABKEY.hemolysis.Donor = Ext.extend(Ext.Panel, {

    initComponent : function()
    {
        Ext.applyIf(this, {
            border : false
        });

        this.items = [];
        this.cellid = this.renderTo;

        this.lookups = [];
        for(var i = 0; i < 4; i++)
            this.lookups.push(undefined);

        // Lookup from previous post -- re-entry
        if (this.lookup)
        {
            var panel = Ext.getCmp('hemo-panel');
            var map = panel.getMap();
            var tps = panel.getTimepoints();
            var donors = panel.getDonors();
            var row = parseInt(this.formId.split('-')[0]);
            var col = parseInt(this.formId.split('-')[1])-1;
            
            this.lookups[0] = map[tps[row]][donors[col]]["Absorbance"];
            this.lookups[1] = map[tps[row]][donors[col]]["PositiveControl"];
            var date = formatDate(map[tps[row]][donors[col]]["AcquisitionDate"]);
            this.lookups[3] = date;
        }
        
        this.newForm = new Ext.FormPanel({
            id     : this.formId,
            border : false,
            defaultType : 'textfield',
            defaults : {
                width: 134,
                style: {
                    margin : "1 0 1 0"
                },
                hideLabel : true,
                allowBlank: false
            },
            items  : [
                {
                    xtype: 'numberfield',
                    name : 'Absorbance',
                    emptyText : 'Absorbance',
                    decimalPrecision : 3,
                    value : this.lookups[0]
                },
                {
                    xtype: 'numberfield',
                    name : 'PositiveControl',
                    emptyText: 'Positive Control',
                    decimalPrecision : 3,
                    value : this.lookups[1]
                },{
                    xtype: 'numberfield',
                    readOnly : true,
                    name : 'PercentPositiveControl',
                    emptyText : 'Calculated',
                    allowBlank: true
                },{
                    xtype : 'datefield',
                    name : 'AcquisitionDate',
                    emptyText : 'Acquisition Date',
                    value : this.lookups[3]
                },{
                    xtype : 'button',
                    text : 'Done',
                    handler : function(){
                        var form = this.newForm.getForm();
                        if (form.isValid())
                        {
                            var run = this.ensureRun();

                            var displayRow = this.cellid.split('-');

                            var donorNum = -1;
                            var tpEl = document.getElementById("tp-" + displayRow[1] + "-val");
                            if (tpEl == null)
                            {
                                displayRow = this.formId.split('-');
                                tpEl = document.getElementById("tp-" + displayRow[0] + "-val");
                                if (tpEl == null)
                                {
                                    alert("Please enter a timepoint value for this row.");
                                    return;
                                }
                                else
                                    donorNum = (parseInt(displayRow[1]));
                            }
                            else
                                donorNum = parseInt(displayRow[2]);

                            var timepoint = tpEl.innerHTML;

                            var formFields = form.getValues();
                            var newRow = {};

                            // Get the associated timepoint
                            newRow["Absorbance"] = parseFloat(formFields["Absorbance"]);
                            newRow["PositiveControl"] = parseFloat(formFields["PositiveControl"]);
                            newRow["AcquisitionDate"] = formFields["AcquisitionDate"];

                            if (donorNum < 0)
                            {
                                alert("There is an error recording donor number.");
                                return;
                            }
                            newRow["DonorNumber"] = donorNum;
                            newRow["PercentPositiveControl"] = (newRow["Absorbance"] / newRow["PositiveControl"]); // calculated
                            newRow["PercentPositiveControl"] = parseFloat(newRow["PercentPositiveControl"].toPrecision(5)) * 100.00;
                            newRow["PercentPositiveControl"] = parseFloat(newRow["PercentPositiveControl"].toPrecision(5));
                            newRow["Timepoint"] = timepoint;

                            function success(cellid, formId, newRow)
                            {
                                var panel = Ext.getCmp('hemo-panel');
                                panel.updatePoint(newRow['Timepoint'], newRow['DonorNumber'], newRow);
                                
                                var elem = document.getElementById(cellid);
                                elem.innerHTML = "";
                                var row = formId.split('-')[0];
                                var col = formId.split('-')[1];
                                
                                new Ext.Panel({
                                    renderTo : cellid,
                                    border : false,
                                    items : [
                                        {
                                            html : "<table  id=\"" + row + '-' + col + "\"ondblclick=\"helper(this.id);\">" +
                                                   "<tr><td class='donor-known'>" + newRow['Absorbance'] + "</td></tr>" +
                                                   "<tr><td class='donor-known'>" + newRow['PositiveControl'] + "</td></tr>" +
                                                   "<tr><td class='donor-known'>" + newRow['PercentPositiveControl'] + "</td></tr>" +
                                                   "<tr><td class='donor-known'>" + newRow['AcquisitionDate'] + "</td></tr>" +
                                                   "</table>",
                                            border: false
                                        }]
                                });
                            }

                            // Check if this is a new lot
                            if (run.properties["LotNumber"] === undefined)
                            {
                                var LotNumber = Ext.get("LotNumber_field").getValue();
                                run.name = LotNumber;

                                // Find the RowID for the associated Formulation
                                LABKEY.Query.selectRows({
                                    schemaName : 'Samples',
                                    queryName  : 'Formulations',
                                    filterArray: [ LABKEY.Filter.create("Name",LotNumber,LABKEY.Filter.Types.EQUAL) ],
                                    columns    : ["RowId"],
                                    successCallback : function(data)
                                    {
                                        run.properties["LotNumber"] = data.rows[0].RowId.toString();
                                        run.dataRows.push(newRow);
                                        LABKEY.page.batch.runs[0] = run;
                                        this.saveBatch(success, [this.cellid, this.formId, newRow]);
                                    },
                                    errorCallback : function(errorInfo, options, responseObj)
                                    {
                                        if(errorInfo && errorInfo.exception)
                                            alert("Failure: " + errorInfo.exception);
                                        else
                                            alert("Failure: " + responseObj.statusText);
                                    },
                                    scope : this
                                });
                            }
                            else
                            {
                                for (var j = 0; j < run.dataRows.length; j++)
                                {
                                    if (run.dataRows[j]["Timepoint"] == newRow["Timepoint"] &&
                                        run.dataRows[j]["DonorNumber"] == newRow["DonorNumber"])
                                        delete run.dataRows[j];
                                }
                                run.dataRows.push(newRow);
                                LABKEY.page.batch.runs[0] = run;
                                this.saveBatch(success, [this.cellid, this.formId, newRow]);
                            }
                        }
                    },
                    scope : this
                }
            ]
        });

        this.items.push(this.newForm);

        LABKEY.hemolysis.Donor.superclass.initComponent.apply(this, arguments);
    },

    render : function()
    {
        LABKEY.hemolysis.Donor.superclass.render.apply(this, arguments);
    },

    ensureRun : function() {
        var batch = LABKEY.page.batch;
        if (!batch.runs || batch.runs.length == 0)
            batch.runs = [ new LABKEY.Exp.Run() ];
        var run = batch.runs[0];

        if (!run.properties)
            run.properties = {};

        if (!run.dataRows)
            run.dataRows = [];
        return run;
    },

    saveBatch : function(onSuccess, args) {
        LABKEY.Experiment.saveBatch({
            assayId : LABKEY.page.assay.id,
            batch : LABKEY.page.batch,
            successCallback : function (batch, response) {
                console.info("Saved successfully.");
                LABKEY.page.batch = batch;
                if (onSuccess)
                    onSuccess(args[0], args[1], args[2]);
            },
            failureCallback : function (errorInfo, options, response) {
                var msg = errorInfo.exception;
                Ext.Msg.hide();
                Ext.Msg.alert("Error saving: " + msg);
            }
        });
    }
});

function helper(val)
{
    var elem = document.getElementById(val);
    var panel = Ext.getCmp('hemo-panel');
    panel.addDonorEdit(elem, true);
}

function formatDate(DBDate)
{
    if (DBDate.match(/\//g) && DBDate.match(/\//g).length > 0)
        return DBDate;
    
    var split = DBDate.split(/\s/g);
    var day = split[0];
    var month = "";
    var months = [null, "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (var i = 0; i < months.length; i++)
    {
        if (split[1] == months[i])
            month = i;
    }
    if (month.length < 2)
        console.info("Failed to find appropriate month.");
    var year = split[2];
    return month + "/" + day +"/" + year;
}

function makeChart(tps, donors, donorMap, imgElemID, formulation)
{
    if(tps.length < 2 && donors.length < 2)
        return;
    
    function compileSrc(prefix, args)
    {
        var src = prefix;
        first = true;
        for (arg in args)
        {
            if (first)
            {
                src += arg + "=" + args[arg];
                first = false;
            }
            else
                src += "&" + arg + "=" + args[arg];
        }
        return src;
    }

    var formulationName = formulation;
    var colors = ["C2BDDD","990056","3333FF","009933","FF9933"];
    var chxl = "0:";
    var chd  = "t:";
    var chdl = "";
    var chco = "";
    var chtt = formulationName + "+Hemolysis";
    var firstDonor = true;
    var xmax = 0;

    // Setup timepoints
    for (var m = 0; m < tps.length; m++)
        chxl += "|" + tps[m];
    
    // For each donor
    for (var k = 0; k <= (donors.length-1); k++)
    {
        if (firstDonor)
        {
            chdl += "Donor+" + donors[k];
            chco += colors[k];
            firstDonor = false;
        }
        else
        {
            chdl += "|Donor+" + donors[k];
            chco += "," + colors[k];
            chd += "|";
        }

        for (var j = 0; j < tps.length; j++)
        {
            var val = donorMap[tps[j]][donors[k]];
            if (val != null)
            {
                if (parseFloat(val["PercentPositiveControl"]) > xmax)
                    xmax = parseFloat(val["PercentPositiveControl"]);

                chd += val["PercentPositiveControl"];
            }
            else
                chd += "0";

            if(j != (tps.length-1))
                    chd += ",";
        }
    }

    var url_prefix = "http://chart.apis.google.com/chart?";
    var args = {};
    args["chxt"] = "x";
    args["cht"]  = "bvg";
    args["chxl"] = chxl;  //"0:|9 mo|10 mo|12 mo";
    args["chs"]  = "500x250";
    args["chco"] = chco;
    args["chds"] = "0.0," + xmax; //"0,104.33";
    args["chd"]  = chd;  //"t:97.64,104.33,86.62|0,103.71,91.98|20,20,20";
    args["chdl"] = chdl; // "Donor+1|Donor+2|Donor+n";
    args["chtt"] = chtt;

    var _width = 500;
    var _height= 250;
    var _alt   = formulationName + " Hemolysis";

    var img = new Image();
    img.src = compileSrc(url_prefix, args);
    img.width = _width;
    img.height = _height;
    img.alt = _alt;

    var _img    = document.getElementById(imgElemID);
    _img.src    = img.src;
    _img.width  = img.width;
    _img.height = img.height;
    _img.alt    = img.alt;
    _img.style.display = "inline";
}
