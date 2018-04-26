var tasks = require('./plugins/config.json');
var notify_slack = require('./src/backend/notify_slack')

var later = require('later');
var scripts = [];

console.log(tasks);

tasks.forEach(function(task){
  var min = task.schedule/1000;
  var scriptToRun = require(task.path)
  var scheduleText = `${min} minutes`;
  var hours
  var days

  if(min > 60) {
    hours = min/60;
    scheduleText = `${hours} hours`;
  }

  if(hours > 24){
    days = hours/24;
    if (days > 7){
      throw 'Medic Bot does not support schedules of more than a week at the moment';
    }

    scheduleText = `${days} days`;
  }
  
  if(task.active) {
    let sched, t;
    if(min > 60){
      if(hours && hours > 24){
        sched = later.parse.recur().on(days).dayOfWeek();
        t = later.setInterval(scriptToRun, sched);
        
        console.log(`${task.name} Schedule set every ${scheduleText}`);      
      } else {
        sched = later.parse.recur().every(hours).hour();
        t = later.setInterval(scriptToRun, sched);
        
        console.log(`${task.name} Schedule set every ${scheduleText}`);      
      }
    } else {
      sched = later.parse.recur().every(min).minute();
      t = later.setInterval(scriptToRun, sched);
      
      console.log(`${task.name} Schedule set every ${scheduleText}`);
      console.log(`Next 2 iterations: ` + later.schedule(sched).next(2));
    }

    //notify_slack(`*Plugin Name*: ${task.name}\n*Description*: ${task.description} \n*Schedule*: Runs every ${scheduleText}.`);
  }
});
