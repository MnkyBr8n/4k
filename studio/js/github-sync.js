// github-sync.js - GitHub API integration for auto-commits

let githubConfig = {
  owner: '',
  repo: '',
  branch: 'main',
  token: ''
};

// Load GitHub config from localStorage
export function loadGitHubConfig() {
  const saved = localStorage.getItem('4k_studio_github_config');
  if (saved) {
    try {
      githubConfig = JSON.parse(saved);
      return githubConfig;
    } catch (e) {
      console.error('Failed to load GitHub config:', e);
    }
  }
  return githubConfig;
}

// Save GitHub config to localStorage
export function saveGitHubConfig(owner, repo, branch, token) {
  githubConfig = { owner, repo, branch: branch || 'main', token };
  localStorage.setItem('4k_studio_github_config', JSON.stringify(githubConfig));
  return true;
}

// Check if GitHub is configured
export function isGitHubConfigured() {
  loadGitHubConfig();
  return !!(githubConfig.owner && githubConfig.repo && githubConfig.token);
}

// Get file SHA (needed for updating files)
async function getFileSHA(path) {
  const { owner, repo, branch, token } = githubConfig;
  
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
}

// Commit a file to GitHub
export async function commitFile(path, content, message) {
  if (!isGitHubConfigured()) {
    return { 
      success: false, 
      error: 'GitHub is not configured. Please add your GitHub token in settings.' 
    };
  }
  
  const { owner, repo, branch, token } = githubConfig;
  
  // Get current file SHA (needed for updates)
  const sha = await getFileSHA(path);
  
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
}

// Upload binary file (images) to GitHub
export async function uploadBinaryFile(path, file, message) {
  if (!isGitHubConfigured()) {
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
      
      const { owner, repo, branch, token } = githubConfig;
      
      // Get current file SHA
      const sha = await getFileSHA(path);
      
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
}

// Delete file from GitHub
export async function deleteFile(path, message) {
  if (!isGitHubConfigured()) {
    return { 
      success: false, 
      error: 'GitHub is not configured' 
    };
  }
  
  const { owner, repo, branch, token } = githubConfig;
  
  // Get file SHA (required for deletion)
  const sha = await getFileSHA(path);
  
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
}

// Test GitHub connection
export async function testGitHubConnection() {
  if (!isGitHubConfigured()) {
    return { 
      success: false, 
      error: 'GitHub not configured' 
    };
  }
  
  const { owner, repo, token } = githubConfig;
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
}

// Get GitHub config status
export function getGitHubStatus() {
  loadGitHubConfig();
  return {
    configured: isGitHubConfigured(),
    owner: githubConfig.owner || 'Not set',
    repo: githubConfig.repo || 'Not set',
    branch: githubConfig.branch || 'main',
    hasToken: !!githubConfig.token
  };
}

// Initialize
loadGitHubConfig();
