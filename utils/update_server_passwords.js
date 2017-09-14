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

var new_servers = 0;

function is_server_found(server){
    var found = false;
    hosts.forEach(function(host){
        if(host.url == server.host){
            if(ssh_vs_couchdb === 'ssh'){
                host.ssh_password = server.password;
            } else if(ssh_vs_couchdb === 'couchdb'){
                host.password = server.password;
            }
            found = true;
        }
    });
    return found;
}


function add_or_upgrade_host(server){
    console.log(`Checking server ${server.host}`);
    if(!is_server_found(server)){
        var ssh_password = ssh_vs_couchdb === 'ssh' ? server.password: "";
        var couchdb_password = ssh_vs_couchdb === 'couchdb' ? server.password: "";
        var is_production = server.host.split('.')[1] === 'app';

        hosts.push({
            "name": server.host,
            "protocol": "https",
            "url": server.host,
            "admin": "admin",
            "password": couchdb_password,
            "ssh_user": "vm",
            "ssh_password": ssh_password,
            "ssh_port": 33696,
            "webapp_instance": true,
            "is_production": is_production,
            "alias": server.host.split('.')[0] + '.' + server.host.split('.')[1],
            "active": true
        });
        console.log(`New server: ${server.host}`);
        new_servers++;
    }
}

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

        add_or_upgrade_host(server);
})
.on('done',(error)=>{
        console.log(`Finished parsing csv and building server list.  Total=${one_pass_hosts.length}`);
        save_hosts_file();
});

function save_hosts_file(){
    fs.writeFile(hosts_path, JSON.stringify(hosts, null, 4), function (err){
        if(err) throw err;
        console.log('JSON file saved');
        if(new_servers){
            console.log(`${new_servers} new servers added`);
        }
    });
}