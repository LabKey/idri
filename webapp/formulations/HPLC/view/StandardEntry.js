Ext4.define('HPLC.view.StandardEntry', {

    extend : 'Ext.panel.Panel',

    alias : 'widget.standardentry',

    layout : 'border',

    border : false,

    frame  : false,

    initComponent : function() {

        this.sampleid = this.standards;
        this.html = this.sampleid;

        var formItems = this.initializeForms();

        this.items = [{
            xtype : 'panel',
            region: 'center',
            layout : {
                type : 'vbox',
                align: 'stretch'
            },
            items : formItems
        }];

        this.callParent();
    },

    initializeForms : function() {

        var formItems = [];

        for (var i=0; i < this.standards.getCount(); i++) {
            formItems.push(this.generateStandardForm(this.standards.getAt(i)));
        }

        return formItems;
    },

    generateStandardForm : function(standard) {

        return Ext4.create('Ext.form.Panel', {
            flex  : 1,
            items : [{
                fieldLabel : 'Compound',
                name : 'compound'
            },{
                fieldLabel : 'Concentration',
                name : 'conc'
            },{
                fieldLabel : 'Dilutent',
                name : 'dilutent'
            }]
        });

    }
});