const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'activity_logs.json');
const MAX_LOGS = 50;

let activities = [];

// Load logs on startup
try {
  if (fs.existsSync(LOG_FILE)) {
    const data = fs.readFileSync(LOG_FILE, 'utf-8');
    activities = JSON.parse(data);
  }
} catch (e) {
  console.error('Failed to load activity logs:', e.message);
}

function log(type, message, source = 'System') {
  const newLog = {
    id: Date.now() + Math.random(),
    timestamp: Date.now(),
    time: new Date().toLocaleTimeString('fr-FR'),
    type, // 'info' | 'warning' | 'error' | 'success'
    msg: message,
    source
  };

  activities.unshift(newLog);
  if (activities.length > MAX_LOGS) {
    activities = activities.slice(0, MAX_LOGS);
  }

  // Save to file
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(activities, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save activity logs:', e.message);
  }

  return newLog;
}

function getActivities() {
  return activities;
}

function clearLogs() {
  activities = [];
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(activities, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to clear activity logs:', e.message);
  }
}

module.exports = { log, getActivities, clearLogs };
