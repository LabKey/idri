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

import org.apache.commons.beanutils.BeanUtils;
import org.labkey.api.exp.ObjectProperty;
import org.labkey.api.exp.api.ExpMaterial;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: jNicholas
 * Date: Oct 15, 2010
 * Time: 11:30:07 AM
 */
public class Compound
{
    private int _rowID = -1;
    private String _name;
    private String _fullName;
    private String _type;
    private String _casNumber;
    private double _density;
    private double _molecularWeight;

    public boolean isNew()
    {
        return _rowID < 0;
    }
    
    public int getRowID()
    {
        return _rowID;
    }

    public void setRowID(int rowID)
    {
        _rowID = rowID;
    }

    public String getName()
    {
        return _name;
    }

    public void setName(String name)
    {
        _name = name;
    }

    public String getFullName()
    {
        return _fullName;
    }

    public void setFullName(String fullName)
    {
        _fullName = fullName;
    }

    public String getType()
    {
        return _type;
    }

    public void setType(String type)
    {
        _type = type;
    }

    public String getCasNumber()
    {
        return _casNumber;
    }

    public void setCasNumber(String casNumber)
    {
        _casNumber = casNumber;
    }

    public double getDensity()
    {
        return _density;
    }

    public void setDensity(double density)
    {
        _density = density;
    }

    public double getMolecularWeight()
    {
        return _molecularWeight;
    }

    public void setMolecularWeight(double molecularWeight)
    {
        _molecularWeight = molecularWeight;
    }

    public static Compound fromSample(ExpMaterial sample)
    {
        try
        {
            Map<String, ObjectProperty> values = sample.getObjectProperties();
            Map<String, Object> properties = new HashMap<String, Object>();

            for(ObjectProperty prop : values.values())
            {
                String name = prop.getName();
                if (name != null)
                {
                    properties.put(name.toLowerCase().replace(" ", ""), prop.value());
                }
            }

            Compound compound = new Compound();
            BeanUtils.populate(compound, properties);

            return compound;
        }
        catch (Exception e)
        {
            throw new RuntimeException(e);
        }
    }
}
