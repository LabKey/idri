/*
 * Copyright (c) 2011-2012 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
var LineFit = function (config) {

    var _x = config.x;
    var _y = config.y;
    var _weight;

    if (!_x) throw new Error("x data array required");
    if (!_y) throw new Error("y data array required");
    if (_x.length < 2)
        throw new Error("Need more than one data point");
    if (_x.length != _y.length)
        throw new Error("x and y arrays must be the same size");

    var _numXY = _x.length;
    var _doneRegress = false;
    var _regressOK = false;

    var _intercept;
    var _slope;
    var _rSquared;
    var _numXY;
    var _sumXX;
    var _sumSqDevX;
    var _sumSqDevY;
    var _sumSqDevXY;
    var _meanSqError;

    function reset() {
        _doneRegress = false;
        _regressOK = false;
        _numXY = _intercept = _slope = _rSquared =
            _sumSqDevX = _sumSqDevY = _sumSqDevXY =
            _meanSqError =
            undefined;
    }

    /**
     * Normalize the line fit weighting factors
     */
    function _setWeights(weights) {
        if (!weights) return;
        if (weights.length != _numXY)
            throw new Error("weight array length must be the same size as data");
        var sumW = 0;
        var numNonZero = 0;
        for (var i = 0; i < weights.length; i++) {
            var weight = weights[i];
            if (weight < 0)
                throw new Error("weight must be non-zero");
            sumW += weight;
            if (weight != 0)
                numNonZero++;
        }
        if (numNonZero < 2)
            throw new Error("At least two weights must be non-zero");
        var factor = weights.length / sumW;

        var scaled = new Array();
        for (var i = 0; i < weights.length; i++) {
            scaled[i] = weights[i] * factor;
        }
        _weight = scaled;
    }

    _weight = _setWeights(config.weight);

    /**
     * Compute sum of x, y, x^2, y^2, and x*y
     * @returns object of {X, Y, XX, YY, XY}
     */
    function _computeSums() {
        var sums = {X: 0, Y: 0, XX: 0, YY: 0, XY: 0};
        if (_weight) {
            for (var i = 0; i < _numXY; i++) {
                var w = _weight[i];
                sums.X += w * _x[i];
                sums.Y += w * _y[i];
                sums.XX += w * Math.pow(_x[i], 2);
                sums.YY += w * Math.pow(_y[i], 2);
                sums.XY += w * _x[i] * _y[i];
            }
        }
        else {
            for (var i = 0; i < _numXY; i++) {
                sums.X += _x[i];
                sums.Y += _y[i];
                sums.XX += Math.pow(_x[i], 2);
                sums.YY += Math.pow(_y[i], 2);
                sums.XY += _x[i] * _y[i];
            }
        }
        return sums;
    }

    /**
     * Do weighted or unweighted least squares 2D line fit.
     * @returns true if successful
     */
    function _regress() {
        if (_doneRegress) return _regressOK;
        if (!_x || !_y)
            throw new Error("No data set!");

        var sums = _computeSums();
        var sumX = sums.X;
        var sumY = sums.Y;
        _sumXX = sums.XX;
        var sumYY = sums.YY;
        var sumXY = sums.XY;

        _sumSqDevX = _sumXX - Math.pow(sumX, 2) / _numXY;
        if (_sumSqDevX != 0) {
            _sumSqDevY = sumYY - Math.pow(sumY, 2) / _numXY;
            _sumSqDevXY = sumXY - sumX * sumY / _numXY;
            _slope = _sumSqDevXY / _sumSqDevX;
            _intercept = (sumY - _slope * sumX) / _numXY;
            _regressOK = true;
        }
        else {
            _regressOK = false;
            _sumXX = _sumSqDevX = undefined;
            throw new Error("Can't fit line when x values are all equal.");
        }
        _doneRegress = true;
        return _regressOK;
    }

    function _sumSqErrors() {
    }

    return {
        /**
         * @returns the slope and intercept from least squares line fit.
         */
        coefficients : function () {
            if (_intercept === undefined || _slope === undefined) {
                _regress();
            }
            return {intercept: _intercept, slope: _slope};
        },

        /**
         * @returns the mean square error.
         */
        meanSqError : function () {
            if (_meanSqError === undefined) {
                this.regress();
                _meanSqError = _sumSqErrors() / _numXY;
            }
            return _meanSqError;
        },

        /**
         * @returns the correlation coefficient
         */
        rSquared : function () {
            if (_rSquared === undefined) {
                _regress();
                var denom = _sumSqDevX * _sumSqDevY;
                _rSquared = denom != 0 ? (_sumSqDevXY * _sumSqDevXY) / denom : 1;
            }
            return _rSquared;
        }

    };
};

