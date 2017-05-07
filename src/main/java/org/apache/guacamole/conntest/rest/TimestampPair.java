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

import org.codehaus.jackson.map.annotate.JsonSerialize;

/**
 * A pair of client and server timestamps related to an arbitrary request. The
 * client timestamp, if present, notes the time that the request was made, while
 * the server timestamp notes the time that the request was serviced.
 */
@JsonSerialize(include=JsonSerialize.Inclusion.NON_NULL)
public class TimestampPair {

    /**
     * The time that the server serviced the request, in milliseconds since
     * January 1, 1970, UTC.
     */
    private final long serverTimestamp;

    /**
     * The time that the client initiated the request, in milliseconds since
     * January 1, 1970, UTC, or null if this time is not known.
     */
    private final Long clientTimestamp;

    /**
     * Creates a new TimestampPair containing the given server and client
     * timestamps.
     *
     * @param serverTimestamp
     *     The time that the server serviced the request, in milliseconds since
     *     January 1, 1970, UTC.
     *
     * @param clientTimestamp
     *     The time that the client initiated the request, in milliseconds
     *     since January 1, 1970, UTC, or null if this time is not known.
     */
    public TimestampPair(long serverTimestamp, Long clientTimestamp) {
        this.serverTimestamp = serverTimestamp;
        this.clientTimestamp = clientTimestamp;
    }

    /**
     * Creates a new TimestampPair containing the current server time and the
     * given client timestamp.
     *
     * @param clientTimestamp
     *     The time that the client initiated the request, in milliseconds
     *     since January 1, 1970, UTC, or null if this time is not known.
     */
    public TimestampPair(Long clientTimestamp) {
        this(System.currentTimeMillis(), clientTimestamp);
    }

    /**
     * Creates a new TimestampPair containing only the current server time. The
     * client timestamp is omitted.
     */
    public TimestampPair() {
        this(null);
    }

    /**
     * Returns the time that the server serviced the request, in milliseconds
     * since January 1, 1970, UTC.
     *
     * @return
     *     The time that the server serviced the request, in milliseconds since
     *     January 1, 1970, UTC.
     */
    public long getServerTimestamp() {
        return serverTimestamp;
    }

    /**
     * Returns the time that the client initiated the request, in milliseconds
     * since January 1, 1970, UTC, or null if this time is not known.
     *
     * @return
     *     The time that the client initiated the request, in milliseconds
     *     since January 1, 1970, UTC, or null if this time is not known.
     */
    public Long getClientTimestamp() {
        return clientTimestamp;
    }

}
