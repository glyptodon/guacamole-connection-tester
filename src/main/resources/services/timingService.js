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
 * Service for measuring round trip tipe using the connection testing REST API.
 */
angular.module('guacConntest').factory('timingService', ['$injector',
        function connectionTestService($injector) {

    // Required services
    var $http = $injector.get('$http');
    var $q    = $injector.get('$q');

    // Required types
    var TimestampPair = $injector.get('TimestampPair');

    var service = {};

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

        var request = $q.defer();
        var timestamp = new Date().getTime();

        // Strip the URL fragment if present
        var hash = serverUrl.indexOf('#');
        if (hash !== -1)
            serverUrl = serverUrl.substring(0, hash);

        // Append trailing slash if missing
        if (!/\/$/.exec(serverUrl))
            serverUrl += '/';

        // Ping the Guacamole server's timestamp service
        $http({
            method  : 'GET',
            url     : serverUrl + 'api/ext/conntest/time',
            timeout : timeout,
            params  : { 'timestamp' : timestamp }
        })

        // Resolve promise with received timestamps if successful
        .then(function timestampRequestSucceeded(response) {
            request.resolve(response.data);
        })

        // Reject promise (or fake the timestamp response) if unsuccessful
        ['catch'](function timestampRequestFailed(response) {

            // If the server simply lacks the connection test extension, use
            // the error response as the ping response
            if (response.status === 404)
                request.resolve(new TimestampPair({
                    'serverTimestamp' : new Date().getTime(),
                    'clientTimestamp' : timestamp
                }));

            // Otherwise, request has simply failed
            else
                request.reject();

        });

        return request.promise;

    };

    return service;

}]);
