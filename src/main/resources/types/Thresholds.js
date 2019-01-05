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
 * Service which defines the Thresholds class.
 */
angular.module('guacConntest').factory('Thresholds', [function defineThresholds() {

    /**
     * Internal representation of a single threshold. A threshold associates a
     * range of latency values (here denoted by a minimum value which is taken
     * relative to other values in the overall list of thresholds) with a CSS
     * color that should be used to represent servers having matching
     * latencies.
     *
     * @private
     * @constructor
     * @param {Threshold|Object} template
     *     The object whose properties should be copied within the new
     *     Threshold.
     */
    var Threshold = function Threshold(template) {

        /**
         * The minimum latency value to which this threshold applies. Values
         * below this threshold are instead covered by the threshold earlier
         * than this threshold in the overall list.
         */
        this.min = template.min;

        /**
         * The CSS color that should be used to represent this threshold.
         */
        this.color = template.color;

    };

    /**
     * A set of latency thresholds which can be used to classify/group servers
     * by the anticipated, subjective quality of Guacamole connections to those
     * servers.
     *
     * With the exception of the "unreachable" property, all properties within
     * a Thresholds instance have integer names, where the name indicates the
     * minimum value which applies to that threshold. All integer properties
     * and the "unreachable" property each contain the CSS color that should be
     * used to represent servers having that latency or higher.
     *
     * The "0" and "unreachable" properties are always required and have been
     * predefined and explicitly documented. All other integer-named properties
     * are optional but will be considered if present.
     *
     * @constructor
     * @param {Thresholds|Object} [template={}]
     *     The object whose properties should be copied within the new
     *     Thresholds.
     */
    var Thresholds = function Thresholds(template) {

        // Use empty object by default
        template = template || {};

        /**
         * The CSS color that should be used to represent servers that have the
         * best possible latency.
         *
         * @type String
         */
        this['0'] = template['0'] || Thresholds.DEFAULT_THRESHOLDS['0'];

        /**
         * The CSS color that should be used to represent servers that are not
         * currently reachable.
         *
         * @type String
         */
        this.unreachable = template.unreachable || 'black';

        /**
         * The colors associated with all thresholds, sorted in increasing
         * order of server slowness. The first threshold is guaranteed to be
         * associated with a minimum latency of zero, while the last threshold
         * is guaranteed to be the "unreachable" threshold (the threshold
         * representing a server which does not respond).
         *
         * @private
         * @type Threshold[]
         */
        var thresholds = [];

        // Add all numeric thresholds (reachable servers), ignoring invalid
        // values
        angular.forEach(template, function addColor(color, threshold) {

            // Ignore the special "unreachable" threshold, as well as any
            // invalid values
            var threshold = parseInt(threshold);
            if (isNaN(threshold) || threshold < 0)
                return;

            thresholds.push(new Threshold({
                min   : threshold,
                color : color
            }));

        });

        // Add the special threshold for unreachable servers
        thresholds.push(new Threshold({
            min   : Number.POSITIVE_INFINITY,
            color : this.unreachable
        }));

        // Sort thresholds in order of increasing slowness
        thresholds.sort(function compareThresholds(a, b) {
            return a.min - b.min;
        });

        /**
         * Returns an arbitrary niceness value indicating how subjectively good
         * a Guacamole connection is likely to be based on the given
         * statistics, where zero is the best possible connection, and higher
         * values represent progressively worse connections.
         *
         * @param {Statistics} stats
         *     The server round trip statistics to use to calculate the
         *     arbitrary niceness value, or null if the server is unreachable.
         *
         * @returns {Number}
         *     An arbitrary niceness value indicating how subjectively good a
         *     Guacamole connection is likely to be based on the given
         *     statistics.
         */
        this.getNiceness = function getNiceness(stats) {

            // If the server is unreachable, use the highest possible value
            if (!stats)
                return thresholds.length - 1;

            // Locate applicable threshold within all defined thresholds,
            // excluding unreachable (already tested above) and the best
            // possible (implicitly matches if no others match)
            var predicted = stats.median + stats.medianAbsoluteDeviation;
            for (var i = thresholds.length - 1; i > 0; i--) {
                if (predicted >= thresholds[i].min)
                    return i;
            }

            // If no match could be found, the server must match the lowest
            // threshold
            return 0;

        };

        /**
         * Returns the CSS color that should be used to represent a server
         * having the given niceness, an arbitrary value dictated by
         * getNiceness(). The "niceness" indicates how subjectively good a
         * Guacamole connection is likely to be, with zero being the best
         * possible connection and larger integer values getting progressively
         * worse.
         *
         * The range of legal niceness values is 0 through N-1, where N is the
         * number of latency thresholds (including the "unreachable"
         * threshold). A value of 0 represents the best possible connection,
         * N-1 represents a server that is completely unreachable, and values
         * in between represent servers that are reachable but sub-ideal.
         *
         * If a given niceness value is outside the legal range, the closest
         * legal value will be used instead.
         *
         * @param {Number} niceness
         *     An arbitrary niceness value indicating how subjectively good a
         *     Guacamole connection is likely to be, as returned by
         *     getNiceness().
         *
         * @returns {String}
         *     The CSS color that should be used to represent a server having
         *     the given niceness value.
         */
        this.getColor = function getColor(niceness) {
            return thresholds[Math.max(0, Math.min(niceness, thresholds.length - 1))].color;
        };

    };

    /**
     * The default values that should be used if no thresholds are defined.
     * Note that these are also defined within the Thresholds class on the Java
     * side.
     *
     * @type Thresholds
     */
    Thresholds.DEFAULT_THRESHOLDS = new Thresholds({

        '0'   : 'rgba(64,  192, 0, 0.5)',
        '60'  : 'rgba(192, 192, 0, 0.5)',
        '130' : 'rgba(192, 128, 0, 0.5)',
        '220' : 'rgba(192, 0,   0, 0.5)',

        'unreachable' : 'black'

    });

    return Thresholds;

}]);
