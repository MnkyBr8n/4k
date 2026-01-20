// dashboard.js - Dashboard functionality for 4K Studio

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadGitHubStatus();
  loadActivityFeed();
});

/**
 * Load dashboard statistics
 */
function loadStats() {
  // Characters
  const characters = JSON.parse(localStorage.getItem('4k_characters') || '{}');
  document.getElementById('statCharacters').textContent = Object.keys(characters).length;

  // Images
  const images = JSON.parse(localStorage.getItem('4k_images') || '{}');
  document.getElementById('statImages').textContent = Object.keys(images).length;

  // Backgrounds
  const backgrounds = JSON.parse(localStorage.getItem('4k_hero_backgrounds') || '{}');
  document.getElementById('statBackgrounds').textContent = Object.keys(backgrounds).length;

  // Tags
  if (typeof tagManager !== 'undefined') {
    const tagStats = tagManager.getTagStats();
    document.getElementById('statTags').textContent = tagStats.totalTags || 0;
  }

  // Storage
  calculateStorage();
}

/**
 * Calculate localStorage usage
 */
function calculateStorage() {
  let totalSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key) && key.startsWith('4k_')) {
      totalSize += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
    }
  }

  const mb = (totalSize / 1024 / 1024).toFixed(2);
  const maxMb = 5; // localStorage limit is ~5MB
  const percentage = Math.min((totalSize / (maxMb * 1024 * 1024)) * 100, 100);

  document.getElementById('storageText').textContent = `${mb} MB / ${maxMb} MB`;
  document.getElementById('storageFill').style.width = `${percentage}%`;
}

/**
 * Load GitHub sync status
 */
function loadGitHubStatus() {
  const indicator = document.getElementById('syncIndicator');
  const statusText = document.getElementById('syncStatusText');
  const statusDetail = document.getElementById('syncStatusDetail');
  const syncButton = document.getElementById('syncButton');

  // Check both githubSync and githubSyncUI
  const syncConfigured = (window.githubSync && window.githubSync.isConfigured()) ||
                         (window.githubSyncUI && window.githubSyncUI.isConfigured());

  if (syncConfigured) {
    // Get status from whichever is available
    let status;
    if (window.githubSync && window.githubSync.isConfigured()) {
      status = window.githubSync.getStatus();
    } else if (window.githubSyncUI) {
      status = window.githubSyncUI.getConfig();
    }

    indicator.className = 'sync-indicator connected';
    statusText.textContent = 'Connected';
    statusDetail.textContent = `${status.owner}/${status.repo} (${status.branch || 'main'})`;
    syncButton.disabled = false;

    // Load sync queue
    loadSyncQueue();
  } else {
    indicator.className = 'sync-indicator disconnected';
    statusText.textContent = 'Not Connected';
    statusDetail.textContent = 'Configure GitHub in Settings';
    syncButton.disabled = true;
  }
}

/**
 * Load sync queue
 */
function loadSyncQueue() {
  const queueContainer = document.getElementById('syncQueueContainer');
  const queueList = document.getElementById('syncQueueList');

  const queue = JSON.parse(localStorage.getItem('4k_github_sync_queue') || '[]');

  if (queue.length > 0) {
    queueContainer.style.display = 'block';
    queueList.innerHTML = queue.map(item => `
      <div class="queue-item">
        <span>${item.path || item.type || 'Unknown'}</span>
        <span style="opacity: 0.6;">${item.action || 'pending'}</span>
      </div>
    `).join('');
  } else {
    queueContainer.style.display = 'none';
  }
}

/**
 * Manual sync
 */
async function manualSync() {
  const indicator = document.getElementById('syncIndicator');
  const statusText = document.getElementById('syncStatusText');
  const syncButton = document.getElementById('syncButton');

  // Show syncing state
  indicator.className = 'sync-indicator syncing';
  statusText.textContent = 'Syncing...';
  syncButton.disabled = true;

  try {
    if (window.githubSyncUI) {
      const result = await window.githubSyncUI.syncNow();

      if (result.success) {
        showNotification(`Synced ${result.synced || 0} items`, 'success');
      } else {
        showNotification(result.error || 'Sync failed', 'error');
      }
    }
  } catch (e) {
    showNotification(`Sync error: ${e.message}`, 'error');
  }

  // Refresh status
  loadGitHubStatus();
}

/**
 * Load activity feed
 */
function loadActivityFeed() {
  const feed = document.getElementById('activityFeed');
  const activity = JSON.parse(localStorage.getItem('4k_activity_log') || '[]');

  if (activity.length === 0) {
    feed.innerHTML = `
      <div style="text-align: center; padding: 2rem; opacity: 0.6;">
        No recent activity
      </div>
    `;
    return;
  }

  // Show last 10 activities
  const recent = activity.slice(-10).reverse();

  feed.innerHTML = recent.map(item => {
    const icon = getActivityIcon(item.type);
    const time = formatTime(item.timestamp);

    return `
      <div class="activity-item">
        <div class="activity-icon">${icon}</div>
        <div class="activity-content">
          <div class="activity-title">${item.title || item.type}</div>
          <div class="activity-time">${time}</div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Get icon for activity type
 */
function getActivityIcon(type) {
  const icons = {
    'character_created': '👤',
    'character_updated': '✏️',
    'character_deleted': '🗑️',
    'image_uploaded': '📷',
    'image_deleted': '🗑️',
    'github_sync': '🔄',
    'backup_created': '💾',
    'backup_restored': '📥',
    'default': '📌'
  };
  return icons[type] || icons.default;
}

/**
 * Format timestamp
 */
function formatTime(timestamp) {
  if (!timestamp) return 'Unknown';

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;

  return date.toLocaleDateString();
}

/**
 * Open backup dialog
 */
function openBackupDialog() {
  document.getElementById('backupDialog').classList.add('active');

  // Show last backup date
  const lastBackup = localStorage.getItem('4k_last_backup');
  document.getElementById('lastBackupDate').textContent = lastBackup
    ? new Date(lastBackup).toLocaleString()
    : 'Never';
}

/**
 * Close backup dialog
 */
function closeBackupDialog() {
  document.getElementById('backupDialog').classList.remove('active');
}

/**
 * Download backup
 */
function downloadBackup() {
  if (typeof exportTools !== 'undefined') {
    const backup = exportTools.createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `4k-studio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    localStorage.setItem('4k_last_backup', new Date().toISOString());

    showNotification('Backup downloaded', 'success');
    closeBackupDialog();
  } else {
    showNotification('Export tools not loaded', 'error');
  }
}

/**
 * Restore from file
 */
async function restoreFromFile(file) {
  if (!file) return;

  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (typeof exportTools !== 'undefined') {
      const result = exportTools.restoreBackup(backup);

      if (result.success) {
        showNotification('Backup restored successfully', 'success');
        closeBackupDialog();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showNotification(result.error || 'Restore failed', 'error');
      }
    }
  } catch (e) {
    showNotification(`Invalid backup file: ${e.message}`, 'error');
  }
}

/**
 * Open export dialog
 */
function openExportDialog() {
  document.getElementById('exportDialog').classList.add('active');
}

/**
 * Close export dialog
 */
function closeExportDialog() {
  document.getElementById('exportDialog').classList.remove('active');
}

/**
 * Export PDF portfolio
 */
function exportPDFPortfolio() {
  showNotification('PDF export coming soon!', 'info');
}

/**
 * Export social cards
 */
function exportSocialCards() {
  showNotification('Social cards coming soon!', 'info');
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type} active`;

  setTimeout(() => {
    notification.classList.remove('active');
  }, 3000);
}

/**
 * Logout
 */
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.removeItem('4k_logged_in');
    window.location.href = 'login.html';
  }
}
