/*
 * Copyright (c) 2014 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('LABKEY.hplc.SpectrumPlot', {

    extend: 'Ext.Component',

    alias: 'widget.spectrum',

    colors: ['#00FE00', '#0100FE', '#FC01FC', '#ff0000'],

    yLabel: '',

    xLabel: '',

    leftBoundField: null,

    rightBoundField: null,

    lowBoundField: null,

    highBoundField: null,

    id: Ext4.id(),

    height: '100%',

    autoEl: {
        tag: 'div'
    },

    highlight: undefined,

    initComponent : function() {
        this.callParent();
    },

    clearPlot : function() {
        Ext4.get(this.id).update('');
    },

    renderPlot : function(contents) {

        var layers = [];
        var colors = this.colors;
        var xleft = Ext4.getCmp(this.leftBoundField).getValue();
        var xright = Ext4.getCmp(this.rightBoundField).getValue();
        var low = Ext4.getCmp(this.lowBoundField).getValue();
        var high = Ext4.getCmp(this.highBoundField).getValue();

        if (!xleft) {
            xleft = 0;
        }
        if (!xright) {
            xright = 0;
        }

        var c=0, isHighlight = false, useHighlight = (this.highlight ? true : false), color;
        for (var i=0; i < contents.length; i++) {
            //
            // create point layer
            //
            color = colors[c%colors.length];

            if (useHighlight) {
                isHighlight = (this.highlight === contents[i].fileName);

                if (!isHighlight) {
                    color = '#A09C9C';
                }
            }

            var pointLayer = new LABKEY.vis.Layer({
                data: LABKEY.hplc.QualityControl.getData(contents[i], xleft, xright, 2),
                aes: {
                    x: function(r) { return r[0]; },
                    y: function(r) { return r[1]; }
                },
                geom: new LABKEY.vis.Geom.Path({
                    color: color
                })
            });
            c++;

            layers.push(pointLayer);
        }

        this.update('');

        var box = this.getBox();

        var width = box.width;
        var height = box.height - 30;

        var me = this;

        var plot = new LABKEY.vis.Plot({
            renderTo: this.id,
            rendererType: 'd3',
            width: width,
            height: height,
            layers: layers,
            legendPos: 'none',
            labels: {
                x: {value: this.xLabel},
                y: {value: this.yLabel}
            },
            scales: {
                x: { domain: [xleft, xright] },
                y: { domain: [low, high] }
            },
            brushing: {
                brush: function() {}, /* required due to bug in brushing API */
                brushend: function(e, d, extent, ls) {
                    var left = extent[0][0];
                    var right = extent[1][0];
                    var bottom = extent[0][1];
                    var top = extent[1][1];
                    me.updateZoom(left, right, bottom, top);
                }
            }
        });

        plot.render();
    },

    setHighlight : function(highlight) {
        this.highlight = highlight;
    },

    updateZoom : function(left, right, bottom, top) {
        this.fireEvent('zoom', left, right, bottom, top);
    }
});