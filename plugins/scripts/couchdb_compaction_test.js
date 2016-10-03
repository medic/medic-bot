var SSH = require('simple-ssh');
var notify_slack = require('../../src/backend/notify_slack');
var hosts = require('../hosts.json');


function couchdb_compaction_test() {
    hosts.forEach(function(host) {
        if(host.webapp_instance){
            var ssh = new SSH({
                host: host.url,
                user: host.ssh_user,
                pass: host.ssh_password,
                port: host.ssh_port
            });

            var log_couch_config =  `_default = [{db_fragmentation, "70%"}, {view_fragmentation, "60%"}, {from, "23:00"}, {to, "04:00"}]`;
            
            var couchdb_compaction_check_cmd =`sudo cat /srv/settings/medic-core/couchdb/default.ini | grep _default`;

            ssh.exec(couchdb_compaction_check_cmd,{
                out: function(stdout){
                    console.log(`${host.name}:\n response:${stdout}\n expected:${log_couch_config}`)
                    if(stdout.indexOf(log_couch_config) == -1){
                        slack_error_msg = `*${host.name}* Warning: CouchDB Compaction not enabled.`
                        notify_slack(slack_error_msg);
                    }
                },
                err: function(stderr) {
                    console.log(stderr); 
                }
            }).start();
        }
    });
}

module.exports = couchdb_compaction_test;