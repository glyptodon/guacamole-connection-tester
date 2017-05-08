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

package org.apache.guacamole.conntest.rest;

import org.codehaus.jackson.annotate.JsonProperty;
import org.codehaus.jackson.map.annotate.JsonSerialize;

/**
 * Information describing a Guacamole server, including its base URL.
 */
@JsonSerialize(include=JsonSerialize.Inclusion.NON_NULL)
public class Server {

    /**
     * The base URL of the Guacamole server.
     */
    private final String url;

    /**
     * Creates a new Server representing the Guacamole server having the given
     * base URL.
     *
     * @param url
     *     The base URL of the Guacamole server.
     */
    public Server(String url) {
        this.url = url;
    }

    /**
     * Returns the base URL of the Guacamole server.
     *
     * @return
     *     The base URL of the Guacamole server.
     */
    @JsonProperty("url")
    public String getURL() {
        return url;
    }

}
