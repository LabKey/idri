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