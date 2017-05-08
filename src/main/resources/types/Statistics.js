/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Service which defines the Statistics class.
 */
angular.module('guacConntest').factory('Statistics', [function defineStatistics() {

    /**
     * Returns the average value of all samples in the given set.
     *
     * @param {Number[]} samples
     *     An array of samples for which the average should be calculated.
     *
     * @returns {Number}
     *     The average taken across all given samples.
     */
    var getAverage = function getAverage(samples) {

        // The average of zero samples is zero
        if (samples.length === 0)
            return 0;

        // Calculate total of all sample values
        var total = 0;
        for (var i = 0; i < samples.length; i++)
            total += samples[i];

        // Return average value
        return total / samples.length;

    };

    /**
     * Returns the variance across all given samples. The variance is the
     * average squared deviation of each sample from the average value of the
     * set.
     *
     * @param {Number[]} samples
     *     An array of samples for which the variance should be calculated.
     *
     * @param {Number} average
     *     The average value for samples within the given set.
     *
     * @returns {Number}
     *     The variance across all given samples.
     */
    var getVariance = function getVariance(samples, average) {

        // The variance of zero samples is zero
        if (samples.length === 0)
            return 0;

        // Calculate total squared deviation across all sample values
        var total = 0;
        for (var i = 0; i < samples.length; i++)
            total += Math.pow(samples[i] - average, 2);

        // Return average squared deviation (variance)
        return total / samples.length;

    };

    /**
     * Statistics gathered over a given set of samples. All statistics are
     * gathered at construction time.
     * 
     * @constructor
     * @param {Number[]} samples
     *     An array of samples for which statistics should be generated.
     */
    var Statistics = function Statistics(samples) {

        /**
         * A reference to the sample array provided at construction time.
         *
         * @type Number[]
         */
        this.samples = samples;

        /**
         * The average value of all given samples.
         *
         * @type Number
         */
        this.average = getAverage(samples);

        /**
         * The variance of all given samples relative to the average.
         *
         * @type Number
         */
        this.variance = getVariance(samples, this.average);

        /**
         * The standard deviation of all given samples relative to the average.
         * This value is equal to the square root of the variance.
         *
         * @type Number
         */
        this.standardDeviation = Math.sqrt(this.variance);

    };

    return Statistics;

}]);
