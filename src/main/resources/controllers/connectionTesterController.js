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
        var logarithmicRTT = Math.log((stats.average + stats.standardDeviation) / WORST_TOLERABLE_LATENCY + 1) / Math.LN2;

        // Map logarithmically-scaled RTT onto integer bins, where 0 is the
        // subjectively best possible connection and higher values are
        // subjectively worse
        return Math.min(NICENESS_BINS - 1, Math.floor(logarithmicRTT * (NICENESS_BINS - 1)));

    };

    /**
     * Sequentially tests each server in the given array. Only one server at a
     * time is tested.
     *
     * NOTE: This function will modify the given array, removing servers from
     * the array while the tests are performed. It is unsafe to continue to use
     * the array after this function has been invoked except to monitor
     * progress.
     *
     * @param {Server[]} servers
     *     An array of all servers to test. This array will be gradually
     *     emptied by this function as tests are performed.
     */
    var testServers = function testServers(servers) {

        // Pull next server from array
        var server = servers.shift();
        if (!server)
            return;

        // Measure round trip statistics for current server
        statisticalMeasurementService.getRoundTripStatistics(server.url)

        // If successful, add server test result
        .then(function roundTripTimeMeasured(stats) {
            $scope.results.push(new Result({
                'server'              : server,
                'niceness'            : getNiceness(stats),
                'roundTripStatistics' : stats
            }));
        })

        // Otherwise, mark server as bad
        ['catch'](function testRemainingServers() {
            $scope.results.push(new Result({
                'server'              : server,
                'niceness'            : NICENESS_BINS,
                'roundTripStatistics' : null
            }));
        })

        // Test all remaining servers
        ['finally'](function testRemainingServers() {
            testServers(servers);
        });

    };

    // Test all servers once the server list has been retrieved
    connectionTestService.getServers()
    .success(function receivedServerList(servers) {

        // Perform test against a copy of the servers array
        testServers(servers.slice());

    });

}]);
