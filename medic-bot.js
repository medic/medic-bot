var tasks = require('./plugins/config.json');
var notify_slack = require('./src/backend/notify_slack')

var later = require('later');
var scripts = [];

tasks.forEach(function(task){
  var min = task.schedule/1000;
  var scriptToRun = require(task.path)
  var scheduleText = `${min} minutes`;
  var hours

  if(min > 60) {
    hours = min/60;
    scheduleText = `${hours} hours`;
  }
  
  if(task.active) {
    if(min > 60){
      var sched = later.parse.recur().every(hours).hour(),
        t = later.setInterval(scriptToRun, sched);
      
      console.log(`${task.name} Schedule set every ${hours} hours`);      
    } else {
      var sched = later.parse.recur().every(min).minute(),
        t = later.setInterval(scriptToRun, sched);
      
      console.log(`${task.name} Schedule set every ${min} minutes`);
    }

    //notify_slack(`*Plugin Name*: ${task.name}\n*Description*: ${task.description} \n*Schedule*: Runs every ${scheduleText}.`);
  }
});
