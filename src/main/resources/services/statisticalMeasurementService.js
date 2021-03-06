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
 * Service for obtaining statistical latency measurements for a given server.
 */
angular.module('guacConntest').factory('statisticalMeasurementService', ['$injector',
        function statisticalMeasurementService($injector) {

    // Required services
    var timingService = $injector.get('timingService');
    var $q = $injector.get('$q');

    // Required types
    var Statistics = $injector.get('Statistics');

    /**
     * The maximum amount of time to spend collecting samples. Note that an
     * individual sample may still exceed this time.
     *
     * @constant
     * @type Number
     */
    var MAX_SAMPLING_TIME = 3000;

    /**
     * The maximum amount of time to spend collecting any individual sample.
     *
     * @constant
     * @type Number
     */
    var MAX_SAMPLE_TIME = 5000;

    /**
     * The desired minimum number of samples which should be taken before
     * deriving statistics from those samples. The actual number of samples
     * taken may be smaller if the maximum sampling time is exceeded.
     *
     * @constant
     * @type Number
     */
    var DESIRED_SAMPLE_SIZE = 5;

    /**
     * The desired ratio for the mean absolute deviation relative to the
     * calculated median round trip time. If the desired mean absolute
     * deviation is met across the minimum number of samples, the sampling
     * operation may terminate prior to reaching the maximum sampling time.
     *
     * @constant
     * @type Number
     */
    var DESIRED_DEVIATION = 0.25;

    /**
     * The desired mean absolute deviation relative to the calculated mean
     * round trip time. Unlike DESIRED_DEVIATION, which is proportionate, the
     * minimum deviation is compared absolutely, avoiding excess sampling when
     * servers are very responsive.
     *
     * @constant
     * @type Number
     */
    var MINIMUM_DEVIATION = 4;

    var service = {};

    /**
     * Returns whether the given statistics can be considered accurate based on
     * the overall number of samples and deviation between those samples.
     *
     * @param {Statistics} stats
     *     The current round trip time statistics.
     *
     * @returns {Boolean}
     *     true if the given statistics can be considered accurate, false
     *     otherwise.
     */
    var isAccurate = function isAccurate(stats) {

        // Must have at least a certain number of samples to be accurate
        if (stats.samples.length < DESIRED_SAMPLE_SIZE)
            return false;

        // Calculate the deviation which would be considered accurate for the
        // current sample set
        var desiredDeviation = Math.max(MINIMUM_DEVIATION, Math.abs(stats.median * DESIRED_DEVIATION));

        // The sample set is accurate if the overall set appears to be within
        // the minimum desired deviation
        return stats.meanAbsoluteDeviation <= desiredDeviation;

    };

    /**
     * Repeatedly pings the Guacamole server at the given URL, estimating the
     * round trip time between the browser and the Guacamole server. Once the
     * round trip time has been estimated, an instance of a Statistics object
     * will be provided through resolving the promise associated with the given
     * deferred.
     *
     * @param {String} serverUrl
     *     The base URL of the Guacamole server being tested.
     *
     * @param {Number[]} samples
     *     An array of all round trip time samples collected thus far.
     *
     * @param {deferred} request
     *     The deferred instance representing the overall sample gathering
     *     operation, as returned by a call to $q.defer(). The promise
     *     associated with that deferred instance will ultimately be resolved
     *     with a Statistics instance representing the best estimate of round
     *     trip time for the server being tested.
     *
     * @param {Number} startTime
     *     The time that the sample gathering operation began for the server
     *     being tested, in milliseconds since January 1, 1970, UTC.
     */
    var gatherSamples = function gatherSamples(serverUrl, samples, request, startTime) {

        // Ping the Guacamole server
        timingService.getTimestamps(serverUrl, MAX_SAMPLE_TIME)

        // If the ping was successful, update the statistics, possibly pinging
        // the server again
        .then(function timestampsReceived(timestamps) {

            var currentTime = new Date().getTime();

            // Add round trip time to sample set
            samples.push(currentTime - timestamps.clientTimestamp);

            // Calculate overall statistics for sample set
            var stats = new Statistics(samples);

            // Stop gathering samples if we are exceeding the maximum time
            // allowed, or the sample set is already accurate enough
            if (currentTime - startTime >= MAX_SAMPLING_TIME || isAccurate(stats))
                request.resolve(stats);

            // Otherwise, gather more samples
            else
                gatherSamples(serverUrl, samples, request, startTime);

        })

        // If the ping failed, abort and reject the promise
        ['catch'](function testFailed() {
            request.reject();
        });

        return request.promise;

    };

    /**
     * Begins testing the responsiveness of the Guacamole server having the
     * given base URL, returning a promise which will resolve when that test is
     * complete. The statistics gathered are provided when the promise is
     * resolved through a Statistics object.
     *
     * @param {String} serverUrl
     *     The base URL of the Guacamole server to test.
     *
     * @returns {Promise.<Statistics>}
     *     A promise which will resolve with a Statistics object describing the
     *     round trip times measured during the test.
     */
    service.getRoundTripStatistics = function getRoundTripStatistics(serverUrl) {

        // Gather as many samples as required to produce an accurate estimate
        // without exceeding time limits
        return gatherSamples(serverUrl, [], $q.defer(), new Date().getTime());

    };

    return service;
}]);
