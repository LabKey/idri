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

import org.labkey.api.data.Container;

/**
 * User: jNicholas
 * Date: Sep 1, 2010
 * Time: 2:17:36 PM
 */
public class Concentration
{
    private int _rowid = -1;
    private double _conc;
    private String _unit;
    private int _compound;
    Container _container;
    private int _lot;
    private int _material;
    private boolean _top;
    
    public int getRowid()
    {
        return _rowid;
    }

    public void setRowid(int rowid)
    {
        _rowid = rowid;
    }

    public Container getContainer()
    {
        return _container;
    }

    public void setContainer(Container container)
    {
        _container = container;
    }

    public double getConcentration()
    {
        return _conc;
    }

    public void setConcentration(double concentration)
    {
        _conc = concentration;
    }

    public String getUnit()
    {
        return _unit;
    }

    public void setUnit(String unit)
    {
        _unit = unit;
    }

    public int getCompound()
    {
        return _compound;
    }

    public void setCompound(int compound)
    {
        _compound = compound;
    }

    public int getMaterial()
    {
        return _material;
    }

    public void setMaterial(int material)
    {
        _material = material;
    }
    
    public int getLot()
    {
        return _lot;
    }

    public void setLot(int lot)
    {
        _lot = lot;
    }

    public boolean isTop()
    {
        return _top;
    }

    public boolean getIsTop()
    {
        return isTop();
    }

    public void setIsTop(boolean top)
    {
        _top = top;
    }

    /*@Override
    public boolean equals(Object aThat)
    {
        if (this == aThat)
            return true;

        if (!(aThat instanceof Concentration))
            return false;

        Concentration that = (Concentration)aThat;
        return (that.getMaterial() == this.getMaterial() &&
                that.getLot() == this.getLot() &&
                that.getUnit().equals(this.getUnit()));
    }*/
}
