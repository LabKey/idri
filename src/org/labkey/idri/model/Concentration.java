package org.labkey.idri.model;

/**
 * Created by IntelliJ IDEA.
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
