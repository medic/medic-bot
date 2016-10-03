var tasks = require('./plugins/config.json');
var hosts = require('./plugins/hosts.json');
var notify_slack = require('./src/backend/notify_slack')

var later = require('later');
var scripts = [];

notify_slack('Yo! Starting up...  Enabled Plugins: ');

tasks.forEach(function(task){
  var min = task.schedule/1000;
  var scriptToRun = require(task.path)
  var scheduleText = `${min} minutes`;

  if(min > 60) {
    var hours = min/60;
    scheduleText = `${hours} hours`;
  }
  
  if(task.active) {
    var sched = later.parse.recur().every(min).minute(),
      t = later.setInterval(scriptToRun, sched);
    notify_slack(`*Plugin Name*: ${task.name}\n*Description*: ${task.description} \n*Schedule*: Runs every ${scheduleText}.`);
  }
});
