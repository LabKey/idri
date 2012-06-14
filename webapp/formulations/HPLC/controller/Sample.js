Ext4.define('HPLC.controller.Sample', {

    extend : 'Ext.app.Controller',

    views : ['SampleEntry', 'StandardEntry'],

    init : function() {

        this.control('window', {
            render : this.onWindowRender
        });

    },

    createSampleView : function(samples, idx, standards) {

        if (!this.sampleEntryMap)
            this.sampleEntryMap = {};

        var smp = samples.getAt(idx);

        if (this.sampleEntryMap[smp.data.name])
            return this.sampleEntryMap[smp.data.name];

        var v = Ext4.create('HPLC.view.SampleEntry', {
            samples   : samples,
            idx       : idx,
            standards : standards,
            listeners : {
                preview : this.showPreview,
                scope : this
            },
            scope : this
        });

        this.sampleEntryMap[v.sampleid] = v;

        return v;
    },

    createStandardView : function(standards) {

        return Ext4.create('HPLC.view.StandardEntry', {
            standards : standards
        });

    },

    showPreview : function(src) {

        this.application.win.hide();

        var previewWin = Ext4.create('Ext.window.Window', {
            autoShow: true,
            width : 800,
            height: 400,
            header : false,
            resizable : false,
            ui : 'custom',
            items : [{
                xtype : 'box',
                autoEl : {
                    tag : 'img',
                    src : src
                }
            }],
            modal : true,
            listeners : {
                close : function() {
                    this.application.win.show();
                },
                afterrender : function() {

                    var task = new Ext.util.DelayedTask(function() {

                        Ext4.getBody().on('click', function() {
                            console.log('closing!');
                            previewWin.close();
                        }, null, {single: true});

                    });

                    task.delay(100);
                },
                scope : this
            },
            scope : this
        });
    },

    hidePreview : function(btn) {

    },

    onWindowRender : function(win) {
        this.win = win;
    }
});
