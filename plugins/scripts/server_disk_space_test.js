var SSH = require('simple-ssh');
var notify_slack = require('../../src/backend/notify_slack');
var hosts = require('../hosts.json');


function server_disk_space_test() {
    hosts.forEach(function(host) {
        if(!host.active){
           return;
        }
        
        var ssh = new SSH({
            host: host.url,
            user: host.ssh_user,
            pass: host.ssh_password,
            port: host.ssh_port
        });

        var disk_space_check =`df -h | grep -vE '^Filesystem|tmpfs|cdrom' | awk '{ print $5 " " $1 }' | while read output;
            do
            usep=$(echo $output | awk '{ print $1}' | cut -d'%' -f1  )
            partition=$(echo $output | awk '{ print $2 }' )
            if [ $usep -ge 80 ]; then
                echo "\"$partition [$usep%]\"\"
            fi
            done
        `;

        ssh.exec(disk_space_check,{
            out: function(stdout){
                if(stdout != ''){
                    slack_error_msg = `*${host.name}* low disk space warning. \nDetails: \n${stdout}`
                    notify_slack(slack_error_msg);
                }
            },
            err: function(stderr) {
                console.log(stderr); 
            }
        }).start();
        
    });
}

module.exports = server_disk_space_test;