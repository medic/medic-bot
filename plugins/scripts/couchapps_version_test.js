var hosts = require('../hosts.json');
var notify_slack = require('../../src/backend/notify_slack')
var set_status = require('../../src/backend/bot_db').set_status;
var get_status = require('../../src/backend/bot_db').get_status;
var http = require('https');


var installed_apps_url = 'dashboard/_design/dashboard/_view/app_version_by_market';

var market_versions = {};

function couchapps_version_test() {
  
  var get_market_version = function(callback){
    var market_urls = ["https://staging.dev.medicmobile.org/markets-release/",
                        "https://staging.dev.medicmobile.org/markets-rc/",
                        "https://staging.dev.medicmobile.org/markets-release-v2/",
                        "https://staging.dev.medicmobile.org/markets-beta/",
                        "https://staging.dev.medicmobile.org/markets-alpha/",
                        "https://staging.dev.medicmobile.org/markets-release-v214/"];

    var market_url_extension = '_db/_design/market/_list/app_versions/apps';
    
    market_urls.forEach(function(url, idx){

      var dest_url = `${url}${market_url_extension}`;
      var market_res = '';

      
      http.get(dest_url, (res) => {
        res.on('data', (d) => {
          if(d){
            process.stdout.write(d);
            market_res += d;
          }
        });

        res.on('end', () => {
          if(market_res){
            market_versions[url] = market_res;
            if(idx == market_urls.length - 1) {
              callback(market_versions);
            }
          }
          
        });
      });
    }, this);
  }

  get_market_version(function(market_ver){
    hosts.forEach(function(host){
    var host_dashboard_market_url = `${host.protocol}://${host.admin}:${host.password}@${host.url}/${installed_apps_url}`;

    var apps_json = '';

    if(host.protocol === 'http'){
      http = require('http');
    }

    http.get(host_dashboard_market_url, (res) => {
      res.on('data', (d) => {
        apps_json += d;
      });

      res.on('end', () => {
        if(res.statusCode == 200) {
          
          var list_of_apps = JSON.parse(apps_json);
          console.log(list_of_apps);

          list_of_apps.rows.forEach(function(app_info) {
            
            //Find the version that this app is supposed to be.
            var app_name = app_info.value['app'];
            var market_version_for_app = JSON.parse(market_ver[app_info.key]);
            
            var version_should_be = market_version_for_app[app_name];
            var version_present = app_info.value['version'];

            if(host.is_production && app_info.key.indexOf('markets-release') == -1){
              notify_slack(`${host.url} - The app *${app_name}* is not on production release.  Installed version is: *${version_present}* from ${app_info.key}`);
            } else if(version_should_be && version_should_be != version_present){
              notify_slack(`${host.url} - The app *${app_name}* is on version *${version_present}* it should be upgraded to *${version_should_be}*`);
            }
          }, this);
        }
      });

    }).on('error', (e) => {
      console.error(e);
    });
  });

  });

}

module.exports = couchapps_version_test;