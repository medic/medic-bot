var tasks = require('./plugins/config.json');
var hosts = require('./plugins/hosts.json');
var notify_slack = require('./src/backend/notify_slack')

var later = require('later');
var scripts = [];

notify_slack('Yo! This is medic-bot.  I\'m starting up.  The following plugins are enabled: ');

tasks.forEach(function(task){
  var min = task.schedule/1000;
  var scriptToRun = require(task.path)

  if(task.active) {
    var sched = later.parse.recur().every(min).minute(),
      t = later.setInterval(scriptToRun, sched);
    notify_slack(`*Plugin Name*: ${task.name}\n*Description*: ${task.description} \n*Schedule*: Runs every ${min} minutes.`);
  }
});
