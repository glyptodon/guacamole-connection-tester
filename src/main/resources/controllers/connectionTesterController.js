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
            result.complete = true;
            testServers(results);
        });

    };

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
        var pendingResults = $scope.results.slice();
        for (var i = 0; i < CONCURRENCY; i++)
            testServers(pendingResults);

    });

}]);
