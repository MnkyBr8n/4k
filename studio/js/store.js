/**
 * store.js - Core Data Storage System
 * Handles all localStorage operations for the 4K Studio CMS
 */

class Store {
  constructor() {
    this.prefix = '4k_studio_';
    this.init();
  }

  init() {
    // Initialize default storage structure if needed
    if (!this.get('initialized')) {
      this.set('initialized', true);
      this.set('characters', []);
      this.set('images', []);
      this.set('backgrounds', []);
      this.set('settings', this.getDefaultSettings());
    }
  }

  getDefaultSettings() {
    return {
      theme: 'dark',
      autoSave: true,
      syncEnabled: false,
      lastSync: null
    };
  }

  // Core storage methods
  set(key, value) {
    try {
      const fullKey = this.prefix + key;
      localStorage.setItem(fullKey, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Store.set failed:', e);
      return false;
    }
  }

  get(key, defaultValue = null) {
    try {
      const fullKey = this.prefix + key;
      const item = localStorage.getItem(fullKey);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Store.get failed:', e);
      return defaultValue;
    }
  }

  remove(key) {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (e) {
      console.error('Store.remove failed:', e);
      return false;
    }
  }

  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      this.init();
      return true;
    } catch (e) {
      console.error('Store.clear failed:', e);
      return false;
    }
  }

  // Character methods
  getCharacters() {
    return this.get('characters', []);
  }

  saveCharacter(character) {
    const characters = this.getCharacters();
    const existingIndex = characters.findIndex(c => c.id === character.id);
    
    if (existingIndex >= 0) {
      characters[existingIndex] = character;
    } else {
      character.id = this.generateId();
      character.createdAt = new Date().toISOString();
      characters.push(character);
    }
    
    character.updatedAt = new Date().toISOString();
    return this.set('characters', characters);
  }

  getCharacter(id) {
    const characters = this.getCharacters();
    return characters.find(c => c.id === id);
  }

  deleteCharacter(id) {
    const characters = this.getCharacters();
    const filtered = characters.filter(c => c.id !== id);
    return this.set('characters', filtered);
  }

  // Image methods
  getImages() {
    return this.get('images', []);
  }

  saveImage(image) {
    const images = this.getImages();
    const existingIndex = images.findIndex(i => i.id === image.id);
    
    if (existingIndex >= 0) {
      images[existingIndex] = image;
    } else {
      image.id = this.generateId();
      image.createdAt = new Date().toISOString();
      images.push(image);
    }
    
    image.updatedAt = new Date().toISOString();
    return this.set('images', images);
  }

  getImage(id) {
    const images = this.getImages();
    return images.find(i => i.id === id);
  }

  deleteImage(id) {
    const images = this.getImages();
    const filtered = images.filter(i => i.id !== id);
    return this.set('images', filtered);
  }

  // Background methods
  getBackgrounds() {
    return this.get('backgrounds', []);
  }

  saveBackground(background) {
    const backgrounds = this.getBackgrounds();
    const existingIndex = backgrounds.findIndex(b => b.id === background.id);
    
    if (existingIndex >= 0) {
      backgrounds[existingIndex] = background;
    } else {
      background.id = this.generateId();
      background.createdAt = new Date().toISOString();
      backgrounds.push(background);
    }
    
    background.updatedAt = new Date().toISOString();
    return this.set('backgrounds', backgrounds);
  }

  getBackground(id) {
    const backgrounds = this.getBackgrounds();
    return backgrounds.find(b => b.id === id);
  }

  deleteBackground(id) {
    const backgrounds = this.getBackgrounds();
    const filtered = backgrounds.filter(b => b.id !== id);
    return this.set('backgrounds', filtered);
  }

  // Settings methods
  getSettings() {
    return this.get('settings', this.getDefaultSettings());
  }

  saveSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    return this.set('settings', settings);
  }

  // Utility methods
  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  exportData() {
    const data = {
      characters: this.getCharacters(),
      images: this.getImages(),
      backgrounds: this.getBackgrounds(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      if (data.characters) this.set('characters', data.characters);
      if (data.images) this.set('images', data.images);
      if (data.backgrounds) this.set('backgrounds', data.backgrounds);
      if (data.settings) this.set('settings', data.settings);
      
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  getStorageInfo() {
    const characters = this.getCharacters().length;
    const images = this.getImages().length;
    const backgrounds = this.getBackgrounds().length;
    
    let totalSize = 0;
    for (let key in localStorage) {
      if (key.startsWith(this.prefix)) {
        totalSize += localStorage[key].length;
      }
    }
    
    return {
      characters,
      images,
      backgrounds,
      totalSize: (totalSize / 1024).toFixed(2) + ' KB',
      available: '5 MB' // localStorage typical limit
    };
  }
}

// Create and export singleton instance
const store = new Store();
window.store = store;