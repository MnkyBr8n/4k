/**
 * Settings JavaScript
 * Handles GitHub configuration, tag management, and data management
 */

// Load settings on page load
document.addEventListener('DOMContentLoaded', () => {
  loadGitHubConfig();
  loadDataStats();
  loadTags();
});

/**
 * Load GitHub configuration
 */
function loadGitHubConfig() {
  const config = githubSyncUI.getConfig();
  
  document.getElementById('githubOwner').value = config.owner || '';
  document.getElementById('githubRepo').value = config.repo || '';
  document.getElementById('githubBranch').value = config.branch || 'main';
  
  // Don't load token for security (user must re-enter)
  document.getElementById('githubToken').placeholder = 
    githubSyncUI.token ? '••••••••••••••••' : 'ghp_xxxxxxxxxxxx';
}

/**
 * Save GitHub configuration
 */
function saveGitHubConfig() {
  const owner = document.getElementById('githubOwner').value.trim();
  const repo = document.getElementById('githubRepo').value.trim();
  const branch = document.getElementById('githubBranch').value.trim() || 'main';
  const token = document.getElementById('githubToken').value.trim();
  
  if (!owner || !repo) {
    showNotification('Please enter repository owner and name', 'error');
    return;
  }
  
  // Save config
  githubSyncUI.saveConfig(owner, repo, branch);
  
  // Save token if provided
  if (token && token !== '') {
    githubSyncUI.saveToken(token);
    githubSyncUI.isConnected = true;
  }
  
  showNotification('GitHub configuration saved', 'success');
  
  // Clear token input for security
  document.getElementById('githubToken').value = '';
  document.getElementById('githubToken').placeholder = '••••••••••••••••';
}

/**
 * Test GitHub connection
 */
async function testConnection() {
  const owner = document.getElementById('githubOwner').value.trim();
  const repo = document.getElementById('githubRepo').value.trim();
  const token = document.getElementById('githubToken').value.trim();
  
  if (!owner || !repo) {
    showNotification('Please enter repository owner and name', 'error');
    return;
  }
  
  if (!token && !githubSyncUI.token) {
    showNotification('Please enter your GitHub token', 'error');
    return;
  }
  
  // Show testing status
  const statusContainer = document.getElementById('connectionStatus');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  
  statusContainer.style.display = 'flex';
  statusIndicator.className = 'status-indicator testing';
  statusText.textContent = 'Testing connection...';
  
  try {
    // Use provided token or saved token
    const testToken = token || githubSyncUI.token;
    
    // Save config temporarily for test
    githubSyncUI.saveConfig(owner, repo);
    
    const result = await githubSyncUI.testConnection(testToken);
    
    if (result.success) {
      statusIndicator.className = 'status-indicator success';
      statusText.innerHTML = `
        <strong>✓ Connected Successfully</strong><br>
        <span style="font-size: 0.9rem; opacity: 0.8;">${result.message}</span>
      `;
      
      // Save token if connection successful
      if (token) {
        githubSyncUI.saveToken(token);
        githubSyncUI.isConnected = true;
        document.getElementById('githubToken').value = '';
        document.getElementById('githubToken').placeholder = '••••••••••••••••';
      }
      
      showNotification('Connection successful!', 'success');
    } else {
      statusIndicator.className = 'status-indicator error';
      statusText.innerHTML = `
        <strong>✗ Connection Failed</strong><br>
        <span style="font-size: 0.9rem; opacity: 0.8;">${result.error}</span>
      `;
      showNotification('Connection failed', 'error');
    }
  } catch (e) {
    statusIndicator.className = 'status-indicator error';
    statusText.innerHTML = `
      <strong>✗ Connection Error</strong><br>
      <span style="font-size: 0.9rem; opacity: 0.8;">${e.message}</span>
    `;
    showNotification(`Error: ${e.message}`, 'error');
  }
}

/**
 * Clear GitHub configuration
 */
function clearGitHubConfig() {
  if (!confirm('Clear all GitHub settings?')) {
    return;
  }
  
  document.getElementById('githubOwner').value = '';
  document.getElementById('githubRepo').value = '';
  document.getElementById('githubBranch').value = 'main';
  document.getElementById('githubToken').value = '';
  document.getElementById('githubToken').placeholder = 'ghp_xxxxxxxxxxxx';
  
  localStorage.removeItem('4k_github_owner');
  localStorage.removeItem('4k_github_repo');
  localStorage.removeItem('4k_github_branch');
  githubSyncUI.removeToken();
  
  document.getElementById('connectionStatus').style.display = 'none';
  
  showNotification('GitHub configuration cleared', 'success');
}

/**
 * Toggle auto-sync
 */
function toggleAutoSync() {
  const autoSync = document.getElementById('autoSync').checked;
  document.getElementById('syncInterval').disabled = !autoSync;
  
  localStorage.setItem('4k_auto_sync', autoSync);
  
  if (autoSync) {
    showNotification('Auto-sync coming soon!', 'info');
  }
}

/**
 * Load data statistics
 */
function loadDataStats() {
  const characters = JSON.parse(localStorage.getItem('4k_characters') || '{}');
  const images = JSON.parse(localStorage.getItem('4k_images') || '{}');
  const heroBackgrounds = JSON.parse(localStorage.getItem('4k_hero_backgrounds') || '{}');
  
  document.getElementById('dataCharacters').textContent = Object.keys(characters).length;
  document.getElementById('dataImages').textContent = Object.keys(images).length;
  document.getElementById('dataBackgrounds').textContent = Object.keys(heroBackgrounds).length;
  
  // Calculate storage
  let totalSize = 0;
  for (let key in localStorage) {
    if (key.startsWith('4k_')) {
      totalSize += localStorage[key].length * 2;
    }
  }
  const mb = (totalSize / 1024 / 1024).toFixed(2);
  document.getElementById('dataStorage').textContent = `${mb} MB`;
}

/**
 * Load tags
 */
function loadTags() {
  const tagStats = tagManager.getTagStats();
  
  document.getElementById('totalTags').textContent = tagStats.totalTags;
  
  const tagsList = document.getElementById('tagsList');
  if (tagStats.allTags.length === 0) {
    tagsList.innerHTML = '<div style="opacity: 0.6;">No tags yet</div>';
    return;
  }
  
  tagsList.innerHTML = tagStats.allTags.slice(0, 20).map(tag => `
    <span style="
      background: rgba(102, 126, 234, 0.3);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
    ">
      ${tag.tag} (${tag.count})
    </span>
  `).join('');
  
  if (tagStats.allTags.length > 20) {
    tagsList.innerHTML += `
      <span style="opacity: 0.6; padding: 0.5rem;">
        +${tagStats.allTags.length - 20} more
      </span>
    `;
  }
}

/**
 * Refresh tags
 */
function refreshTags() {
  loadTags();
  showNotification('Tags refreshed', 'success');
}

/**
 * Clear cache
 */
function clearCache() {
  if (!confirm('Clear browser cache? This will not delete your data.')) {
    return;
  }
  
  // Clear activity log
  localStorage.removeItem('4k_activity_log');
  
  showNotification('Cache cleared', 'success');
  loadDataStats();
}

/**
 * Reset settings
 */
function resetSettings() {
  if (!confirm('Reset all settings to defaults? Your data will not be deleted.')) {
    return;
  }
  
  // Clear settings
  localStorage.removeItem('4k_github_owner');
  localStorage.removeItem('4k_github_repo');
  localStorage.removeItem('4k_github_branch');
  localStorage.removeItem('4k_auto_sync');
  githubSyncUI.removeToken();
  
  showNotification('Settings reset', 'success');
  
  // Reload page
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

/**
 * Clear all data
 */
function clearAllData() {
  const confirmation = prompt(
    'This will DELETE ALL DATA permanently!\n\n' +
    'Type "DELETE ALL DATA" to confirm:'
  );
  
  if (confirmation !== 'DELETE ALL DATA') {
    showNotification('Deletion cancelled', 'info');
    return;
  }
  
  try {
    exportTools.clearAllData();
    showNotification('All data deleted', 'success');
    
    // Reload page
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  } catch (e) {
    showNotification(`Error: ${e.message}`, 'error');
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = 'notification ' + type + ' active';
  
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