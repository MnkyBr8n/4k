// github-sync.js - GitHub API integration for auto-commits
// Uses same localStorage keys as github-sync-ui.js for consistency

const githubSync = {
  // Get config from localStorage (matches github-sync-ui.js pattern)
  getConfig() {
    return {
      owner: localStorage.getItem('4k_github_owner') || '',
      repo: localStorage.getItem('4k_github_repo') || '',
      branch: localStorage.getItem('4k_github_branch') || 'main',
      token: this.getToken()
    };
  },

  // Get token (handles base64 encoding from github-sync-ui.js)
  getToken() {
    const encrypted = localStorage.getItem('4k_github_token');
    if (!encrypted) return '';

    try {
      // Try to decrypt (base64)
      const decrypted = atob(encrypted);
      if (decrypted.startsWith('ghp_') || decrypted.startsWith('github_pat_')) {
        return decrypted;
      }
      // Token stored unencrypted
      return encrypted;
    } catch (e) {
      // Not base64, use as-is
      return encrypted;
    }
  },

  // Save GitHub config to localStorage
  saveConfig(owner, repo, branch, token) {
    localStorage.setItem('4k_github_owner', owner);
    localStorage.setItem('4k_github_repo', repo);
    localStorage.setItem('4k_github_branch', branch || 'main');
    if (token) {
      localStorage.setItem('4k_github_token', btoa(token));
    }
    return true;
  },

  // Check if GitHub is configured
  isConfigured() {
    const config = this.getConfig();
    return !!(config.owner && config.repo && config.token);
  },

  // Get file SHA (needed for updating files)
  async getFileSHA(path) {
    const { owner, repo, branch, token } = this.getConfig();

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.sha;
      }
      return null;
    } catch (e) {
      console.error('Failed to get file SHA:', e);
      return null;
    }
  },

  // Get file from GitHub
  async getFile(path) {
    const { owner, repo, branch, token } = this.getConfig();

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Decode content from base64
        if (data.content) {
          data.decodedContent = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
        }
        return data;
      }
      return null;
    } catch (e) {
      console.error('Failed to get file:', e);
      return null;
    }
  },

  // Update/create file on GitHub
  async updateFile(path, content, message) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'GitHub is not configured. Please add your GitHub token in settings.'
      };
    }

    const { owner, repo, branch, token } = this.getConfig();

    // Get current file SHA (needed for updates)
    const sha = await this.getFileSHA(path);

    // Encode content to base64
    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const body = {
      message: message || `Update ${path} via 4K Studio`,
      content: encodedContent,
      branch: branch
    };

    // Include SHA if file exists (for updates)
    if (sha) {
      body.sha = sha;
    }

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          commit: data.commit,
          url: data.content.html_url
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to commit file'
        };
      }
    } catch (e) {
      console.error('GitHub commit error:', e);
      return {
        success: false,
        error: e.message || 'Network error while committing to GitHub'
      };
    }
  },

  // Commit a file to GitHub (alias for updateFile)
  async commitFile(path, content, message) {
    return this.updateFile(path, content, message);
  },

  // Upload binary file (images) to GitHub
  async uploadBinaryFile(path, file, message) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'GitHub is not configured. Please add your GitHub token in settings.'
      };
    }

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        const bytes = new Uint8Array(arrayBuffer);

        // Convert to base64
        let binary = '';
        bytes.forEach(byte => binary += String.fromCharCode(byte));
        const encodedContent = btoa(binary);

        const { owner, repo, branch, token } = this.getConfig();

        // Get current file SHA
        const sha = await this.getFileSHA(path);

        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

        const body = {
          message: message || `Upload ${file.name} via 4K Studio`,
          content: encodedContent,
          branch: branch
        };

        if (sha) {
          body.sha = sha;
        }

        try {
          const response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });

          if (response.ok) {
            const data = await response.json();
            resolve({
              success: true,
              url: data.content.download_url,
              path: path
            });
          } else {
            const error = await response.json();
            resolve({
              success: false,
              error: error.message || 'Failed to upload file'
            });
          }
        } catch (e) {
          resolve({
            success: false,
            error: e.message || 'Network error while uploading to GitHub'
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to read file'
        });
      };

      reader.readAsArrayBuffer(file);
    });
  },

  // Delete file from GitHub
  async deleteFile(path, message) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'GitHub is not configured'
      };
    }

    const { owner, repo, branch, token } = this.getConfig();

    // Get file SHA (required for deletion)
    const sha = await this.getFileSHA(path);

    if (!sha) {
      return {
        success: false,
        error: 'File not found or already deleted'
      };
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message || `Delete ${path} via 4K Studio`,
          sha: sha,
          branch: branch
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to delete file'
        };
      }
    } catch (e) {
      return {
        success: false,
        error: e.message || 'Network error'
      };
    }
  },

  // Test GitHub connection
  async testConnection() {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'GitHub not configured'
      };
    }

    const { owner, repo, token } = this.getConfig();
    const url = `https://api.github.com/repos/${owner}/${repo}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          repo: data.full_name,
          private: data.private
        };
      } else {
        return {
          success: false,
          error: 'Invalid repository or access denied'
        };
      }
    } catch (e) {
      return {
        success: false,
        error: e.message || 'Network error'
      };
    }
  },

  // Get GitHub config status
  getStatus() {
    const config = this.getConfig();
    return {
      configured: this.isConfigured(),
      owner: config.owner || 'Not set',
      repo: config.repo || 'Not set',
      branch: config.branch || 'main',
      hasToken: !!config.token
    };
  }
};

// Make available globally
window.githubSync = githubSync;
console.log('✅ githubSync available globally');
