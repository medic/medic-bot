var hosts = require('../hosts.json');
var notify_slack = require('../../src/backend/notify_slack')
var http = require('https');


function couchdb_doc_conflicts() {
  
  var process_conflicts_object = function(host_url, callback){

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
    var conflicts_view = '_design/medic-conflicts/conflicts';
    var dest_url_conflicts = `https://${host.admin}:${host.password}@${host.url}/${db_name}/${conflicts_view}`;

    process_conflicts_object(dest_url_conflicts, function(view_output){
      var conflicts_json = JSON.parse(view_output);
      var conflicts_count = conflicts_json["total_rows"];

      if(conflicts_count > 0){
        notify_slack(`Warning: ${host.url} *Document conflicts* Count of conflicts: *${conflicts_count}%*`);
      }
    });
  });

}

module.exports = couchdb_doc_conflicts;