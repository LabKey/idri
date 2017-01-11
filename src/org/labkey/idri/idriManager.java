/*
 * Copyright (c) 2011-2016 LabKey Corporation
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

import org.apache.log4j.Logger;
import org.jetbrains.annotations.Nullable;
import org.labkey.api.collections.CaseInsensitiveHashMap;
import org.labkey.api.data.CompareType;
import org.labkey.api.data.Container;
import org.labkey.api.data.DbSchema;
import org.labkey.api.data.DbScope;
import org.labkey.api.data.PropertyStorageSpec;
import org.labkey.api.data.RuntimeSQLException;
import org.labkey.api.data.SQLFragment;
import org.labkey.api.data.SimpleFilter;
import org.labkey.api.data.SqlSelector;
import org.labkey.api.data.Table;
import org.labkey.api.data.TableInfo;
import org.labkey.api.data.TableSelector;
import org.labkey.api.exp.ExperimentException;
import org.labkey.api.exp.PropertyDescriptor;
import org.labkey.api.exp.PropertyType;
import org.labkey.api.exp.api.ExpMaterial;
import org.labkey.api.exp.api.ExpSampleSet;
import org.labkey.api.exp.api.ExperimentService;
import org.labkey.api.exp.list.ListDefinition;
import org.labkey.api.exp.list.ListService;
import org.labkey.api.exp.property.Domain;
import org.labkey.api.exp.property.DomainProperty;
import org.labkey.api.exp.query.SamplesSchema;
import org.labkey.api.gwt.client.model.GWTPropertyDescriptor;
import org.labkey.api.query.BatchValidationException;
import org.labkey.api.query.FieldKey;
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
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class idriManager
{
    private static final idriManager _instance = new idriManager();
    static Logger _log = Logger.getLogger(idriManager.class);

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

    public static ExpMaterial getFormulationAsSample(Formulation formulation)
    {
        ExperimentService.Interface service = ExperimentService.get();

        String materialSrcLSID = service.getSampleSetLsid(idriSchema.TABLE_FORMULATIONS, HttpView.getContextContainer()).toString();

        return service.createExpMaterial(HttpView.getContextContainer(), materialSrcLSID, formulation.getBatch());
    }

    @Nullable
    public static ExpSampleSet getCompoundsSampleSet(Container container)
    {
        return ExperimentService.get().getSampleSet(container, idriSchema.TABLE_COMPOUNDS);
    }

    @Nullable
    public static ExpSampleSet getFormulationSampleSet(Container container)
    {
        return ExperimentService.get().getSampleSet(container, idriSchema.TABLE_FORMULATIONS);
    }

    @Nullable
    public static ExpSampleSet getRawMaterialsSampleSet(Container container)
    {
        return ExperimentService.get().getSampleSet(container, idriSchema.TABLE_RAW_MATERIALS);
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
     * @param materialName
     * @return
     */
    public static Map<String, Object> getMaterialType(String materialName)
    {
        ViewContext ctx = HttpView.getRootContext();
        Container c = ctx.getContainer();
        ExpMaterial formulationMaterial = getFormulationSampleSet(c).getSample(c, materialName);

        Map<String, Object> aggregate = new CaseInsensitiveHashMap<>();
        aggregate.put("Type", "aggregate");
        aggregate.put("Units", "%v/vol");

        if (formulationMaterial == null)
        {
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
        }

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
        // Prototype code to test saving to a formulation demographics dataset
        Study study = StudyService.get().getStudy(container);
        if (study != null)
        {
            String DATASET_NAME = "FORM1";
            String STUDY_COL_ID = "BatchId";

            UserSchema schema = QueryService.get().getUserSchema(user, container, "study");
            TableInfo info = schema.getTable(DATASET_NAME);
            if (info != null)
            {
                List<Map<String, Object>> _formulation = new ArrayList<>();
                Map<String, Object> keys = new CaseInsensitiveHashMap<>(formulation.describe());
                keys.put(STUDY_COL_ID, formulation.getBatch());

                _formulation.add(keys);
                try
                {
                    SimpleFilter filter = new SimpleFilter(FieldKey.fromParts(STUDY_COL_ID), formulation.getBatch(), CompareType.EQUAL);
                    String[] forms = new TableSelector(info, filter, null).getArray(String.class);
                    if (null != forms)
                    {
                        BatchValidationException errors = new BatchValidationException();
                        if (forms.length == 0)
                        {
                            info.getUpdateService().insertRows(user, container, _formulation, errors, null, Collections.emptyMap());
                        }
                        else
                        {
                            List<Map<String, Object>> result = info.getUpdateService().getRows(user, container, _formulation);
                            info.getUpdateService().updateRows(user, container, _formulation, result, null, Collections.emptyMap());
                        }
                    }
                }
                catch (Exception e)
                {
                    throw new RuntimeException(e);
                }
            }
        }

        ExpSampleSet ss = getFormulationSampleSet(container);
        if (ss != null && ss.canImportMoreSamples())
        {
            ExpMaterial exists = ss.getSample(container, formulation.getBatch());

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

                List<Map<String, Object>> rows = new ArrayList<>();
                rows.add(formulationMap);

                try
                {
                    result = qservice.updateRows(user, container, rows, null, null, null);
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

                List<Map<String, Object>> rows = new ArrayList<>();
                rows.add(formulationMap);

                try
                {
                    BatchValidationException errors = new BatchValidationException();
                    result = qservice.insertRows(user, container, rows, errors, null, null);
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

            try (DbScope.Transaction transaction = getSchema().getScope().ensureTransaction())
            {
                // Delete all rows for the current formulation
                SimpleFilter filter = new SimpleFilter(FieldKey.fromParts("lot"), formulation.getRowID());
                Table.delete(getSchema().getTable(idriSchema.TABLE_CONCENTRATIONS), filter);

                // Add all the new concentration values
                for (Concentration conc : concentrations)
                {
                    Table.insert(user, getSchema().getTable(idriSchema.TABLE_CONCENTRATIONS), conc);
                }

                transaction.commit();
            }

            List<Integer> invalids = new ArrayList<>();
            SQLFragment sql = new SQLFragment("SELECT * FROM idri.concentrations WHERE compound = ?");
            sql.add(formulation.getRowID());

            Collection<Concentration> concCollection = new SqlSelector(getSchema(), sql).getCollection(Concentration.class);
            for (Concentration conc : concCollection)
                invalids.add(conc.getLot());

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

    public static boolean deleteFormulation(Formulation formulation, User user, Container container) throws SQLException
    {
        // TODO: Clean-up related study dataset entries

        ExpMaterial mat = ExperimentService.get().getExpMaterial(formulation.getRowID());

        if (mat != null)
        {
            // Delete all concentration entries for this formulation
            SimpleFilter filter = new SimpleFilter("lot", formulation.getRowID());

            // TODO: Transact if possible
            Table.delete(getSchema().getTable(idriSchema.TABLE_CONCENTRATIONS), filter);
            mat.delete(user);

            return true;
        }

        return false;
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
        Formulation formulation = null;
        ExpSampleSet ss = getFormulationSampleSet(HttpView.getContextContainer());

        if (null != ss)
        {
            ExpMaterial sampleRow = ss.getSample(lot);
            if (sampleRow != null)
            {
                formulation = Formulation.fromSample(sampleRow, true);
            }
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
        Formulation formulation = null;

        ExpMaterial mat = service.getExpMaterial(RowId);
        if (mat != null)
        {
            formulation = getFormulation(mat.getName());
        }

        return formulation;
    }

    /**
     * Calculates concentrations and returns a list of Concentration objects.
     * @param formulation - The formulation and all associated first-level materials
     * @param c - container
     * @param u - user
     * @return
     */
    private static List<Concentration> calculateConcentrations(Formulation formulation, Container c, User u)
    {
        List<Concentration> concentrations = new ArrayList<>();

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

        Map<Integer, Concentration> map = new HashMap<>();
        List<Concentration> tops = new ArrayList<>();
        for (Concentration conc : concentrations)
        {
            conc.setContainer(c);
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

        concentrations = new ArrayList<>();
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
        ExpSampleSet sampleSet = getFormulationSampleSet(c);

        if (sampleSet != null)
        {
            ExpMaterial m = sampleSet.getSample(f.getBatch());

            if (m != null)
            {
                List<Concentration> concentrations = new ArrayList<>();
                SQLFragment sql = new SQLFragment("SELECT * FROM idri.concentrations WHERE lot = ? AND istop = ?");
                sql.add(service.getExpMaterialsByName(f.getBatch(), c, u).get(0).getRowId());
                sql.add(isTopOnly);
                Collection<Concentration> concCollection = new SqlSelector(getSchema(), sql).getCollection(Concentration.class);
                concentrations.addAll(concCollection);
                return concentrations;
            }
        }

        return Collections.emptyList();
    }

    private static List<Concentration> getConcentrations(Material material, Container c, User u)
    {
        ExperimentService.Interface service = ExperimentService.get();
        List<Concentration> concentrations = new ArrayList<>();
        ExpMaterial m = getRawMaterialsSampleSet(c).getSample(c, material.getMaterialName());

        if (m == null)
        {
            m = getFormulationSampleSet(c).getSample(c, material.getMaterialName());
            if (m == null)
                throw new RuntimeException("The material received is not valid.");

            SQLFragment sql = new SQLFragment("SELECT * FROM idri.concentrations WHERE lot = ? AND istop = 'false'");
            sql.add(service.getExpMaterialsByName(material.getMaterialName(), c, u).get(0).getRowId());
            Collection<Concentration> concCollection = new SqlSelector(getSchema(), sql).getCollection(Concentration.class);
            concentrations.addAll(concCollection);

            double concVal;
            for(Concentration concentration : concentrations)
            {
                concVal = ((concentration.getConcentration()/100.0) * (material.getConcentration()/100.0));
                concentration.setConcentration((concVal * 100.0));
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

            Map<String, Object> type;
            if (material.getTypeKey() != null)
            {
                type = getCompoundType(material.getTypeKey(), c);
                if (type != null)
                    conc.setUnit(type.get("units").toString());
                else
                    conc.setUnit("%v/vol");
            }
            else
                conc.setUnit("%v/vol");

            conc.setConcentration(material.getConcentration());
            concentrations.add(conc);
        }

        if (material.isTop())
        {
            Concentration conc = new Concentration();
            conc.setCompound(m.getRowId());  // Use the expMaterial for the RowId

            Map<String, Object> type;
            if (material.getTypeKey() != null)
            {
                type = getCompoundType(material.getTypeKey(), c);
                if (type != null)
                    conc.setUnit(type.get("units").toString());
                else
                    conc.setUnit("%v/vol");
            }
            else
                conc.setUnit("%v/vol");

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
        ExpSampleSet rawMaterialsSS = getRawMaterialsSampleSet(container);
        ExpMaterial m = null;

        if (rawMaterialsSS != null)
        {
            m = rawMaterialsSS.getSample(RawMaterial);

            // Lookup the Compound for this Raw Material
            if (m != null)
            {
                String pcol = rawMaterialsSS.getParentCol().getName();
                assert pcol != null : idriSchema.TABLE_RAW_MATERIALS + " requires a parent column. Fix the Sample Set to proceed.";
                Map<PropertyDescriptor, Object> values = m.getPropertyValues();
                for (PropertyDescriptor pd : values.keySet())
                {
                    if (pd.getName().equals(pcol))
                        return getCompoundsSampleSet(container).getSample(values.get(pd).toString());
                }
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

    @Nullable
    private static Map<String, Object> getCompoundType(ExpMaterial Compound)
    {
        Map<PropertyDescriptor, Object> values = Compound.getPropertyValues();
        for (PropertyDescriptor pd : values.keySet())
        {
            if (pd.getName().equalsIgnoreCase("compoundLookup"))
            {
                ListDefinition ld = ListService.get().getList(Compound.getContainer(), idriSchema.LIST_MATERIAL_TYPES);
                Map<String, Object> type = new CaseInsensitiveHashMap<>();
                if (ld != null)
                {
                    User u = HttpView.currentContext().getUser();
                    Container c = Compound.getContainer();

                    List<Map<String, Object>> types = new ArrayList<>();
                    Map<String, Object> keys = new CaseInsensitiveHashMap<>();
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

    @Nullable
    public static Map<String, Object> getCompoundType(Integer key, Container c)
    {
        ListDefinition ld = ListService.get().getList(c, idriSchema.LIST_MATERIAL_TYPES);
        Map<String, Object> type = new CaseInsensitiveHashMap<>();
        if (ld != null)
        {
            User u = HttpView.currentContext().getUser();

            List<Map<String, Object>> types = new ArrayList<>();
            Map<String, Object> keys = new CaseInsensitiveHashMap<>();
            keys.put("Key", key);
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

            return type;
        }
        return null;
    }

    /**
     * Initializes the Samples Sets used by Formulations. Does precautionary
     * lookup to make sure sample sets don't already exist. If they do, does
     * nothing.
     * @param c
     */
    public static void initializeSampleSets(Container c, User user)
    {
        try
        {
            List<GWTPropertyDescriptor> properties;

            // Create the Compounds Sample Set
            if (getCompoundsSampleSet(c) == null)
            {
                // Definition -- 'Compounds' Sample Set
                properties = new ArrayList<>();
                properties.add(new GWTPropertyDescriptor("Compound Name", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Full Name", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("CAS Number", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Density", PropertyType.DOUBLE.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Molecular Weight", PropertyType.DOUBLE.getTypeUri()));

                ExperimentService.get().createSampleSet(c, user, idriSchema.TABLE_COMPOUNDS, "Formulation Compounds", properties, Collections.emptyList(), 0, -1, -1, -1);
            }

            // Create the Raw Materials Sample Set
            if (getRawMaterialsSampleSet(c) == null)
            {
                properties = new ArrayList<>();
                properties.add(new GWTPropertyDescriptor("Identifier", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Material Name", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Supplier", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Source", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Catalogue ID", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Lot ID", PropertyType.STRING.getTypeUri()));

                ExperimentService.get().createSampleSet(c, user, idriSchema.TABLE_RAW_MATERIALS, "Raw Materials used in Formulations", properties, Collections.emptyList(), 0, -1, -1, 1);
            }

            // Create the Formulations Sample Set
            if (getFormulationSampleSet(c) == null)
            {
                properties = new ArrayList<>();
                properties.add(new GWTPropertyDescriptor("Batch", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("DM", PropertyType.DATE_TIME.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("batchsize", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("nbpg", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Failure", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Type", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Catalog", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Grant", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Comments", PropertyType.STRING.getTypeUri()));
                properties.add(new GWTPropertyDescriptor("Raw Materials", PropertyType.STRING.getTypeUri()));

                ExperimentService.get().createSampleSet(c, user, idriSchema.TABLE_FORMULATIONS, null, properties, Collections.emptyList(), 0, -1, -1, 9);
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

    public static void initializeLists(Container c, User user)
    {
        try
        {
            ListService.Interface listService = ListService.get();
            ListDefinition list;
            Domain listDomain;

            // Create 'Catalog' list
            list = listService.getList(c, "Catalog");
            if (null == list)
            {
                list = listService.createList(c, "Catalog", ListDefinition.KeyType.Varchar);
                list.setKeyName("catalogId");
                list.save(user);
            }

            // Create 'Grant' list
            list = listService.getList(c, "Grants");
            if (null == list)
            {
                list = listService.createList(c, "Grants", ListDefinition.KeyType.Varchar);
                list.setKeyName("grant");
                list.save(user);
            }

            // Create 'Temperatures' list
            list = listService.getList(c, "Temperatures");
            if (null == list)
            {
                list = listService.createList(c, "Temperatures", ListDefinition.KeyType.Integer);
                list.setKeyName("temperature");
                listDomain = list.getDomain();
                if (null != listDomain)
                {
                    addDomainProperty(listDomain, "defaultStability", "On Stability", PropertyType.BOOLEAN, c);
                }
                list.save(user);
            }

            // Create 'Timepoints' list
            list = listService.getList(c, "Timepoints");
            if (null == list)
            {
                list = listService.createList(c, "Timepoints", ListDefinition.KeyType.Varchar);
                list.setKeyName("time");
                listDomain = list.getDomain();
                if (null != listDomain)
                {
                    addDomainProperty(listDomain, "sort", "Sort Order", PropertyType.INTEGER, c);
                    addDomainProperty(listDomain, "defaultStability", "On Stability", PropertyType.BOOLEAN, c);
                }
                list.save(user);
            }

            // Create 'MaterialTypes' list
            list = listService.getList(c, "MaterialTypes");
            if (null == list)
            {
                list = listService.createList(c, "MaterialTypes", ListDefinition.KeyType.AutoIncrementInteger);
                list.setKeyName("key");

                listDomain = list.getDomain();
                if (null != listDomain)
                {
                    addDomainProperty(listDomain, "type", "Type", PropertyType.STRING, c);
                    addDomainProperty(listDomain, "units", "Units", PropertyType.STRING, c);
                }

                list.save(user);
            }

            // Create 'FormulationTypes' list
            list = listService.getList(c, "FormulationTypes");
            if (null == list)
            {
                list = listService.createList(c, "FormulationTypes", ListDefinition.KeyType.Varchar);
                list.setKeyName("type");
                list.save(user);
            }

            // Create 'TaskList' list
            list = listService.getList(c, "TaskList");
            if (null == list)
            {
                list = listService.createList(c, "TaskList", ListDefinition.KeyType.AutoIncrementInteger);
                list.setKeyName("Key");

                listDomain = list.getDomain();
                if (null != listDomain)
                {
                    addDomainProperty(listDomain, "cat", "Category", PropertyType.STRING, c);
                    addDomainLookupProperty(listDomain, "lotNum", "Lot Num", PropertyType.INTEGER, c, "Samples", "Formulations");
                    addDomainLookupProperty(listDomain, "temperature", "Temp", PropertyType.STRING, c, "lists", "Temperatures");
                    addDomainLookupProperty(listDomain, "timepoint", "Timepoint", PropertyType.STRING, c, "lists", "Timepoints");
                    addDomainProperty(listDomain, "type", "formulation", PropertyType.STRING, c);
                    addDomainProperty(listDomain, "adjuvant", "Adjuvant", PropertyType.STRING, c);
                    addDomainProperty(listDomain, "date", "Date Due", PropertyType.DATE_TIME, c);
                    addDomainProperty(listDomain, "comment", "comment", PropertyType.STRING, c);
                    addDomainProperty(listDomain, "importance", "importance", PropertyType.STRING, c);
                    addDomainProperty(listDomain, "complete", "Complete", PropertyType.BOOLEAN, c);
                    addDomainProperty(listDomain, "failed", "Failed", PropertyType.BOOLEAN, c);
                }
                list.save(user);
            }

            // Create 'TimepointsHPLCUV' list
            list = listService.getList(c, "TimepointsHPLCUV");
            if (null == list)
            {
                list = listService.createList(c, "TimepointsHPLCUV", ListDefinition.KeyType.Varchar);
                list.setKeyName("time");
                listDomain = list.getDomain();
                if (null != listDomain)
                {
                    addDomainProperty(listDomain, "sort", "Sort Order", PropertyType.INTEGER, c);
                    addDomainProperty(listDomain, "defaultStability", "On Stability", PropertyType.BOOLEAN, c);
                }
                list.save(user);
            }

            // Create 'StabilityProfile' list
            list = listService.getList(c, "StabilityProfile");
            if (null == list)
            {
                list = listService.createList(c, "StabilityProfile", ListDefinition.KeyType.AutoIncrementInteger);
                list.setKeyName("Key");
                listDomain = list.getDomain();
                if (null != listDomain)
                {
                    addDomainLookupProperty(listDomain, "lotNum", "Lot Num", PropertyType.INTEGER, c, "Samples", "Formulations");
                    addDomainProperty(listDomain, "profile", "Profile", PropertyType.MULTI_LINE, c);
                }
                list.save(user);
            }

            // Create 'HPLCStandard' list
            list = listService.getList(c, "HPLCStandard");
            if (null == list)
            {
                list = listService.createList(c, "HPLCStandard", ListDefinition.KeyType.AutoIncrementInteger);
                list.setKeyName("Key");
                listDomain = list.getDomain();
                if (null != listDomain)
                {
                    addDomainProperty(listDomain, "Name", null, PropertyType.STRING, c);
                    addDomainProperty(listDomain, "provisionalRun", null, PropertyType.INTEGER, c);
                    addDomainProperty(listDomain, "rsquared", null, PropertyType.DOUBLE, c);
                    addDomainProperty(listDomain, "b0", null, PropertyType.DOUBLE, c);
                    addDomainProperty(listDomain, "b1", null, PropertyType.DOUBLE, c);
                    addDomainProperty(listDomain, "b2", null, PropertyType.DOUBLE, c);
                    addDomainProperty(listDomain, "error", null, PropertyType.DOUBLE, c);
                }
                list.save(user);
            }

            // Create 'HPLCStandardSource' list
            list = listService.getList(c, "HPLCStandardSource");
            if (null == list)
            {
                list = listService.createList(c, "HPLCStandardSource", ListDefinition.KeyType.AutoIncrementInteger);
                list.setKeyName("Key");
                listDomain = list.getDomain();
                if (null != listDomain)
                {
                    addDomainProperty(listDomain, "name", null, PropertyType.STRING, c);
                    addDomainProperty(listDomain, "concentration", null, PropertyType.DOUBLE, c);
                    addDomainProperty(listDomain, "xleft", null, PropertyType.DOUBLE, c);
                    addDomainProperty(listDomain, "xright", null, PropertyType.DOUBLE, c);
                    addDomainProperty(listDomain, "auc", null, PropertyType.DOUBLE, c);
                    addDomainProperty(listDomain, "peakMax", null, PropertyType.DOUBLE, c);
                    addDomainProperty(listDomain, "peakResponse", null, PropertyType.DOUBLE, c);
                    addDomainProperty(listDomain, "filePath", null, PropertyType.STRING, c);
                    addDomainProperty(listDomain, "fileName", null, PropertyType.STRING, c);
                    addDomainProperty(listDomain, "fileExt", null, PropertyType.STRING, c);
                    addDomainLookupProperty(listDomain, "standard", null, PropertyType.INTEGER, c, "lists", "HPLCStandard");
                }
                list.save(user);
            }

            // Create 'VisualOptions' list
            list = listService.getList(c, "VisualOptions");
            if (null == list)
            {
                list = listService.createList(c, "VisualOptions", ListDefinition.KeyType.AutoIncrementInteger);
                list.setKeyName("Key");
                listDomain = list.getDomain();
                if (null != listDomain)
                {
                    addDomainProperty(listDomain, "item", null, PropertyType.STRING, c);
                    addDomainProperty(listDomain, "category", null, PropertyType.STRING, c);
                    addDomainProperty(listDomain, "pass", null, PropertyType.BOOLEAN, c);
                    addDomainProperty(listDomain, "fail", null, PropertyType.BOOLEAN, c);
                }
                list.save(user);
            }

            // Setup lookup for compound material type
            ExpSampleSet compounds = getCompoundsSampleSet(c);
            if (null != compounds)
            {
                Domain sampleDomain = compounds.getType();
                if (null != sampleDomain)
                {
                    addDomainLookupProperty(sampleDomain, "CompoundLookup", "Type of Material", PropertyType.INTEGER, c, "lists", "MaterialTypes");
                    sampleDomain.save(user);
                }
            }
        }
        catch (Exception e)
        {
            throw new RuntimeException(e);
        }
    }

    private static DomainProperty addDomainProperty(Domain domain, String name, @Nullable String label, PropertyType type, Container c)
    {
        PropertyDescriptor pd = new PropertyDescriptor(domain.getTypeURI(), type, name, c);
        DomainProperty property = domain.addProperty(new PropertyStorageSpec(pd));
        if (null != label)
            property.setLabel(label);
        return property;
    }

    private static DomainProperty addDomainLookupProperty(Domain domain, String name, @Nullable String label, PropertyType type, Container c, String lookupSchema, String lookupQuery)
    {
        PropertyDescriptor pd = new PropertyDescriptor(domain.getTypeURI(), type, name, c);
        DomainProperty property = domain.addProperty(new PropertyStorageSpec(pd));
        pd = property.getPropertyDescriptor();
        pd.setLookupContainer(c.getEntityId().toString());
        pd.setLookupSchema(lookupSchema);
        pd.setLookupQuery(lookupQuery);

        if (null != label)
            property.setLabel(label);
        return property;
    }
}