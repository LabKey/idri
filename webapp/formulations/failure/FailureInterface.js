Ext.namespace("LABKEY.formulations");

/**
 * Use the FailureInterface to register a failure on a specific assay.
 */
LABKEY.formulation.FailureInterface = Ext.extend(Ext.Component, {

    LIST : "Failure",

    initComponent : function() {
        console.info("You have initialized the Failure Interface.");

        
        
        LABKEY.formulation.FailureInterface.superclass.initComponent.apply(this, arguments);
    },

    createFailure : function() {

        // This is where the failure interface will create a failure. Place it in the list
    },

    getFailure : function() {

        // Get one failure
    },

    getFailures : function() {

        // Get many failures
    },

    updateFailure : function() {

        // Update failures that already exist.
    },

    removeFailure : function() {

        // This is used to remove failures from the list.
    }
});