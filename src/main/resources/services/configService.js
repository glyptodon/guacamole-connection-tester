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
 * Service for retrieving configuration informationusing the connection testing
 * REST API.
 */
angular.module('guacConntest').factory('configService', ['$injector',
        function configService($injector) {

    // Required services
    var $http = $injector.get('$http');
    var $q    = $injector.get('$q');

    var service = {};

    /**
     * Makes a request to the REST API to get the list of Guacamole servers
     * available for testing, returning a promise that provides an map of
     * @link{Server} objects if successful.
     *
     * @returns {Promise.<Object.<String, Server[]>>}
     *     A promise which will resolve with a map of @link{Server}
     *     objects, where the key of each entry is the human-reable name for
     *     the Guacamole server described by the corresponding @link{Server}
     *     object.
     */
    service.getServers = function getServers() {

        var request = $q.defer();

        // Attempt to retrieve server list
        $http({
            method  : 'GET',
            url     : 'api/ext/conntest/servers'
        })

        // If successful, resolve promise with map of servers
        .then(function serverListRetrievalSucceeded(response) {
            request.resolve(response.data);
        })

        // If unsuccessful, resolve with empty map
        ['catch'](function serverListRetrievalFailed() {
            request.resolve({});
        });

        return request.promise;

    };

    return service;

}]);
