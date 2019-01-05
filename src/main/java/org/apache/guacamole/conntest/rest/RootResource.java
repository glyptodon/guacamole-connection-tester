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

import com.google.inject.Inject;
import java.util.Map;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.guacamole.conntest.conf.ServerList;
import org.apache.guacamole.conntest.conf.Thresholds;

/**
 * The root-level resource of the Guacamole connection testing extension.
 */
@Produces(MediaType.APPLICATION_JSON)
public class RootResource {

    /**
     * The list of all Guacamole servers to be tested by this extension.
     */
    @Inject
    private ServerList serverList;

    /**
     * The overall set of latency thresholds and associated CSS colors that
     * should be used to classify Guacamole servers by subjective quality.
     */
    @Inject
    private Thresholds thresholds;

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
     * Returns a response containing the current server time when this request
     * was serviced and, if provided, the current client time when this request
     * was made. Both timestamps are given in the number of milliseconds since
     * midnight of January 1, 1970, UTC.
     *
     * CORS headers are set on the response to allow all origins to ping the
     * timestamp service.
     *
     * @param timestamp
     *     The current client time in milliseconds since midnight of January 1,
     *     1970, UTC, or null if only the server time is desired.
     *
     * @return
     *     A response containing the current server time and, if provided, the
     *     current client time.
     */
    @GET
    @Path("time")
    public Response getTimestamp(@QueryParam("timestamp") Long timestamp) {

        // Return successful reponse containing requested timestamps and
        // CORS headers
        return Response.ok(new TimestampPair(timestamp))
                .header("Access-Control-Allow-Origin", "*")
                .build();

    }

    /**
     * Returns a map of all Guacamole servers within the pool being tested,
     * where the key of each entry is a unique and human-readable name for that
     * Guacamole server.
     *
     * @return
     *     A map of all Guacamole servers within the pool being tested.
     */
    @GET
    @Path("servers")
    public Map<String, Server> getServerURLs() {
        return serverList.getValue();
    }

    /**
     * Returns a map of latency thresholds, where the key of each entry is the
     * minimum integer number of milliseconds that a latency value must have
     * to be classified within that threshold, with the exception of a single
     * entry having the key "unreachable" which is used for servers that cannot
     * be reached at all. The upper bound of each threshold is dictated by the
     * presence of larger keys within the map. The value of each entry is the
     * CSS color that should be used to graphically represent servers classified
     * within that threshold.
     *
     * @return
     *     A map of latency thresholds to the corresponding CSS colors that
     *     should be used to represent servers classified within those
     *     thresholds.
     */
    @GET
    @Path("thresholds")
    public Map<String, String> getThresholds() {
        return thresholds.getValue();
    }

}
