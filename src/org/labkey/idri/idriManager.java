/*
 * Copyright (c) 2011-2012 LabKey Corporation
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

import org.jetbrains.annotations.Nullable;
import org.labkey.api.collections.CaseInsensitiveHashMap;
import org.labkey.api.data.Container;
import org.labkey.api.data.DbSchema;
import org.labkey.api.data.RuntimeSQLException;
import org.labkey.api.data.SQLFragment;
import org.labkey.api.data.SimpleFilter;
import org.labkey.api.data.Table;
import org.labkey.api.data.TableInfo;
import org.labkey.api.exp.ExperimentException;
import org.labkey.api.exp.PropertyDescriptor;
import org.labkey.api.exp.api.ExpMaterial;
import org.labkey.api.exp.api.ExpSampleSet;
import org.labkey.api.exp.api.ExperimentService;
import org.labkey.api.exp.list.ListDefinition;
import org.labkey.api.exp.list.ListService;
import org.labkey.api.exp.query.SamplesSchema;
import org.labkey.api.gwt.client.model.GWTPropertyDescriptor;
import org.labkey.api.query.BatchValidationException;
import org.labkey.api.query.QueryService;
import org.labkey.api.query.QueryUpdateService;
import org.labkey.api.query.UserSchema;
import org.labkey.api.security.User;
import org.labkey.api.study.Study;
import org.labkey.api.study.StudyService;
import org.labkey.api.view.HttpView;
import org.labkey.api.view.ViewContext;
import org.labkey.idri.model.Concentration;
import org.labkey.idri.model.Formulation;
import org.labkey.idri.model.Material;
import org.labkey.idri.query.idriSchema;

import java.sql.SQLException;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class idriManager
{   
    private static final idriManager _instance = new idriManager();

    private idriManager()
    {
        // prevent external construction with a private default constructor
    }

    public static idriManager get()
    {
        return _instance;
    }

    public static DbSchema getSchema()
    {
        return DbSchema.get(idriSchema.NAME);
    }

    public static void ensureTransaction() throws SQLException
    {
        getSchema().getScope().ensureTransaction();
    }

    public static void commitTransaction() throws SQLException
    {
        getSchema().getScope().commitTransaction();
    }

    public static void closeConnection()
    {
        getSchema().getScope().closeConnection();
    }
    
    public static ExpMaterial getFormulationAsSample(Formulation formulation)
    {
        ExperimentService.Interface service = ExperimentService.get();
        
        String materialSrcLSID = service.getSampleSetLsid(idriSchema.TABLE_FORMULATIONS, HttpView.getContextContainer()).toString();

        return service.createExpMaterial(HttpView.getContextContainer(), materialSrcLSID, formulation.getBatch());
    }

    /**
     *
     * @param rowID
     * @return
     */
    @Nullable
    public static Material getMaterial(int rowID)
    {
        ExperimentService.Interface service = ExperimentService.get();
        ExpMaterial mat = service.getExpMaterial(rowID);

        if (mat != null)
            return Material.fromExpMaterial(mat);
        return null;
    }

    /**
     *
     * @param container
     * @return
     */
    public static List<Material> getMaterials(Container container)
    {
        return getMaterials(container, null);
    }

    /**
     *
     * @param container
     * @param materialType
     * @return
     */
    public static List<Material> getMaterials(Container container, String materialType)
    {
        List<String> sources = new ArrayList<String>();
        List<Material> materials = new ArrayList<Material>();

        /* populate the known sources of materials */
        if (materialType != null)
            sources.add(materialType);
        else
        {
            sources.add(idriSchema.TABLE_RAW_MATERIALS);
            sources.add(idriSchema.TABLE_FORMULATIONS);
        }
        
        ExperimentService.Interface service = ExperimentService.get();
        ExpSampleSet ss;
        
        for (String source : sources)
        {
            ss = service.getSampleSet(container, source);
            List<ExpMaterial> _expMaterials;
            
            if (ss != null)
            {
                _expMaterials = Arrays.asList(ss.getSamples());
                for (ExpMaterial expMat : _expMaterials)
                {
                    Material mat = Material.fromExpMaterial(expMat);
                    materials.add(mat);
                }
            }
            else
                throw new RuntimeException("An expected source was not found for formulation material sources. " + source);
        }
        
        return materials;
    }

    /**
     *
     * @param materialName
     * @return
     */
    public static Map<String, Object> getMaterialType(String materialName)
    {
        ViewContext ctx = HttpView.getRootContext();        
        ExpMaterial form = ExperimentService.get().getSampleSet(ctx.getContainer(), idriSchema.TABLE_FORMULATIONS).getSample(materialName);

        Map<String, Object> aggregate = new CaseInsensitiveHashMap<Object>();
        aggregate.put("Type", "aggregate");
        aggregate.put("Units", "%v/vol");

        if (form != null)
            return aggregate;

        ExpMaterial mat = ExperimentService.get().getExpMaterialsByName(materialName, ctx.getContainer(), ctx.getUser()).get(0);
        
        if (mat.getCpasType().contains(idriSchema.TABLE_COMPOUNDS))
        {
            return getCompoundType(mat);
        }
        else if (mat.getCpasType().contains(idriSchema.TABLE_RAW_MATERIALS.replaceAll(" ", "+")))
        {
            ExpMaterial expMat = getCompound(mat.getName());
            return getCompoundType(expMat);
        }
        else
            return aggregate;
    }

    /**
     * Saves a formulation and associated concentrations with Raw Materials, Compounds, etc.
     * This is both insert and update orders. The method will check to see if a formulation already exists based
     * on lot.
     * @param formulation
     * @param user
     * @param container
     * @return
     */
    public static Formulation saveFormulation(Formulation formulation, User user, Container container)
    {
        return saveFormulationHelper(formulation, user, container);
    }

    private static Formulation saveFormulationHelper(Formulation formulation, User user, Container container)
    {
        ExperimentService.Interface service = ExperimentService.get();

        // Prototype code to test saving to a formulation demographics dataset
        Study study = StudyService.get().getStudy(container);
        if (study != null)
        {
            UserSchema schema = QueryService.get().getUserSchema(user, container, "study");
            TableInfo info = schema.getTable("FORM1");
            if (info != null)
            {
                List<Map<String, Object>> _formulation = new ArrayList<Map<String, Object>>();
                Map<String, Object> keys = new CaseInsensitiveHashMap<Object>(formulation.describe());
                keys.put("BatchId", formulation.getBatch());

                _formulation.add(keys);
                try
                {
                    List<Map<String, Object>> result = info.getUpdateService().getRows(user, container, _formulation);
                    if (result != null)
                    {
                        BatchValidationException errors = new BatchValidationException();
                        if (result.size() == 0)
                        {
                            info.getUpdateService().insertRows(user, container, _formulation, errors, new HashMap<String, Object>());
                        }
                        else
                        {
                            info.getUpdateService().updateRows(user, container, _formulation, result, new HashMap<String, Object>());
                        }
                    }
                }
                catch (Exception e)
                {
                    throw new RuntimeException(e);
                }
            }
        }

        ExpSampleSet ss = service.getSampleSet(container, idriSchema.TABLE_FORMULATIONS);
        if (ss != null && ss.canImportMoreSamples())
        {
            ExpMaterial exists = ss.getSample(formulation.getBatch());

            SamplesSchema sampleSchema = new SamplesSchema(user, container);
            TableInfo tableInfo = sampleSchema.getSchema("Samples").getTable(idriSchema.TABLE_FORMULATIONS);
            QueryUpdateService qservice = tableInfo.getUpdateService();
            Set<String> columnSet = tableInfo.getColumnNameSet();
            List<Map<String, Object>> result;

            // If true, then the formulation already exists
            if (exists != null)
            {
                formulation.setRowID(exists.getRowId());
                Map<String, Object> formulationMap = formulation.describe();

                for (String key : formulationMap.keySet())
                    assert columnSet.contains(key) : "Cannot find '" + key + "' in " + idriSchema.TABLE_FORMULATIONS;

                List<Map<String, Object>> rows = new ArrayList<Map<String, Object>>();
                rows.add(formulationMap);

                try
                {
                    result = qservice.updateRows(user, container, rows, null, null);
                    formulation.setRowID(Integer.parseInt(result.get(0).get("RowId").toString()));
                }
                catch (Exception e)
                {
                    throw new RuntimeException(e.getMessage());
                }
            }
            else
            {
                Map<String, Object> formulationMap = formulation.describe();

                for (String key : formulationMap.keySet())
                    assert columnSet.contains(key) : "Cannot find '" + key + "' in " + idriSchema.TABLE_FORMULATIONS;
                
                List<Map<String, Object>> rows = new ArrayList<Map<String, Object>>();
                rows.add(formulationMap);

                try
                {
                    BatchValidationException errors = new BatchValidationException();
                    result = qservice.insertRows(user, container, rows, errors, null);
                    if (errors.hasErrors())
                        throw errors;
                    formulation.setRowID(Integer.parseInt(result.get(0).get("RowId").toString()));
                }
                catch (Exception e)
                {
                    throw new RuntimeException(e.getMessage());
                }
            }

            List<Concentration> concentrations = calculateConcentrations(formulation, container, user);

            try
            {
                ensureTransaction();

                // Delete all rows for the current formulation
                SimpleFilter filter = new SimpleFilter("lot", formulation.getRowID());
                Table.delete(getSchema().getTable(idriSchema.TABLE_CONCENTRATIONS), filter);
                
                // Add all the new concentration values
                for (Concentration conc : concentrations)
                {
                    Table.insert(user, getSchema().getTable(idriSchema.TABLE_CONCENTRATIONS), conc);
                }

                commitTransaction();
            }
            catch (SQLException e)
            {
                throw new RuntimeSQLException(e);
            }
            finally
            {
                closeConnection();
            }

            List<Integer> invalids = new ArrayList<Integer>();
            SQLFragment sql = new SQLFragment("SELECT * FROM idri.concentrations WHERE compound = ?");
            sql.add(formulation.getRowID());

            try
            {
                Concentration[] concArray = Table.executeQuery(getSchema(), sql, Concentration.class);
                for (Concentration conc : concArray)
                    invalids.add(conc.getLot());
            }
            catch (SQLException e)
            {
                throw new RuntimeSQLException(e);
            }

            for (Integer i : invalids)
                processInvalid(i, user, container);
        }
        return formulation;
    }

    private static void processInvalid(Integer invalid, User user, Container container)
    {
        Formulation f = getFormulation(invalid);
        if (f != null)
            saveFormulationHelper(f, user, container);
    }

    /**
     * Retrieves a well-formed (not a Sample Set row as it is persisted) formulation from the database.
     * Returns NULL if formulation is not found.
     * @param lot
     * @return
     */
    @Nullable
    public static Formulation getFormulation(String lot)
    {
        ExperimentService.Interface service = ExperimentService.get();

        Container container = HttpView.getContextContainer();
        ExpSampleSet ss = service.getSampleSet(container, idriSchema.TABLE_FORMULATIONS);
        
        ExpMaterial sampleRow = ss.getSample(lot);
        Formulation formulation = null;
        if (sampleRow != null)
        {
            formulation = Formulation.fromSample(sampleRow, true);
        }
        return formulation;
    }

    /**
     *
     * @param RowId
     * @return
     */
    @Nullable
    public static Formulation getFormulation(int RowId)
    {
        ExperimentService.Interface service = ExperimentService.get();
        return getFormulation(service.getExpMaterial(RowId).getName());
    }

    /**
     *
     * @param container
     * @return
     */
    public static List<Formulation> getFormulations(Container container)
    {
        List<Formulation> formulations = new ArrayList<Formulation>();

        ExpSampleSet ss = ExperimentService.get().getSampleSet(container, idriSchema.TABLE_FORMULATIONS);
        List<ExpMaterial> asMaterials = Arrays.asList(ss.getSamples());
        for (ExpMaterial mat : asMaterials)
            formulations.add(Formulation.fromSample(mat, false));

        return formulations;
    }

    /**
     * Calculates concentrations and returns a list of Concentration objects.
     * @param formulation - The formulation and all associated first-level materials
     * @param c
     * @param u
     * @return
     */
    private static List<Concentration> calculateConcentrations(Formulation formulation, Container c, User u)
    {
        List<Concentration> concentrations = new ArrayList<Concentration>();

        ExperimentService.Interface service = ExperimentService.get();
        try
        {
            for(Material material : formulation.getMaterials())
            {
                material.setTop(true);
                concentrations.addAll(getConcentrations(material, c, u));
            }
        }
        catch (Exception e)
        {
            throw new RuntimeException(e.getMessage());
        }

        DecimalFormat twoDForm = new DecimalFormat("#.###");

        Map<Integer, Concentration> map = new HashMap<Integer, Concentration>();
        List<Concentration> tops = new ArrayList<Concentration>();
        for (Concentration conc : concentrations)
        {
            if (conc.isTop())
                tops.add(conc);
            else if (map.containsKey(conc.getMaterial()))
            {
                Concentration combined = map.get(conc.getMaterial());
                combined.setConcentration(combined.getConcentration() + conc.getConcentration());
                combined.setMaterial(conc.getMaterial());
                combined.setCompound(conc.getCompound());
                combined.setIsTop(conc.getIsTop());
                combined.setLot(conc.getLot());
                map.remove(conc.getMaterial());
                map.put(conc.getMaterial(), combined);
            }
            else
                map.put(conc.getMaterial(), conc);
        }

        concentrations = new ArrayList<Concentration>();
        for (Concentration top : tops)
        {
            top.setLot(-1);
            top.setLot(formulation.getRowID());

            // Round the calculation
            top.setConcentration(Double.valueOf(twoDForm.format(top.getConcentration())));
            concentrations.add(top);
        }
        for (Concentration conc : map.values())
        {           
            conc.setLot(formulation.getRowID());
            conc.setRowid(-1); // all of these rows must be added as new.

            // Round the calculation
            conc.setConcentration(Double.valueOf(twoDForm.format(conc.getConcentration())));
            concentrations.add(conc);
        }
        return concentrations;
    }

    public static List<Concentration> getConcentrations(Formulation f, Container c, User u, boolean isTopOnly)
    {
        ExperimentService.Interface service = ExperimentService.get();
        ExpMaterial m = service.getSampleSet(c, idriSchema.TABLE_FORMULATIONS).getSample(f.getBatch());
        if (m == null)
            return Collections.emptyList();

        List<Concentration> concentrations = new ArrayList<Concentration>();
        SQLFragment sql = new SQLFragment("SELECT * FROM idri.concentrations WHERE lot = ? AND istop = ?");
        try
        {
            sql.add(service.getExpMaterialsByName(f.getBatch(), c, u).get(0).getRowId());
            sql.add(isTopOnly);
            Concentration[] concArray = Table.executeQuery(getSchema(), sql, Concentration.class);
            concentrations.addAll(Arrays.asList(concArray));
        }
        catch (SQLException e)
        {
            throw new RuntimeSQLException(e);
        }
        return concentrations;
    }
    
    private static List<Concentration> getConcentrations(Material material, Container c, User u)
    {
        ExperimentService.Interface service = ExperimentService.get();
        List<Concentration> concentrations = new ArrayList<Concentration>();
        ExpMaterial m = service.getSampleSet(c, idriSchema.TABLE_RAW_MATERIALS).getSample(material.getMaterialName());
        
        if (m == null)
        {
            m = service.getSampleSet(c, idriSchema.TABLE_FORMULATIONS).getSample(material.getMaterialName());
            if (m == null)
                throw new RuntimeException("The material received is not valid.");

            SQLFragment sql = new SQLFragment("SELECT * FROM idri.concentrations WHERE lot = ? AND istop = 'false'");
            try
            {
                sql.add(service.getExpMaterialsByName(material.getMaterialName(), c, u).get(0).getRowId());
                Concentration[] concArray = Table.executeQuery(getSchema(), sql, Concentration.class);
                concentrations.addAll(Arrays.asList(concArray));

                double concVal;
                for(Concentration concentration : concentrations)
                {
                    concVal = ((concentration.getConcentration()/100.0) * (material.getConcentration()/100.0));
                    concentration.setConcentration((concVal * 100.0));
                }
            }
            catch (SQLException e)
            {
                throw new RuntimeSQLException(e);
            }
        }
        else
        {
            // It is a Raw Material -- Return the Concentration with the Compound
            String pcol = m.getSampleSet().getParentCol().getName();
            assert pcol != null : idriSchema.TABLE_RAW_MATERIALS + " requires a parent column. Fix the Sample Set to proceed.";

            // Lookup the Compound for this Raw Material
            ExpMaterial comp = getCompound(material.getMaterialName());
            assert comp != null : "'" + material.getMaterialName() + "' is required to have a compound.";

            Concentration conc = new Concentration();
            conc.setCompound(comp.getRowId());
            conc.setMaterial(m.getRowId());
            conc.setUnit(material.getTypeUnit());
            conc.setConcentration(material.getConcentration());
            concentrations.add(conc);
        }

        if (material.isTop())
        {
            Concentration conc = new Concentration();
            conc.setCompound(m.getRowId());  // Use the expMaterial for the RowId
            conc.setUnit(material.getTypeUnit());
            conc.setMaterial(m.getRowId());
            conc.setConcentration(material.getConcentration());
            conc.setIsTop(material.isTop());
            concentrations.add(conc);
        }
        
        return concentrations;
    }

    /**
     *
     * @param RawMaterial
     * @return
     */
    @Nullable
    public static ExpMaterial getCompound(String RawMaterial)
    {
        Container container = HttpView.getRootContext().getContainer();
        ExperimentService.Interface service = ExperimentService.get();
        ExpMaterial m = service.getSampleSet(container, idriSchema.TABLE_RAW_MATERIALS).getSample(RawMaterial);
        
        // Lookup the Compound for this Raw Material
        if (m != null)
        {
            String pcol = m.getSampleSet().getParentCol().getName();
            assert pcol != null : idriSchema.TABLE_RAW_MATERIALS + " requires a parent column. Fix the Sample Set to proceed.";
            Map<PropertyDescriptor, Object> values = m.getPropertyValues();
            for (PropertyDescriptor pd : values.keySet())
            {
                if (pd.getName().equals(pcol))
                    return service.getSampleSet(container, idriSchema.TABLE_COMPOUNDS).getSample(values.get(pd).toString());
            }
        }

        /* Material not found as a Raw Material */
        return m;
    }

    /**
     *
     * @param CompoundName
     * @return
     */
    @Nullable
    private static Map<String, Object> getCompoundType(String CompoundName)
    {
        Container container = HttpView.getRootContext().getContainer();
        ExperimentService.Interface service = ExperimentService.get();
        ExpMaterial m = service.getSampleSet(container, idriSchema.TABLE_COMPOUNDS).getSample(CompoundName);
        if (m != null)
            return getCompoundType(m);
        return null;
    }

    private static Map<String, Object> getCompoundType(ExpMaterial Compound)
    {
        Map<PropertyDescriptor, Object> values = Compound.getPropertyValues();
        for (PropertyDescriptor pd : values.keySet())
        {
            if (pd.getName().equalsIgnoreCase("compoundLookup"))
            {
                ListDefinition ld = ListService.get().getList(Compound.getContainer(), idriSchema.LIST_MATERIAL_TYPES);
                Map<String, Object> type = new CaseInsensitiveHashMap<Object>();
                if (ld != null)
                {
                    User u = HttpView.currentContext().getUser();
                    Container c = Compound.getContainer();

                    List<Map<String, Object>> types = new ArrayList<Map<String, Object>>();
                    Map<String, Object> keys = new CaseInsensitiveHashMap<Object>();
                    keys.put("Key", values.get(pd));
                    types.add(keys);

                    try
                    {
                        types = ld.getTable(u).getUpdateService().getRows(u, c, types);
                        if (types.size() >= 0)
                            type = types.get(0);
                    }
                    catch (Exception e)
                    {
                        /* */
                    }
                }
                return type;
            }
        }
        return null;
    }

    // NYI
//    public static void initializeLists(Container c)
//    {
//        User u = HttpView.currentContext().getUser();
//        ListService.Interface service = ListService.get();
//
//        // Create the Material Types List
//        ListDefinition matTypesList = service.getList(c, idriSchema.LIST_MATERIAL_TYPES);
//
//        if (matTypesList == null)
//        {
//            matTypesList = service.createList(c, idriSchema.LIST_MATERIAL_TYPES);
//            matTypesList.setKeyName("Key");
//            matTypesList.setKeyType(ListDefinition.KeyType.AutoIncrementInteger);
//            matTypesList.setDescription("Material Types for Formulation Samples.");
//
//            try
//            {
//                matTypesList.setAllowDelete(true);
//                matTypesList.setAllowExport(true);
//                matTypesList.setAllowUpload(true);
//
////                RowMapFactory<Object> mapFactory = new RowMapFactory<Object>("ListName", "Type", "Units");
//
//                matTypesList.save(u);
//            }
//            catch (Exception e)
//            {
//                throw new RuntimeException(e);
//            }
//        }
//    }

    /**
     * Initializes the Samples Sets used by Formulations. Does precautionary
     * lookup to make sure sample sets don't already exist. If they do, does
     * nothing.
     * @param c
     */
    public static void initializeSampleSets(Container c)
    {
        User u = HttpView.currentContext().getUser();
        List<GWTPropertyDescriptor> properties;

        // Create the Compounds Sample Set
        ExpSampleSet compoundsSS = ExperimentService.get().getSampleSet(c, idriSchema.TABLE_COMPOUNDS);

        // Create the Raw Materials Sample Set
        ExpSampleSet rawMaterialsSS = ExperimentService.get().getSampleSet(c, idriSchema.TABLE_RAW_MATERIALS);

        // Create the Formulations Sample Set
        ExpSampleSet formulationsSS = ExperimentService.get().getSampleSet(c, idriSchema.TABLE_FORMULATIONS);

        try
        {
            if (compoundsSS == null)
            {
                // Definition -- 'Compounds' Sample Set
                properties = new ArrayList<GWTPropertyDescriptor>();
                properties.add(new GWTPropertyDescriptor("Compound Name", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("Full Name", "http://www.w3.org/2001/XMLSchema#string"));
//                properties.add(new GWTPropertyDescriptor("Type of Material", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("CAS Number", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("Density", "http://www.w3.org/2001/XMLSchema#double"));
                properties.add(new GWTPropertyDescriptor("Molecular Weight", "http://www.w3.org/2001/XMLSchema#double"));

                compoundsSS = ExperimentService.get().createSampleSet(c, u, idriSchema.TABLE_COMPOUNDS, "Formulation Compounds", properties, 0, -1, -1, -1);
            }

            if (rawMaterialsSS == null)
            {
                properties = new ArrayList<GWTPropertyDescriptor>();
                properties.add(new GWTPropertyDescriptor("Identifier", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("Material Name", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("Supplier", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("Source", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("Catalogue ID", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("Lot ID", "http://www.w3.org/2001/XMLSchema#string"));

                rawMaterialsSS = ExperimentService.get().createSampleSet(c, u, idriSchema.TABLE_RAW_MATERIALS, "Raw Materials used in Formulations", properties,
                        0, -1, -1, 1);
            }

            if (formulationsSS == null)
            {
                properties = new ArrayList<GWTPropertyDescriptor>();
                properties.add(new GWTPropertyDescriptor("Batch", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("DM", "http://www.w3.org/2001/XMLSchema#dateTime"));
                properties.add(new GWTPropertyDescriptor("batchsize", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("nbpg", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("Failure", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("Type", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("Comments", "http://www.w3.org/2001/XMLSchema#string"));
                properties.add(new GWTPropertyDescriptor("Raw Materials", "http://www.w3.org/2001/XMLSchema#string"));
                
                formulationsSS = ExperimentService.get().createSampleSet(c, u, idriSchema.TABLE_FORMULATIONS, null, properties,
                        0, -1, -1, 7);
            }
        }
        catch (SQLException e)
        {
            throw new RuntimeSQLException(e);
        }
        catch (ExperimentException e)
        {
            throw new RuntimeException(e);
        }
    }
}
