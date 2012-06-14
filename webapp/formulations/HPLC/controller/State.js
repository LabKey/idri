Ext4.define('HPLC.controller.State', {

    extend : 'Ext.app.Controller',

    views : ['Upload'],

    refs : [{
        selector : 'window',
        ref : 'win'
    }],

    init : function() {

        this.activeview = '';
        this.upload = {};
        this.activated = false;

        this.control('window', {
            render : this.onWindowRender
        });

    },

    setActiveView : function(xtype) {
        this.activeview = xtype;
    },

    getActiveView : function() {
        return this.activeview;
    },

    onWindowRender : function(window)  {

        if (this.activated) {
            return;
        }
        this.activated = true;

        this.upload = Ext4.create('HPLC.view.Upload', {
            targetFile : this.application.getFolder(),
            fileSystem : this.application.getFileSystem()
        });

        var me = this;

        this.back = Ext4.create('Ext.Button', {
            text : 'Previous',
            handler : me.requestPrevious,
            disabled: true,
            scope : me
        });

        this.forward = Ext4.create('Ext.Button', {
            text : 'Next',
            handler : me.requestNext,
            scope : me
        });

        var tb = Ext4.create('Ext.toolbar.Toolbar', {
            dock  : 'bottom',
            items : ['->',
                this.back,
                this.forward],
            scope : me
        });

        window.items.items[0].add(this.upload);
        window.addDocked(tb);


        this.activeIdx = 0;
        this.max = 0;
        this.done = false;
        this.setActiveView(this.upload.getXType());
    },

    requestPrevious : function() {
        this.changeTab(false);
    },

    requestNext : function() {

        if (!this.getActiveView() || this.getActiveView() == 'hplcupload')
        {
            var view;

            if (!this.done)
            {
                for (var i=0; i < this.upload.smpStore.getCount(); i++)
                {
                    view = this.createSampleView(this.upload.smpStore, i, this.upload.stdStore);
                    this.application.tab.add(view);
                    this.max++;
                }

                if (this.upload.stdStore.getCount() > 0) {
                    view = this.createStandardView(this.upload.stdStore);
                    this.application.tab.add(view);
                    this.max++;
                }

                this.application.tab.add(this.createReviewView());
                this.max++;
            }

            this.done = true;
        }

        this.changeTab(true);
    },

    changeTab : function(next) {
        if (!next || this.activeIdx < this.max) {
            this.activeIdx = this.activeIdx + (next ? 1 : -1);
        }

        this.back.setDisabled(this.activeIdx <= 0);
        this.application.tab.setActiveTab(this.activeIdx);

        var xtype = this.application.tab.getActiveTab().getXType();
        this.forward.setDisabled((xtype == 'hplcreview'));
        this.setActiveView(xtype);
    },

    createReviewView : function() {
        return this.application.getController('AssayResolver').createReviewView();
    },

    createSampleView : function(samples, idx, standards) {
        return this.application.getController('Sample').createSampleView(samples, idx, standards);
    },

    createStandardView : function(standards) {
        return this.application.getController('Sample').createStandardView(standards);
    },

    getSampleForms : function() {
        return this._getForms('sampleentry');
    },

    getStandardForms : function() {
        return this._getForms('standardentry');
    },

    _getForms : function(xtype) {
        var tabs = this.application.tab,
                forms = [], f;

        // skip initial page
        for (var i=1; i < tabs.items.length; i++) {

            if (tabs.items.items[i].xtype == xtype) {

                f = tabs.items.items[i].getForm();
                if (Ext4.isArray(f)) {
                    forms = forms.concat(f);
                }
                else {
                    forms.push(f);
                }
            }
        }

        return forms;
    }
});