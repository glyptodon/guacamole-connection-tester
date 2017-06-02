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
     * The current status of the connection test.
     *
     * @type Status
     */
    $scope.status = connectionTestingService.getStatus();

    /**
     * The final results of the connection test, or null if the connection test
     * is not yet completed.
     *
     * @type Result[]
     */
    $scope.results = null;

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

        // Return (fake) place value of first incomplete server, as if all
        // completed servers were first in the list
        return $scope.status.total - $scope.status.remaining + 1;

    };

    /**
     * Returns the percentage of tests which have been completed.
     *
     * @returns {Number}
     *     The percentage of tests which have been completed.
     */
    $scope.getProgressPercent = function getProgressPercent() {
        return $scope.getCurrentServer() / $scope.status.total * 100;
    };

    /**
     * Starts the connection test. The list of available servers is retrieved
     * via REST, and each defined server is tested to determine the latency
     * characteristics of the network connection between the user and that
     * server.
     */
    $scope.startTest = function startTest() {
        connectionTestingService.startTest(CONCURRENCY);
    };

    // Display results when ready
    connectionTestingService.getResults().then(function testComplete(results) {
        $scope.results = results;
    })

    // Update status as test continues
    ['finally'](null, function testProgress(status) {
        $scope.status = status;
    });

}]);
