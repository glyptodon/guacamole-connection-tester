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
 * Service which defines the Status class.
 */
angular.module('guacConntest').factory('Status', [function defineStatus() {
            
    /**
     * The current status of a connection test.
     *
     * @constructor
     * @param {Status|Object} [template={}]
     *     The object whose properties should be copied within the new
     *     Status.
     */
    var Status = function Status(template) {

        // Use empty object by default
        template = template || {};

        /**
         * The total number of servers which remain to be tested. If all tests
         * are complete, this will be zero.
         *
         * @type Number
         */
        this.remaining = template.remaining;

        /**
         * The total number of servers being tested.
         *
         * @type Number
         */
        this.total = template.total;

        /**
         * Whether the connection test has begun. This is distinct from whether
         * the test is "running" - a test which is running must have been
         * started, but a test which is started but is not running is complete.
         *
         * @type Boolean
         */
        this.started = !!template.started;

        /**
         * Whether the connection test is in progress. This is distinct from
         * whether the test is "started" - a test which is running must have
         * been started, but a test which is started but is not running is
         * complete.
         *
         * @type Boolean
         */
        this.running = !!template.running;

        /**
         * Whether the connection test has completed.
         *
         * @type Boolean
         */
        this.complete = !!template.complete;

    };

    return Status;

}]);
