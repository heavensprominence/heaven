/**
 * Automated Disaster Recovery — Nightly backups of uploads + DB
 * Runs as a setInterval in the Express process (every 24 hours at 3 AM)
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = path.join(__dirname, '../../../backups');
const UPLOADS_DIR = path.join(__dirname, '../../../public/uploads');
const DB_NAME = process.env.DB_NAME || 'heavenslive_db';
const DB_USER = process.env.DB_USER || 'heavenslive';

function ensureBackupDir() {
  try { fs.mkdirSync(BACKUP_DIR, { recursive: true }); } catch(e) {}
}

function rotateBackups() {
  // Keep last 7 daily backups
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-'))
    .sort()
    .reverse();
  files.slice(7).forEach(f => fs.unlinkSync(path.join(BACKUP_DIR, f)));
}

async function runBackup() {
  try {
    ensureBackupDir();
    const date = new Date().toISOString().split('T')[0];
    const backupName = `backup-${date}`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    fs.mkdirSync(backupPath, { recursive: true });

    // 1. Copy all uploads
    if (fs.existsSync(UPLOADS_DIR)) {
      execSync(`cp -r ${UPLOADS_DIR} ${backupPath}/uploads`);
    }

    // 2. Dump database
    execSync(`PGPASSWORD='${process.env.DB_PASSWORD}' pg_dump -h localhost -U ${DB_USER} -d ${DB_NAME} -F c -f ${backupPath}/db.dump`, {
      timeout: 60000,
      stdio: 'pipe'
    });

    // 3. Create tar archive
    execSync(`cd ${BACKUP_DIR} && tar -czf ${backupName}.tar.gz ${backupName} && rm -rf ${backupName}`);

    // 4. Rotate old backups
    rotateBackups();

    console.log(`✅ Backup complete: ${backupName}.tar.gz`);
    return { success: true, name: backupName };
  } catch(e) {
    console.error('Backup failed:', e.message);
    return { success: false, error: e.message };
  }
}

module.exports = { runBackup };
