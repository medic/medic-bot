var SSH = require('simple-ssh');
var notify_slack = require('../../src/backend/notify_slack');
var hosts = require('../hosts.json');

var current_date = new Date();


function date_time_test() {
    hosts.forEach(function(host) {

        
        var ssh = new SSH({
            host: host.url,
            user: host.ssh_user,
            pass: host.ssh_password,
            port: host.ssh_port
        });

        var date_time_check =`date`;

        ssh.exec(date_time_check,{
            out: function(stdout){
                if(stdout && stdout != "\n"){
                    var server_date = stdout;
                    var server_date_js = Date.parse(server_date);
                    var diff = Math.abs(server_date_js - current_date);
                    if(diff >= 2000){
                        slack_error_msg = `*Warning*: ${host.url} Incorrect date warning on server: *${Date(server_date)}*`;
                        notify_slack(slack_error_msg);
                    }
                }
            },
            err: function(stderr) {
                console.log(stderr);
            }
        }).start();
        
    });
}

module.exports = date_time_test;