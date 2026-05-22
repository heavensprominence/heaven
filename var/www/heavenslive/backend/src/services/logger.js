/**
 * HeavensLive Structured Logger
 * JSON-formatted logs with request context, auto-buffered writes.
 */
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
const ERROR_LOG = path.join(LOG_DIR, 'errors.jsonl');
const ACCESS_LOG = path.join(LOG_DIR, 'access.jsonl');

// Ensure log directory exists
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch(e) {}

// In-memory buffer for recent errors (last 100)
const recentErrors = [];
const MAX_RECENT = 100;

function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };
  
  // Keep in-memory buffer for dashboard
  if (level === 'error' || level === 'warn') {
    recentErrors.unshift(entry);
    if (recentErrors.length > MAX_RECENT) recentErrors.pop();
    
    // Write errors to file
    fs.appendFile(ERROR_LOG, JSON.stringify(entry) + '\n', () => {});
  }
  
  // Console output
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'info' ? 'ℹ️' : '🐛';
  console.log(`${prefix} [${entry.timestamp}] ${message}`, meta.error || '');
}

function error(message, meta = {}) { log('error', message, meta); }
function warn(message, meta = {}) { log('warn', message, meta); }
function info(message, meta = {}) { log('info', message, meta); }
function debug(message, meta = {}) { log('debug', message, meta); }

// Express middleware for access logging
function accessLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const entry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    };
    fs.appendFile(ACCESS_LOG, JSON.stringify(entry) + '\n', () => {});
    if (res.statusCode >= 500) {
      error(`HTTP ${res.statusCode} ${req.method} ${req.path}`, { status: res.statusCode, duration });
    }
  });
  next();
}

function getRecentErrors() { return recentErrors.slice(0, 50); }

// System metrics
function getMetrics() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    nodeVersion: process.version,
    recentErrorCount: recentErrors.length,
    recentErrors: recentErrors.slice(0, 20).map(e => ({ time: e.timestamp, msg: e.message }))
  };
}

module.exports = { error, warn, info, debug, accessLogger, getRecentErrors, getMetrics };
