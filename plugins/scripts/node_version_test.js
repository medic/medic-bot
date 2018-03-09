var SSH = require('simple-ssh');
var notify_slack = require('../../src/backend/notify_slack');
var hosts = require('../hosts.json');

var min_node_version = 4;


function node_version_test() {
    hosts.forEach(function(host) {

        
        var ssh = new SSH({
            host: host.url,
            user: host.ssh_user,
            pass: host.ssh_password,
            port: host.ssh_port
        });

        var node_version_check =`node -v`;

        ssh.exec(node_version_check,{
            out: function(stdout){
                if(stdout && stdout != "\n"){
                    var node_version = stdout;
                    var major_version = node_version.replace('v','').split('.')[0];
                    
                    if(major_version < min_node_version){
                        slack_error_msg = `*Warning*: ${host.url} Node version warning. *${node_version.trim()}*`;
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

module.exports = node_version_test;