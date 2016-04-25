/*
 * Copyright (c) 2011-2015 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext.namespace("LABKEY.idri");

LABKEY.idri.FormulationPanel = Ext.extend(Ext.Panel, {

    buttonAlign: 'left',

    border: false,

    frame: false,

    hasStabilityProfile: false,

    isUpdate: false,

    initComponent : function() {
        this.materialCount = -1;

        this.materialMap = {};
        this.materialsPanel = this.generateMaterialsForm();

        this.buttons = [{
            id: 'add-button',
            text: 'Add Another Material',
            handler: function() {
                this.add(this.generateMaterialsForm(true));
                this.doLayout();
            },
            scope: this
        },{
            id: 'submit-formulation-btn',
            text: 'Create',
            handler: this.onCreateFormulation,
            scope: this
        }];

        this.items = [
            {
                itemId: 'dialogPanel',
                html: '',
                border: false,
                frame: false,
                hidden: true,
                style: {
                    padding: '7px'
                }
            },
            this.getForm(),
            this.materialsPanel
        ];

        LABKEY.idri.FormulationPanel.superclass.initComponent.apply(this, arguments);

        this.on('afterrender', function() {
            // Ext4 is used here as the Stability/TaskList is Ext 4.x based
            Ext4.onReady(function() {
                this._loadStores(function() {
                    var urlRowID = LABKEY.ActionURL.getParameter('RowId');
                    if (urlRowID) {
                        var formulation = this.getFormulationsStore().getById(urlRowID);
                        if (formulation) {
                            this.loadFormulation(formulation);
                        }
                    }
                }, this);
            }, this);
        }, this, {single: true});
    },

    _loadStores : function(callback, scope) {
        var loadCount = 0;
        function handleLoad() {
            loadCount++;
            if (loadCount == 4) {
                if (Ext.isFunction(callback)) {
                    callback.call(scope || this);
                }
            }
        }

        this.getFormulationsStore().load({callback: handleLoad});
        this.getLotMaterialsStore().load({callback: handleLoad});

        /* NOTE: These are ExtJS 4.x stores */
        this.getStabilityStore().load(handleLoad);
        this.getTaskListStore().load(handleLoad);
    },

    getFormulationsStore : function() {
        if (!this.formulationsStore) {
            this.formulationsStore = new LABKEY.ext.Store({
                schemaName: 'samples',
                queryName: 'Formulations'
            });
        }

        return this.formulationsStore;
    },

    getLotMaterialsStore : function() {
        if (!this.materialsStore) {
            this.materialsStore = new LABKEY.ext.Store({
                schemaName: 'idri',
                queryName: 'LotMaterials'
            });
        }

        return this.materialsStore;
    },

    getStabilityStore : function() {
        if (!this.stabilityStore) {
            this.stabilityStore = new LABKEY.ext4.Store({
                schemaName: 'lists',
                queryName: 'StabilityProfile'
            });
        }

        return this.stabilityStore;
    },

    getTaskListStore : function() {
        if (!this.taskListStore) {
            this.taskListStore = new LABKEY.ext4.Store({
                schemaName: 'lists',
                queryName: 'TaskList'
            });
        }

        return this.taskListStore;
    },

    loadFormulation : function(formulation) {
        this.getEl().mask('Loading Formulation...');

        this.getForm().getForm().loadRecord(formulation);

        var batch = formulation.get('Batch');
        var rowId = formulation.get('RowId');

        this.lastChecked = rowId;
        this.isUpdate = true;
        this.getSubmitBtn().setText('Save Changes');

        if (this.getStabilityStore().findExact('lotNum', rowId)) {
            this.setStabilityWatch(true);
            this.hasStabilityProfile = true;
        }

        /* In addition the the formulation record this will request any material components */
        LABKEY.Ajax.request({
            url: LABKEY.ActionURL.buildURL('idri', 'getFormulation.api'),
            method: 'GET',
            params: {
                materialName: batch
            },
            success: function(response) {
                var json = Ext.decode(response.responseText);
                this.loadMaterials(formulation, json.formulation.materials);

                this.getEl().unmask();
            },
            failure : function() {
                Ext.msg.alert('Failure', 'Failed to retrieve material information for lot "' + Ext4.htmlEncode(batch) + '".');
                this.getEl().unmask();
            },
            scope: this
        });
    },

    loadMaterials : function(formulation, materials) {
        Ext.each(materials, function(mat, i) {
            if (!this.materialMap['material' + i]) {
                this.add(this.generateMaterialsForm()); // This will add to the materialMap
                this.doLayout();
            }

            var cmp = this.materialMap['material' + i];
            cmp.fireEvent('loadMaterial', cmp, mat);
        }, this);
    },

    showMsg : function(msg, error) {
        var dialogPanel = this.getComponent('dialogPanel');

        if (dialogPanel) {
            if (msg.length == 0)
                dialogPanel.hide();
            else
                dialogPanel.show();

            if (error)
                dialogPanel.update('<span style="color: red;">' + msg + '</span>');
            else
                dialogPanel.update('<span style="color: green;">' + msg + '</span>');
        }
    },

    getForm : function() {

        if (!this.formPanel) {

            this.formPanel = new Ext.FormPanel({
                labelAlign: 'top',
                width: 575,
                border: false,
                frame: false,
                items: [{
                    layout: 'column',
                    border: false,
                    frame: false,
                    items: [{
                        columnWidth: .4,
                        layout: 'form',
                        border: false,
                        frame: false,
                        defaults: {
                            labelSeparator: '',
                            width: 200
                        },
                        items: [{
                            id: 'lot-field-id',
                            xtype: 'textfield',
                            fieldLabel: 'Lot Number*',
                            name: 'Batch',
                            enableKeyEvents: true,
                            allowBlank: false,
                            validateOnBlur: false,
                            validationEvent: false,
                            listeners: {
                                specialkey : function(field, e) {
                                    if (e.getKey() == e.ENTER) {
                                        field.fireEvent('blur', field);
                                    }
                                },
                                blur : function(field) {
                                    field.setValue(field.getValue().toUpperCase());
                                    var val = field.getValue();

                                    if (!val) {
                                        return;
                                    }

                                    this.getFormulationsStore().each(function(formulation) {

                                        var batch = formulation.get('Batch');

                                        if (batch === val) {

                                            var rowId = formulation.get('RowId');

                                            if (this.lastChecked == rowId) {
                                                return;
                                            }
                                            this.lastChecked = rowId;

                                            Ext.Msg.show({
                                                title: 'Load ' + Ext4.htmlEncode(batch) + '?',
                                                msg: Ext4.htmlEncode(batch) + ' already exists. Would you like to load the formulation?',
                                                buttons: Ext.Msg.YESNO,
                                                closable: false,
                                                fn: function(id) {
                                                    if (id == 'yes') {
                                                        this.getForm().getForm().reset();
                                                        this.resetMaterials();

                                                        this.showMsg('');
                                                        this.loadFormulation(formulation);
                                                    }
                                                },
                                                icon: Ext.MessageBox.QUESTION,
                                                scope: this
                                            });

                                            return false;
                                        }
                                    }, this);
                                },
                                scope: this
                            },
                            scope: this
                        },{
                            xtype: 'combo',
                            fieldLabel: 'Formulation Type*',
                            name: 'Type',
                            triggerAction: 'all',
                            typeAhead: true,
                            allowBlank: false,
                            editable: false,
                            validateOnBlur: false,
                            displayField: 'type',
                            store: new LABKEY.ext.Store({
                                schemaName: 'lists',
                                queryName: 'FormulationTypes'
                            }),
                            scope: this
                        },{
                            xtype: 'textarea',
                            fieldLabel: 'Comments',
                            name: 'Comments'
                        }],
                        scope: this
                    },{
                        columnWidth: .5,
                        layout: 'form',
                        border: false,
                        frame: false,
                        defaults: {
                            labelSeparator: '',
                            width: 150
                        },
                        items : [{
                            xtype: 'datefield',
                            fieldLabel: 'Date of Manufacture*',
                            name: 'DM',
                            allowBlank: false,
                            validateOnBlur: false
                        },{
                            xtype: 'numberfield',
                            fieldLabel: 'Batch Size*',
                            name: 'batchsize',
                            allowBlank: false,
                            validateOnBlur: false
                        },{
                            xtype: 'textfield',
                            fieldLabel: 'Notebook Page*',
                            name: 'nbpg',
                            allowBlank: false,
                            validateOnBlur: false
                        },{
                            id: 'stability-check',
                            xtype: 'checkbox',
                            fieldLabel: 'Stability Watch',
                            name: 'stability'
                        }]
                    }],
                    scope: this
                }],
                scope: this
            });
        }

        return this.formPanel;
    },

    onStabilityWatch : function() {
        var sb = Ext.getCmp('stability-check'),
            onStability = false;

        if (sb) {
            onStability = sb.getValue() === true;
        }
        else {
            console.error('Unable to determine stability watch state. Cannot find form element.');
        }

        return onStability;
    },

    setStabilityWatch : function(onStability) {
        var sb = Ext.getCmp('stability-check');

        if (sb) {
            sb.setValue(onStability === true)
        }
        else {
            console.error('Unable to set stability watch state. Cannot find form element.');
        }
    },

    getMaterialItems : function(parentID) {
        var btnID = Ext.id();
        var _id = 'material' + this.materialCount;
        this.materialCount++;

        var data = [];
        this.getLotMaterialsStore().each(function(lotMaterial) {
            data.push([lotMaterial.get('Name')]);
        });

        this.materialMap[_id] = new Ext.form.ComboBox({
            id: _id,
            fieldLabel: 'Material',
            name: 'materialName',
            valueField: 'materialName',
            displayField: 'materialName',
            mode: 'local',
            width: 130,
            triggerAction: 'all',
            store: new Ext.data.ArrayStore({
                fields: ['materialName'],
                data: data
            }),
            emptyText: 'Choose Material',
            typeAhead: true,
            forceSelection: true,
            parentId: parentID,
            btnId: btnID,
            allowBlank: false,
            listeners: {
                select: this.onMaterialSelect,
                loadMaterial: this.onMaterialLoad,
                scope: this
            },
            scope: this
        });

        return [this.materialMap[_id]];
    },

    generateMaterialsForm : function(addRemoveButton) {
        if (this.materialCount < 0){
            this.materialCount++;
            return new Ext.Panel({
                hidden: true
            });
        }

        var _id = Ext.id();
        var fp = new Ext.FormPanel({
            id: _id,
            layout: 'hbox',
            layoutConfig: {
                extraCls: 'material-xtra'
            },
            bodyStyle: 'padding: 4px 0;',
            hideLabel: true,
            border: false,
            frame: false,
            items: this.getMaterialItems(_id),
            scope: this
        });

        if (addRemoveButton) {
            fp.add({
                itemId: 'removebtn',
                width: 55,
                template: new Ext.Template('<div><a>{0}</a></div>'),
                buttonSelector: 'a',
                xtype: 'button',
                text: 'Remove',
                handler: function() {
                    fp.destroy();
                }
            });
        }

        return fp;
    },

    resetMaterials : function() {
        var count = this.materialCount;
        while (count >= 0) {
            var cmp = Ext.getCmp('material' + count);
            if (cmp && cmp.parentId) {
                var p = Ext.getCmp(cmp.parentId);
                if (p) {
                    p.destroy();
                }
            }
            count = count - 1;
        }

        this.materialCount = 0;
        this.materialMap = {};
        this.materialsPanel.removeAll(); //precaution
        this.materialsPanel.doLayout();

        this.getForm().getForm().cleanDestroyed();
    },

    onCreateFormulation : function() {
        var formulation = this.validateSubmit();

        if (formulation) {

            this.getEl().mask('Saving Formulation...');

            Ext.Ajax.request({
                url: LABKEY.ActionURL.buildURL('idri', 'saveFormulation.api'),
                method: 'POST',
                jsonData: formulation,
                success: this.onSaveFormulation,
                failure: function(response) {
                    this.getEl().unmask();
                    if (response && response.responseText) {
                        var decode = Ext.decode(response.responseText);
                        if (decode) {
                            if (decode.errors) {
                                this.showMsg(decode.errors[0].message, true);
                                return;
                            }
                            else if (decode.exception) {
                                this.showMsg(decode.exception, true);
                                return;
                            }
                        }
                    }
                    this.showMsg('Failed to Save.', true);
                },
                scope: this
            });
        }
    },


    //
    // Expects response of idri/saveFormulation action
    //
    onSaveFormulation : function(response) {

        this.getEl().unmask();
        var obj = Ext.decode(response.responseText);
        if (obj.errors) {
            onFailure(response);
            return;
        }

        var savedRowId = obj.formulation.rowID;
        var onStability = this.onStabilityWatch();
        var hasProfile = this.hasStabilityProfile;

        /* display a message to the user -- linking to the newly created/updated lot */
        var localHref = LABKEY.ActionURL.buildURL('project', 'begin', null, {
            rowId: savedRowId,
            pageId: 'idri.LOT_SUMMARY'
        });
        this.showMsg("Formulation : <a href='" + localHref + "'>" + Ext4.htmlEncode(obj.formulation.batch) + "</a> has been " + (this.isUpdate ? "updated." : "created."), false);

        /* reset back to the initial state */
        this.getSubmitBtn().setText('Create');
        this.isUpdate = false;
        this.hasStabilityProfile = false;
        this.getForm().getForm().reset();
        this.resetMaterials();

        /* reload the stores to pickup latest formulation information */
        this._loadStores(function() {

            if (onStability) {
                if (hasProfile) {
                    Ext.Msg.show({
                        title: 'Stability Profile',
                        msg: 'Would you like to change the Stability Profile?<br/>Note, changing the Stability Profile will delete all tasks and create new ones.',
                        buttons: Ext.Msg.YESNO,
                        fn: function(id) {
                            if (id == 'yes') {
                                this.showTaskWindow(obj.formulation);
                            }
                        },
                        icon: Ext.MessageBox.QUESTION,
                        scope: this
                    });
                }
                else {
                    this.informStabilityGroup(obj, localHref);
                    this.showTaskWindow(obj.formulation);
                }
            }
            else if (hasProfile) {
                Ext.Msg.show({
                    title: 'Removed From Stability Watch',
                    msg: 'This formulation was taken off stability watch. Would you like to remove related tasks?',
                    buttons: Ext.Msg.YESNO,
                    fn: function (id) {
                        if (id == 'yes') {
                            var stabilityStore = this.getStabilityStore();
                            var taskListStore = this.getTaskListStore();

                            var removeTasks = function() {
                                var removed = [];

                                Ext.each(taskListStore.getRange(), function(task) {
                                    if (task.get('lotNum') === savedRowId) {
                                        removed.push(task);
                                    }
                                });

                                if (removed.length) {
                                    taskListStore.remove(removed);
                                    taskListStore.sync();
                                }
                            };

                            var stabilityProfile = stabilityStore.findRecord('lotNum', savedRowId);
                            if (stabilityProfile) {
                                stabilityStore.remove(stabilityProfile);
                                stabilityStore.sync({
                                    success: function() {
                                        removeTasks.call(this);
                                    },
                                    scope: this
                                });
                            }
                            else {
                                removeTasks.call(this);
                            }
                        }
                    },
                    icon: Ext.MessageBox.QUESTION,
                    scope: this
                });
            }
        }, this);
    },

    showTaskWindow : function(formulation) {
        Ext4.onReady(function() {
            var window = Ext4.create('Ext.window.Window', {
                title: 'Stability Profile',
                height: 425,
                width: 625,
                bodyStyle: 'padding:5px; padding-top; 30px;',
                items: [{
                    xtype: 'idri-taskpanel',
                    rowId: formulation.rowID,
                    listeners: {
                        profilecreated: function() {
                            if (window) {
                                window.close();
                            }
                        }
                    }
                }],
                autoShow: true
            });
        });
    },

    resolveStabilityGroup : function(callback, scope) {
        LABKEY.Security.getGroupPermissions({
            includeSubfolders: false,
            success: function(permissions) {
                // determine the 'Stability' group
                var stabilityGrp;
                if (permissions && permissions.container && Ext.isArray(permissions.container.groups)) {
                    Ext.each(permissions.container.groups, function(grp) {
                        if (grp.name && grp.name.toLowerCase() === 'stability') {
                            stabilityGrp = grp;
                            return false;
                        }
                    });
                }

                if (stabilityGrp) {
                    if (Ext.isFunction(callback)) {
                        callback.call(scope || this, stabilityGrp);
                    }
                }
                else {
                    Ext.Msg.alert('Stability Watch', 'Unable to resolve \'Stability\' group to place this lot on stability watch. Please inform an administrator.');
                }
            },
            failure: function() {
                Ext.Msg.alert('Stability Watch', 'Failed to resolve group permissions. Please inform an administrator.');
            }
        });
    },

    resolveStabilityUsers : function(callback, scope) {
        this.resolveStabilityGroup(function(group) {
            LABKEY.Security.getUsers({
                groupId: group.id,
                success: function(usersInfo) {
                    var users = usersInfo.users,
                        recipients = [], i = 0;

                    for (; i < users.length; i++) {
                        recipients.push(LABKEY.Message.createRecipient(LABKEY.Message.recipientType.to, users[i].email));
                    }

                    if (Ext.isFunction(callback)) {
                        callback.call(scope || this, recipients);
                    }
                },
                failure : function() {
                    Ext.Msg.alert('Stability Watch', 'Failed to resolve stability users. Please inform an administrator.');
                }
            });
        }, this);
    },

    informStabilityGroup : function(obj, localHref) {
        this.resolveStabilityUsers(function(emails) {

            if (Ext.isArray(emails) && emails.length) {

                var link = [
                    window.location.origin,
                    localHref
                ].join('');

                var emailContent = [
                    '<h4>Stability Review Requested</h4>',
                    'Formulation : <a href=\"' + link + '\">' + Ext4.htmlEncode(obj.formulation.batch) + '</a> has been processed.',
                    '<br/><br/>IDRI LabKey Administration Team'
                ].join('');

                LABKEY.Message.sendMessage({
                    msgFrom: 'ops@labkey.com',
                    msgSubject: 'Formulation added on LabKey',
                    msgRecipients: emails,
                    msgContent: [
                        LABKEY.Message.createMsgContent(LABKEY.Message.msgType.html, emailContent)
                    ],
                    successCallback : function(result) {
                        console.info("Email(s) sent successfully.");
                    },
                    errorCallback : function(errorInfo, responseObj) {
                        LABKEY.Utils.displayAjaxErrorResponse(responseObj, errorInfo);
                    }
                });
            }
            else {
                console.log('Stability watch: No users found.');
            }

        }, this);
    },

    onMaterialLoad : function(combo, material) {
        if (!material || !material.materialName) {
            Ext.Msg.alert('Failed to Load Material', 'Unable to load material information.');
            return;
        }

        combo.setValue(material.materialName);
        var parent = Ext.getCmp(combo.parentId);
        
        if (material.concentration == 0) {
            material.concentration = '';
        }

        var removeBtn = parent.getComponent('removebtn');
        if (removeBtn) {
            parent.remove(removeBtn);
        }

        var items = [{
            ref: 'conc',
            xtype: 'numberfield',
            name: 'concentration',
            hideLabel: true,
            width: 60,
            decimalPrecision: 4,
            allowBlank: false,
            validateOnBlur: false,
            value: material.concentration
        },{
            ref: 'unittype',
            xtype: 'box',
            width: 70,
            autoEl: {
                tag: 'span',
                html: (material.typeUnit || material.unit)
            }
        },{
            itemId: 'removebtn',
            width: 55,
            template: new Ext.Template('<div><a>{0}</a></div>'),
            buttonSelector: 'a',
            xtype: 'button',
            text: 'Remove',
            handler: function() {
                parent.destroy();
            }
        },{
            ref: 'typeid',
            xtype: 'hidden',
            name: 'typeID',
            value: material.typeID
        }];

        if (material.type && material.type.key) {
            items.push({
                ref: 'typekey',
                xtype: 'hidden',
                name: 'typeKey',
                value: material.type.key
            });
        }

        parent.add(items);
        parent.doLayout();
        parent.conc.clearInvalid();
    },

    onMaterialSelect : function(cb, rec) {
        var parent = Ext.getCmp(cb.parentId);
        parent.getEl().mask('Loading Material...');

        Ext.Ajax.request({
            url: LABKEY.ActionURL.buildURL('idri', 'getMaterialType.api', undefined, {
                materialName: rec.get('materialName')
            }),
            method: 'GET',
            success: function(response) {
                parent.getEl().unmask();

                var json = Ext.decode(response.responseText);
                var material = json.material;

                if (parent.conc) {
                    parent.conc.setValue(undefined);
                    parent.conc.clearInvalid();
                    parent.unittype.update("<span>" + material.unit + "</span>");
                    parent.typeid.setValue(material.typeID);
                    parent.doLayout();
                }
                else {
                    this.onMaterialLoad(cb, material);
                }
            },
            failure: function(response, opts) {
                parent.getEl().unmask();

                LABKEY.Utils.displayAjaxErrorResponse(response, opts);
            },
            scope : this
        });
    },
    
    validateSubmit : function() {
        this.showMsg('');
        var insertFormulation = {};
        var form = this.getForm().getForm();

        /* Get Formulation values (not materials) */
        if (form.isValid()) {
            Ext.apply(insertFormulation, form.getValues());
        }
        else {
            this.showMsg("> Please correct the following errors.", true);
            return false;
        }

        /* remap known fields */
        insertFormulation['batch'] = insertFormulation['Batch'];
        insertFormulation['comments'] = insertFormulation['Comments'];
        insertFormulation['dm'] = insertFormulation['DM'];
        insertFormulation['type'] = insertFormulation['Type'];

        /* remove extraneous fields */
        delete insertFormulation['Batch'];
        delete insertFormulation['Comments'];
        delete insertFormulation['DM'];
        delete insertFormulation['Type'];
        delete insertFormulation['@stability'];
        delete insertFormulation['stability'];

        /* Get Material values */
        insertFormulation.materials = [];
        for (var i = 0; i <= this.materialCount; i++) {
            var cmp = Ext.getCmp('material' + i);
            if (cmp) {
                var parent = cmp.findParentByType('form');
                if (parent.getForm().isValid())
                    insertFormulation.materials.push(parent.getForm().getValues());
                else
                {
                    this.showMsg("> Invalid material.", true);
                    return false;
                }
            }
        }
        
        return insertFormulation;
    },

    getSubmitBtn : function() {
        var btn = Ext.getCmp('submit-formulation-btn');
        if (!btn) {
            console.error('Unable to find submit button.');
        }
        return btn;
    }
});
