/*
 * Copyright (c) 2011 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
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

