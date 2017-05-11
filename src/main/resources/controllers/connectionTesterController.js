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
     * Array of all final server test results.
     *
     * @type Result[]
     */
    $scope.results = [];

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
            $scope.results.push(result);
            testServers(results);
        });

    };

    // Test all servers once the server map has been retrieved
    connectionTestService.getServers()
    .success(function receivedServerList(servers) {

        // Create skeleton test results for all servers
        var pendingResults = [];
        angular.forEach(servers, function createPendingResult(server, name) {
            pendingResults.push(new Result({
                'name'   : name,
                'server' : server
            }));
        });

        // Test all servers retrieved
        testServers(pendingResults);

    });

}]);
