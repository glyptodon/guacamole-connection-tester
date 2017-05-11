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

import com.google.inject.Inject;
import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import org.apache.guacamole.conntest.rest.Server;
import org.apache.guacamole.environment.Environment;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.type.TypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Service for retrieving configuration information regarding the Guacamole
 * connection testing tool.
 */
public class ConfigurationService {

    /**
     * Logger for this class.
     */
    private final Logger logger = LoggerFactory.getLogger(ConfigurationService.class);

    /**
     * The name of the JSON file within GUACAMOLE_HOME which describes the
     * Guacamole servers to be tested.
     */
    private static final String SERVER_LIST_FILENAME = "guacamole-server-list.json";

    /**
     * The type which the JSON file describing the Guacamole servers to be
     * tested should be deserialized to.
     */
    private static final TypeReference<Map<String, Server>> SERVER_LIST_TYPE =
            new TypeReference<Map<String, Server>>() {};

    /**
     * ObjectMapper for deserializing JSON.
     */
    @Inject
    private ObjectMapper mapper;

    /**
     * The Guacamole server environment.
     */
    @Inject
    private Environment environment;

    /**
     * The time that the Guacamole server file was last modified, in
     * milliseconds since January 1, 1970, or zero if the file has not yet been
     * read.
     */
    private long lastModified = 0;

    /**
     * The most recent result of deserializing the Guacamole server file, or
     * an empty map if the file has not yet been read.
     */
    private Map<String, Server> cachedServers = Collections.<String, Server>emptyMap();

    /**
     * Returns a map of all Guacamole servers which should be tested, where the
     * key of each entry is a unique and human-readable name, and the value of
     * each entry is an object describing the server URL, location, etc.
     *
     * @return
     *     A map of all Guacamole servers, where the key of each entry is the
     *     name of the server.
     */
    public Map<String, Server> getServers() {

        File serverFile = new File(environment.getGuacamoleHome(),
                SERVER_LIST_FILENAME);

        // Update cached server list if the file has been modified
        if (serverFile.lastModified() > lastModified) {

            // Attempt to parse JSON list of Guacamole servers
            try {
                cachedServers = mapper.readValue(serverFile, SERVER_LIST_TYPE);
                lastModified = serverFile.lastModified();
            }

            // Log any failures to do so
            catch (IOException e) {
                logger.warn("Unable to read Guacamole server list \"{}\": {}", serverFile, e.getMessage());
                logger.debug("Failed to read Guacamole server list.", e);
            }

        }

        return cachedServers;

    }

}
