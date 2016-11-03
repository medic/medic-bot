var hosts = require('../hosts.json');
var notify_slack = require('../../src/backend/notify_slack')
var set_status = require('../../src/backend/bot_db').set_status;
var get_status = require('../../src/backend/bot_db').get_status;

function server_live_test() {
  hosts.forEach(function(host){
    var dest_url = `${host.protocol}://${host.admin}:${host.password}@${host.url}`;
    var slack_error_msg = `${host.url} cannot be reached.`;
    var slack_restoration_msg = `${host.url} is now back up.`;

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
          notify_slack(slack_error_msg + ` Status Code: ${res.statusCode}`);
          set_status(host.url, 'server_live_test', res.statusCode);
          
        } else {
          
          if(get_status(host.url, 'server_live_test') >= 400){
            //This server was down in the last test.
            notify_slack(slack_restoration_msg);
          }
          
          set_status(host.url, 'server_live_test', res.statusCode);
        }
      });

    }).on('error', (e) => {
      console.error(e);
    });
  });
}

module.exports = server_live_test;