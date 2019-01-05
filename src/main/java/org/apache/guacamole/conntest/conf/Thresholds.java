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

import com.google.common.collect.ImmutableMap;
import com.google.common.primitives.Ints;
import java.util.Map;
import org.codehaus.jackson.type.TypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A cached copy of the custom server latency thresholds defined by
 * GUACAMOLE_HOME/connection-test-thresholds.json. The thresholds are
 * represented by a map where each string key contains the decimal integer of
 * the minimum latency to which that threshold applies, and each value is the
 * CSS color that should be used to represent a server having that latency. The
 * only key that is not a decimal integer is "unreachable", which contains the
 * CSS color that should be used to represent a server that cannot be reached
 * at all.
 *
 * For example, the following JSON represents the default thresholds which are
 * used if no custom thresholds are defined:
 *
 *     {
 *         "0"   : "rgba(64,  192, 0, 0.5)",
 *         "60"  : "rgba(192, 192, 0, 0.5)",
 *         "130" : "rgba(192, 128, 0, 0.5)",
 *         "220" : "rgba(192, 0,   0, 0.5)",
 *
 *         "unreachable" : "black"
 *     }
 *
 * The "0" and "unreachable" keys are always required. If these keys are
 * missing, or a non-numeric key is found which is not the "unreachable" key,
 * the custom thresholds will be ignored and the last successfully-parsed copy
 * of the thresholds will be used instead. If the custom thresholds have never
 * successfully been parsed, this will be the defaults.
 */
public class Thresholds extends CachedJSON<Map<String, String>> {

    /**
     * Logger for this class.
     */
    private final Logger logger = LoggerFactory.getLogger(Thresholds.class);

    /**
     * The name of the JSON file within GUACAMOLE_HOME which describes the
     * Guacamole servers to be tested.
     */
    public static final String FILENAME = "connection-test-thresholds.json";

    /**
     * The default values that should be used if no thresholds are defined.
     * Note that these are also defined within the Thresholds class on the
     * JavaScript side.
     */
    private static final Map<String, String> DEFAULT_THRESHOLDS =
            ImmutableMap.<String, String>builder()
                    .put("0",   "rgba(64,  192, 0, 0.5)")
                    .put("60",  "rgba(192, 192, 0, 0.5)")
                    .put("130", "rgba(192, 128, 0, 0.5)")
                    .put("220", "rgba(192, 0,   0, 0.5)")
                    .put("unreachable", "black")
                    .build();

    /**
     * Creates a new Thresholds which exposes the contents of
     * GUACAMOLE_HOME/connection-test-thresholds.json.
     */
    public Thresholds() {
        super(FILENAME, new TypeReference<Map<String, String>>() {}, DEFAULT_THRESHOLDS);
    }

    @Override
    protected Map<String, String> update(Map<String, String> oldValue,
            Map<String, String> newValue) {

        // The "unreachable" threshold is required
        if (!newValue.containsKey("unreachable")) {
            logger.warn("\"{}\" is missing the required \"unreachable\" "
                    + "threshold. Using previous/default thresholds instead.",
                    FILENAME);
            return oldValue;
        }

        // A threshold must be provided for 0ms
        if (!newValue.containsKey("0")) {
            logger.warn("\"{}\" is missing the required \"0\" threshold. "
                    + "Using previous/default thresholds instead.", FILENAME);
            return oldValue;
        }

        // Verify all keys are numeric (except for "unreachable")
        for (String threshold : newValue.keySet()) {
            if (!threshold.equals("unreachable") && Ints.tryParse(threshold) == null) {
                logger.warn("\"{}\" contains an invalid threshold (\"{}\"). "
                        + "All thresholds must either be integers or the "
                        + "special threshold \"unreachable\". Using "
                        + "previous/default thresholds instead.",
                        FILENAME, threshold);
                return oldValue;
            }
        }

        // Update passes all checks
        return newValue;

    }

}
