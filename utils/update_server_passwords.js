//Command format: 
//node update_server_passwords.js [ssh/couchdb] [path_to_1passwords_csv]

var hosts = require('../plugins/hosts.json');
var hosts_path = '../plugins/hosts.json';

csv2json=require('csvtojson');
fs = require('fs');

var one_password_csv, ssh_vs_couchdb;

one_password_csv =  process.argv[3];
ssh_vs_couchdb = process.argv[2];

var one_pass_hosts = [];

const OnePasswordcsvFilePath = one_password_csv;

csv2json()
.fromFile(OnePasswordcsvFilePath)
.on('json',(jsonObj)=>{
        var server = {};
        if(ssh_vs_couchdb === 'ssh'){
            server.host = jsonObj.URL.substring(6, jsonObj.URL.indexOf(':33696'));
        }
        else if(ssh_vs_couchdb === 'couchdb'){
            server.host = jsonObj.URL.substring(8, jsonObj.URL.length);
        }
        
        server.password = jsonObj.Password;
        server.username = jsonObj.Username;
        one_pass_hosts.push(server);

        hosts.forEach(function(host){
            if(host.url == server.host){
            console.log(`Current mode=${ssh_vs_couchdb} host=${host.url} password = ${host.password} ssh_password=${host.ssh_password} incoming password = ${server.password}`);
                if(ssh_vs_couchdb === 'ssh'){
                    host.ssh_password = server.password;
                } else if(ssh_vs_couchdb === 'couchdb'){
                    host.password = server.password;
                }
            }
        });
})
.on('done',(error)=>{
        console.log(hosts);
        console.log('Finished parsing csv and building server list.');        
        save_hosts_file();
});

function save_hosts_file(){
    fs.writeFile(hosts_path, JSON.stringify(hosts, null, 4), function (err){
        if(err) throw err;
        console.log('JSON file saved');
    });
}