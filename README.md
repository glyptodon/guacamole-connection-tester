guacamole-connection-tester
===========================

guacamole-connection-tester is an extension for [Apache
Guacamole](http://guacamole.incubator.apache.org) which adds a publicly-visible
connection testing page, allowing visitors to your Guacamole deployment to
determine which of your Guacamole servers is likely to provide the best
responsiveness.

The test is performed by repeatedly pinging each defined Guacamole server,
taking as many samples as required to produce a reasonably-accurate result. On
average, the test should require no more than roughly one second per server,
less if the network is well behaved.

NOTE: **This extension expects all servers being tested to also have this
extension installed!** If you need to test servers which will lack this
extension, please see [the section covering testing servers without the
extension](#testing-servers-without-the-extension). Additional CORS headers
will need to be manually added to specific responses if your Guacamole servers
are in different domains.

Building the extension
----------------------

guacamole-connection-tester is built using [Apache
Maven](http://maven.apache.org). Building guacamole-connection-tester should be
as simple as running a single command within the root of the source tree:

    $ mvn package

The extension `.jar` file can then be found within the `target/` subdirectory,
which Maven will have automatically created if it didn't exist.

Installation and configuration
------------------------------

To install guacamole-connection-tester, the extension `.jar` file must be
copied to the `extensions/` subdirectory of
[`GUACAMOLE_HOME`](http://guacamole.incubator.apache.org/doc/gug/configuring-guacamole.html#guacamole-home). There are no properties which must be set within
`guacamole.properties` - simply copying the extension `.jar` in place and
restarting Tomcat is sufficient.

The set of available servers is configured with a JSON file,
`guacamole-server-list.json`, which must be added to `GUACAMOLE_HOME`. The
format of this file is fairly straightforward:

    {

        "Arbitrary Server Name #1" : {
            "country" : "US",
            "url"     : "https://example.org/guacamole/"
        },

        "Arbitrary Server Name #2" : {
            "country" : "US",
            "url"     : "https://example.net/guacamole/"
        }

    }

`guacamole-server-list.json` consists of a single `object` value, where each
property of that object defines a Guacamole server. The name of that property
is used to provide the human-readable display name for the server. There is
no restriction as to the content of these names, but they must be unique with
respect to each other.

Each server defined within `guacamole-server-list.json` may have two
properties: `country`, the two-letter [ISO
3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) country code for the country
in which the server is located, and `url`, the full URL for the Guacamole
deployment running on that server. Only the `url` property is required, but
servers without a defined `country` will not have a corresponding flag icon in
the connection testing report.

Property Name | Description
------------- | -----------
`country`     | The two-letter country code for the country in which the server is located, as defined by [ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2).
`url`         | The full URL for the Guacamole deployment running on the server. **This property is required.**

`guacamole-server-list.json` will be automatically reloaded if changed or
created after Tomcat has been started, so there is no need to restart Tomcat
each time changes are made to this file. If the file contains invalid data,
changes will not be loaded, errors will be logged to the Tomcat logs, and
guacamole-connection-tester will continue using the data from the previous
version of `guacamole-server-list.json`.

Testing servers without the extension
-------------------------------------

**The guacamole-connection-tester extension expects that all servers being
tested will have this extension installed.** In addition to providing the page
which actually performs the test, this extension adds a REST service which
responds to the pings made by the test page. It is still possible to test the
responsiveness of servers which lack the extension, but if your servers span
multiple domains, **those servers will need to be behind a proxy which adds
CORS headers**.

In the case that a server does not actually expose the connection testing REST
service, the connection test is written to use the timing of the HTTP 404
response as a substitute, but this response will not be readable by the
JavaScript within the connection test page unless it contains the following
HTTP header:

    Access-Control-Allow-Origin: *

This header will already be present in responses from the connection testing
REST service, but needs to be manually added using a proxy if the REST service
is not available (the extension is not installed). The header need only be
added to responses from the `api/ext/conntest/servers` path, relative to the
path of Guacamole itself.

Performing a connection test
----------------------------

To perform a connection test, navigate to the `/#/conntest/` page within a 
Guacamole deployment having this extension installed. This page is relative to
the root of your deployment. For example, if Guacamole is deployed to
`https://example.org/guacamole/`, the connection testing page would be found at
`https://example.org/guacamole/#/conntest/`.

Visiting the connection testing page does not require authentication. Any users
visiting the URL will immediately see a welcome screen instructing them to
click the "Start Test" button to start the test. Once the test has started,
a progress bar will be displayed showing the current state of the test. The
test should take less than one second per server on average.

Once the test has completed, a table of results will be displayed listing all
available servers in order of responsiveness. Connection quality is ranked and
color coded based on how good the subjective user experience is likely to be
given current network conditions:

Color  | Meaning
------ | -------
Green  | Excellent connection quality. Little to no perceptible latency.
Yellow | Good connection quality. Latency is low or difficult to notice.
Orange | Acceptable connection quality. Latency is noticeable, but not disruptive.
Red    | Poor connection quality. Latency is high enough to be disruptive.
Black  | The server is unavailable.

