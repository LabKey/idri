/*
 * Copyright (c) 2012 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('HPLC.panel.StandardPicker', {
    extend : 'Ext.panel.Panel',
    alias : 'widget.standardpicker',

    initComponent : function() {

        Ext4.create('LABKEY.ext4.filter.SelectPanel', {
            allowAll : true,
            flex : 1,
            border : false, frame : false
        });
        this.callParent();
    }
});