var hosts = require('../hosts.json');
var notify_slack = require('../../src/backend/notify_slack')
var set_status = require('../../src/backend/bot_db').set_status;
var get_status = require('../../src/backend/bot_db').get_status;
var http = require('https');


function couchdb_fragmentation_test() {
  
  var get_db_information_object = function(host_url, callback){

      var db_obj_res = '';
      
      http.get(host_url, (res) => {
        res.on('data', (d) => {
          if(res.statusCode == 200){
            process.stdout.write(d);
            db_obj_res += d;
          }
        });

        res.on('end', () => {
          if(db_obj_res){
            callback(db_obj_res);
          }
        });

      }).on('error',(e) => {
        console.error(host_url);
        console.error(e);
      });
  }
  

  hosts.forEach(function(host){
    var db_name = 'medic';
    var view_group_info = '/_design/medic/_info';
    var dest_url_db_info = `https://${host.admin}:${host.password}@${host.url}/${db_name}`;
    var dest_url_view_group_info = `https://${host.admin}:${host.password}@${host.url}/${db_name}`;

    get_db_information_object(dest_url_db_info, function(db_info){
      var db_info_json = JSON.parse(db_info);
      var data_size = db_info_json["data_size"];
      var disk_size = db_info_json["disk_size"];

      var fragmentation = (disk_size - data_size)*100/data_size;
      console.log(`${host.url} db fragmentation=${fragmentation}`);
      if(fragmentation > 70){
        notify_slack(`Warning: ${host.url} *db fragmentation* is at *${fragmentation}%*`);
      }
    });

    get_db_information_object(dest_url_view_group_info, function(db_info){
      var db_info_json = JSON.parse(db_info);
      var data_size = db_info_json["data_size"];
      var disk_size = db_info_json["disk_size"];

      var fragmentation = (disk_size - data_size)*100/data_size;
      console.log(`${host.url} view fragmentation=${fragmentation}`);
      if(fragmentation > 60){
        notify_slack(`Warning: ${host.url} *view fragmentation* is at *${fragmentation}%*`);
      }      
    });
  });

}

module.exports = couchdb_fragmentation_test;