// Storage service - localStorage wrapper with typed operations
// Compatible with original 4k_studio_* prefix for data migration

import type {
  Character,
  CharacterImage,
  HeroBackground,
  AppSettings,
  StorageInfo,
  ActivityLogEntry,
} from '../types';

const STORAGE_PREFIX = '4k_studio_';

// Generic storage helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const fullKey = STORAGE_PREFIX + key;
    const item = localStorage.getItem(fullKey);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Storage.get failed for key ${key}:`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): boolean {
  try {
    const fullKey = STORAGE_PREFIX + key;
    localStorage.setItem(fullKey, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Storage.set failed for key ${key}:`, e);
    return false;
  }
}

function removeItem(key: string): boolean {
  try {
    const fullKey = STORAGE_PREFIX + key;
    localStorage.removeItem(fullKey);
    return true;
  } catch (e) {
    console.error(`Storage.remove failed for key ${key}:`, e);
    return false;
  }
}

// Initialize storage with defaults if needed
export function initStorage(): void {
  if (!getItem('initialized', false)) {
    setItem('initialized', true);
    setItem('characters', []);
    setItem('images', []);
    setItem('backgrounds', []);
    setItem('settings', {
      theme: 'dark',
      autoSave: true,
      syncEnabled: false,
      lastSync: null,
    });
    setItem('activity_log', []);
  }
}

// ============== Characters ==============

export function getCharacters(): Character[] {
  return getItem<Character[]>('characters', []);
}

export function getCharacter(id: string): Character | undefined {
  const characters = getCharacters();
  return characters.find(c => c.id === id);
}

export function saveCharacter(character: Character): boolean {
  const characters = getCharacters();
  const existingIndex = characters.findIndex(c => c.id === character.id);

  if (existingIndex >= 0) {
    characters[existingIndex] = {
      ...character,
      updatedAt: new Date().toISOString(),
    };
  } else {
    characters.push({
      ...character,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return setItem('characters', characters);
}

export function deleteCharacter(id: string): boolean {
  const characters = getCharacters();
  const filtered = characters.filter(c => c.id !== id);
  return setItem('characters', filtered);
}

// ============== Images ==============

export function getImages(): CharacterImage[] {
  return getItem<CharacterImage[]>('images', []);
}

export function getImage(id: string): CharacterImage | undefined {
  const images = getImages();
  return images.find(i => i.id === id);
}

export function getCharacterImages(characterId: string): CharacterImage[] {
  const images = getImages();
  return images.filter(i => i.characterId === characterId);
}

export function getImagesByAlbum(characterId: string, album: string): CharacterImage[] {
  return getCharacterImages(characterId).filter(i => i.album === album);
}

export function getCarouselImages(characterId: string): CharacterImage[] {
  return getCharacterImages(characterId)
    .filter(i => i.isCarousel)
    .sort((a, b) => a.carouselOrder - b.carouselOrder)
    .slice(0, 5);
}

export function getPortraitImage(characterId: string): CharacterImage | undefined {
  const images = getCharacterImages(characterId);
  return images.find(i => i.isPortrait) || images[0];
}

export function saveImage(image: CharacterImage): boolean {
  const images = getImages();
  const existingIndex = images.findIndex(i => i.id === image.id);

  if (existingIndex >= 0) {
    images[existingIndex] = {
      ...image,
      lastModified: new Date().toISOString(),
    };
  } else {
    images.push({
      ...image,
      uploadDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    });
  }

  return setItem('images', images);
}

export function deleteImage(id: string): boolean {
  const images = getImages();
  const filtered = images.filter(i => i.id !== id);
  return setItem('images', filtered);
}

export function batchDeleteImages(ids: string[]): { success: string[]; failed: string[] } {
  const images = getImages();
  const result = { success: [] as string[], failed: [] as string[] };

  const filtered = images.filter(img => {
    if (ids.includes(img.id)) {
      result.success.push(img.id);
      return false;
    }
    return true;
  });

  setItem('images', filtered);
  return result;
}

export function reorderImages(imageIds: string[]): boolean {
  const images = getImages();

  imageIds.forEach((id, index) => {
    const img = images.find(i => i.id === id);
    if (img) {
      img.carouselOrder = index;
      img.lastModified = new Date().toISOString();
    }
  });

  return setItem('images', images);
}

export function setPortraitImage(characterId: string, imageId: string): boolean {
  const images = getImages();

  // Clear existing portrait for character
  images.forEach(img => {
    if (img.characterId === characterId && img.isPortrait) {
      img.isPortrait = false;
    }
  });

  // Set new portrait
  const target = images.find(i => i.id === imageId);
  if (target) {
    target.isPortrait = true;
    target.lastModified = new Date().toISOString();
  }

  return setItem('images', images);
}

// ============== Backgrounds ==============

export function getBackgrounds(): HeroBackground[] {
  return getItem<HeroBackground[]>('backgrounds', []);
}

export function saveBackground(background: HeroBackground): boolean {
  const backgrounds = getBackgrounds();
  const existingIndex = backgrounds.findIndex(b => b.id === background.id);

  if (existingIndex >= 0) {
    backgrounds[existingIndex] = background;
  } else {
    backgrounds.push({
      ...background,
      createdAt: new Date().toISOString(),
    });
  }

  return setItem('backgrounds', backgrounds);
}

export function deleteBackground(id: string): boolean {
  const backgrounds = getBackgrounds();
  const filtered = backgrounds.filter(b => b.id !== id);
  return setItem('backgrounds', filtered);
}

// ============== Settings ==============

export function getSettings(): AppSettings {
  return getItem<AppSettings>('settings', {
    theme: 'dark',
    autoSave: true,
    syncEnabled: false,
    lastSync: null,
  });
}

export function saveSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): boolean {
  const settings = getSettings();
  settings[key] = value;
  return setItem('settings', settings);
}

export function saveSettings(settings: AppSettings): boolean {
  return setItem('settings', settings);
}

// ============== Activity Log ==============

export function getActivityLog(): ActivityLogEntry[] {
  return getItem<ActivityLogEntry[]>('activity_log', []);
}

export function logActivity(
  type: string,
  description: string,
  data?: Record<string, unknown>
): boolean {
  const log = getActivityLog();
  const entry: ActivityLogEntry = {
    id: `log_${Date.now()}`,
    type,
    description,
    data,
    timestamp: new Date().toISOString(),
  };

  // Keep last 100 entries
  log.unshift(entry);
  if (log.length > 100) {
    log.pop();
  }

  return setItem('activity_log', log);
}

// ============== Storage Info ==============

export function getStorageInfo(): StorageInfo {
  const characters = getCharacters().length;
  const images = getImages().length;
  const backgrounds = getBackgrounds().length;

  let totalSize = 0;
  for (const key in localStorage) {
    if (key.startsWith(STORAGE_PREFIX)) {
      totalSize += localStorage[key].length * 2; // UTF-16 encoding
    }
  }

  return {
    characters,
    images,
    backgrounds,
    totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
    available: '5 MB',
  };
}

// ============== Export / Import ==============

export function exportAllData(): string {
  const data = {
    characters: getCharacters(),
    images: getImages(),
    backgrounds: getBackgrounds(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(data, null, 2);
}

export function importData(
  jsonString: string
): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonString);

    if (data.characters) setItem('characters', data.characters);
    if (data.images) setItem('images', data.images);
    if (data.backgrounds) setItem('backgrounds', data.backgrounds);
    if (data.settings) setItem('settings', data.settings);

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ============== Clear All ==============

export function clearAllData(): boolean {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        // Use removeItem helper - strip prefix since it's added inside
        const shortKey = key.replace(STORAGE_PREFIX, '');
        removeItem(shortKey);
      }
    });
    initStorage();
    return true;
  } catch (e) {
    console.error('Failed to clear data:', e);
    return false;
  }
}
