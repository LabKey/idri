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

import org.labkey.api.collections.CaseInsensitiveHashMap;
import org.labkey.api.exp.api.ExpMaterial;

import java.util.Map;

/**
 * User: jNicholas
 * Date: Aug 26, 2010
 * Time: 4:30:24 PM
 */
public class Material
{
    private String _materialName;
    private double _concentration;
    private Map<String, Object> _type;
    private Integer _typeKey;
    private String _typeID;
    private boolean _top = false;
    private Compound _compound;

    public boolean isTop()
    {
        return _top;
    }

    public void setTop(boolean top)
    {
        _top = top;
    }
    
    public String getMaterialName()
    {
        return _materialName;
    }

    public void setMaterialName(String materialName)
    {
        _materialName = materialName;
    }

    public Integer getTypeKey()
    {
        return (Integer) _type.get("Key");
    }

    public void setTypeKey(Integer typeKey)
    {
        _typeKey = typeKey;
    }

    public Map<String, Object> getType()
    {
        return _type;
    }

    public void setType(Map<String, Object> type)
    {
        _type = type;

        if (_type.get("Key") == null && _typeKey != null)
            _type.put("Key", _typeKey);

        Object mappedType = _type.get("type");
        if (mappedType != null)
        {
            this.setTypeID(_type.get("type").toString());
        }
    }

    public String getTypeID()
    {
        return _typeID;
    }

    /**
     * This
     * @param typeId
     */
    public void setTypeID(String typeId)
    {
        _typeID = typeId;

        Map<String, Object> map;
        if (_type == null)
        {
            map = new CaseInsensitiveHashMap<>();
            map.put("type", typeId);
            this.setType(map);
        }
        else
        {
            _type.put("type", typeId);
        }
    }

    public double getConcentration()
    {
        return _concentration;
    }

    public void setConcentration(double concentration)
    {
        _concentration = concentration;
    }

    public void setCompound(Compound compound)
    {
        _compound = compound;
    }

    public Compound getCompound()
    {
        return _compound;
    }

    public String getTypeUnit()
    {
        if (_type != null)
        {
            Object unit = _type.get("Units");
            if (unit != null)
                return unit.toString();
            return "unknown";
        }
        else
            return "%v/vol";
    }

    public static Material fromExpMaterial(ExpMaterial exp)
    {
        Material material = new Material();
        material.setMaterialName(exp.getName());

        return material;
    }

    @Override
    public boolean equals(Object obj)
    {
        if (this == obj)
            return true;

        if (obj == null)
            return false;

        if (!(obj instanceof Material))
            return false;

        Material cMat = (Material) obj;

        return this.getMaterialName().equals(cMat.getMaterialName());
    }

    @Override
    public int hashCode()
    {
        int prime = 23;
        return prime + this._materialName.hashCode();
    }
}
