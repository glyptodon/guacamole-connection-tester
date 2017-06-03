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
 * Run block which prepares a connection test to automatically start when the
 * user successfully logs in. Once the connection test is completed, a
 * "guacConntestServerRecommended" event is broadcast on the $rootScope if a
 * better server was found, with the Server object describing that server
 * included as the event data.
 */
angular.module('guacConntest').run(['$injector',
    function automaticConnectionTest($injector) {

    // Required services
    var $rootScope               = $injector.get('$rootScope');
    var $window                  = $injector.get('$window');
    var connectionTestingService = $injector.get('connectionTestingService');

    /**
     * The URL of the Guacamole server currently in use.
     *
     * @constant
     * @type String
     */
    var CURRENT_URL = $window.location.origin + $window.location.pathname + '/';

    /**
     * Comparator which sorts connection test results in ascending order of
     * median round trip time.
     *
     * @param {Result} a
     *     The first connection test result to compare.
     *
     * @param {Result} b
     *     The second connection test result to compare.
     *
     * @returns {Number}
     *     A negative value if result "a" should come before result "b", a
     *     positive value if result "a"should come after result "b", or zero if
     *     the results are equivalent.
     */
    var resultComparator = function resultComparator(a, b) {
        return a.roundTripStatistics.median - b.roundTripStatistics.median;
    };

    // Automatically start connection test upon login
    $rootScope.$on('guacLogin', function userLoggedIn() {
        connectionTestingService.startTest();
    });

    // Collect and interpret test results when the connection test is completed
    connectionTestingService.getResults().then(function testCompleted(results) {

        var alternatives = [];
        var current = [];

        // Partition results based on whether we are currently using the
        // associated server
        angular.forEach(results, function partitionResult(result) {

            // Ignore result if server is completely unavailable
            if (!result.roundTripStatistics)
                return;

            // Use origin to determine server identity
            var url = result.server.url + '/';
            if (url.substring(0, CURRENT_URL.length) === CURRENT_URL)
                current.push(result);
            else
                alternatives.push(result);

        });

        // We cannot make a recommendation for a better server if we have
        // nothing to compare
        if (!current.length || !alternatives.length)
            return;

        // Sort both sets of results by best performance
        current.sort(resultComparator);
        alternatives.sort(resultComparator);

        // If the current server acceptable, nothing to do
        if (current[0].niceness <= alternatives[0].niceness)
            return;

        // Recommend a better server
        $rootScope.$broadcast('guacConntestServerRecommended', alternatives[0].server);

    });

}]);
