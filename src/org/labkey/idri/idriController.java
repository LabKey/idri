/*
 * Copyright (c) 2011-2014 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.labkey.idri;

import org.json.JSONObject;
import org.labkey.api.action.ApiAction;
import org.labkey.api.action.ApiResponse;
import org.labkey.api.action.ApiSimpleResponse;
import org.labkey.api.action.CustomApiForm;
import org.labkey.api.action.FormViewAction;
import org.labkey.api.action.MutatingApiAction;
import org.labkey.api.action.SimpleViewAction;
import org.labkey.api.action.SpringActionController;
import org.labkey.api.data.ContainerFilter;
import org.labkey.api.data.DataRegion;
import org.labkey.api.data.RuntimeSQLException;
import org.labkey.api.data.TableInfo;
import org.labkey.api.exp.api.ExpData;
import org.labkey.api.exp.api.ExpMaterial;
import org.labkey.api.exp.api.ExpRun;
import org.labkey.api.exp.api.ExpSampleSet;
import org.labkey.api.exp.api.ExperimentService;
import org.labkey.api.exp.query.ExpDataTable;
import org.labkey.api.exp.query.ExpMaterialTable;
import org.labkey.api.exp.query.ExpSchema;
import org.labkey.api.exp.query.SamplesSchema;
import org.labkey.api.files.FileContentService;
import org.labkey.api.pipeline.PipeRoot;
import org.labkey.api.pipeline.PipelineService;
import org.labkey.api.query.FieldKey;
import org.labkey.api.query.QuerySettings;
import org.labkey.api.query.QueryUpdateService;
import org.labkey.api.query.QueryView;
import org.labkey.api.query.UserSchema;
import org.labkey.api.security.RequiresPermissionClass;
import org.labkey.api.security.permissions.ReadPermission;
import org.labkey.api.security.permissions.UpdatePermission;
import org.labkey.api.services.ServiceRegistry;
import org.labkey.api.util.FileUtil;
import org.labkey.api.util.URLHelper;
import org.labkey.api.util.UnexpectedException;
import org.labkey.api.view.JspView;
import org.labkey.api.view.NavTree;
import org.labkey.api.view.VBox;
import org.labkey.api.view.ViewContext;
import org.labkey.api.view.WebPartView;
import org.labkey.api.webdav.WebdavResource;
import org.labkey.api.webdav.WebdavService;
import org.labkey.idri.assay.hplc.HPLCAssayDataHandler;
import org.labkey.idri.model.Formulation;
import org.labkey.idri.model.Material;
import org.springframework.validation.BindException;
import org.springframework.validation.Errors;
import org.springframework.web.servlet.ModelAndView;

import java.io.File;
import java.net.MalformedURLException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class idriController extends SpringActionController
{
    private static final DefaultActionResolver _actionResolver = new DefaultActionResolver(idriController.class);

    public idriController()
    {
        setActionResolver(_actionResolver);
    }

    public static class ExpObjectForm
    {
        private int _rowId;
        private String _name;

        public int getRowId()
        {
            return _rowId;
        }

        public void setRowId(int rowId)
        {
            _rowId = rowId;
        }

        public String getName()
        {
            return _name;
        }

        public void setName(String name)
        {
            _name = name;
        }
    }

    @RequiresPermissionClass(ReadPermission.class)
    public class GetDerivationGraphDescriptionAction extends ApiAction<MaterialTypeForm>
    {
        private String start;
        private String nodeDefinition;
        private String options;
        private String links;
        private String link;
        private String sep;
        private String end;

        @Override
        public ApiResponse execute(MaterialTypeForm form, BindException errors) throws Exception
        {
            start = "digraph Derivations {";
            nodeDefinition = "node [shape=circle, fixedsize=true, width=0.9]; ";
            options = "overlap=false;label=\"Derivations Graph\";";
            links = "";
            link = "->";
            sep = ";";
            end   = "}";

            getFormulationGraph(form.getMaterialName());

            // compile description
            String description = start + nodeDefinition + links + options + end;

            ApiSimpleResponse response = new ApiSimpleResponse();
            response.put("description", description);
            response.put("success", true);

            return response;
        }

        private void getFormulationGraph(String formulationName)
        {
            Formulation formulation = idriManager.getFormulation(formulationName);
            String _link;
            if (formulation != null)
            {
                nodeDefinition += formulation.getBatch() + sep;
                for (Material m : formulation.getMaterials())
                {
                    String legalName = m.getMaterialName().replace("-","");

                    // recurisely build other formulations
                    if (idriManager.getMaterialType(m.getMaterialName()).equals("aggregate"))
                        getFormulationGraph(m.getMaterialName());

                    // construct node definition
                    nodeDefinition += legalName + sep;
                    if (m.getCompound() != null)
                    {
                        nodeDefinition += m.getCompound().getName() + sep;

                        // material to compound link
                        _link = legalName + link + m.getCompound().getName() + sep;
                        if (!links.contains(_link))
                            links += _link;
                    }

                    // formulation to material link
                    _link = formulation.getBatch() + link + legalName + sep;
                    if (!links.contains(_link))
                        links += _link;
                }

            }
        }
    }

    @RequiresPermissionClass(ReadPermission.class)
    public class CreateFormulationAction extends SimpleViewAction
    {
        @Override
        public ModelAndView getView(Object o, BindException errors) throws Exception
        {
            return new JspView("/org/labkey/idri/view/createFormulation.jsp");
        }

        @Override
        public NavTree appendNavTrail(NavTree root)
        {
            return root;
        }
    }

    public static class SaveFormulationForm implements CustomApiForm
    {
        private Map<String, Object> _formulationProps;
        
        @Override
        public void bindProperties(Map<String, Object> props)
        {
            _formulationProps = props;
        }

        public Map<String, Object> getFormuluationProps()
        {
            return _formulationProps;
        }
    }
    
    @RequiresPermissionClass(UpdatePermission.class)
    public class SaveFormulationAction extends MutatingApiAction<SaveFormulationForm>
    {
        Formulation _formulation;
        
        @Override
        public void validateForm(SaveFormulationForm form, Errors errors)
        {
            JSONObject formulationProps = (JSONObject)form.getFormuluationProps();
            if (null == formulationProps || formulationProps.size() == 0)
                errors.reject(ERROR_MSG, "No Formulation Properties were posted to the server.");

            _formulation = Formulation.fromJSON(formulationProps);
            if (null == _formulation.getBatch() || _formulation.getBatch().length() == 0)
                errors.reject(ERROR_MSG, "Formulation Provided does not have a lot name.");

            String batch = _formulation.getBatch();
            if (!batch.startsWith("QD") && !batch.startsWith("QF") && !batch.startsWith("TD"))
            {
                errors.reject(ERROR_MSG, "Formulations must start TD, QF, or QD.");
            }

            validateSourceMaterials(errors);
        }

        private Boolean validateSourceMaterials(Errors errors)
        {
            List<Material> materials = _formulation.getMaterials();
            if (materials.size() <= 0)
                errors.reject(ERROR_MSG, "A minimum of one source material is required.");

            Set<Material> setMaterial = new HashSet<>(materials);
            if (setMaterial.size() < materials.size())
                errors.reject(ERROR_MSG, "Duplicate source materials are not allowed. Please check your source materials.");
            
            return false;
        }
        
        @Override
        public ApiResponse execute(SaveFormulationForm form, BindException errors) throws Exception
        {
            Formulation saved = idriManager.saveFormulation(_formulation, getUser(), getContainer());
            
            ApiSimpleResponse resp = new ApiSimpleResponse();
            resp.put("success", true);
            resp.put("formulation", saved.toJSON());
            return resp;
        }
    }

    @RequiresPermissionClass(UpdatePermission.class)
    public class DeleteFormulationAction extends FormViewAction<ExpObjectForm>
    {
        @Override
        public void validateCommand(ExpObjectForm target, Errors errors)
        {
        }

        @Override
        public ModelAndView getView(ExpObjectForm form, boolean reshow, BindException errors) throws Exception
        {
            return null;
        }

        @Override
        public boolean handlePost(ExpObjectForm form, BindException errors) throws Exception
        {
            boolean deleted = false;
            Formulation formulation = idriManager.getFormulation(form.getRowId());

            if (formulation != null)
            {
                ViewContext ctx = getViewContext();
                deleted = idriManager.deleteFormulation(formulation, ctx.getUser(), ctx.getContainer());
            }

            return deleted;
        }


        @Override
        public URLHelper getSuccessURL(ExpObjectForm form)
        {
            return null;
        }

        @Override
        public NavTree appendNavTrail(NavTree root)
        {
            return null;
        }
    }

    @RequiresPermissionClass(ReadPermission.class)
    public class GetFormulationAction extends ApiAction<MaterialTypeForm>
    {
        @Override
        public ApiResponse execute(MaterialTypeForm form, BindException errors) throws Exception
        {
            ApiSimpleResponse resp = new ApiSimpleResponse();
            String formulationName = form.getMaterialName();

            JSONObject formulation = idriManager.getFormulation(formulationName).toJSON();

            resp.put("formulation", formulation);
            resp.put("success", true);
            return resp;
        }
    }

    public static class MaterialTypeForm
    {
        private int _rowId;
        private String _materialName;

        public int getRowId() { return _rowId; }

        public void setRowId(int rowId) { _rowId = rowId; }

        public String getMaterialName()
        {
            return _materialName;
        }

        public void setMaterialName(String materialName)
        {
            _materialName = materialName;
        }
    }

    @RequiresPermissionClass(ReadPermission.class)
    public class GetMaterialTypeAction extends ApiAction<MaterialTypeForm>
    {
        @Override
        public ApiResponse execute(MaterialTypeForm form, BindException errors) throws Exception
        {
            ApiSimpleResponse resp = new ApiSimpleResponse();

            String name = form.getMaterialName();
            Map<String, Object> type = idriManager.getMaterialType(name);
            Material mat = new Material();
            mat.setType(type);
            String unit = mat.getTypeUnit();

            if (type == null)
            {
                resp.put("failed", true);
                return resp;
            }

            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("materialName", name);
            responseMap.put("typeID", type);
            responseMap.put("unit", unit);
            
            JSONObject response = new JSONObject(responseMap);

            resp.put("material", response);
            resp.put("success", true);
            return resp;
        }

        @Override
        public void validateForm(MaterialTypeForm form, Errors errors)
        {
            if (form.getMaterialName() == null)
                errors.reject("No Material Name provided.");
        }
    }

    @RequiresPermissionClass(ReadPermission.class)
    public class FormulationDetailsAction extends SimpleViewAction<ExpObjectForm>
    {
        private Formulation _formulation;

        @Override
        public ModelAndView getView(ExpObjectForm form, BindException errors) throws Exception
        {
            VBox vbox = new VBox();

            _formulation = idriManager.getFormulation(form.getRowId());

            JspView view = new JspView("/org/labkey/idri/view/formulationDetails.jsp", form);
            view.setFrame(WebPartView.FrameType.NONE);
            vbox.addView(view);

            return vbox;
        }

        @Override
        public NavTree appendNavTrail(NavTree root)
        {
            return root.addChild("Formulation " + _formulation.getBatch());
        }
    }

    /* Copied from ExperimentController */
    private boolean isUnknownMaterial(ExpMaterial material)
    {
        return "Unknown".equals(material.getName());
    }

    private List<ExpMaterial> removeUnknownMaterials(Iterable<ExpMaterial> materials)
    {
        // Filter out the generic unknown material, which is just a placeholder and doesn't represent a real
        // parent
        ArrayList<ExpMaterial> result = new ArrayList<>();
        for (ExpMaterial material : materials)
        {
            if (!isUnknownMaterial(material))
            {
                result.add(material);
            }
        }
        return result;
    }

    private Set<ExpMaterial> getParentMaterials(ExpMaterial _material)
    {
        if (isUnknownMaterial(_material))
        {
            return Collections.emptySet();
        }
        List<ExpRun> runsToInvestigate = new ArrayList<>();
        ExpRun parentRun = _material.getRun();
        if (parentRun != null)
        {
            runsToInvestigate.add(parentRun);
        }
        Set<ExpRun> investigatedRuns = new HashSet<>();
        final Set<ExpMaterial> parentMaterials = new HashSet<>();
        while (!runsToInvestigate.isEmpty())
        {
            ExpRun predecessorRun = runsToInvestigate.remove(0);
            investigatedRuns.add(predecessorRun);

            for (ExpData d : predecessorRun.getDataInputs().keySet())
            {
                ExpRun dRun = d.getRun();
                if (dRun != null && !investigatedRuns.contains(dRun))
                {
                    runsToInvestigate.add(dRun);
                }
            }
            for (ExpMaterial m : removeUnknownMaterials(predecessorRun.getMaterialInputs().keySet()))
            {
                ExpRun mRun = m.getRun();
                if (mRun != null)
                {
                    if (!investigatedRuns.contains(mRun))
                    {
                        runsToInvestigate.add(mRun);
                    }
                }
                parentMaterials.add(m);
            }
        }
        return parentMaterials;
    }

    private Set<ExpMaterial> getChildMaterials(ExpMaterial _material) throws SQLException
    {
        if (isUnknownMaterial(_material))
        {
            return Collections.emptySet();
        }
        List<ExpRun> runsToInvestigate = new ArrayList<>();
        runsToInvestigate.addAll(ExperimentService.get().getRunsUsingMaterials(_material.getRowId()));
        runsToInvestigate.remove(_material.getRun());
        Set<ExpMaterial> result = new HashSet<>();
        Set<ExpRun> investigatedRuns = new HashSet<>();

        while (!runsToInvestigate.isEmpty())
        {
            ExpRun childRun = runsToInvestigate.remove(0);
            if (!investigatedRuns.contains(childRun))
            {
                investigatedRuns.add(childRun);

                List<ExpMaterial> materialOutputs = removeUnknownMaterials(childRun.getMaterialOutputs());
                result.addAll(materialOutputs);

                for (ExpMaterial materialOutput : materialOutputs)
                {
                    runsToInvestigate.addAll(ExperimentService.get().getRunsUsingMaterials(materialOutput.getRowId()));
                }

                runsToInvestigate.addAll(ExperimentService.get().getRunsUsingDatas(childRun.getDataOutputs()));
            }
        }
        result.remove(_material);
        return result;
    }

    private QueryView createMaterialsView(final Set<ExpMaterial> materials, String dataRegionName, String title)
    {
        // Strip out materials in folders that the user can't see - this lets us avoid a container filter that
        // enforces the permissions when we do the query
        String typeName = null;
        boolean sameType = true;
        for (Iterator<ExpMaterial> iter = materials.iterator(); iter.hasNext(); )
        {
            ExpMaterial material = iter.next();
            if (!material.getContainer().hasPermission(getUser(), ReadPermission.class))
            {
                iter.remove();
            }

            String type = material.getCpasType();
            if (sameType)
            {
                if (typeName == null)
                    typeName = type;
                else if (!typeName.equals(type))
                {
                    typeName = null;
                    sameType = false;
                }
            }
        }
        final ExpSampleSet ss;
        if (sameType && typeName != null && !"Material".equals(typeName) && !"Sample".equals(typeName))
            ss = ExperimentService.get().getSampleSet(typeName);
        else
            ss = null;

        QuerySettings settings = new QuerySettings(getViewContext(), dataRegionName);
        UserSchema schema;
        if (ss == null)
        {
            schema = new ExpSchema(getUser(), getContainer());
            settings.setQueryName(ExpSchema.TableType.Materials.toString());
        }
        else
        {
            schema = new SamplesSchema(getUser(), getContainer());
            settings.setQueryName(ss.getName());
        }
        settings.setSchemaName(schema.getSchemaName());
        QueryView materialsView = new QueryView(schema, settings, null)
        {
            protected TableInfo createTable()
            {
                ExpMaterialTable table = ExperimentService.get().createMaterialTable(ExpSchema.TableType.Materials.toString(), getSchema());
                table.setMaterials(materials);
                table.populate(ss, false);
                // We've already set an IN clause that restricts us to showing just data that we have permission
                // to view
                table.setContainerFilter(ContainerFilter.EVERYTHING);

                List<FieldKey> defaultVisibleColumns = new ArrayList<>();
                if (ss == null)
                {
                    // The table columns without any of the active SampleSet property columns
                    defaultVisibleColumns.add(FieldKey.fromParts(ExpMaterialTable.Column.Name));
                    defaultVisibleColumns.add(FieldKey.fromParts(ExpMaterialTable.Column.SampleSet));
                    defaultVisibleColumns.add(FieldKey.fromParts(ExpMaterialTable.Column.Flag));
                }
                else
                {
                    defaultVisibleColumns.addAll(table.getDefaultVisibleColumns());
                }
                defaultVisibleColumns.add(FieldKey.fromParts(ExpMaterialTable.Column.Created));
                defaultVisibleColumns.add(FieldKey.fromParts(ExpMaterialTable.Column.CreatedBy));
                defaultVisibleColumns.add(FieldKey.fromParts(ExpMaterialTable.Column.Run));
                table.setDefaultVisibleColumns(defaultVisibleColumns);
                return table;
            }
        };
        materialsView.disableContainerFilterSelection();
        materialsView.setShowBorders(true);
        materialsView.setShowDetailsColumn(false);
        materialsView.setShowExportButtons(false);
        materialsView.setShadeAlternatingRows(true);
        materialsView.setButtonBarPosition(DataRegion.ButtonBarPosition.BOTTOM);
        materialsView.setTitle(title);
        return materialsView;
    }

    /**
     * Meant to mimic PipelineController.getPipelineContainerAction but with the incorporated HPLC path context
     */
    @RequiresPermissionClass(ReadPermission.class)
    public class getHPLCPipelineContainerAction extends ApiAction
    {
        public ApiResponse execute(Object form, BindException errors) throws Exception
        {
            ApiSimpleResponse resp = new ApiSimpleResponse();
            PipeRoot root = PipelineService.get().findPipelineRoot(getContainer());

            String containerPath = null;
            String webdavURL = null;

            if (null != root)
            {
                containerPath = root.getContainer().getPath();
                webdavURL = root.getWebdavURL();
                if (HPLCAssayDataHandler.NAMESPACE.length() > 0)
                    webdavURL += HPLCAssayDataHandler.NAMESPACE;
            }

            resp.put("containerPath", containerPath);
            resp.put("webDavURL", webdavURL);

            return resp;
        }
    }

    public static class HPLCResourceForm
    {
        public String _path;

        public String getPath()
        {
            return _path;
        }

        public void setPath(String path)
        {
            _path = path;
        }
    }

    @RequiresPermissionClass(ReadPermission.class)
    public class getHPLCResourceAction extends ApiAction<HPLCResourceForm>
    {
        @Override
        public ApiResponse execute(HPLCResourceForm form, BindException errors) throws Exception
        {
            String path = form.getPath();
            WebdavResource resource = WebdavService.get().lookup(path);
            Map<String, String> props = new HashMap<>();

            if (null != resource)
            {
                FileContentService svc = ServiceRegistry.get().getService(FileContentService.class);
                ExpData data = svc.getDataObject(resource, getContainer());

                if (null != data)
                {
                    TableInfo ti = ExpSchema.TableType.Data.createTable(new ExpSchema(getUser(), getContainer()), ExpSchema.TableType.Data.toString());
                    QueryUpdateService qus = ti.getUpdateService();

                    try
                    {
                        File canonicalFile = FileUtil.getAbsoluteCaseSensitiveFile(resource.getFile());
                        String url = canonicalFile.toURI().toURL().toString();
                        Map<String, Object> keys = Collections.singletonMap(ExpDataTable.Column.DataFileUrl.name(), (Object) url);
                        List<Map<String, Object>> rows = qus.getRows(getUser(), getContainer(), Collections.singletonList(keys));

                        if (rows.size() == 1)
                        {
                            for (Map.Entry<String, Object> entry : rows.get(0).entrySet())
                            {
                                Object value = entry.getValue();

                                if (null != value)
                                {
                                    props.put(entry.getKey(), String.valueOf(value));
                                }
                            }
                        }
                    }
                    catch (MalformedURLException e)
                    {
                        throw new UnexpectedException(e);
                    }
                    catch (SQLException e)
                    {
                        throw new RuntimeSQLException(e);
                    }
                    catch (RuntimeException re)
                    {
                        throw re;
                    }
                    catch (Exception e)
                    {
                        throw new RuntimeException(e);
                    }
                }
            }

            ApiSimpleResponse resp = new ApiSimpleResponse(props);

            return resp;
        }
    }
}
