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
    var $routeParams             = $injector.get('$routeParams');
    var connectionTestingService = $injector.get('connectionTestingService');

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
    $scope.getResults = function getResults() {
        return connectionTestingService.currentResults;
    };

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
        for (var i = 0; i < connectionTestingService.currentResults.length; i++) {
            if (!connectionTestingService.currentResults[i].complete)
                incompleteServers++;
        }

        // Return (fake) place value of first incomplete server, as if all
        // completed servers were first in the list
        return connectionTestingService.currentResults.length - incompleteServers + 1;

    };

    /**
     * Returns the total number of servers available, including those which
     * have not yet been tested.
     *
     * @returns {Number}
     *     The total number of servers available.
     */
    $scope.getTotalServers = function getTotalServers() {
        return connectionTestingService.currentResults.length;
    };

    /**
     * Returns whether a server test is currently running.
     *
     * @returns {Boolean}
     *     true if a server test is currently running, false otherwise.
     */
    $scope.isRunning = function isRunning() {

        // Tests are running if at least one result is incomplete
        for (var i = 0; i < connectionTestingService.currentResults.length; i++) {
            if (!connectionTestingService.currentResults[i].complete)
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
        return !!connectionTestingService.currentResults.length;
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
     * Starts the connection test. The list of available servers is retrieved
     * via REST, and each defined server is tested to determine the latency
     * characteristics of the network connection between the user and that
     * server.
     */
    $scope.startTest = function startTest() {
        connectionTestingService.getResults(CONCURRENCY);
    };

}]);
