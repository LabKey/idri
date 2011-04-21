/*
 * Copyright (c) 2011 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext.namespace("LABKEY.idri");

LABKEY.idri.CompoundForm = Ext.extend(Ext.Panel, {

    initComponent : function()
    {
        this.items  = [];
        this.border = false;
        this.frame  = false;

        this.formpanel = this.getCompoundForm();
    },

    getCompoundForm : function()
    {
        var fp = new Ext.FormPanel({
            labelAlign : 'top',
            border : false,
            frame  : false
        });
    }
});