Ext4.define('LABKEY.hplc.ProvisionalRun', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'name'},
        {name: 'fileExt'},
//                {name: 'RowId', type: 'int'},
        {name: 'filePath'},
        {name: 'expDataRun'}
    ]
});

Ext4.define('LABKEY.hplc.Standard', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'Key', type: 'int'},
        {name: 'Name'},
        {name: 'provisionalRun'}
    ]
});

Ext4.define('LABKEY.hplc.StandardSource', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'key', type: 'int'},
        {name: 'expDataRun'},
        {name: 'standard', type: 'int'}, // lookup to Standard.key
        {name: 'name'},
        {name: 'concentration', type: 'float'},
        {name: 'xleft', type: 'float'},
        {name: 'xright', type: 'float'},
        {name: 'base', type: 'float'},
        {name: 'auc', type: 'float'},
        {name: 'peakMax', type: 'float'},
        {name: 'peakResponse', type: 'float'},
        {name: 'filePath'},
        {name: 'fileName'},
        {name: 'fileExt'}
    ]
});