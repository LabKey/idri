Ext4.define('HPLC.controller.Sample', {

    extend : 'Ext.app.Controller',

    views : ['SampleEntry', 'StandardEntry'],

    init : function() {

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
            standards : standards
        });

        this.sampleEntryMap[v.sampleid] = v;

        return v;
    },

    createStandardView : function(standards) {

        return Ext4.create('HPLC.view.StandardEntry', {
            standards : standards
        });

    }
});
