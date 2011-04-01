Ext.namespace("LABKEY.idri");

LABKEY.idri.FormulationPanel = Ext.extend(Ext.Panel, {

    initComponent : function()
    {       
        this.items = [];
        this.border = false;
        this.frame  = false;
        this.width  = 425;
        this.materialCount = -1;
        this.lastChecked = "";
        this.isUpdate = false;
        LABKEY.idri.activeFormID = this.id;
        
        /* This store contains all known source materials */
        this.materialStore = new Ext.data.ArrayStore({
            fields : ['materialName'],
            data   : this.materials
        });

        this.formulationStore = new Ext.data.JsonStore({
            fields : ['comments', {name: 'dm', type:'date'}, 'batch', 'batchsize', 'rowID'],
            idProperty : 'batch',
            data   : this.formulations
        });

        this.dialogPanel = new Ext.Panel({
            html:"",
            border: false,
            frame: false,
            hidden: true,
            style: {
                padding: '7px'
            }
        });

        this.formPanel = this.getFormulationItems();
        this.materialsPanel = this.getFormItems();

        this.items.push(this.dialogPanel);
        this.items.push(this.formPanel);
        this.items.push(this.materialsPanel);

        this.buttonAlign = "left";
        this.buttons = [{
            id : 'add-button',
            text : 'Add Another Material',
            handler : function()
            {
                this.add(this.getFormItems());
                this.doLayout();
            },
            scope : this
        },{
            id : 'submit-formulation-btn',
            text : 'Create',
            handler : function()
            {
                var formulation = this.validateSubmit();

                if (formulation)
                {
                    this.getEl().mask("Saving Formulation...");
                    Ext.Ajax.request({
                        method : 'POST',
                        url : LABKEY.ActionURL.buildURL("idri", "saveFormulation.api"),
                        jsonData : formulation,
                        success : function(response)
                        {
                            var obj = Ext.decode(response.responseText);
                            this.formulations.push(obj.formulation);
                            this.formulationStore = new Ext.data.JsonStore({
                                fields : ['comments', {name: 'dm', type:'date'}, 'batch', 'batchsize'],
                                idProperty : 'batch',
                                data   : this.formulations
                            });
                            this.getEl().unmask();
                            var mainParams = {};
                            mainParams['rowId'] = obj.formulation.rowID;
                            var _link = location.protocol + "//" + location.host + "/" + LABKEY.ActionURL.buildURL("idri", "formulationDetails.view", LABKEY.ActionURL.getContainer(), mainParams);
                            this.showMsg("Formulation : <a href='" + _link + "'>" + obj.formulation.batch + "</a> has been " + (this.isUpdate ? "updated." : "created."), false);
                            var cmp = Ext.getCmp('stability-check');
                            if (cmp && cmp.getValue())
                            {
                                LABKEY.Security.getUsers({
                                    groupId : 1043, // 'Stability'
                                    successCallback : function(usersInfo, response)
                                    {
                                        var users = usersInfo.users;
                                        var recipients = [];
                                        for (var i = 0; i < users.length; i++)
                                            recipients.push(LABKEY.Message.createRecipient(LABKEY.Message.recipientType.to, users[i].email));

                                        var val = obj.formulation.batch;
                                        LABKEY.Message.sendMessage({
                                            msgFrom : 'ops@labkey.com',
                                            msgSubject : 'Formulation added on LabKey',
                                            msgRecipients : recipients,
                                            msgContent : [
                                                LABKEY.Message.createMsgContent(LABKEY.Message.msgType.html, "<h4>Stability Review Requested</h4>" +
                                                        "Formulation : <a href='" + _link + "'>" + val + "</a> has been processed.<br/><br/>IDRI LabKey Administration Team")
                                            ],
                                            successCallback : function(result) {
                                                console.info("Email(s) sent successfully.");
                                            },
                                            errorCallback : function(errorInfo, responseObj)
                                            {
                                                LABKEY.Utils.displayAjaxErrorResponse(responseObj, errorInfo);
                                            }
                                        });
                                    },
                                    errorCallback : function(errorInfo, response)
                                    {
                                        console.info("Failed to send email.");
                                    },
                                    scope: this
                                });
                            }

                            var cmp = Ext.getCmp('submit-formulation-btn');
                            if (cmp)
                            {
                                cmp.setText('Create');
                            }
                            this.isUpdate = false;
                            this.formPanel.getForm().reset();
                            this.resetMaterials();
                        },
                        failure : function(response)
                        {
                            this.getEl().unmask();
                            this.showMsg("Failed to Save.", true);
                        },
                        scope: this
                    });
                }
            },
            scope : this
        }];

        LABKEY.idri.FormulationPanel.superclass.initComponent.apply(this, arguments);

        this.on('afterrender', function(panel){
            var urlRowID = LABKEY.ActionURL.getParameter("RowId");
            if (urlRowID)
            {
                var collection = this.formulationStore.query("rowID", urlRowID);
                if (collection)
                {
                    var first = collection.first();
                    if (first)
                    {
                        this.getEl().mask("Loading Formulation...");
                        this.formPanel.getForm().load({
                            url : LABKEY.ActionURL.buildURL('idri', 'getFormulation.api'),
                            method : 'GET',
                            params : {materialName: first.json.batch},
                            success : function(panel, form) {
                                this.getEl().unmask();
                                var cmp = Ext.getCmp('submit-formulation-btn');
                                if (cmp)
                                {
                                    this.isUpdate = true;
                                    cmp.setText("Save Changes");
                                }
                            },
                            failure : function()
                            {
                                console.info("Failed to retrieve formulation.");
                                this.getEl().unmask();
                            },
                            scope : this
                        });
                    }
                }
            }
        }, this);
    },    

    showMsg : function(msg, error)
    {
        if (msg.length == 0)
            this.dialogPanel.hide();
        else
            this.dialogPanel.show();
        
        if (error)
            this.dialogPanel.update("<span style='color: red;'>" + msg + "</span>");
        else
            this.dialogPanel.update("<span style='color: green;'>" + msg + "</span>");
    },
    
    materialFromJSON : function(v, rec)
    {
        if (rec)
        {
            var materials = rec.materials; // Array of Material objects
            if (materials.length > 0)
            {
                var cmp;
                cmp = Ext.getCmp('material-0');
                cmp.fireEvent('loadMaterial', cmp, materials[0]);

                for (var i = 1; i < materials.length; i++)
                {
                    cmp = Ext.getCmp('material-' + i);
                    if (cmp == null)
                    {
                        /* Not good -- attached ID to global scoped object. Should work fine though */
                        var panel = Ext.getCmp(LABKEY.idri.activeFormID);
                        panel.add(panel.getFormItems());
                        panel.doLayout();
                    }
                    cmp = Ext.getCmp('material-' + i);
                    cmp.fireEvent('loadMaterial', cmp, materials[i]);
                }
            }
        }
    },
    
    getFormulationItems : function()
    {
        var fp = new Ext.FormPanel({
            labelAlign : 'top',
            width : 400,
            border: false,
            frame : false,
            reader: new Ext.data.JsonReader({
                idProperty: 'batch',
                root: 'formulation',
                fields: [
                    {name: 'dm', type:'date'},
                    {name: 'type'},
                    {name: 'batch'},
                    {name: 'nbpg'},
                    {name: 'comments'},
                    {name: 'batchsize'},
                    {name: 'material', convert: this.materialFromJSON }
                ],
                scope : this
            }),
            items : [{
                layout : 'column',
                border : false,
                frame  : false,
                items  : [{
                    columnWidth : .4,
                    layout : 'form',
                    border : false,
                    frame  : false,
                    defaults : {
                        labelSeparator : '',
                        width : 150
                    },
                    items  : [{
                        id: 'lot-field-id',
                        xtype : 'textfield',
                        fieldLabel : 'Lot Number*',
                        name : 'batch',
                        enableKeyEvents: true,
                        listeners : {
                            specialkey : function(field, e) {
                                if (e.getKey() == e.ENTER) {
                                    field.fireEvent('blur', field);
                                }
                            },
                            blur : function(field)
                            {
                                field.setValue(field.getValue().toUpperCase());
                                var val = field.getValue();
                                var recs = this.formulationStore.query('batch', val, false, true);
                                if (recs.length > 0)
                                {
                                    for (var i = 0; i < recs.keys.length; i++)
                                    {
                                        if (recs.keys[i] == val)
                                        {
                                            if (this.lastChecked == val)
                                                return;
                                            this.lastChecked = val;
                                            Ext.Msg.show({
                                                title:'Load Formulation?',
                                                msg: 'That formulation already exists. Would you like to load the formulation?',
                                                buttons: Ext.Msg.YESNO,
                                                fn: function(id) {
                                                    if (id == 'yes')
                                                    {
                                                        this.showMsg("");
                                                        this.getEl().mask('loading formulation...');
                                                        this.formPanel.getForm().reset();
                                                        this.resetMaterials();
                                                        this.formPanel.getForm().load({
                                                            url : LABKEY.ActionURL.buildURL('idri', 'getFormulation.api'),
                                                            method : 'GET',
                                                            params : {materialName: val},
                                                            success : function(panel, form) {
                                                                this.getEl().unmask();
                                                                var cmp = Ext.getCmp('submit-formulation-btn');
                                                                if (cmp)
                                                                {
                                                                    this.isUpdate = true;
                                                                    cmp.setText("Save Changes");
                                                                }
                                                            },
                                                            failure : function()
                                                            {
                                                                console.info("Failed to retrieve formulation.");
                                                                this.getEl().unmask();
                                                            },
                                                            scope : this
                                                        });
                                                    }
                                                    else
                                                    {
                                                        this.isUpdate = false;
                                                        this.formPanel.getForm().reset();
                                                        this.resetMaterials();
                                                        field.setValue(val);
                                                        var cmp = Ext.getCmp('submit-formulation-btn');
                                                        if (cmp)
                                                        {
                                                            cmp.setText("Save Changes");
                                                        }
                                                    }
                                                },
                                                icon: Ext.MessageBox.QUESTION,
                                                scope: this
                                            });
                                            break;
                                        }
                                    }
                                }
                            },
                            scope : this
                        },
                        scope : this
                    },{
                        xtype : 'combo',
                        fieldLabel : 'Formulation Type*',
                        name : 'type',
                        triggerAction : 'all',
                        typeAhead : true,
                        mode  : 'local',
                        displayField : 'type',
                        allowBlank : false,
                        validateOnBlur : false,
                        valueField   : 'type',
                        store : new Ext.data.ArrayStore({
                            fields : ['type'],
                            data : [
                            ['Emulsion'],['Aqueous'],
                            ['Powder'],['Liposome'],
                            ['Alum'],
                            ['Niosomes']]
                        }),
                        scope : this
                    },{
                        xtype : 'textarea',
                        fieldLabel : 'Comments',
                        name : 'comments'
                    }],
                    scope : this
                },{
                    columnWidth : .5,
                    layout : 'form',
                    border : false,
                    frame  : false,
                    defaults : {
                        labelSeparator : '',
                        width : 100
                    },
                    items : [{
                        xtype : 'datefield',
                        fieldLabel : 'Date of Manufacture*',
                        name : 'dm',
                        allowBlank : false,
                        validateOnBlur : false
                    },{
                        xtype : 'numberfield',
                        fieldLabel : 'Batch Size*',
                        name : 'batchsize',
                        allowBlank : false,
                        validateOnBlur : false
                    },{
                        xtype : 'textfield',
                        fieldLabel : 'Notebook Page*',
                        name : 'nbpg',
                        allowBlank : false,
                        validateOnBlur: false
                    },{
                        id: 'stability-check',
                        xtype : 'checkbox',
                        fieldLabel : 'Stability Watch',
                        name : 'stability'
                    }]
                }],
                scope : this
            }],
            scope : this
        });
        
        return fp;
    },

    getMaterialItem : function()
    {
        this.materialCount = this.materialCount + 1;
        return {
            layout : 'column',
            border : false,
            frame  : false,
            items  : [{
                columnWidth : .4,
                layout : 'form',
                border : false,
                frame  : false,
                defaults : {
                    labelSeparator : '',
                    width : 150
                },
                items  : [{
                    id : 'material-' + this.materialCount,
                    xtype : 'combo',
                    fieldLabel : 'Material',
                    name  : 'materialName',
                    valueField : 'materialName',
                    displayField : 'materialName',
                    mode : 'local',
                    triggerAction : 'all',
                    store : this.materialStore,
                    emptyText : 'Choose a material',
                    typeAhead : true,
                    forceSelection : true,
                    listeners : {
                        select : this.onMaterialSelect,
                        loadMaterial : this.onMaterialLoad,
                        scope : this
                    },
                    scope : this
                }],
                scope : this
            },{
                columnWidth : .5,
                layout : 'form',
                border : false,
                frame  : false,
                shown  : true,
                defaults : {
                    labelSeparator : ''
                },
                items  : [],
                listeners : {
                    afterlayout : function(panel)
                    {
                        if (panel.shown)
                        {
                            panel.hide();
                            panel.shown = false;
                        }
                    }
                },
                scope : this
            }],
            scope : this
        };
    },

    getFormItems : function()
    {
        var fp = new Ext.FormPanel({
            labelAlign : 'top',
            width : 400,
            border: false,
            frame : false,
            items : [ this.getMaterialItem() ],
            scope : this
        });
        return fp;
    },

    resetMaterials : function()
    {
        var count = this.materialCount;
        while (count > 0)
        {
            var cmp = Ext.getCmp('material-' + count);
            var parent = cmp.findParentByType('panel');
            var named = parent.findParentByType('panel');
            named.destroy();
            count = count - 1;
        }
        this.materialCount = count;

        // reset the initial material
        var cmp = Ext.getCmp('material-' + count);
        var parent = cmp.findParentByType('panel');
        var named = parent.findParentByType('panel');
        cmp.reset();
        if (named.conc)
        {
            named.conc.destroy();
        }

        this.formPanel.getForm().cleanDestroyed();

        // Re-add the first material
    },

    onMaterialLoad : function(combo, material)
    {
        combo.setValue(material.materialName);
        var parent = combo.findParentByType('panel');
        var named = parent.findParentByType('panel');

        if (named.getComponent(2))
            named.remove(named.getComponent(2));

        if (material.concentration == 0)
            material.concentration = "";
        
        named.add({
            columnWidth : .3,
            layout : 'form',
            border : false,
            frame  : false,
            labelSeparator : '',
            items  : [{
                ref : '../conc',
                xtype : 'numberfield',
                name  : 'concentration',
                width : 100,
                decimalPrecision : 4,
                fieldLabel : 'Unit (' + material.typeUnit + ')'
            },{
                xtype : 'hidden',
                name  : 'typeID',
                value : material.type
            }]
        });
        named.getEl().unmask();
        named.doLayout();
        named.conc.setValue(material.concentration);
    },
    
    onMaterialSelect : function(cb, rec, idx)
    {      
        var parent = cb.findParentByType('panel');
        var named = parent.findParentByType('panel');
        
        if (named.getComponent(2))
            named.remove(named.getComponent(2));

        named.getEl().mask("Reticulating Splines.");
        Ext.Ajax.request({
            method : 'GET',
            url    : LABKEY.ActionURL.buildURL("idri", "getMaterialType.api",
                    LABKEY.ActionURL.getContainer(), {materialName : rec.get('materialName')}),
            success: function(response, e)
            {
                var json = Ext.util.JSON.decode(response.responseText);
                
                named.add({
                    columnWidth : .3,
                    layout : 'form',
                    border : false,
                    frame  : false,
                    labelSeparator : '',
                    items  : [{
                        xtype : 'numberfield',
                        name  : 'concentration',
                        width : 100,
                        decimalPrecision : 4,
                        validateOnBlur : false,
                        allowBlank : false,
                        fieldLabel : 'Unit (' + json.material.unit + ')'
                    },{
                        xtype : 'hidden',
                        name  : 'typeID',
                        value : json.material.typeID
                    }]
                });
                named.getEl().unmask();
                named.doLayout();
            },
            failure: function(response, opts)
            {
                named.getEl().unmask();
                LABKEY.Utils.displayAjaxErrorResponse(response, opts);
            },
            scope : this
        });
    },
    
    validateSubmit : function()
    {
        this.showMsg("");
        var formulation = {};

        /* Get Formulation values (not materials) */
        if (this.getComponent(1).getForm().isValid())
            Ext.apply(formulation, this.getComponent(1).getForm().getValues());
        else
        {
            this.showMsg("> Please correct the following errors.", true);
            return false;
        }

        /* Get Material values */
        formulation.materials = [];
        for (var i = 0; i <= this.materialCount; i++)
        {
            var cmp = Ext.getCmp('material-' + i);
            var parent = cmp.findParentByType('form');
            if (parent.getForm().isValid())
                formulation.materials.push(parent.getForm().getValues());
            else
            {
                this.showMsg("> Invalid material.", true);
                return false;
            }

        }
        
        return formulation;
    }
});