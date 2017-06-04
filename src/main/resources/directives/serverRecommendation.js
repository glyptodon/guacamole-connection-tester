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
 * A directive which automatically performs a connection test, recommending an
 * alternative Guacamole server if responsiveness is expected to be better than
 * the current server.
 */
angular.module('guacConntest').directive('guacServerRecommendation', ['$injector',
    function guacServerRecommendation($injector) {

    // Required services
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

    /**
     * Configuration object for the guacServerRecommendation directive.
     *
     * @type Object.<String, Object>
     */
    var config = {
        restrict    : 'E',
        replace     : true,
        templateUrl : 'app/ext/conntest/templates/serverRecommendation.html'
    };

    // guacServerRecommendation directive controller
    config.controller = ['$scope', function guacServerRecommendationController($scope) {

        /**
         * The Result describing the Guacamole server that is recommended based
         * on a connection test, or null if the connection has not yet run or
         * the current server is acceptable.
         *
         * @type Result
         */
        $scope.recommendation = null;

        /**
         * Ignores the current server recommendation, hiding this directive.
         */
        $scope.ignore = function ignore() {
            $scope.recommendation = null;
        };

        // Automatically start test, if not already started
        connectionTestingService.startTest();

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
            $scope.recommendation = alternatives[0];

        });

    }];

    return config;

}]);
