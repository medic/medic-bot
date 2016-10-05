var hosts = require('../hosts.json');
var notify_slack = require('../../src/backend/notify_slack')
var http = require('http');

var target_url = '/medic/_design/medic/_rewrite/'

function https_only_test() {
  hosts.forEach(function(host){
    var dest_url_http = `http://${host.admin}:${host.password}@${host.url}${target_url}`;
    var slack_error_msg = `*Warning*: ${host.url} fails https test.  Recommended configuration is https only.`;

    http.get(dest_url_http, (res) => {

      res.on('data', (d) => {
        process.stdout.write(d);
      });

      res.on('end', () => {
        if(res.statusCode == 200 || (!res.headers.location || res.headers.location.indexOf('https') == -1)){
          notify_slack(slack_error_msg);
          return;
        } 
      });

    }).on('error', (e) => {
      console.log(host.url)
      console.error(e);
    });
  });
}

module.exports = https_only_test;