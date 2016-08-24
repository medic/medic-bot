var hosts = require('../hosts.json');
var notify_slack = require('../../src/backend/notify_slack')

function server_live_test() {
  hosts.forEach(function(host){
    var dest_url = `${host.protocol}://${host.admin}:${host.password}@${host.url}`;
    var slack_error_msg = `@channel ${host.name} cannot be reached.`;

    console.log(dest_url);

    var http = require('https');

    if(host.protocol === 'http'){
      http = require('http');
    }

    http.get(dest_url, (res) => {
      console.log('statusCode: ', res.statusCode);
      console.log('headers: ', res.headers);

      res.on('data', (d) => {
        process.stdout.write(d);
        if(res.statusCode >= 400){
          notify_slack(slack_error_msg);
        }
      });

    }).on('error', (e) => {
      console.error(e);
    });
  });
}

module.exports = server_live_test;