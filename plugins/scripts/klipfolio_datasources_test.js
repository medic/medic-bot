/*
 * This script checks for failing data sources and sends out a monitoring slack notification if a data source
 * is failing to refresh.
 *
 * It needs a definition of data sources to work with in the file `../klipfolio/data_sources.json`. You can have as many groups of
 * the datasources that need tracking here. See the example provided: ../data_sources.json.example.
 *
 * *Note*: The user specified must have klipfolios's `api` previleges and should exist within a client.
 */

var datasources = require('../klipfolio/data_sources.json');
var notify_slack = require('../../src/backend/notify_slack');
var https = require('https');

var base_url = `app.klipfolio.com/api/1/datasource-instances`;

function fetchDatasource(ds, uuid) {
    var url = `https://${ds.user}:${ds.password}@${base_url}/${uuid}`;
    var body = '';
    var msg = '';
    var json;

    https.get(url, (res) => {
        res.on('data', (d) => {
            if(res.statusCode === 200) {
                body += d;
            } else {
                msg += `Datasource \`${uuid}\` is inaccessible. *Status code*: ${res.statusCode}.`;
                console.error(msg);
            }
        });
        res.on('end', function() {
            if(body !== '') {
                json = JSON.parse(body);
                if(json.data && json.data.refresh_fail_count > 0) {
                    let lastRefreshDate = new Date(json.data.date_last_refresh).toLocaleDateString("en-US", {
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'});
                    msg += `${json.data.datasource_name}(${uuid}) refresh is failing. *Last refresh*: ${lastRefreshDate}`;
                    console.error(msg);
                } else {
                    console.log(`${ds.name}: all looks ok for ${uuid}`);
                }
            }

            if(msg !== '') {
                msg = `*${ds.name}*: ${msg}`;
                notify_slack(msg);
            }
        });
    }).on('error', (e) => {
      console.error(e);
    });
}

function loopWithTimeout(ds, counter) {
    var uuid = ds.datasources_uuids[--counter];
    setTimeout(() => {
        fetchDatasource(ds, uuid);
        if(counter > 0) {
            loopWithTimeout(ds, counter);
        }
    }, 2000);
}

function klipfolio_datasources_test() {
    datasources.forEach(function(ds){
        loopWithTimeout(ds, ds.datasources_uuids.length);
  });
}

module.exports = klipfolio_datasources_test;
