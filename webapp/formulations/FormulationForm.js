/*
 * Copyright (c) 2011-2012 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext.namespace("LABKEY.idri");

LABKEY.idri.FormulationPanel = Ext.extend(Ext.Panel, {

    //
    // Array of currently available formulations
    //
    formulations: [],

    buttonAlign: 'left',

    border: false,

    frame: false,

    initComponent : function()
    {
        this.materialCount = -1;
        this.lastChecked = "";
        this.isUpdate = false;
        
        /* This store contains all known source materials */
        this.materialStore = new Ext.data.ArrayStore({
            fields : ['materialName'],
            data   : this.materials
        });

        this.formulationStore = this.getFormulationsStore();

        this.dialogPanel = new Ext.Panel({
            html:"",
            border: false,
            frame: false,
            hidden: true,
            style: {
                padding: '7px'
            }
        });

        this.materialMap = {};
        this.formPanel = this.getFormulationItems();
        this.materialsPanel = this.getFormItems();

        this.buttons = [{
            id : 'add-button',
            text : 'Add Another Material',
            handler : function()
            {
                this.add(this.getFormItems(true));
                this.doLayout();
            },
            scope : this
        },{
            id : 'submit-formulation-btn',
            text : 'Create',
            handler : this.onCreateFormulation,
            scope : this
        }];

        this.items = [this.dialogPanel, this.formPanel, this.materialsPanel];

        LABKEY.idri.FormulationPanel.superclass.initComponent.apply(this, arguments);

        this.on('afterrender', function(){
            var urlRowID = LABKEY.ActionURL.getParameter("RowId");
            if (urlRowID)
            {
                var collection = this.formulationStore.query("rowID", urlRowID);
                if (collection)
                {
                    var first = collection.first();
                    if (first)
                    {
                        this.loadFormulation(first.json.batch);
                    }
                }
            }
        }, this, {single: true});
    },

    loadFormulation : function(materialName)
    {
        this.getEl().mask("Loading Formulation...");
        this.formPanel.getForm().load({
            url : LABKEY.ActionURL.buildURL('idri', 'getFormulation.api'),
            method : 'GET',
            params : {materialName: materialName},
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
    
    materialFromJSON : function(ff, v, rec)
    {
        if (rec)
        {
            var materials = rec.materials; // Array of Material objects
            var cmp;
            for (var i = 0; i < materials.length; i++) {
                cmp = ff.materialMap['material' + i];
                if (cmp) {                    
                }
                else {
                    ff.add(ff.getFormItems()); // This will add to the materalMap
                    ff.doLayout();
                }
                cmp = ff.materialMap['material' + i];               
                cmp.fireEvent('loadMaterial', cmp, materials[i]);
            }
        }
    },

    getFormulationsStore : function()
    {
        return new Ext.data.JsonStore({
            fields : ['comments', {name: 'dm', type:'date'}, 'batch', 'batchsize', 'rowID'],
            idProperty : 'batch',
            data   : this.formulations
        });
    },

    getFormulationItems : function()
    {
        var ff = this;
        return new Ext.FormPanel({
            labelAlign : 'top',
            width : 575,
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
                    {name: 'material', convert: function(v, rec){
                        ff.materialFromJSON(ff, v, rec);
                    }}
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
                        width : 200
                    },
                    items  : [{
                        id: 'lot-field-id',
                        xtype : 'textfield',
                        fieldLabel : 'Lot Number*',
                        name : 'batch',
                        enableKeyEvents: true,
                        allowBlank : false,
                        validateOnBlur : false,
                        validationEvent: false,
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

                                                    this.formPanel.getForm().reset();
                                                    this.resetMaterials();

                                                    if (id == 'yes')
                                                    {
                                                        this.showMsg("");
                                                        this.loadFormulation(val);
                                                    }
                                                    else
                                                    {
                                                        this.isUpdate = false;
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
                        xtype          : 'combo',
                        fieldLabel     : 'Formulation Type*',
                        name           : 'type',
                        triggerAction  : 'all',
                        typeAhead      : true,
                        allowBlank     : false,
                        editable       : false,
                        validateOnBlur : false,
                        displayField   : 'type',
                        store          : new LABKEY.ext.Store({
                            schemaName : 'lists',
                            queryName  : 'FormulationTypes'
                        }),
                        scope          : this
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
                        width : 150
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
    },

    getMaterialItems : function(parentID)
    {
        var btnID = Ext.id();
        var _id = 'material' + this.materialCount;
        this.materialCount += 1;
        this.materialMap[_id] = new Ext.form.ComboBox({
            id : _id,
            fieldLabel : 'Material',
            name  : 'materialName',
            valueField : 'materialName',
            displayField : 'materialName',
            mode : 'local',
            width : 130,
            triggerAction : 'all',
            store : this.materialStore,
            emptyText : 'Choose Material',
            typeAhead : true,
            forceSelection : true,
            parentId : parentID,
            btnId : btnID,
            allowBlank : false,
            listeners : {
                select : this.onMaterialSelect,
                loadMaterial : this.onMaterialLoad,
                scope : this
            },
            scope : this
        });

        return [this.materialMap[_id]];
    },

    getFormItems : function(addRemoveButton)
    {
        if (this.materialCount < 0){
            this.materialCount += 1;
            return new Ext.Panel({
                hidden : true
            });
        }
        var _id = Ext.id();
        var fp = new Ext.FormPanel({
            id : _id,
            layout : 'hbox',
            layoutConfig : {
                extraCls : 'material-xtra'
            },
            bodyStyle : 'padding: 4px 0;',
            hideLabel : true, border: false, frame : false,
            items : this.getMaterialItems(_id),
            scope : this
        });
        if (addRemoveButton) {
            fp.add({
                ref   : 'removebtn',
                width : 55,
                template : new Ext.Template('<div><a>{0}</a></div>'),
                buttonSelector : 'a',
                xtype : 'button',
                text  : 'Remove',
                handler: function(btn) {
                    fp.destroy();
                }
            });
        }
        return fp;
    },

    resetMaterials : function()
    {
        var count = this.materialCount;
        while (count >= 0)
        {
            var cmp = Ext.getCmp('material' + count);
            if (cmp && cmp.parentId) {
                var p = Ext.getCmp(cmp.parentId);
                if (p) {
                    p.destroy();
                }
            }
            count = count - 1;
        }

        this.materialsPanel.removeAll(); //precaution
        this.materialsPanel.doLayout();
        this.materialCount = 0;
        this.materialMap = {};
        this.materialsPanel.doLayout();
        
        this.formPanel.getForm().cleanDestroyed();
    },

    onCreateFormulation : function()
    {
        var formulation = this.validateSubmit();

        if (formulation)
        {
            var me = this;
            var onFailure = function(response)
            {
                me.getEl().unmask();
                if (response && response.responseText) {
                    var decode = Ext.decode(response.responseText);
                    if (decode && decode.errors) {
                        me.showMsg(decode.errors[0].message, true);
                        return;
                    }
                }
                me.showMsg("Failed to Save.", true);
            };

            this.getEl().mask("Saving Formulation...");
            Ext.Ajax.request({
                method : 'POST',
                url : LABKEY.ActionURL.buildURL("idri", "saveFormulation.api"),
                jsonData : formulation,
                success : this.onSaveFormulation,
                failure : onFailure,
                scope: this
            });
        }
    },


    //
    // Expects response of idri/saveFormulation action
    //
    onSaveFormulation : function(response)
    {
        var obj = Ext.decode(response.responseText);
        if (obj.errors)
        {
            onFailure(response);
            return;
        }
        this.formulations.push(obj.formulation);
        this.formulationStore = this.getFormulationsStore();
        this.getEl().unmask();
        var mainParams = {
            'rowId': obj.formulation['rowID']
        };
        var _link = LABKEY.ActionURL.buildURL("idri", "formulationDetails.view", LABKEY.ActionURL.getContainer(), mainParams);
        this.showMsg("Formulation : <a href='" + _link + "'>" + obj.formulation.batch + "</a> has been " + (this.isUpdate ? "updated." : "created."), false);
        var cmp = Ext.getCmp('stability-check');
        if (cmp && cmp.getValue())
        {
            this.informStabilityGroup();
        }

        cmp = Ext.getCmp('submit-formulation-btn');
        if (cmp)
        {
            cmp.setText('Create');
        }
        this.isUpdate = false;
        this.formPanel.getForm().reset();
        this.resetMaterials();
    },


    informStabilityGroup : function()
    {
        var getUserConfig = {
            groupId : 1043, // 'Stability'
            success : function(usersInfo, response)
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
                    successCallback : function(result)
                    {
                        console.info("Email(s) sent successfully.");
                    },
                    errorCallback : function(errorInfo, responseObj)
                    {
                        LABKEY.Utils.displayAjaxErrorResponse(responseObj, errorInfo);
                    }
                });
            },
            failure : function(errorInfo, response)
            {
                console.info("Failed to send email.");
            },
            scope: this
        };

        LABKEY.Security.getUsers(getUserConfig);
    },


    onMaterialLoad : function(combo, material)
    {
        if (!material || (!material.materialName && (!material.material || !material.material.materialName)))
        {
            Ext.Msg.alert('Failed to Load Material', 'Unable to load material information.');
            return;
        }

        combo.setValue((material.materialName || material.material.materialName));
        var parent = Ext.getCmp(combo.parentId);
        
        if (material.concentration == 0)
            material.concentration = "";

        parent.add({
            ref   : 'conc',
            xtype : 'numberfield',
            name  : 'concentration',
            hideLabel : true,
            width : 60,
            decimalPrecision : 4,
            allowBlank : false,
            validateOnBlur : false,
            value : material.concentration
        },{
            ref : 'unittype',
            xtype: 'box',
            width : 70,
            autoEl : {
                tag : 'span',
                html: (material.typeUnit || material.material.unit)
            }
        },{
            ref   : 'removebtn',
            width : 55,
            template : new Ext.Template('<div><a>{0}</a></div>'),
            buttonSelector : 'a',
            xtype : 'button',
            text  : 'Remove',
            handler: function(btn) {
                parent.destroy();
            }
        },{
            ref   : 'typeid',            
            xtype : 'hidden',
            name  : 'typeID',
            value : material.typeID
        });

        if (material.type && material.type.key) {
            parent.add({
                ref   : 'typekey',
                xtype : 'hidden',
                name  : 'typeKey',
                value : material.type.key
            });
        }

        parent.doLayout();
        parent.conc.clearInvalid();
    },


    onMaterialSelect : function(cb, rec, idx)
    {
        var parent = Ext.getCmp(cb.parentId);
        
        parent.getEl().mask("Loading Material...");
        Ext.Ajax.request({
            method : 'GET',
            url    : LABKEY.ActionURL.buildURL("idri", "getMaterialType.api",
                    LABKEY.ActionURL.getContainer(), {materialName : rec.get('materialName')}),
            success: function(response, e)
            {
                var json = Ext.util.JSON.decode(response.responseText);
                if (parent.conc)
                {
                    parent.conc.setValue(undefined);
                    parent.conc.clearInvalid();
                    parent.unittype.update("<span>" + json.material.unit + "</span>");
                    parent.typeid.setValue(json.material.typeID);
                    parent.getEl().unmask();
                    parent.doLayout();
                }
                else
                {
                    parent.remove(parent.removebtn);
                    this.onMaterialLoad(cb, json);
                }
                parent.getEl().unmask();
            },
            failure: function(response, opts)
            {
                parent.getEl().unmask();
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
            var cmp = Ext.getCmp('material' + i);
            if (cmp) {
                var parent = cmp.findParentByType('form');
                if (parent.getForm().isValid())
                    formulation.materials.push(parent.getForm().getValues());
                else
                {
                    this.showMsg("> Invalid material.", true);
                    return false;
                }
            }
        }
        
        return formulation;
    }
});
