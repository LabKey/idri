/*
 * Copyright (c) 2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
/**
 * Created by Nick Arnold on 1/21/14.
 */

if (!LABKEY.idri) {
    LABKEY.idri = {};
}

LABKEY.idri.buttons = new function() {

    var deleteHandler = function(rowId, callback, failure, scope) {
        console.log('deleting:', rowId);
        LABKEY.Ajax.request({
            url: LABKEY.ActionURL.buildURL('idri', 'deleteFormulation', null, {rowId: parseInt(rowId)}),
            method: 'POST',
            success: callback,
            failure: failure,
            scope: scope
        });
    };

    return {
        DeleteFormulationHandler : function(dataRegion) {
            if (dataRegion) {
                dataRegion.getSelected({
                    success: function(selection) {

                        var ids = selection.selected;

                        if (ids && ids.length == 1) {
                            // Delete the Formulations one at a time
                            deleteHandler(selection.selected[0],
                                    function() { location.reload(); },
                                    function() { alert("Failed to delete"); },
                                    this
                            );
                        }
                        else {
                            alert('Currently, only one formulation may be deleted at a time.');
                        }
                    }
                });
            }
        }
    };
};