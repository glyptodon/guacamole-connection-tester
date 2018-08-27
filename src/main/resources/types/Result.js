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
angular.module('guacConntest').factory('Result', ['$injector', function defineResult($injector) {

    // Required types
    var Statistics = $injector.get('Statistics');

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

    /**
     * Compresses the given set of connection test results, producing an opaque
     * string which may be passed to Result.unpack() to reconstitute those
     * results. Redundant information may be stripped from the results for the
     * sake of saving space. The given results are assumed to be from a
     * completed connection test.
     *
     * @param {Result[]} results
     *     The set of connection test results to compress.
     *
     * @returns {String}
     *     An opaque string which, if passed to Result.unpack(), will produce
     *     the given set of connection test results.
     */
    Result.pack = function pack(results) {

        // Strip calculated values from results, including only server URLs and
        // the samples measured for each server
        var samplesByUrl = {};
        angular.forEach(results, function addResult(result) {
            if (result.roundTripStatistics)
                samplesByUrl[result.server.url] = result.roundTripStatistics.samples;
        });

        // Convert packed results to JSON, compress using deflate, and finally
        // encode that binary value as a base64 string
        return btoa(pako.deflateRaw(angular.toJson(samplesByUrl), { 'to' : 'string' }));

    };

    /**
     * Decompresses the given opaque string producing the original set of
     * connection test results. The given string MUST have come from a previous
     * call to Result.pack(). If the provided set of servers differs from that
     * available at the time Result.pack() was called, results for servers no
     * longer present will be omitted.
     *
     * @param {Object.<String, Server>} servers
     *     A map of @link{Server} objects, where the key of each entry is the
     *     human-readable name for the Guacamole server described by the
     *     corresponding @link{Server} object. This map should be the current
     *     set of servers as would be returned through a call to
     *     configService.getServers().
     *
     * @param {String} packed
     *     An opaque string generated by a previous call to Result.pack().
     *
     * @returns {Result[]}
     *     The set of connection test results originally provided to
     *     Result.pack() when the opaque string was generated.
     */
    Result.unpack = function unpack(servers, packed) {

        // Decode the given base64 string into (presumably) deflated JSON data,
        // inflate (decompress) that data into JSON, and convert that JSON into
        // the packed result map originally produced by a call to Result.pack()
        var samplesByUrl = angular.fromJson(pako.inflateRaw(atob(packed), { 'to' : 'string' }));

        // Reconstitute each packed result, omitting only the server
        // information (which will need to be added in another pass)
        var resultsByUrl = {};
        angular.forEach(samplesByUrl, function addResult(samples, url) {

            var statistics = new Statistics(samples);

            resultsByUrl[url] = new Result({
                'niceness' : Result.getNiceness(statistics),
                'roundTripStatistics' : statistics,
                'complete' : true
            });

        });

        // Fully reconstitute the packed results, restoring the missing server
        // information using the URLs associated with the results unpacked thus
        // far
        var results = [];
        angular.forEach(servers, function pushResultForServer(server, name) {

            // If no result for the current server is defined, assume the
            // server could not be reached
            var result = resultsByUrl[server.url];
            if (!result) {
                result = new Result({
                    'niceness' : Result.NICENESS_BINS,
                    'complete' : true
                });
            }

            // Restore the server information for the current result
            result.name = name;
            result.server = server;
            results.push(result);

        });

        return results;

    };

    return Result;

}]);
