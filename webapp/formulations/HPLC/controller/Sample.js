/*
 * Copyright (c) 2012 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('HPLC.controller.Sample', {

    extend : 'Ext.app.Controller',

//    views : ['SampleEntry', 'StandardEntry'],

    sampleEntryMap : {},

    init : function() {

        this.control('window', {
            render : this.onWindowRender
        });

        this.control('combo[name="replicatechoice"]', {
            select : this.onReplicateSelect
        });
    },

    createSampleView : function(samples, idx, standards) {

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

    onWindowRender : function(win) {
        this.win = win;
    },

    onReplicateSelect : function(cb, recs) {

        if (this.sampleEntryMap[recs[0].data.name] && cb.getSamplePanel) {

            if (cb.getSamplePanel().id != this.sampleEntryMap[recs[0].data.name].id) {
                var vals = this.sampleEntryMap[recs[0].data.name].getForm();
                cb.getSamplePanel().setForm(vals);
            }

        }
    }
});
