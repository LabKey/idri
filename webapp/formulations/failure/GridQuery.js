function queryAssayGrid(assayRowId, formulationName, machine, callbackFn) {

    var sql = 'SELECT CASE WHEN psbasepivot.StorageTemperature = \'5C\' THEN \'05C\' ELSE psbasepivot.StorageTemperature END AS Temperature, ' +
            'MIN(psbasepivot."T=0") AS "DM", ' +
            'MIN(psbasepivot."1 wk") AS "1 wk", ' +
            'MIN(psbasepivot."2 wk") AS "2 wk", ' +
            'MIN(psbasepivot."1 mo") AS "1 mo", ' +
            'MIN(psbasepivot."3 mo") AS "3 mo", ' +
            'MIN(psbasepivot."6 mo") AS "6 mo", ' +
            'MIN(psbasepivot."12 mo") AS "12 mo", ' +
            'MIN(psbasepivot.ZAveMean) AS "Mean" ' + 
            'FROM psbasepivot ' +
            'WHERE psbasepivot.RowId=' + assayRowId + ' AND psbasepivot.AnalysisTool=\'' + machine + '\'' +
            'GROUP BY psbasepivot.StorageTemperature';

    var _store = new LABKEY.ext.Store({
        schemaName: 'assay',
        sql : sql
    });

    var _grid = new LABKEY.ext.EditorGridPanel({
        store : _store,
        renderTo : 'testdiv',
        id : 'query-assay-grid',
        showExportButton: false,
        autoHeight: true,
        editable: false,
        listeners : {
            'columnmodelcustomize' : function(cm, idx) {
                if (cm === undefined) {
                    return;
                }
                for (tp in idx) {
                    var col = idx[tp];
                    col.renderer = function(data, cellMetaData, record, rowIndex, colIndex, store) {
                        var mean = record.get("Mean");
                        if (isNaN(data) || data == "" || data == null || cellMetaData.css.search("x-grid3-cell-last") != -1) {
                            return data;
                        }
                        if (mean * 1.5 > data) {
                            cellMetaData.attr = 'style="background:green; color: white;"';
                        }
                        else if (mean * 1.5 < data) {
                            cellMetaData.attr = 'style="background:red; color: white;"';
                        }
                        return data;
                    }
                }
            },
            render : function() {
                var el = Ext.get('testdiv');
                el.unmask();
            }
        }
    });
    
    callbackFn(_grid);
}

function lookupAssayId(formulationName, machine, callbackFn) {

    LABKEY.Query.selectRows({
        schemaName: 'assay',
        queryName : 'Particle Size Runs',
        filterArray: [ LABKEY.Filter.create('Name', formulationName, LABKEY.Filter.Types.STARTS_WITH)],
        successCallback : function(data) {
            if (data.rows.length < 1) {
                console.info("More/Less then 1 result for " + formulationName);
                return;
            }
            var assayRowId = data.rows[0].RowId;
            queryAssayGrid(assayRowId, formulationName, machine, callbackFn);
        }
    });
}