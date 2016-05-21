var tasks = require('./plugins/config.json');
var hosts = require('./plugins/hosts.json');

var later = require('later');
var scripts = [];

tasks.forEach(function(task){
  var min = task.schedule/1000;
  var scriptToRun = require(task.path)

  var sched = later.parse.recur().every(min).minute(),
  	t = later.setInterval(scriptToRun, sched);
});
