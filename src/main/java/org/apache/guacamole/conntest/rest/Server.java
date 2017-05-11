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
    private String url;

    /**
     * The two-letter country code of the country in which this server is
     * located, as defined by ISO 3166-2.
     */
    private CountryCode country;

    /**
     * Returns the two-letter country code of the country in which this server
     * is located, as defined by ISO 3166-2.
     *
     * @return
     *     The two-letter country code of the country in which this server is
     *     located, as defined by ISO 3166-2.
     */
    public CountryCode getCountry() {
        return country;
    }

    /**
     * Sets the two-letter country code of the country in which this server is
     * located, as defined by ISO 3166-2.
     *
     * @param country
     *     The two-letter country code of the country in which this server is
     *     located, as defined by ISO 3166-2.
     */
    public void setCountry(CountryCode country) {
        this.country = country;
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

    /**
     * Sets the base URL of the Guacamole server.
     *
     * @param url
     *     The base URL of the Guacamole server.
     */
    @JsonProperty("url")
    public void setURL(String url) {
        this.url = url;
    }

}
