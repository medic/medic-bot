var pg = require('pg');

var config = {
  user: 'postgres', //env var: PGUSER
  database: 'medic-bot', //env var: PGDATABASE
  password: 'postgres', //env var: PGPASSWORD
  host: 'localhost', // Server hosting the postgres database
  port: 5432, //env var: PGPORT
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};


var get_status = function(host_url, plugin_name) {
  var pool = new pg.Pool(config);

  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query('SELECT * from plugin_result WHERE host_url=$1 AND plugin_name=$2;', [host_url, plugin_name], function(err, result) {
      done();
      
      if(err) {
        return console.error('error running query', err);
      }
      return result.rows
    });
  });

  pool.on('error', function (err, client) {
    console.error('idle client error', err.message, err.stack)
  })  
}

var set_status = function(host_url, plugin_name, status_result) {
  var pool = new pg.Pool(config);

    pool.connect(function(err,client, done) {

        client.query('UPDATE plugin_result SET result = $3, last_updated=CURRENT_TIMESTAMP WHERE host_url=$1 AND plugin_name = $2;', [host_url, plugin_name, status_result], function (err, result){
            done();

            if(err) {
              return console.error('Error running query', err);
            }
        });

        client.query('INSERT INTO plugin_result (host_url, plugin_name, result) SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT host_url FROM plugin_result WHERE host_url=$1 AND plugin_name = $2);', [host_url, plugin_name, status_result], function (err, result){
            done();

            if(err) {
              return console.error('Error running query', err);
            }
        });
    });
    
}

module.exports = {
  set_status: set_status, 
  get_status: get_status
}