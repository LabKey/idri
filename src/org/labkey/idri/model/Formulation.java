/*
 * Copyright (c) 2011-2013 LabKey Corporation
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
package org.labkey.idri.model;

import org.apache.commons.beanutils.BeanUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.labkey.api.exp.ObjectProperty;
import org.labkey.api.exp.api.ExpMaterial;
import org.labkey.api.view.HttpView;
import org.labkey.idri.idriManager;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * User: jNicholas
 * Date: Aug 26, 2010
 * Time: 4:22:21 PM
 */
public class Formulation
{
    private int _rowID = -1;
    private String _batch;
    private Date _dm;
    private String _batchsize;
    private String _nbpg;
    private String _comments;
    private String _type;
    private String _catalog;
    private String _grant;
    private String _materialsString;
    private Map _map;
    
    private transient List<Material> _materials = new ArrayList<>();

    public int getRowID()
    {
        return _rowID;
    }

    public void setRowID(int rowID)
    {
        _rowID = rowID;
        updateMap("RowId", _rowID);
    }

    public String getBatch()
    {
        return _batch;
    }

    public void setBatch(String batch)
    {
        _batch = batch;
        updateMap("Batch", _batch);
    }

    public Date getDm()
    {
        return _dm;
    }

    public void setDm(Date dm)
    {
        _dm = dm;
        updateMap("DM", _dm);
    }

    public String getBatchsize()
    {
        return _batchsize;
    }

    public void setBatchsize(String batchsize)
    {
        _batchsize = batchsize;
        updateMap("batchsize", _batchsize);
    }

    public String getNbpg()
    {
        return _nbpg;
    }

    public void setNbpg(String nbpg)
    {
        _nbpg = nbpg;
        updateMap("nbpg", _nbpg);
    }

    public String getComments()
    {
        return _comments;
    }

    public void setComments(String comments)
    {
        _comments = comments;
        updateMap("Comments", _comments);
    }

    public String getType()
    {
        return _type;
    }

    public void setType(String type)
    {
        _type = type;
        updateMap("Type", _type);
    }

    public String getCatalog()
    {
        return _catalog;
    }

    public void setCatalog(String catalog)
    {
        _catalog = catalog;
        updateMap("Catalog", _catalog);
    }

    public String getGrant()
    {
        return _grant;
    }

    public void setGrant(String grant)
    {
        _grant = grant;
        updateMap("Grant", _grant);
    }

    public List<Material> getMaterials()
    {
        return _materials;
    }

    public String getMaterialsString()
    {
        return _materialsString;
    }

    private void setMaterialsString(String matString)
    {
        _materialsString = matString;
    }
    
    public void addMaterial(Material material)
    {
        getMaterials().add(material);

        // Build the multi-valued string
        String materialString = "";
        List<Material> materials = getMaterials();
        if (materials.size() > 0)
        {
            boolean first = true;
            for (Material mat : materials)
            {
                if (first)
                {
                    materialString += mat.getMaterialName();
                    first = !first;
                }
                else
                    materialString += ", " + mat.getMaterialName();
            }
        }
        setMaterialsString(materialString);
        updateMap("Raw Materials", materialString);
    }

    /* Similar to BeanUtils.describe(Obj) in functionality. */
    public Map<String, Object> describe()
    {       
        return _map;
    }

    private void updateMap(String string, Object o)
    {
        if (_map == null)
            _map = new HashMap<String, Object>();
        _map.put(string, o);
    }

    public JSONObject toJSON()
    {
        JSONObject formulation = new JSONObject(this);
        formulation.remove("class");
        formulation.remove("container");

        formulation.remove("materials");
        JSONArray jsonMaterials = new JSONArray();
        if (this.getMaterials() != null)
        {
            for (Material material : this.getMaterials())
            {
                jsonMaterials.put(new JSONObject(material));
            }
        }
        formulation.put("materials", jsonMaterials);

        return formulation;
    }
    
    public static Formulation fromJSON(JSONObject json)
    {
        try
        {
            Formulation formulation = new Formulation();
            BeanUtils.populate(formulation, json);

            JSONArray materials = json.getJSONArray("materials");

            formulation._materials = new ArrayList<>();
            for (int idx = 0; idx < materials.length(); ++idx)
            {
                JSONObject materialProps = materials.getJSONObject(idx);
                Material material = new Material();
                BeanUtils.populate(material, materialProps);
                material.setType(idriManager.getMaterialType(material.getMaterialName()));
                formulation.addMaterial(material);
            }
            
            return formulation;
        }
        catch (Exception e)
        {
            throw new RuntimeException(e);
        }
    }

    /**
     * Converts this Formulation into a Sample Set ready ExpMaterial.
     * NOTE: This does not change state of anything! No material is added, purely for object retrieval.
     * @return
     */
    public ExpMaterial toSample()
    {
        ExpMaterial asSample = idriManager.getFormulationAsSample(this);
        return asSample;
    }

    public static Formulation fromSample(ExpMaterial sample, boolean includeMaterials)
    {
        try
        {
            Map<String, ObjectProperty> values = sample.getObjectProperties();
            Map<String, Object> properties = new HashMap<>();

            // Get the RowId -- must have a RowId
            properties.put("rowID", sample.getRowId());
            properties.put("container", sample.getContainer());
            properties.put("comments", sample.getComment());
            
            for(ObjectProperty prop : values.values())
            {
                String name = prop.getName();
                if (name != null)
                {                    
                    properties.put(name.toLowerCase().replace(" ", ""), prop.value());
                }
            }

            Formulation formulation = new Formulation();
            BeanUtils.populate(formulation, properties);

            if (includeMaterials)
            {
                /* Lookup concentration values */
                List<Concentration> concs = idriManager.getConcentrations(formulation,
                        HttpView.getContextContainer(), HttpView.getRootContext().getUser(), true);

                /* Get top level materials to describe */
                if (properties.get("rawmaterials") != null)
                {
                    String[] mats = properties.get("rawmaterials").toString().replace(" ", "").split(",");
                    boolean found;
                    for (int i = 0; i < mats.length; i++)
                    {
                        Material m = new Material();
                        m.setMaterialName(mats[i]);
                        found = false;
                        for (Concentration c : concs)
                        {
                            m = idriManager.getMaterial(c.getMaterial());
                            if (null != m && m.getMaterialName().equals(mats[i]))
                            {
                                m.setConcentration(c.getConcentration());
                                m.setType(idriManager.getMaterialType(mats[i]));
                                m.setTop(true);                                
                                found = true;
                                break;
                            }
                        }
                        if (!found)
                        {
                            m = new Material();
                            m.setMaterialName(mats[i]); // Fix for NULL materials set due to no name being present
                            m.setType(idriManager.getMaterialType(mats[i]));
                        }
                        formulation.addMaterial(m);
                    }
                }
            }

            return formulation;
        }
        catch (Exception e)
        {
            throw new RuntimeException(e);
        }
    }
}
