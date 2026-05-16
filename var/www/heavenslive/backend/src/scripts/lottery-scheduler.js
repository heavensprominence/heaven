// Runs continuously, draws lottery every Monday at 9 AM
const { Pool } = require('pg');
const pool = new Pool({ user: 'heavenslive', database: 'heavenslive_db' });
const { execSync } = require('child_process');

let lastDrawWeek = null;

async function checkAndDraw() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon
  const hour = now.getHours();
  const weekNum = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (7 * 86400000));
  
  // Draw on Monday between 9:00-9:05 AM
  if (day === 1 && hour === 9 && lastDrawWeek !== weekNum) {
    lastDrawWeek = weekNum;
    console.log(`[${now.toISOString()}] Running weekly lottery draw...`);
    try {
      execSync('node ' + __dirname + '/lottery-draw.js', { stdio: 'inherit' });
    } catch(e) { console.error('Draw error:', e.message); }
  }
}

// Check every 3 minutes
setInterval(checkAndDraw, 3 * 60 * 1000);
checkAndDraw();
console.log('Lottery scheduler started — checks every 3 min, draws Monday 9 AM');
