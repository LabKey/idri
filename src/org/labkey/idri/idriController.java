/*
 * Copyright (c) 2011-2015 LabKey Corporation
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
import org.labkey.api.data.Container;
import org.labkey.api.data.RuntimeSQLException;
import org.labkey.api.data.TableInfo;
import org.labkey.api.exp.api.DataType;
import org.labkey.api.exp.api.ExpData;
import org.labkey.api.exp.api.ExperimentService;
import org.labkey.api.exp.query.ExpDataTable;
import org.labkey.api.exp.query.ExpSchema;
import org.labkey.api.files.FileContentService;
import org.labkey.api.pipeline.PipeRoot;
import org.labkey.api.pipeline.PipelineService;
import org.labkey.api.query.QueryUpdateService;
import org.labkey.api.security.RequiresPermission;
import org.labkey.api.security.permissions.ReadPermission;
import org.labkey.api.security.permissions.UpdatePermission;
import org.labkey.api.services.ServiceRegistry;
import org.labkey.api.util.FileUtil;
import org.labkey.api.util.URLHelper;
import org.labkey.api.util.UnexpectedException;
import org.labkey.api.view.JspView;
import org.labkey.api.view.NavTree;
import org.labkey.api.view.NotFoundException;
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
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
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

    @RequiresPermission(ReadPermission.class)
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

                    // recursively build other formulations
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

    @RequiresPermission(ReadPermission.class)
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
    
    @RequiresPermission(UpdatePermission.class)
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
            if (!batch.startsWith("QD") && !batch.startsWith("QF") && !batch.startsWith("QG") && !batch.startsWith("QH") && !batch.startsWith("TD"))
            {
                errors.reject(ERROR_MSG, "Formulations must start TD, QD, QF, QG, or QH.");
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

    @RequiresPermission(UpdatePermission.class)
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

    @RequiresPermission(ReadPermission.class)
    public class GetFormulationAction extends ApiAction<MaterialTypeForm>
    {
        @Override
        public ApiResponse execute(MaterialTypeForm form, BindException errors) throws Exception
        {
            ApiSimpleResponse resp = new ApiSimpleResponse();

            Formulation formulation = idriManager.getFormulation(form.getMaterialName());

            if (formulation != null)
            {
                resp.put("formulation", formulation.toJSON());
            }

            resp.put("success", formulation != null);
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

    @RequiresPermission(ReadPermission.class)
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

    @RequiresPermission(ReadPermission.class)
    public class FormulationDetailsAction extends SimpleViewAction<ExpObjectForm>
    {
        private Formulation _formulation;

        @Override
        public void validate(ExpObjectForm form, BindException errors)
        {
            _formulation = idriManager.getFormulation(form.getRowId());
            if (_formulation == null)
                throw new NotFoundException("Formulation not found.");
        }

        @Override
        public ModelAndView getView(ExpObjectForm form, BindException errors) throws Exception
        {
            VBox vbox = new VBox();

            JspView view = new JspView<>("/org/labkey/idri/view/formulationDetails.jsp", form);
            view.setFrame(WebPartView.FrameType.NONE);
            vbox.addView(view);

            return vbox;
        }

        @Override
        public NavTree appendNavTrail(NavTree root)
        {
            if(_formulation != null)
                return root;

            return root.addChild("Formulation " + _formulation.getBatch());
        }
    }

    /**
     * Meant to mimic PipelineController.getPipelineContainerAction but with the incorporated HPLC path context
     */
    @RequiresPermission(ReadPermission.class)
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
        public boolean _test = false;

        public String getPath()
        {
            return _path;
        }

        public void setPath(String path)
        {
            _path = path;
        }

        public boolean isTest()
        {
            return _test;
        }

        public void setTest(boolean test)
        {
            _test = test;
        }
    }

    @RequiresPermission(ReadPermission.class)
    public class getHPLCResourceAction extends ApiAction<HPLCResourceForm>
    {
        @Override
        public ApiResponse execute(HPLCResourceForm form, BindException errors) throws Exception
        {
            String path = form.getPath();
            WebdavResource resource = WebdavService.get().lookup(path);
            Map<String, String> props = new HashMap<>();
            Container c = getContainer();

            if (null != resource)
            {
                FileContentService svc = ServiceRegistry.get().getService(FileContentService.class);
                ExpData data = svc.getDataObject(resource, c);

                if (form.isTest() && data == null)
                {
                    // Generate the data to help the test, replicating what DavController would do for us
                    File file = resource.getFile();
                    if (null != file)
                    {
                        data = ExperimentService.get().createData(c, new DataType("UploadedFile"));
                        data.setName(file.getName());
                        data.setDataFileURI(file.toURI());

                        int scale = ExperimentService.get().getTinfoData().getColumn("DataFileURL").getScale();
                        String dataFileURL = data.getDataFileUrl();
                        if (dataFileURL != null && dataFileURL.length() > scale)
                        {
                            // If the path is too long to store, bail out without creating an exp.data row
                        }
                        else
                        {
                            data.save(getUser());
                        }
                    }
                }

                if (null != data)
                {
                    TableInfo ti = ExpSchema.TableType.Data.createTable(new ExpSchema(getUser(), c), ExpSchema.TableType.Data.toString());
                    QueryUpdateService qus = ti.getUpdateService();

                    try
                    {
                        File canonicalFile = FileUtil.getAbsoluteCaseSensitiveFile(resource.getFile());
                        String url = canonicalFile.toURI().toURL().toString();
                        Map<String, Object> keys = Collections.singletonMap(ExpDataTable.Column.DataFileUrl.name(), url);
                        List<Map<String, Object>> rows = qus.getRows(getUser(), c, Collections.singletonList(keys));

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

            return new ApiSimpleResponse(props);
        }
    }
}
