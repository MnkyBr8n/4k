// GitHub API service for syncing character data to repository
// Commits character JSON files to /oc folder

interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}


interface GitHubApiResponse {
  sha?: string;
  content?: {
    sha: string;
  };
  message?: string;
}

const API_BASE = 'https://api.github.com';

function getConfig(): GitHubConfig | null {
  const saved = localStorage.getItem('4k_studio_github_config');
  if (!saved) return null;

  try {
    const config = JSON.parse(saved);
    if (!config.owner || !config.repo || !config.token) {
      return null;
    }
    return config;
  } catch {
    return null;
  }
}

async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<GitHubApiResponse> {
  const config = getConfig();
  if (!config) throw new Error('GitHub not configured');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `GitHub API error: ${response.status}`);
  }

  return response.json();
}

// Get file from repo (to get SHA for updates)
async function getFile(path: string): Promise<{ content: string; sha: string } | null> {
  const config = getConfig();
  if (!config) return null;

  try {
    const response = await fetch(
      `${API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`,
      {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Failed to get file: ${response.status}`);

    const data = await response.json();
    return {
      content: atob(data.content),
      sha: data.sha,
    };
  } catch (error) {
    console.error('Failed to get file:', error);
    return null;
  }
}

// Create or update a file in the repo
async function putFile(
  path: string,
  content: string,
  message: string
): Promise<boolean> {
  const config = getConfig();
  if (!config) return false;

  try {
    // Get existing file SHA if it exists
    const existing = await getFile(path);

    const body: Record<string, string> = {
      message,
      content: btoa(unescape(encodeURIComponent(content))), // Handle UTF-8
      branch: config.branch,
    };

    if (existing?.sha) {
      body.sha = existing.sha;
    }

    await apiRequest(
      `/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );

    return true;
  } catch (error) {
    console.error('Failed to put file:', error);
    return false;
  }
}

// Delete a file from the repo
async function deleteFile(path: string, message: string): Promise<boolean> {
  const config = getConfig();
  if (!config) return false;

  try {
    const existing = await getFile(path);
    if (!existing) return true; // File doesn't exist, nothing to delete

    await apiRequest(
      `/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: 'DELETE',
        body: JSON.stringify({
          message,
          sha: existing.sha,
          branch: config.branch,
        }),
      }
    );

    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

// Test connection to GitHub
export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: 'GitHub not configured' };
  }

  try {
    await apiRequest(`/repos/${config.owner}/${config.repo}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Sync a single character to GitHub
export async function syncCharacter(character: {
  id: string;
  name: string;
  [key: string]: unknown;
}): Promise<{ success: boolean; error?: string }> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: 'GitHub not configured' };
  }

  try {
    // Create character JSON file in /oc folder
    const path = `oc/${character.id}.json`;
    const content = JSON.stringify(character, null, 2);

    const success = await putFile(
      path,
      content,
      `Update character: ${character.name}`
    );

    if (!success) {
      return { success: false, error: 'Failed to sync character' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Character type for sync (matches what's passed from storage)
interface SyncCharacter {
  id: string;
  name: string;
  template?: string;
  category?: string;
  age?: number;
  aboutQuick?: string;
  portraitUrl?: string;
  pageLink?: string;
  website?: string;
  passport?: {
    role?: string;
    university?: string;
    faculty?: string;
    nationality?: string;
    placeOfBirth?: string;
    dateOfBirth?: string;
    motto?: string;
    bio?: string;
  };
  dandy?: {
    abilities?: string;
    aboutLong?: string;
    stats?: {
      health: number;
      strength: number;
      speed: number;
      intelligence: number;
      charisma: number;
    };
  };
  classic?: {
    dateOfBirth?: string;
    placeOfBirth?: string;
    bio?: string;
  };
}

// Sync all characters to GitHub as data/characters.js + images to /oc
export async function syncAllCharacters(
  characters: SyncCharacter[]
): Promise<{ success: boolean; synced: number; failed: number; imagesUploaded: number; error?: string }> {
  const config = getConfig();
  if (!config) {
    return { success: false, synced: 0, failed: 0, imagesUploaded: 0, error: 'GitHub not configured' };
  }

  let imagesUploaded = 0;

  try {
    // Build the CHARACTERS object in the expected format
    const charactersObj: Record<string, unknown> = {};

    for (const char of characters) {
      // Use name as key (or id if name not suitable)
      const key = char.name || char.id;

      // Build character object matching data/characters.js format
      const folderName = char.name.toLowerCase().replace(/\s+/g, '-');
      const portraitPath = `oc/${folderName}/portrait.png`;

      // Upload portrait image to /oc folder if it exists
      if (char.portraitUrl && char.portraitUrl.startsWith('data:')) {
        const matches = char.portraitUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const [, , base64Data] = matches;
          const uploaded = await putFileBase64(
            portraitPath,
            base64Data,
            `Upload portrait for ${char.name}`
          );
          if (uploaded) {
            imagesUploaded++;
          }
        }
      }

      const charData: Record<string, unknown> = {
        id: char.id,
        template: char.template,
        name: char.name,
      };

      // Add template-specific fields
      if (char.template === 'passport') {
        Object.assign(charData, {
          role: char.passport?.role || '',
          portrait: portraitPath,
          fullArt: portraitPath,
          link: char.pageLink ? `${char.pageLink}.html` : '',
          website: char.website || '',
          university: char.passport?.university || '',
          faculty: char.passport?.faculty || '',
          nationality: char.passport?.nationality || '',
          placeOfBirth: char.passport?.placeOfBirth || '',
          dateOfBirth: char.passport?.dateOfBirth || '',
          age: char.age,
          motto: char.passport?.motto || '',
          aboutQuick: char.aboutQuick || '',
          aboutLong: char.passport?.bio || '',
        });
      } else if (char.template === 'dandy') {
        Object.assign(charData, {
          role: 'Artist / OC',
          portrait: portraitPath,
          fullArt: portraitPath,
          link: char.pageLink ? `${char.pageLink}.html` : 'dandy.html',
          website: char.website || '',
          aboutQuick: char.aboutQuick || '',
          backstoryTeaser: char.dandy?.aboutLong || '',
          stats: char.dandy?.stats ? {
            hearts: char.dandy.stats.health,
            skill: char.dandy.stats.strength,
            move: char.dandy.stats.speed,
            stealth: char.dandy.stats.intelligence,
            stamina: char.dandy.stats.charisma / 5,
            extract: 0.5,
          } : undefined,
        });
      } else if (char.template === 'classic') {
        Object.assign(charData, {
          category: char.category || 'ocs',
          portrait: portraitPath,
          link: char.pageLink ? `${char.pageLink}.html` : '',
          website: char.website || '',
          age: char.age,
          dateOfBirth: char.classic?.dateOfBirth || '',
          placeOfBirth: char.classic?.placeOfBirth || '',
          aboutQuick: char.aboutQuick || char.classic?.bio || '',
        });
      }

      charactersObj[key] = charData;
    }

    // Generate the JavaScript file content
    const jsContent = `// data/characters.js
export const CHARACTERS = ${JSON.stringify(charactersObj, null, 2)};
`;

    const success = await putFile(
      'data/characters.js',
      jsContent,
      `Update characters (${characters.length} total)`
    );

    if (!success) {
      return { success: false, synced: 0, failed: characters.length, imagesUploaded, error: 'Failed to sync to GitHub' };
    }

    return {
      success: true,
      synced: characters.length,
      failed: 0,
      imagesUploaded,
    };
  } catch (error) {
    return { success: false, synced: 0, failed: characters.length, imagesUploaded, error: (error as Error).message };
  }
}

// Put file with base64 content (for images)
async function putFileBase64(
  path: string,
  base64Content: string,
  message: string
): Promise<boolean> {
  const config = getConfig();
  if (!config) return false;

  try {
    // Get existing file SHA if it exists
    const existing = await getFile(path);

    const body: Record<string, string> = {
      message,
      content: base64Content, // Already base64 encoded
      branch: config.branch,
    };

    if (existing?.sha) {
      body.sha = existing.sha;
    }

    await apiRequest(
      `/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );

    return true;
  } catch (error) {
    console.error('Failed to put file:', error);
    return false;
  }
}

// Delete a character from GitHub
export async function deleteCharacterFromGitHub(
  characterId: string,
  characterName: string
): Promise<{ success: boolean; error?: string }> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: 'GitHub not configured' };
  }

  try {
    const path = `oc/${characterId}.json`;
    const success = await deleteFile(path, `Delete character: ${characterName}`);

    if (!success) {
      return { success: false, error: 'Failed to delete character from GitHub' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Check if GitHub is configured
export function isGitHubConfigured(): boolean {
  return getConfig() !== null;
}

// Get current config (without token for display)
export function getGitHubConfigDisplay(): { owner: string; repo: string; branch: string } | null {
  const config = getConfig();
  if (!config) return null;

  return {
    owner: config.owner,
    repo: config.repo,
    branch: config.branch,
  };
}
