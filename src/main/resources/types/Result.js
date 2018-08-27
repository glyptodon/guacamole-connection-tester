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
 * Service which defines the Result class.
 */
angular.module('guacConntest').factory('Result', [function defineResult() {

    /**
     * The result of testing the responsiveness of a particular Guacamole
     * server.
     *
     * @constructor
     * @param {Result|Object} [template={}]
     *     The object whose properties should be copied within the new
     *     Result.
     */
    var Result = function Result(template) {

        // Use empty object by default
        template = template || {};

        /**
         * An arbitrary, unique, human-readable name for the Guacamole server
         * which was tested.
         *
         * @type String
         */
        this.name = template.name;

        /**
         * The Guacamole server which was tested.
         *
         * @type Server
         */
        this.server = template.server;

        /**
         * An arbitrary integer value indicating how subjectively-good the user
         * experience is likely to be, where zero is the best possible user
         * experience, and higher numbers are progressively worse.
         *
         * @type Number
         */
        this.niceness = template.niceness;

        /**
         * The statistics gathered while measuring the round trip time for
         * packets sent to/from the Guacamole server.
         *
         * @type Statistics
         */
        this.roundTripStatistics = template.roundTripStatistics;

        /**
         * Whether the server associated with this result has finished being
         * tested.
         *
         * @type Boolean
         */
        this.complete = !!template.complete;

    };

    /**
     * The subjectively-worst possible round trip time for a Guacamole
     * connection while still being usable, in milliseconds. Connections that
     * are worse than this value will be virtually unusable.
     *
     * @constant
     * @type Number
     */
    Result.WORST_TOLERABLE_LATENCY = 220;

    /**
     * The number of bins to split servers into based on approximate subjective
     * connection quality.
     *
     * @constant
     * @type Number
     */
    Result.NICENESS_BINS = 4;

    /**
     * Returns an arbitrary niceness value indicating how subjectively good a
     * Guacamole connection is likely to be based on the given statistics,
     * where zero is the best possible connection, and higher values represent
     * progressively worse connections, with the worst possible value being
     * NICENESS_BINS - 1.
     *
     * @param {Statistics} stats
     *     The server round trip statistics to use to calculate the arbitrary
     *     niceness value.
     *
     * @returns {Number}
     *     An arbitrary niceness value indicating how subjectively good a
     *     Guacamole connection is likely to be based on the given statistics,
     *     where zero is the best possible connection, and higher values
     *     represent progressively worse connections.
     */
    Result.getNiceness = function getNiceness(stats) {

        // Remap expected round trip time to a logarithmic scale from 0 to 1,
        // where 1 represents the worst tolerable latency for a Guacamole
        // connection, taking inaccuracy into account
        var logarithmicRTT = Math.log((stats.median + stats.medianAbsoluteDeviation) / Result.WORST_TOLERABLE_LATENCY + 1) / Math.LN2;

        // Map logarithmically-scaled RTT onto integer bins, where 0 is the
        // subjectively best possible connection and higher values are
        // subjectively worse
        return Math.min(Result.NICENESS_BINS - 1, Math.floor(logarithmicRTT * (Result.NICENESS_BINS - 1)));

    };

    return Result;

}]);
