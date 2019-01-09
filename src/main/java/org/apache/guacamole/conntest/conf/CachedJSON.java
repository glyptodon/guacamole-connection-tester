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
import org.apache.guacamole.environment.Environment;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.type.TypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The cached result of deserializing a JSON file as the given type. The result
 * is refreshed on-demand when the last modified timestamp of the JSON file is
 * newer than the currently cached result.
 *
 * @param <T>
 *     The type which the JSON file should be deserialized to.
 */
public class CachedJSON<T> {

    /**
     * Logger for this class.
     */
    private final Logger logger = LoggerFactory.getLogger(CachedJSON.class);

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
     * The name of the JSON file within GUACAMOLE_HOME to be deserialized.
     */
    private final String filename;

    /**
     * The type which the JSON file should be deserialized to.
     */
    private final TypeReference<T> type;

    /**
     * The time that the JSON file was last modified, in milliseconds since
     * January 1, 1970, or zero if the file has not yet been read.
     */
    private long lastModified = 0;

    /**
     * The most recent result of deserializing the JSON file. This will be the
     * initial value given to the constructor if the file has not yet been
     * read.
     */
    private T cachedValue;

    /**
     * Creates a new CachedJSON which deserializes the contents of the given
     * JSON file as the given type. The file MUST be directly within
     * GUACAMOLE_HOME; it may not be within a subdirectory of GUACAMOLE_HOME
     * nor elsewhere in the filesystem.
     *
     * @param filename
     *     The name of the JSON file within GUACAMOLE_HOME to be deserialized.
     *
     * @param type
     *     A TypeReference instance representing the type which the JSON file
     *     should be deserialized to.
     *
     * @param initial
     *     The initial cached value. This value will be returned by getValue()
     *     until the JSON file has been successfully parsed at least once.
     */
    public CachedJSON(String filename, TypeReference<T> type, T initial) {
        this.filename = filename;
        this.type = type;
        this.cachedValue = initial;
    }

    /**
     * Validates the new parse result, returning the value that should be
     * cached. The value returned may simply be the new value, the old value,
     * an in-place updated version of the old value, or any other legal
     * instance of the type.
     *
     * If not overridden, this function will simply return the new value and
     * performs no validation.
     *
     * @param oldValue
     *     The previously cached value.
     *
     * @param newValue
     *     The value which was just parsed from the JSON file.
     *
     * @return
     *     The value which should now be cached for future calls to getValue()
     *     until the JSON file is modified.
     */
    protected T update(T oldValue, T newValue) {
        return newValue;
    }

    /**
     * Returns the result of parsing the JSON file. If the file has not been
     * modified since the last time it was parsed, the cached result of parsing
     * the file will be returned. If the file has been modified, the file is
     * reparsed, the cache is updated, and the new parse result is returned. If
     * the file cannot be parsed for any reason, the last successful parse
     * result will be used.
     *
     * @return
     *     The result of parsing the JSON file, if the file has been updated
     *     and has been successfully parsed, or the cached result of the last
     *     parse attempt otherwise.
     */
    public T getValue() {

        File json = new File(environment.getGuacamoleHome(), filename);

        // Update cached result if the file has been modified
        if (json.lastModified() > lastModified) {

            // Attempt to parse JSON
            try {
                cachedValue = update(cachedValue, mapper.<T>readValue(json, type));
                lastModified = json.lastModified();
            }

            // Log any failures to do so
            catch (IOException e) {
                logger.warn("Unable to read \"{}\": {}", json, e.getMessage());
                logger.debug("Failed to read JSON.", e);
            }

        }

        return cachedValue;

    }

}
