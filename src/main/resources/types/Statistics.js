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
     * Comparator for the standard JavaScript sort() function which sorts
     * values numerically and in ascending order.
     */
    var numericComparator = function numericComparator(a, b) {
        return a - b;
    };

    /**
     * Returns the mean (average) value of all samples in the given set.
     *
     * @param {Number[]} samples
     *     An array of samples for which the mean should be calculated.
     *
     * @returns {Number}
     *     The average taken across all given samples.
     */
    var getMean = function getMean(samples) {
        
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
     * Returns the median value of all samples in the given set. The sample
     * array MUST already be sorted.
     *
     * @param {Number[]} samples
     *     A sorted array of samples for which the median should be calculated.
     *
     * @returns {Number}
     *     The median taken across all given samples.
     */
    var getMedian = function getMedian(samples) {

        // The median of zero samples is zero
        var length = samples.length;
        if (length === 0)
            return 0;

        // Return middle value if there are an odd number of samples
        if (length % 2 === 1)
            return samples[(length - 1) / 2];

        // Otherwise return average of the two middle samples
        return (samples[length / 2 - 1] + samples[length / 2]) / 2;

    };

    /**
     * Returns an array of the absolute deviation of each sample relative to a
     * given value.
     *
     * @param {Number[]} samples
     *     An array of samples for which the absolute deviation if each sample
     *     should be calculated.
     *
     * @param {Number} value
     *     The value that each sample should be compared against to determine
     *     the absolute deviation for that sample.
     *
     * @returns {Number[]}
     *     An array of the absolute deviation of each sample relative to the
     *     given value.
     */
    var getAbsoluteDeviations = function getAbsoluteDeviations(samples, value) {

        // Build list of absolute deviations for all samples
        var absoluteDeviations = [];
        for (var i = 0; i < samples.length; i++)
            absoluteDeviations.push(Math.abs(samples[i] - value));

        return absoluteDeviations;

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
         * A sorted copy of the array of samples provided at construction time.
         *
         * @type Number[]
         */
        this.samples = samples.slice().sort(numericComparator);

        /**
         * The median of all given samples.
         *
         * @type Number
         */
        this.median = getMedian(this.samples);

        /**
         * Sorted Array of the absolute deviation of each sample from the
         * median.
         *
         * @private
         * @type Number[]
         */
        var deviations = getAbsoluteDeviations(this.samples, this.median).sort(numericComparator);

        /**
         * The mean absolute deviation of all given samples relative to the
         * median.
         *
         * @type Number
         */
        this.meanAbsoluteDeviation = getMean(deviations);

        /**
         * The median absolute deviation of all given samples relative to the
         * median.
         *
         * @type Number
         */
        this.medianAbsoluteDeviation = getMedian(deviations);

    };

    return Statistics;

}]);
