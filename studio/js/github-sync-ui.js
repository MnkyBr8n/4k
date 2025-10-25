/**
 * GitHub Sync UI Module
 * Handles GitHub token setup, connection testing, and manual sync
 */

class GitHubSyncUI {
  constructor() {
    this.token = null;
    this.isConnected = false;
    this.syncInProgress = false;
    this.init();
  }

  init() {
    // Load saved token (encrypted in localStorage)
    this.loadToken();
    console.log('✅ GitHub Sync UI initialized');
  }

  /**
   * Load token from localStorage
   */
  loadToken() {
    const encrypted = localStorage.getItem('4k_github_token');
    if (encrypted) {
      try {
        this.token = this.decrypt(encrypted);
        this.isConnected = true;
        console.log('✅ Token loaded from localStorage');
      } catch (e) {
        console.error('❌ Failed to load token:', e);
        this.token = null;
        this.isConnected = false;
      }
    } else {
      console.log('⚠️ No token found in localStorage');
    }
  }

  /**
   * Save token to localStorage (encrypted)
   */
  saveToken(token) {
    try {
      const encrypted = this.encrypt(token);
      localStorage.setItem('4k_github_token', encrypted);
      this.token = token;
      this.isConnected = true;
      console.log('✅ Token saved successfully');
      return true;
    } catch (e) {
      console.error('❌ Failed to save token:', e);
      return false;
    }
  }

  /**
   * Remove token from localStorage
   */
  removeToken() {
    localStorage.removeItem('4k_github_token');
    this.token = null;
    this.isConnected = false;
    console.log('✅ Token removed');
  }

  /**
   * Simple encryption (base64 for now - would use stronger in production)
   */
  encrypt(text) {
    return btoa(text);
  }

  /**
   * Simple decryption
   */
  decrypt(encoded) {
    return atob(encoded);
  }

  /**
   * Check if configured
   */
  isConfigured() {
    const owner = localStorage.getItem('4k_github_owner');
    const repo = localStorage.getItem('4k_github_repo');
    return !!(this.token && owner && repo);
  }

  /**
   * Test GitHub connection
   */
  async testConnection(token = null) {
    const testToken = token || this.token;
    
    if (!testToken) {
      return {
        success: false,
        error: 'No GitHub token provided'
      };
    }

    try {
      // Get repo info from localStorage
      const repoOwner = localStorage.getItem('4k_github_owner') || '';
      const repoName = localStorage.getItem('4k_github_repo') || '';

      if (!repoOwner || !repoName) {
        return {
          success: false,
          error: 'GitHub repository not configured. Please set owner and repo name in Settings.'
        };
      }

      console.log(`🔍 Testing connection to: ${repoOwner}/${repoName}`);

      // Test API call to get repo info
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${testToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Connection successful:', data.full_name);
        return {
          success: true,
          message: `Connected to ${data.full_name}`,
          repo: data
        };
      } else {
        const error = await response.json();
        console.error('❌ Connection failed:', error);
        return {
          success: false,
          error: error.message || 'Failed to connect to GitHub'
        };
      }
    } catch (e) {
      console.error('❌ Connection error:', e);
      return {
        success: false,
        error: `Connection error: ${e.message}`
      };
    }
  }

  /**
   * Get sync queue from localStorage
   */
  getSyncQueue() {
    const queue = JSON.parse(localStorage.getItem('4k_github_sync_queue') || '[]');
    return queue;
  }

  /**
   * Clear sync queue
   */
  clearSyncQueue() {
    localStorage.setItem('4k_github_sync_queue', '[]');
    console.log('✅ Sync queue cleared');
  }

  /**
   * Manual sync now
   */
  async syncNow() {
    if (this.syncInProgress) {
      return {
        success: false,
        error: 'Sync already in progress'
      };
    }

    if (!this.token) {
      return {
        success: false,
        error: 'GitHub token not configured'
      };
    }

    console.log('🔄 Starting manual sync...');
    this.syncInProgress = true;

    try {
      const queue = this.getSyncQueue();

      if (queue.length === 0) {
        this.syncInProgress = false;
        console.log('⚠️ Nothing to sync');
        return {
          success: true,
          message: 'Nothing to sync',
          synced: 0
        };
      }

      console.log(`📦 Syncing ${queue.length} items...`);

      const results = {
        success: [],
        failed: []
      };

      // Process each item in queue
      for (const item of queue) {
        try {
          await this.syncItem(item);
          results.success.push(item);
          console.log(`✅ Synced: ${item.path}`);
        } catch (e) {
          results.failed.push({
            item: item,
            error: e.message
          });
          console.error(`❌ Failed to sync ${item.path}:`, e.message);
        }
      }

      // Update queue (remove successful syncs)
      const remainingQueue = queue.filter(item => 
        !results.success.find(s => s.id === item.id)
      );
      localStorage.setItem('4k_github_sync_queue', JSON.stringify(remainingQueue));

      this.syncInProgress = false;

      console.log(`✅ Sync complete: ${results.success.length} synced, ${results.failed.length} failed`);

      return {
        success: true,
        message: `Synced ${results.success.length} items`,
        synced: results.success.length,
        failed: results.failed.length,
        details: results
      };

    } catch (e) {
      this.syncInProgress = false;
      console.error('❌ Sync failed:', e);
      return {
        success: false,
        error: `Sync failed: ${e.message}`
      };
    }
  }

  /**
   * Sync a single item to GitHub
   */
  async syncItem(item) {
    const repoOwner = localStorage.getItem('4k_github_owner');
    const repoName = localStorage.getItem('4k_github_repo');

    // Determine action based on item type
    if (item.action === 'create' || item.action === 'update') {
      return await this.createOrUpdateFile(repoOwner, repoName, item);
    } else if (item.action === 'delete') {
      return await this.deleteFile(repoOwner, repoName, item);
    }
  }

  /**
   * Create or update file on GitHub
   */
  async createOrUpdateFile(owner, repo, item) {
    // Convert image data URL to base64 content
    let content;
    if (item.imageData) {
      // Remove data URL prefix
      content = item.imageData.split(',')[1];
    } else if (item.content) {
      content = btoa(unescape(encodeURIComponent(item.content)));
    }

    const branch = localStorage.getItem('4k_github_branch') || 'main';

    const payload = {
      message: item.commitMessage || `Update ${item.path} - ${new Date().toISOString()}`,
      content: content,
      branch: branch
    };

    // Get current file SHA if updating
    if (item.action === 'update') {
      try {
        const existingFile = await this.getFile(owner, repo, item.path);
        if (existingFile) {
          payload.sha = existingFile.sha;
        }
      } catch (e) {
        // File doesn't exist, will create instead
        console.log(`File doesn't exist, will create: ${item.path}`);
      }
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync file');
    }

    return await response.json();
  }

  /**
   * Delete file from GitHub
   */
  async deleteFile(owner, repo, item) {
    // Get file SHA first
    const existingFile = await this.getFile(owner, repo, item.path);
    if (!existingFile) {
      throw new Error('File not found');
    }

    const branch = localStorage.getItem('4k_github_branch') || 'main';

    const payload = {
      message: item.commitMessage || `Delete ${item.path} - ${new Date().toISOString()}`,
      sha: existingFile.sha,
      branch: branch
    };

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete file');
    }

    return await response.json();
  }

  /**
   * Get file from GitHub
   */
  async getFile(owner, repo, path) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (response.ok) {
      return await response.json();
    }
    return null;
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    const queue = this.getSyncQueue();
    return {
      connected: this.isConnected,
      configured: this.isConfigured(),
      hasToken: !!this.token,
      syncInProgress: this.syncInProgress,
      queueLength: queue.length,
      queue: queue
    };
  }

  /**
   * Add item to sync queue
   */
  addToQueue(item) {
    const queue = this.getSyncQueue();
    queue.push({
      ...item,
      id: item.id || Date.now() + Math.random().toString(36).substr(2, 9),
      queuedAt: new Date().toISOString()
    });
    localStorage.setItem('4k_github_sync_queue', JSON.stringify(queue));
    console.log(`✅ Added to sync queue: ${item.path}`);
  }

  /**
   * Remove item from queue
   */
  removeFromQueue(itemId) {
    const queue = this.getSyncQueue();
    const filtered = queue.filter(item => item.id !== itemId);
    localStorage.setItem('4k_github_sync_queue', JSON.stringify(filtered));
    console.log(`✅ Removed from sync queue: ${itemId}`);
  }

  /**
   * Get GitHub configuration
   */
  getConfig() {
    return {
      owner: localStorage.getItem('4k_github_owner') || '',
      repo: localStorage.getItem('4k_github_repo') || '',
      branch: localStorage.getItem('4k_github_branch') || 'main',
      hasToken: !!this.token
    };
  }

  /**
   * Save GitHub configuration
   */
  saveConfig(owner, repo, branch = 'main') {
    localStorage.setItem('4k_github_owner', owner);
    localStorage.setItem('4k_github_repo', repo);
    localStorage.setItem('4k_github_branch', branch);
    console.log(`✅ GitHub config saved: ${owner}/${repo} (${branch})`);
  }

  /**
   * Get status for display
   */
  getStatus() {
    if (!this.isConfigured()) {
      return {
        connected: false,
        message: 'Not configured - Please add GitHub settings'
      };
    }

    const config = this.getConfig();
    return {
      connected: this.isConnected,
      message: this.isConnected 
        ? `Connected to ${config.owner}/${config.repo}` 
        : 'Token configured but not tested'
    };
  }
}

// Create global instance - IMPORTANT!
window.githubSyncUI = new GitHubSyncUI();
console.log('✅ githubSyncUI available globally:', typeof window.githubSyncUI);

// Also make it available without window prefix
const githubSyncUI = window.githubSyncUI;

// Export for ES modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GitHubSyncUI;
}