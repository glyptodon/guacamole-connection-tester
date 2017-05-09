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
 * Service which defines the Server class.
 */
angular.module('guacConntest').factory('Server', [function defineServer() {
            
    /**
     * The object returned by REST API calls when representing the data
     * associated with a Guacamole server.
     * 
     * @constructor
     * @param {Server|Object} [template={}]
     *     The object whose properties should be copied within the new
     *     Server.
     */
    var Server = function Server(template) {

        // Use empty object by default
        template = template || {};

        /**
         * The two-letter country code of the country in which the Guacamole
         * server is located, as defined by ISO 3166-2.
         *
         * @type String
         */
        this.country = template.country;

        /**
         * The base URL of the Guacamole server.
         *
         * @type String
         */
        this.url = template.url;

    };

    return Server;

}]);
