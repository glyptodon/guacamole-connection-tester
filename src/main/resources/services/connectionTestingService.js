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
    var Status = $injector.get('Status');

    /**
     * The number of tests to run in parallel, if the concurrency level is not
     * overridden when calling startTest().
     *
     * @constant
     * @type Number
     */
    var DEFAULT_CONCURRENCY = 4;

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
     * results of a connection test, which may currently be in progress.
     *
     * @type deferred
     */
    var deferredResults = $q.defer();

    /**
     * Array of all current server test results, or null if the server tests
     * have not yet started.
     *
     * @type Result[]
     */
    var currentResults = null;

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
     * Returns the number of servers remaining to be tested. If the test has
     * completed, or is not yet running, this will be zero.
     *
     * @returns {Number}
     *     The number of servers remaining to be tested.
     */
    var getRemaining = function getRemaining() {

        // No servers remain if the test is not even running
        if (!currentResults)
            return 0;

        // Count the number of tests remaining
        var remaining = currentResults.length;
        angular.forEach(currentResults, function countRemaining(result) {
            if (result.complete)
                remaining--;
        });

        return remaining;

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
            result.niceness = Result.getNiceness(stats);
            result.roundTripStatistics = stats;
        })

        // Otherwise, mark server as bad
        ['catch'](function testRemainingServers() {
            result.niceness = Result.NICENESS_BINS;
        })

        // Test all remaining servers
        ['finally'](function testRemainingServers() {

            // Mark test as complete
            delete activeTests[domain];
            result.complete = true;

            // Notify that a test has completed
            deferredResults.notify(service.getStatus());

            // Resolve promise once all tests have completed
            if (!getRemaining())
                deferredResults.resolve(currentResults);

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
     * Returns an object representing the current status of the connection
     * test. The returned object is a snapshot of the connection test status.
     * To continuously watch the status of the connection test, this function
     * must be continuously invoked, or a notification callback must be
     * supplied to the promise returned by getResults().
     *
     * @returns {Status}
     *     An object representing the current status of the connection test.
     */
    service.getStatus = function getStatus() {

        // Not yet started
        if (!currentResults) {
            return new Status({
                'remaining' : 0,
                'total'     : 0,
                'complete'  : false,
                'running'   : false,
                'started'   : false
            });
        }

        // In-progress / Complete
        var remaining = getRemaining();
        return new Status({
            'remaining' : remaining,
            'total'     : currentResults.length,
            'complete'  : remaining === 0,
            'running'   : remaining !== 0,
            'started'   : true
        });

    };

    /**
     * Returns a promise which resolves with the results of the connection
     * test, performing that test first if necessary. The promise will be
     * notified each time a test is completed. The status object passed to the
     * promise during notification may also be retrieved manually through
     * calling getStatus().
     *
     * Invoking this function will NOT implicitly start the connection test.
     * Though a promise will be returned, that promise will not be resolved
     * until the connection test has completed, and that connection test will
     * not start until startTest() has been explicitly invoked.
     *
     * @returns {Promise.<Result[]>}
     *     A promise which resolves with an array of completed results once all
     *     tests have completed.
     */
    service.getResults = function getResults() {
        return deferredResults.promise;
    };

    /**
     * Starts the connection test, if the connection test has not already been
     * started. The current status of the connection test can be obeserved
     * through invoking getStatus() or through receiving notifications via the
     * promise returned by getResults(). The promise returned by getResults()
     * will be resolved with the results of the test once the test has
     * completed.
     *
     * When performing the test, the list of available servers is retrieved via
     * REST, and each defined server is tested to determine the latency
     * characteristics of the network connection between the user and that
     * server.
     *
     * @param {Number} [concurrency=4]
     *     The desired number of concurrent tests. If the number of active
     *     tests falls below this value, additional tests will be started.
     */
    service.startTest = function startTest(concurrency) {

        // Do nothing if a test has already been started
        if (currentResults)
            return;

        // Test all servers once the server map has been retrieved
        configService.getServers()
        .then(function receivedServerList(servers) {

            // Reset any past results
            currentResults = [];

            // Create skeleton test results for all servers
            angular.forEach(servers, function createPendingResult(server, name) {
                currentResults.push(new Result({
                    'name'   : name,
                    'server' : server
                }));
            });

            // Notify that the tests are starting
            deferredResults.notify(service.getStatus());

            // Test all servers retrieved
            spawnTests(currentResults.slice(), concurrency || DEFAULT_CONCURRENCY);

        });

    };

    /**
     * Loads connection test results from the given opaque string originally
     * returned by a call to Result.pack(). Status reporting, etc. of the
     * connection test behaves identically to that of an actual test started
     * via startTest() except that the results are made available immediately.
     *
     * @param {String} packed
     *     The opaque string returned by a previous call to Result.pack() for
     *     the connection test results to be restored.
     */
    service.restoreResults = function restoreResults(packed) {

        // Do nothing if a test has already been started
        if (currentResults)
            return;

        // Set results to unpacked contents of given packed results
        configService.getServers().then(function receivedServerList(servers) {
            currentResults = Result.unpack(servers, packed);
            deferredResults.notify(service.getStatus());
            deferredResults.resolve(currentResults);
        });

    };

    return service;

}]);
