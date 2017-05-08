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

import java.util.Arrays;
import java.util.List;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

/**
 * The root-level resource of the Guacamole connection testing extension.
 */
@Produces(MediaType.APPLICATION_JSON)
public class RootResource {

    /**
     * Returns the version of this extension, as declared within the project
     * pom.xml.
     *
     * @return
     *     The version of this extension, as declared within the project
     *     pom.xml.
     */
    @GET
    public String getVersion() {
        return RootResource.class.getPackage().getImplementationVersion();
    }

    /**
     * Returns the current server time when this request was serviced and, if
     * provided, the current client time when this request was made. Both
     * timestamps are given in the number of milliseconds since midnight of
     * January 1, 1970, UTC.
     *
     * @param timestamp
     *     The current client time in milliseconds since midnight of January 1,
     *     1970, UTC, or null if only the server time is desired.
     *
     * @return
     *     The current server time and, if provided, the current client time.
     */
    @GET
    @Path("time")
    public TimestampPair getTimestamp(@QueryParam("timestamp") Long timestamp) {
        return new TimestampPair(timestamp);
    }

    /**
     * Returns a list absolute URLs for all Guacamole servers within the pool
     * being tested, in order of priority.
     *
     * @return
     *     A list absolute URLs for all Guacamole servers within the pool being
     *     tested, in order of priority.
     */
    @GET
    @Path("servers")
    public List<Server> getServerURLs() {

        // FIXME: STUB
        return Arrays.asList(
            new Server("http://localhost:8080/guacamole/"),
            new Server("https://guacamole.example.org/"),
            new Server("https://guacamole.example.net/"),
            new Server("https://other.example.org/guacamole/")
        );

    }

}
