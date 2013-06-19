/*
 * Copyright (c) 2011 LabKey Corporation
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
import org.labkey.api.data.ObjectFactory;
import org.labkey.api.exp.ObjectProperty;
import org.labkey.api.exp.api.ExpMaterial;

import java.util.Map;

/**
 * User: jNicholas
 * Date: Oct 15, 2010
 * Time: 11:30:07 AM
 */
public class Compound
{
    private int rowID = -1;
    private String name;
    private String fullName;
    private String type;
    private String CASNumber;
    private double density;
    private double molecularWeight;

    public boolean isNew()
    {
        return rowID < 0;
    }
    
    public int getRowID()
    {
        return rowID;
    }

    public void setRowID(int rowID)
    {
        this.rowID = rowID;
    }

    public String getName()
    {
        return name;
    }

    public void setCompoundName(String compoundName)
    {
        this.name = compoundName;
    }

    public void setName(String name)
    {
        this.name = name;
    }

    public String getFullName()
    {
        return fullName;
    }

    public void setFullName(String FullName)
    {
        this.fullName = FullName;
    }

    public String getType()
    {
        return type;
    }

    public void setType(String type)
    {
        this.type = type;
    }

    public void setTypeofMaterial(String typeofMaterial)
    {
        this.type = typeofMaterial;
    }

    public String getCASNumber()
    {
        return CASNumber;
    }

    public void setCASNumber(String CASNumber)
    {
        this.CASNumber = CASNumber;
    }

    public double getDensity()
    {
        return density;
    }

    public void setDensity(double density)
    {
        this.density = density;
    }

    public double getMolecularWeight()
    {
        return molecularWeight;
    }

    public void setMolecularWeight(double molecularWeight)
    {
        this.molecularWeight = molecularWeight;
    }

    public static Compound fromSample(ExpMaterial sample)
    {
        try
        {
            Map<String, ObjectProperty> values = sample.getObjectProperties();
            Map<String, Object> properties = new CaseInsensitiveHashMap<Object>();

            for(ObjectProperty prop : values.values())
            {
                String name = prop.getName();
                if (name != null)
                {
                    properties.put(name.replace(" ", ""), prop.value());
                }
            }

            return ObjectFactory.Registry.getFactory(Compound.class).fromMap(properties);
        }
        catch (Exception e)
        {
            throw new RuntimeException(e);
        }
    }
}
