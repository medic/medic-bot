var Slack = require('node-slack');
var config = require('../../config');

var slack = new Slack(config.slack.web_hook_url);

function notify_slack(message) {
  console.log("Sending message to slack...");
  slack.send(
    {
      text: message,
      username: config.slack.username,
      icon_emoji: config.slack.icon_emoji
    }
  );
}

module.exports = notify_slack;
