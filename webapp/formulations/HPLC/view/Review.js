Ext4.define('HPLC.view.Review', {
    extend : 'Ext.panel.Panel',

    alias : 'widget.standardentry',

//    layout : 'border',

    border : false,

    frame  : false,

    initComponent : function() {

        this.html = 'Review Review!';

        this.callParent();
    }
});