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

package org.apache.guacamole.conntest.conf;

import com.google.inject.Singleton;
import java.util.Collections;
import java.util.Map;
import org.apache.guacamole.conntest.rest.Server;
import org.codehaus.jackson.type.TypeReference;

/**
 * A cached copy of the server list defined by
 * GUACAMOLE_HOME/guacamole-server-list.json. The server list is a map of all
 * Guacamole servers which should be tested, where the key of each entry is a
 * unique and human-readable name, and the value of each entry is an object
 * describing the server URL, location, etc.
 */
@Singleton
public class ServerList extends CachedJSON<Map<String, Server>> {

    /**
     * The name of the JSON file within GUACAMOLE_HOME which describes the
     * Guacamole servers to be tested.
     */
    public static final String FILENAME = "guacamole-server-list.json";

    /**
     * Creates a new ServerList which exposes the contents of
     * GUACAMOLE_HOME/guacamole-server-list.json.
     */
    public ServerList() {
        super(FILENAME, new TypeReference<Map<String, Server>>() {},
                Collections.<String, Server>emptyMap());
    }

}
