# MedicBot

## Description
MedicBot will monitor important processes required for the smooth running of servers and if and when problems are detected, it will post to slack (Automated monitoring) and attempt to correct the problem (Automated maintenance).

The individual monitoring/maintenance components are built as plugins and additional plugins could be added as needed.  At the most basic level the medic-bot source code is a periodic task scheduler that runs provided scripts (plugins) on a list of hosts based on the specified schedule which is configurable.  It provides what webapps like StatusCake provide but also much more, as you can write completely new node.js plugins that can do anything. (E.g. Monitor the changing of an exchange rate from a certain website and send notifications when there is a change.)

## Plugins Provided with the Code
* Monitor that a server instance is up and running (Configurable schedule) - `server_live_test.js` plugin
* Monitor Disk Space for server instances - `server_disk_space_test.js` plugin
* Monitor CouchDB compaction is enabled and running - `couchdb_compaction_test.js` plugin
* HTTPS Test - `https_only_test.js` plugin

## Notes
* MedicBot needs to be supervised by another process like Supervisord so that it is always up and running and is restarted in case of crashes
