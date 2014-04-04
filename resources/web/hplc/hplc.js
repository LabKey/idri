/*
 * Copyright (c) 2013-2014 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
if (!LABKEY.idri) {
    LABKEY.idri = {};
}

LABKEY.idri.hplcSelection = function(dataRegion, dataRegionName) {
    window.location = LABKEY.ActionURL.buildURL('idri', 'qc', null, {
        selectionKey: dataRegion.selectionKey,
        queryName: dataRegion.queryName,
        schemaName: dataRegion.schemaName
    });
};