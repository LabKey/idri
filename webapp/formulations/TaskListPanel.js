/*
 * Copyright (c) 2015 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('LABKEY.idri.TaskListPanel', {

    extend: 'Ext.panel.Panel',

    alias: 'widget.idri-tasklistpanel',

    buttonAlign: 'left',

    width: 900,

    initComponent : function() {
        this.getTaskStore();

        this.taskPanel = this.getGridItems();

        this.items = [this.taskPanel];

        this.callParent();
    },

    getGridItems : function() {
        return Ext4.create('Ext.grid.Panel', {
            store: this.getTaskStore(),
            columns: this.storeColumns(),
            frame: false,
            border: false,
            height: 500,
            width: 900,
            tbar: [{
                text: 'Save Changes',
                tooltip: 'Click to save all changes to the database',
                id: 'save-button',
                handler: this.saveChanges,
                scope: this
            },'-',{
                text: 'Export',
                tooltip: 'Click to Export the data to Excel',
                id: 'export-records-button',
                handler: function() {
                    this.exportExcel();
                },
                scope: this
            },'-',{
                text: 'Refresh',
                tooltip: 'Click to refresh the table',
                id: 'refresh-button',
                handler: this.onRefresh,
                scope: this
            },'-',{
                xtype: 'checkbox',
                boxLabel: 'Include Overdue Tasks',
                id: 'oldTasks',
                name: 'oldTasks',
                listeners: {
                    change: function() {
                        this.getTasks();
                    },
                    scope: this
                }
            },'-',{
                xtype : 'datefield',
                id : 'taskDate',
                value: new Date(),
                listeners: {
                    change: function() {
                        this.getTasks();
                    },
                    scope : this
                }
            }],
            bbar: Ext4.create('Ext.PagingToolbar',{
                pageSize: this.pageSize, //default is 20
                store: this.taskStore,
                displayInfo: true,
                emptyMsg: "No data to display"
            }),
            selModel: {
                selType: 'cellmodel'
            },
            plugins: [Ext4.create('Ext.grid.plugin.CellEditing', { clicksToEdit: 2 })]
        });
    },

    exportExcel : function() {
      this.taskPanel.downloadExcelXml([],'Task List');
    },

    getTaskStore : function() {
        if (!this.taskStore) {
            var week = this.getWeek();

            this.taskStore = new LABKEY.ext4.Store({
                schemaName: 'lists',
                queryName: 'TaskList',
                groupField: 'cat',
                groupDir: 'ASC',
                sorters: [{
                    property: 'temperature',
                    direction: 'ASC'
                },{
                    property: 'lotNum/Name',
                    direction: 'ASC'
                }],
                columns : [ 'lotNum/Name', '*' /* The rest of the columns */],
                filters:  function(rec) {
                    if (rec.get('date') >= week[0] && rec.get('date') <= week[1]) {
                        return true;
                    }
                }
            });

            this.taskStore.load();
        }

        return this.taskStore;
    },

    storeColumns : function() {
        return [
            { text: 'Category',  dataIndex: 'cat', width: 70, editable: false },
            {
                text: 'Lot',
                dataIndex: 'lotNum',
                width: 60,
                editable: false,
                renderer: function(lotNum, metadata, rec) {
                    var url = LABKEY.ActionURL.buildURL('project', 'begin.view', null, {
                        rowId: lotNum,
                        pageId: 'idri.LOT_SUMMARY'
                    });
                    return '<a href="' + url + '" target="_blank">' + Ext4.htmlEncode(rec.get('lotNum/Name')) + '</a>';
                }
            },
            {
                text: 'Temp',
                dataIndex: 'temperature',
                width: 55,
                editable: false
            },
            { text: 'Timepoint',  dataIndex: 'timepoint', width: 80, editable: false },
            { text: 'Date Due',  dataIndex: 'date', renderer: Ext4.util.Format.dateRenderer('m/d/y'),width: 90, editable: false },
            { text: 'Type',  dataIndex: 'type', width: 90, editable: false },
            { text: 'Adjuvant',  dataIndex: 'adjuvant', width: 100, editable: false },
            {
                text: 'Comment',
                header: 'Comment',
                dataIndex: 'comment',
                editable: true,
                width: 200,
                field: {
                    type: 'textfield'
                }
            },{
                xtype: 'checkcolumn',
                header: 'Complete',
                dataIndex: 'complete',
                width: 80
            },{
                xtype: 'checkcolumn',
                header: 'Fail',
                dataIndex: 'failed',
                listeners: {
                    checkchange : function(column, recordIndex, checked, item) {
                        if (checked == true) {
                            this.getMessage(recordIndex);
                        }
                    },
                    scope:this
                },
                width: 50
            }
        ];
    },

    getTasks : function() {
        var date = Ext4.getCmp('taskDate').getValue();
        var week = this.getWeek(date);
        this.taskStore.filters.clear();

        if (Ext4.getCmp('oldTasks').getValue()) {
            this.taskStore.filter(function(rec) {
                if ((rec.get('date') >= week[0] && rec.get('date') <= week[1]) ||  (rec.get('date') < week[0] && !rec.get('complete') && !rec.get('failed'))) {
                    return true;
                }
            });
        }
        else {
            this.taskStore.filter(function(rec) {
                if (rec.get('date') >= week[0] && rec.get('date') <= week[1]) {
                    return true;
                }
            });
        }

        this.onRefresh();
    },

    getWeek : function(date) {
        // If no date object supplied, use current date
        // Copy date so don't modify supplied date
        var now = date ? new Date(date) : new Date();

        // set time to some convenient value
        now.setHours(0,0,0,0);

        // Get the previous Monday
        var monday = new Date(now);
        monday.setDate(monday.getDate() - monday.getDay() + 1);

        // Get next Sunday
        var sunday = new Date(now);
        sunday.setDate(sunday.getDate() - sunday.getDay() + 7);

        // Return array of date objects
        return [monday, sunday];
    },

    saveChanges : function() {

        this.taskStore.commitChanges();
        var updatedRecords = this.taskStore.getModifiedRecords();
        var deleteRecord =  [];
        Ext4.each(updatedRecords, function(record) {
            if (record.get('failed') == true) {
                this.taskStore.clearFilter(true);
                if (record.get('cat') == 'nano' || record.get('cat') == 'aps') {
                    this.taskStore.each(function(rec) {
                        if (rec.get('cat') == record.get('cat') &&
                            rec.get('lotNum') == record.get('lotNum') &&
                            rec.get('temperature') == record.get('temperature') &&
                            rec.get('date') > record.get('date')) {
                            deleteRecord.push(rec);
                        }
                    });
                }
                else if (record.get('cat') == 'HPLC' || record.get('cat') == 'UV') {
                    this.taskStore.each(function(rec) {
                        if (rec.get('cat') == record.get('cat') &&
                            rec.get('lotNum') == record.get('lotNum') &&
                            rec.get('date') > record.get('date')) {
                            deleteRecord.push(rec);
                        }
                    });
                }
            }
        }, this);

        if (Ext4.isEmpty(deleteRecord)) {
            this.getTasks();
        }
        else {
            this.taskStore.remove(deleteRecord);
            this.taskStore.sync({
                success: function() {
                    this.getTasks();
                },
                scope: this
            });
        }
    },

    onRefresh : function() {
        this.taskStore.reload();
    },

    getMessage : function(recordIndex) {

        var record = this.taskPanel.getView().getRecord(this.taskPanel.getView().getNode(recordIndex));

        if (record.get('cat') == 'nano' || record.get('cat') == 'aps') {
            Ext4.Msg.show({
                title: 'Delete Future Tasks?',
                msg: 'Once you click "Save Changes" all future timepoints at Temperature ' + record.get('temperature') + 'C for ' + record.get('lotNum/Name') + ' will be removed!',
                buttons: Ext4.Msg.OK,
                scope: this
            });
        }
        else {
            Ext4.Msg.show({
                title: 'Delete Future Tasks?',
                msg: 'Once you click "Save Changes" all future timepoints for ' + record.get('lotNum/Name') + ' will be removed!',
                buttons: Ext4.Msg.OK,
                scope: this
            });
        }
    }
});

var Base64 = (function() {
    // Private property
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    // Private method for UTF-8 encoding

    function utf8Encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }

    // Public method for encoding
    return {
        encode: (typeof btoa == 'function') ? function(input) {
            return btoa(utf8Encode(input));
        } : function(input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            input = utf8Encode(input);
            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output = output +
                keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                keyStr.charAt(enc3) + keyStr.charAt(enc4);
            }
            return output;
        }
    };
})();

Ext4.define('MyApp.view.override.Grid', {
    override: 'Ext4.grid.GridPanel',
    requires: 'Ext4.form.action.StandardSubmit',

    /*
     Kick off process
     */

    downloadExcelXml: function(includeHidden, title) {

        if (!title) title = this.title;

        var vExportContent = this.getExcelXml(includeHidden, title);

        var location = 'data:application/vnd.ms-excel;base64,' + Base64.encode(vExportContent);

        /*
         dynamically create and anchor tag to force download with suggested filename
         note: download attribute is Google Chrome specific
         */

        if (Ext4.isChrome) {
            var gridEl = this.getEl();

            var el = Ext4.DomHelper.append(gridEl, {
                tag: "a",
                download: title + "-" + Ext4.Date.format(new Date(), 'Y-m-d Hi') + '.xls',
                href: location
            });

            el.click();

            Ext4.fly(el).destroy();

        } else {

            var form = this.down('form#uploadForm');
            if (form) {
                form.destroy();
            }
            form = this.add({
                xtype: 'form',
                itemId: 'uploadForm',
                hidden: true,
                standardSubmit: true,
                url: 'http://webapps.figleaf.com/dataservices/Excel.cfc?method=echo&mimetype=application/vnd.ms-excel&filename=' + escape(title + ".xls"),
                items: [{
                    xtype: 'hiddenfield',
                    name: 'data',
                    value: vExportContent
                }]
            });

            form.getForm().submit();

        }
    },

    /*

     Welcome to XML Hell
     See: http://msdn.microsoft.com/en-us/library/office/aa140066(v=office.10).aspx
     for more details

     */
    getExcelXml: function(includeHidden, title) {

        var theTitle = title || this.title;

        var worksheet = this.createWorksheet(includeHidden, theTitle);
        var totalWidth = this.columnManager.columns.length;

        return ''.concat(
                '<?xml version="1.0"?>',
                '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">',
                '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Title>' + theTitle + '</Title></DocumentProperties>',
                '<OfficeDocumentSettings xmlns="urn:schemas-microsoft-com:office:office"><AllowPNG/></OfficeDocumentSettings>',
                '<ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">',
                '<WindowHeight>' + worksheet.height + '</WindowHeight>',
                '<WindowWidth>' + worksheet.width + '</WindowWidth>',
                '<ProtectStructure>False</ProtectStructure>',
                '<ProtectWindows>False</ProtectWindows>',
                '</ExcelWorkbook>',

                '<Styles>',

                '<Style ss:ID="Default" ss:Name="Normal">',
                '<Alignment ss:Vertical="Bottom"/>',
                '<Borders/>',
                '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Color="#000000"/>',
                '<Interior/>',
                '<NumberFormat/>',
                '<Protection/>',
                '</Style>',

                '<Style ss:ID="title">',
                '<Borders />',
                '<Font ss:Bold="1" ss:Size="18" />',
                '<Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1" />',
                '<NumberFormat ss:Format="@" />',
                '</Style>',

                '<Style ss:ID="headercell">',
                '<Font ss:Bold="1" ss:Size="10" />',
                '<Alignment ss:Horizontal="Center" ss:WrapText="1" />',
                '<Interior ss:Color="#A3C9F1" ss:Pattern="Solid" />',
                '</Style>',


                '<Style ss:ID="even">',
                '<Interior ss:Color="#CCFFFF" ss:Pattern="Solid" />',
                '</Style>',


                '<Style ss:ID="evendate" ss:Parent="even">',
                '<NumberFormat ss:Format="yyyy-mm-dd" />',
                '</Style>',


                '<Style ss:ID="evenint" ss:Parent="even">',
                '<Numberformat ss:Format="0" />',
                '</Style>',

                '<Style ss:ID="evenfloat" ss:Parent="even">',
                '<Numberformat ss:Format="0.00" />',
                '</Style>',

                '<Style ss:ID="odd">',
                '<Interior ss:Color="#CCCCFF" ss:Pattern="Solid" />',
                '</Style>',

                '<Style ss:ID="groupSeparator">',
                '<Interior ss:Color="#D3D3D3" ss:Pattern="Solid" />',
                '</Style>',

                '<Style ss:ID="odddate" ss:Parent="odd">',
                '<NumberFormat ss:Format="yyyy-mm-dd" />',
                '</Style>',

                '<Style ss:ID="oddint" ss:Parent="odd">',
                '<NumberFormat Format="0" />',
                '</Style>',

                '<Style ss:ID="oddfloat" ss:Parent="odd">',
                '<NumberFormat Format="0.00" />',
                '</Style>',


                '</Styles>',
                worksheet.xml,
                '</Workbook>'
        );
    },

    /*

     Support function to return field info from store based on fieldname

     */

    getModelField: function(fieldName) {

        var fields = this.store.model.getFields();
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].name === fieldName) {
                return fields[i];
            }
        }
    },

    /*

     Convert store into Excel Worksheet

     */
    generateEmptyGroupRow: function(dataIndex, value, cellTypes, includeHidden) {


        var cm = this.columnManager.columns;
        var colCount = cm.length;
        var rowTpl = '<Row ss:AutoFitHeight="0"><Cell ss:StyleID="groupSeparator" ss:MergeAcross="{0}"><Data ss:Type="String"><html:b>{1}</html:b></Data></Cell></Row>';
        var visibleCols = 0;

        // rowXml += '<Cell ss:StyleID="groupSeparator">'

        for (var j = 0; j < colCount; j++) {
            if (cm[j].xtype != 'actioncolumn' && (cm[j].dataIndex != '') && (includeHidden || !cm[j].hidden)) {
                // rowXml += '<Cell ss:StyleID="groupSeparator"/>';
                visibleCols++;
            }
        }

        // rowXml += "</Row>";

        return Ext4.String.format(rowTpl, visibleCols - 1, value);
    },


    createWorksheet: function(includeHidden, theTitle) {
        // Calculate cell data types and extra class names which affect formatting
        var cellType = [];
        var cellTypeClass = [];
        var cm = this.columnManager.columns;

        var totalWidthInPixels = 0;
        var colXml = '';
        var headerXml = '';
        var visibleColumnCountReduction = 0;
        var colCount = cm.length;
        for (var i = 0; i < colCount; i++) {
            if (cm[i].xtype != 'actioncolumn' && (cm[i].dataIndex != '') && (includeHidden || !cm[i].hidden)) {
                var w = cm[i].getEl().getWidth();
                totalWidthInPixels += w;

                if (cm[i].text === "") {
                    cellType.push("None");
                    cellTypeClass.push("");
                    ++visibleColumnCountReduction;
                } else {
                    colXml += '<Column ss:AutoFitWidth="1" ss:Width="' + w + '" />';
                    headerXml += '<Cell ss:StyleID="headercell">' +
                    '<Data ss:Type="String">' + cm[i].text + '</Data>' +
                    '<NamedCell ss:Name="Print_Titles"></NamedCell></Cell>';


                    var fld = this.getModelField(cm[i].dataIndex);
                    switch (fld.type.type) {
                        case "int":
                            cellType.push("Number");
                            cellTypeClass.push("int");
                            break;
                        case "float":
                            cellType.push("Number");
                            cellTypeClass.push("float");
                            break;

                        case "bool":

                        case "boolean":
                            cellType.push("String");
                            cellTypeClass.push("");
                            break;
                        case "date":
                            cellType.push("DateTime");
                            cellTypeClass.push("date");
                            break;
                        default:
                            cellType.push("String");
                            cellTypeClass.push("");
                            break;
                    }
                }
            }
        }
        var visibleColumnCount = cellType.length - visibleColumnCountReduction;

        var result = {
            height: 9000,
            width: Math.floor(totalWidthInPixels * 30) + 50
        };

        // Generate worksheet header details.

        // determine number of rows
        var numGridRows = this.store.getCount() + 2;
        if (!Ext.isEmpty(this.store.groupField) || this.store.groupers.items.length > 0) {
            numGridRows = numGridRows + this.store.getGroups().length;
        }

        // create header for worksheet
        var t = ''.concat(
                '<Worksheet ss:Name="' + theTitle + '">',

                '<Names>',
                '<NamedRange ss:Name="Print_Titles" ss:RefersTo="=\'' + theTitle + '\'!R1:R2">',
                '</NamedRange></Names>',

                '<Table ss:ExpandedColumnCount="' + (visibleColumnCount + 2),
                '" ss:ExpandedRowCount="' + numGridRows + '" x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="65" ss:DefaultRowHeight="15">',
                colXml,
                '<Row ss:Height="38">',
                '<Cell ss:MergeAcross="' + (visibleColumnCount - 1) + '" ss:StyleID="title">',
                '<Data ss:Type="String" xmlns:html="http://www.w3.org/TR/REC-html40">',
                '<html:b>' + theTitle + '</html:b></Data><NamedCell ss:Name="Print_Titles">',
                '</NamedCell></Cell>',
                '</Row>',
                '<Row ss:AutoFitHeight="1">',
                headerXml +
                '</Row>'
        );

        // Generate the data rows from the data in the Store
        var groupVal = "";
        var groupField = "";
        if (this.store.groupers.keys.length > 0) {
            groupField = this.store.groupers.keys[0];
        }
        for (var i = 0, it = this.store.data.items, l = it.length; i < l; i++) {

            if (!Ext.isEmpty(groupField)) {
                if (groupVal != this.store.getAt(i).get(groupField)) {
                    groupVal = this.store.getAt(i).get(groupField);
                    t += this.generateEmptyGroupRow(groupField, groupVal, cellType, includeHidden);
                }
            }
            t += '<Row>';
            var cellClass = (i & 1) ? 'odd' : 'even';
            r = it[i].data;
            var k = 0;
            for (var j = 0; j < colCount; j++) {
                if (cm[j].xtype != 'actioncolumn' && (cm[j].dataIndex != '') && (includeHidden || !cm[j].hidden)) {
                    var v = r[cm[j].dataIndex];
                    if (cellType[k] !== "None") {
                        t += '<Cell ss:StyleID="' + cellClass + cellTypeClass[k] + '"><Data ss:Type="' + cellType[k] + '">';
                        if (cellType[k] == 'DateTime') {
                            t += Ext4.Date.format(v, 'Y-m-d');
                        } else {
                            t += v;
                        }
                        t += '</Data></Cell>';
                    }
                    k++;
                }
            }
            t += '</Row>';
        }

        result.xml = t.concat(
                '</Table>',
                '<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">',
                '<PageLayoutZoom>0</PageLayoutZoom>',
                '<Selected/>',
                '<Panes>',
                '<Pane>',
                '<Number>3</Number>',
                '<ActiveRow>2</ActiveRow>',
                '</Pane>',
                '</Panes>',
                '<ProtectObjects>False</ProtectObjects>',
                '<ProtectScenarios>False</ProtectScenarios>',
                '</WorksheetOptions>',
                '</Worksheet>'
        );
        return result;
    }
});
