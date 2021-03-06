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

package org.apache.guacamole.conntest;

import com.google.inject.Guice;
import com.google.inject.Injector;
import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.conntest.rest.RootResource;
import org.apache.guacamole.net.auth.AbstractAuthenticationProvider;

/**
 * AuthenticationProvider which exposes REST services for testing the
 * responsiveness of a pool of Guacamole servers. This AuthenticationProvider
 * does not perform any authentication, but rather exposes the results of
 * testing in a dynamically-generated report visible to anyone.
 */
public class ConnectionTestingAuthenticationProvider extends AbstractAuthenticationProvider {

    /**
     * Injector which will manage the object graph of this authentication
     * provider.
     */
    private final Injector injector;

    /**
     * Creates a new ConnectionTestingAuthenticationProvider which tests the
     * responsiveness of a pool of Guacamole servers.
     *
     * @throws GuacamoleException
     *     If a required property is missing, or an error occurs while parsing
     *     a property.
     */
    public ConnectionTestingAuthenticationProvider() throws GuacamoleException {

        // Set up Guice injector.
        injector = Guice.createInjector(
            new ConnectionTestingAuthenticationProviderModule(this)
        );

    }

    @Override
    public String getIdentifier() {
        return "conntest";
    }

    @Override
    public Object getResource() throws GuacamoleException {
        return injector.getInstance(RootResource.class);
    }

}
