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
    var $location                = $injector.get('$location');
    var $routeParams             = $injector.get('$routeParams');
    var connectionTestingService = $injector.get('connectionTestingService');

    // Required types
    var Result = $injector.get('Result');

    /**
     * The number of tests to run in parallel, as specified by the "n"
     * parameter in the URL. By default, the level of concurrency is dictated
     * by the connection testing service.
     *
     * @type Number
     */
    var desiredConcurrency = $routeParams.n && parseInt($routeParams.n);

    /**
     * Whether the connection test should be started automatically, once the
     * interface and associated resources have finished loading, as specified
     * by a non-zero value for the "auto" parameter in the URL. By default, the
     * user will be prompted to start the test.
     *
     * @type Boolean
     */
    $scope.startAutomatically = !!$routeParams.auto;

    /**
     * The current status of the connection test.
     *
     * @type Status
     */
    $scope.status = connectionTestingService.getStatus();

    /**
     * An opaque string containing the results of a previous test. This string
     * will have been generated through a previous call to Result.pack().
     *
     * @type String
     */
    $scope.packedResults = $routeParams.r;

    /**
     * The final results of the connection test, or null if the connection test
     * is not yet completed.
     *
     * @type Result[]
     */
    $scope.results = null;

    /**
     * A permanent, shareable link to the final results of the connection test,
     * or null if the connection test is not yet completed.
     *
     * @type String
     */
    $scope.permalink = null;

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
        connectionTestingService.startTest(desiredConcurrency);
    };

    /**
     * Returns whether the prompt for starting the connection test should be
     * visible to the user. In general, the prompt should only be visible if
     * the test has not started and will not be starting automatically.
     *
     * @returns {Boolean}
     *     true if the connection test prompt should be displayed, false
     *     otherwise.
     */
    $scope.isPromptVisible = function isPromptVisible() {
        return !($scope.status.started || $scope.startAutomatically || $scope.packedResults);
    };

    /**
     * Returns whether the given CSS background color is relatively dark. A
     * background color is considered dark if white text would be more visible
     * over that background (provide better contrast) than black text. If the
     * background color is not yet known, the background is assumed to be
     * light.
     *
     * @param {String} background
     *     The CSS background color to test, or null if the background color
     *     is not currently known.
     *
     * @returns {Boolean}
     *     true if the background is relatively dark (white text would provide
     *     better contrast than black), false otherwise.
     */
    $scope.isDark = function isDark(background) {

        // Assume light background if not yet known
        if (!background)
            return false;

        // Canonicalize the given CSS color leveraging getComputedStyle(),
        // which should represent all colors with "rgb(R, G, B)" in properly
        // conforming browsers
        var div = document.createElement('div');
        div.style.color = background;
        var computedColor = getComputedStyle(div).color;

        // Attempt to parse RGB components out of arbitrary CSS color
        var components = computedColor.match(/\brgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);

        // If components were successfully extracted, determine dark vs. light
        // by calculating luminance in the HSL space
        if (components) {

            // Extract color components as normalized float values
            // between 0 and 1 inclusive
            var red = components[1] / 255;
            var green = components[2] / 255;
            var blue = components[3] / 255;

            // Convert RGB to luminance in HSL space (as defined by the
            // relative luminance formula given by the W3C for accessibility)
            var luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

            // Consider the background to be dark if white text over that
            // background would provide better contrast than black. This is the
            // case if the luminance of the background color is 0.175 or less.
            // See: https://ux.stackexchange.com/questions/107318/formula-for-color-contrast-between-text-and-background
            if (luminance <= 0.175)
                return true;

        }

        // Assume the background is light in all other cases
        return false;

    };

    // Display results when ready
    connectionTestingService.getResults().then(function testComplete(results) {
        $scope.results = results;
        $scope.permalink = '#' + $location.path() + '?r=' + encodeURIComponent(Result.pack(results));
    })

    // Update status as test continues
    ['finally'](null, function testProgress(status) {
        $scope.status = status;
    });

    $scope.$on('$viewContentLoaded', function interfaceLoaded() {

        // If packed results are given, load those immediately rather than
        // perform a new test
        if ($scope.packedResults)
            connectionTestingService.restoreResults($scope.packedResults);

        // Automatically start the test if configured to do so
        else if ($scope.startAutomatically)
            $scope.startTest();

    });

}]);
