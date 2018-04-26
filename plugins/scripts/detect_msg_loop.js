var moment = require('moment');
var cradle = require('cradle');
const sqlite3 = require('sqlite3');
var notify_slack = require('../../src/backend/notify_slack');
var hosts = require('../hosts.json');


var no_of_repeats_becomes_loop = 5;

var start_of_day_timestamp = (moment().startOf('day').unix()) * 1000;

var end_of_day_timestamp = (moment().endOf('day').unix()) * 1000;

var currentTimestamp = 0;

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //To remove SSL checking of certificates. Works on cradle library too


function detect_msg_loop() {

    var db_sqlite = new sqlite3.Database('./sms_loop_store.db');

    //Check if table loop_logs exists
    var sql_check = `
                CREATE TABLE IF NOT EXISTS loop_logs( 
                id INTEGER PRIMARY KEY,
                  from_no TEXT NOT NULL, 
                  message TEXT NOT NULL, 
                  repeats INTEGER NOT NULL, 
                  time_stored TEXT NOT NULL,  
                  instance TEXT NOT NULL 
              )             
            `;

    db_sqlite.run(sql_check, function(err) {
        if (err) console.log(err.message);
    });


    var c = new(cradle.Connection)(host.url, host.ssh_port, {
        cache: true,
        raw: false,
        forceSave: true,
        secure: false,
        auth: {
            username: host.ssh_user,
            password: host.ssh_password
        }
    });

    var instance = host.name;

    var db = c.database('medic');

    db.exists(function(err, exists) {
        if (err) {
            console.log('error', err);
        } else if (exists) {
            //The database exists
            db.view('loop-msgs-check/all', {
                startkey: [start_of_day_timestamp],
                endkey: [end_of_day_timestamp, {}],
                include_docs: false,
                group: true,
                reduce: true
            }, function(err, res) {
                if (err) {
                    var error_as_string = JSON.stringify(err);

                    if (error_as_string.includes('missing_named_view') || error_as_string.includes('deleted')) /*Check if error says that view does not exist in db*/ {
                        //if the View does not exist in the db, insert it
                        db.save('_design/loop-msgs-check', {
                            views: {
                                all: {
                                    map: function(doc) {

                                        if (doc.from && doc.type == 'data_record' && !doc.form && doc.errors != "[]") {
                                            var le_timestamp = doc.reported_date;
                                            var xx_time = new Date(le_timestamp);
                                            xx_time.setHours(0, 0, 0, 0);
                                            var reported_beginning = xx_time.getTime();

                                            emit([reported_beginning, doc.from, doc.sms_message.message], doc.reported_date);
                                        }
                                    },
                                    reduce: "_stats"
                                }
                            }
                        });
                    } else {
                        console.log('error', err);
                    }
                } else {
                    //if the view exists, retrieve the view output and process it 
                    currentTimestamp = (moment().unix()) * 1000;

                    for (var i = 0; i < res.length; i++) {
                        //Variable assignage is as according to naming
                        var from = res[i].key[1];
                        var message = res[i].key[2];
                        var repeats = res[i].value['count'];

                        var x = i;

                        if (repeats >= no_of_repeats_becomes_loop) //If at least repeats are greater than the number needed to tag as a loop
                        {
                            
                            var sql1 = `SELECT from_no, message, repeats, time_stored 
                        FROM loop_logs WHERE from_no = ? AND time_stored >= ? and instance =? ORDER BY time_stored DESC LIMIT 1`;

                            (function(from, message, repeats) {

                                db_sqlite.get(sql1, [from, start_of_day_timestamp, instance], function(err, row) {

                                    if (err) {
                                        console.log(err.message);
                                    }

                                    if (row && row.repeats) var subtracted = repeats - row.repeats;

                                    if ((subtracted && subtracted >= no_of_repeats_becomes_loop) || ((!row || !row.repeats) && repeats >= no_of_repeats_becomes_loop)) { //subtracted >= no_of_repeats_becomes_loop means another alert will only go out after more sms equal to the number which defines a loop

                                        //Insert repeats into db
                                        var sql2 = "INSERT INTO loop_logs(from_no, message, repeats, time_stored,  instance) VALUES(?,?,?,?,?)";
                                        db_sqlite.run(sql2, [from, message, repeats, currentTimestamp, instance], function(err) {

                                            if (err) {
                                                console.log(err.message);
                                            }

                                        });

                                        //Code to send to Slack channel here
                                        slack_error_msg = '*Loop Message Alert*: The number ${from} has been sending the message below *${repeats} times today. ```${message}```';
                                        notify_slack(slack_error_msg);
                                    } else {

                                    }

                                });
                            })(from, message, repeats)


                        }

                    }
                }
            });

        } else {
            console.log('database does not exists.');
            db.create();
            /* populate design documents */
        }
    });
}

module.exports = detect_msg_loop;