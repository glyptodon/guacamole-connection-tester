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
 * Service for performing an overall connection test.
 */
angular.module('guacConntest').factory('connectionTestingService', ['$injector',
    function connectionTestingService($injector) {

    // Required services
    var $q                            = $injector.get('$q');
    var configService                 = $injector.get('configService');
    var statisticalMeasurementService = $injector.get('statisticalMeasurementService');

    var service = {};

    // Required types
    var Result = $injector.get('Result');

    /**
     * The number of bins to split servers into based on approximate subjective
     * connection quality.
     *
     * @constant
     * @type Number
     */
    var NICENESS_BINS = 4;

    /**
     * The subjectively-worst possible round trip time for a Guacamole
     * connection while still being usable, in milliseconds. Connections that
     * are worse than this value will be virtually unusable.
     *
     * @constant
     * @type Number
     */
    var WORST_TOLERABLE_LATENCY = 220;

    /**
     * The set of all domains associated with active tests. Regardless of the
     * desired level of concurrency, only one test is allowed per domain at
     * any one time.
     *
     * @type Object.<String, Boolean>
     */
    var activeTests = {};

    /**
     * A deferred object, as returned by the $q service, representing the
     * results of a connection test, which may currently be in progress. If no
     * test has been started yet, this will be null.
     *
     * @type deferred
     */
    var deferredResults = null;

    /**
     * Array of all final server test results.
     *
     * @type Result[]
     */
    service.currentResults = [];

    /**
     * Parses the given URL, returning the domain. If the URL cannot be parsed,
     * null is returned.
     *
     * @param {String} url
     *     The URL to parse.
     *
     * @returns {Boolean}
     *     The domain within the given URL, or null if the URL cannot be
     *     parsed.
     */
    var getDomain = function getDomain(url) {

        // Match given URL against regex identifying the domain
        var matches = /^[^\/]*\/\/([^\/]*)/.exec(url);

        // Return domain only if found
        return matches && matches[1];

    };

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
    var getNiceness = function getNiceness(stats) {

        // Remap expected round trip time to a logarithmic scale from 0 to 1,
        // where 1 represents the worst tolerable latency for a Guacamole
        // connection, taking inaccuracy into account
        var logarithmicRTT = Math.log((stats.median + stats.medianAbsoluteDeviation) / WORST_TOLERABLE_LATENCY + 1) / Math.LN2;

        // Map logarithmically-scaled RTT onto integer bins, where 0 is the
        // subjectively best possible connection and higher values are
        // subjectively worse
        return Math.min(NICENESS_BINS - 1, Math.floor(logarithmicRTT * (NICENESS_BINS - 1)));

    };

    /**
     * Sequentially tests each server associated with the incomplete results in
     * the given array, populating the values of each result as the tests are
     * completed. Only one server at a time is tested.
     *
     * NOTE: This function will modify the given array, removing result objects
     * from the array while the tests are performed. It is unsafe to continue
     * to use the array after this function has been invoked except to monitor
     * progress.
     *
     * @param {Result[]} results
     *     An array of incomplete results to populate. This array will be
     *     gradually emptied by this function as tests are performed.
     *
     * @param {Number} concurrency
     *     The desired number of concurrent tests. If the number of active
     *     tests falls below this value, additional tests will be started.
     */
    var testServers = function testServers(results, concurrency) {

        // Pull next result from array
        var result = results.shift();
        if (!result)
            return;

        // If a test is already in progress for that domain, put the result
        // back and wait
        var domain = getDomain(result.server.url);
        if (activeTests[domain]) {
            results.unshift(result);
            return;
        }

        // Mark test as active
        activeTests[domain] = true;

        // Measure round trip statistics for current server
        statisticalMeasurementService.getRoundTripStatistics(result.server.url)

        // If successful, add server test result
        .then(function roundTripTimeMeasured(stats) {
            result.niceness = getNiceness(stats);
            result.roundTripStatistics = stats;
        })

        // Otherwise, mark server as bad
        ['catch'](function testRemainingServers() {
            result.niceness = NICENESS_BINS;
        })

        // Test all remaining servers
        ['finally'](function testRemainingServers() {

            // Mark test as complete
            delete activeTests[domain];
            result.complete = true;

            // Notify that a test has completed
            deferredResults.notify();

            // Count the number of tests remaining
            var remaining = service.currentResults.length;
            angular.forEach(service.currentResults, function countRemaining(result) {
                if (result.complete)
                    remaining--;
            });

            // Resolve promise once all tests have completed
            if (!remaining)
                deferredResults.resolve(service.currentResults);

            // Spawn tests for remaining servers
            spawnTests(results, concurrency);

        });

    };

    /**
     * Spawns a series of parallel tests for each of the servers associated
     * with the incomplete results in the given array.
     *
     * NOTE: This function will modify the given array, removing result objects
     * from the array while the tests are performed. It is unsafe to continue
     * to use the array after this function has been invoked except to monitor
     * progress.
     *
     * @param {Result[]} results
     *     An array of incomplete results to populate. This array will be
     *     gradually emptied as tests are performed.
     *
     * @param {Number} concurrency
     *     The desired number of concurrent tests. If the number of active
     *     tests falls below this value, additional tests will be started.
     */
    var spawnTests = function spawnTests(results, concurrency) {

        // Count the number of tests currently running
        var spawnCount = concurrency;
        angular.forEach(activeTests, function countActiveTests() {
            spawnCount--;
        });

        // Start as many tests as allowed
        for (var i = 0; i < spawnCount; i++)
            testServers(results, concurrency);

    };

    /**
     * Returns a promise which resolves with the results of the connection
     * test, performing that test first if necessary. The promise will be
     * notified each time a test is completed. While the test is underway, the
     * incomplete results will be available under the currentResults property.
     * 
     * When performing the test, the list of available servers is retrieved via
     * REST, and each defined server is tested to determine the latency
     * characteristics of the network connection between the user and that
     * server.
     *
     * @param {Number} concurrency
     *     The desired number of concurrent tests. If the number of active
     *     tests falls below this value, additional tests will be started.
     *
     * @returns {Promise.<Result[]>}
     *     A promise which resolves with an array of completed results once all
     *     tests have completed.
     */
    service.getResults = function getResults(concurrency) {

        // Start a new test only if no such test has been started
        if (!deferredResults) {

            deferredResults = $q.defer();

            // Test all servers once the server map has been retrieved
            configService.getServers()
            .then(function receivedServerList(servers) {

                // Reset any past results
                service.currentResults = [];

                // Create skeleton test results for all servers
                angular.forEach(servers, function createPendingResult(server, name) {
                    service.currentResults.push(new Result({
                        'name'   : name,
                        'server' : server
                    }));
                });

                // Notify that the tests are starting
                deferredResults.notify();

                // Test all servers retrieved
                spawnTests(service.currentResults.slice(), concurrency);

            });

        }

        return deferredResults.promise;

    };

    return service;

}]);
