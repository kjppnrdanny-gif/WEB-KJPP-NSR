import fs from 'fs';

const notifLogs = JSON.parse(fs.readFileSync('data/notification_logs.json', 'utf8'));
console.log('Total notif logs recorded:', notifLogs.length);
if (notifLogs.length > 0) {
  console.log('Sample notif log:', notifLogs[0]);
}

const mailQueue = JSON.parse(fs.readFileSync('data/mail_queue.json', 'utf8'));
console.log('Total mail queue count:', mailQueue.length);
if (mailQueue.length > 0) {
  console.log('Sample mail queue item:', mailQueue[0]);
}
