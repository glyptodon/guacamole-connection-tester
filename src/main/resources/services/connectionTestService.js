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
 * Service for interacting with the connection testing REST API.
 */
angular.module('guacConntest').factory('connectionTestService', ['$injector',
        function connectionTestService($injector) {

    // Required services
    var $http = $injector.get('$http');
    
    var service = {};

    /**
     * Makes a request to the REST API to get the list of Guacamole servers
     * available for testing, returning a promise that provides an array of
     * @link{Server} objects if successful.
     *
     * @returns {Promise.<Server[]>}
     *     A promise which will resolve with an array of @link{Server}
     *     objects, where each @link{Server} describes a Guacamole server
     *     available for testing, in order of decreasing priority.
     */
    service.getServers = function getServers() {
        return $http({
            method  : 'GET',
            url     : 'api/ext/conntest/servers'
        });
    };

    /**
     * Makes a request to the REST API for the current server time, returning
     * a promise that provides a @link{TimestampPair} object if successful. The
     * @link{TimestampPair} represents both the server time when the request
     * was serviced and the client time when the request was made.
     *
     * @param {String} serverUrl
     *     The base URL of the Guacamole server to test.
     *
     * @param {Number} [timeout]
     *     The maximum amount of time to allow for the request, in
     *     milliseconds. If omitted, the request will never timeout.
     *
     * @returns {Promise.<TimestampPair>}
     *     A promise which will resolve with a @link{TimestampPair} object,
     *     describing both the server time when the request was serviced and
     *     the client time when the request was made.
     */
    service.getTimestamps = function getTimestamps(serverUrl, timeout) {

        // Append trailing slash if missing
        if (!/\/$/.exec(serverUrl))
            serverUrl += '/';

        // Ping the Guacamole server's timestamp service
        return $http({
            method  : 'GET',
            url     : serverUrl + 'api/ext/conntest/time',
            timeout : timeout,
            params  : { 'timestamp' : new Date().getTime() }
        });

    };

    return service;

}]);
