/* Returns an LABKEY.ext.Store of IDRI Formulation temperatures */
function getTemperatureStore() {
    
    return new LABKEY.ext.Store({
        schemaName : 'lists',
        queryName  : 'Temperatures',
        sort       : '[+]temperature'
    });
    
}

function getTimeStore() {

    return new LABKEY.ext.Store({
        schemaName : 'lists',
        queryName  : 'Timepoints',
        sort       : '[+]sort'
    });

}

