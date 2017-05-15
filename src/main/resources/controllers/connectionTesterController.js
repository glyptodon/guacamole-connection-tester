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
 * Controller for the Guacamole connection tester report.
 */
angular.module('guacConntest').controller('connectionTesterController', ['$scope', '$injector',
    function connectionTesterController($scope, $injector) {

    // Required services
    var $routeParams                  = $injector.get('$routeParams');
    var connectionTestService         = $injector.get('connectionTestService');
    var statisticalMeasurementService = $injector.get('statisticalMeasurementService');

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
     * The number of tests to run in parallel. This may be overridden through
     * specifying the "n" parameter in the URL. By default, four servers are
     * tested at a time.
     *
     * @constant
     * @type Number
     */
    var CONCURRENCY = parseInt($routeParams.n) || 4;

    /**
     * The set of all domains associated with active tests. Regardless of the
     * desired level of concurrency, only one test is allowed per domain at
     * any one time.
     *
     * @type Object.<String, Boolean>
     */
    var activeTests = {};

    /**
     * Array of all final server test results.
     *
     * @type Result[]
     */
    $scope.results = [];

    /**
     * Returns the place value (not index) of the server being tested relative
     * to the total number of servers, where 1 is the first server. This place
     * value is not necessarily the true place value of the server, as server
     * results may be processed out-of-order and/or in parallel, but rather an
     * overall progress indicator.
     *
     * @returns {Number}
     *     The place value of the server being tested.
     */
    $scope.getCurrentServer = function getCurrentServer() {

        var incompleteServers = 0;

        // Count the number of incomplete results
        for (var i = 0; i < $scope.results.length; i++) {
            if (!$scope.results[i].complete)
                incompleteServers++;
        }

        // Return (fake) place value of first incomplete server, as if all
        // completed servers were first in the list
        return $scope.results.length - incompleteServers + 1;

    };

    /**
     * Returns the total number of servers available, including those which
     * have not yet been tested.
     *
     * @returns {Number}
     *     The total number of servers available.
     */
    $scope.getTotalServers = function getTotalServers() {
        return $scope.results.length;
    };

    /**
     * Returns whether a server test is currently running.
     *
     * @returns {Boolean}
     *     true if a server test is currently running, false otherwise.
     */
    $scope.isRunning = function isRunning() {

        // Tests are running if at least one result is incomplete
        for (var i = 0; i < $scope.results.length; i++) {
            if (!$scope.results[i].complete)
                return true;
        }

        // Tests are not running if all results are complete
        return false;

    };

    /**
     * Returns whether the connection test has been started. The connection
     * test may or may not be running.
     *
     * @returns {Boolean}
     *     true if the connection test has been started, false otherwise.
     */
    $scope.hasStarted = function hasStarted() {
        return !!$scope.results.length;
    };

    /**
     * Returns whether the connection test has finished.
     *
     * @returns {Boolean}
     *     true if the connection test has finished, false otherwise.
     */
    $scope.isComplete = function isComplete() {
        return $scope.hasStarted() && !$scope.isRunning();
    };

    /**
     * Returns the percentage of tests which have been completed.
     *
     * @returns {Number}
     *     The percentage of tests which have been completed.
     */
    $scope.getProgressPercent = function getProgressPercent() {
        return $scope.getCurrentServer() / ($scope.getTotalServers() + 1) * 100;
    };

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
     */
    var testServers = function testServers(results) {

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

            // Spawn tests for remaining servers
            spawnTests(results);

        });

    };

    /**
     * Spawns a series of parallel tests for each of the servers associated
     * with the incomplete results in the given array. The level of concurrency
     * is dictated by the CONCURRENCY constant and is maintained each time this
     * function is invoked: if the number of active tests falls below the
     * desired level of concurrency, additional tests are started.
     *
     * NOTE: This function will modify the given array, removing result objects
     * from the array while the tests are performed. It is unsafe to continue
     * to use the array after this function has been invoked except to monitor
     * progress.
     *
     * @param {Result[]} results
     *     An array of incomplete results to populate. This array will be
     *     gradually emptied as tests are performed.
     */
    var spawnTests = function spawnTests(results) {

        // Count the number of tests currently running
        var spawnCount = CONCURRENCY;
        angular.forEach(activeTests, function countActiveTests() {
            spawnCount--;
        });

        // Start as many tests as allowed
        for (var i = 0; i < spawnCount; i++)
            testServers(results);

    };

    /**
     * Starts the connection test. The list of available servers is retrieved
     * via REST, and each defined server is tested to determine the latency
     * characteristics of the network connection between the user and that
     * server.
     */
    $scope.startTest = function startTest() {

        // Test all servers once the server map has been retrieved
        connectionTestService.getServers()
        .then(function receivedServerList(servers) {

            // Reset any past results
            $scope.results = [];

            // Create skeleton test results for all servers
            angular.forEach(servers, function createPendingResult(server, name) {
                $scope.results.push(new Result({
                    'name'   : name,
                    'server' : server
                }));
            });

            // Test all servers retrieved
            spawnTests($scope.results.slice());

        });

    };

}]);
