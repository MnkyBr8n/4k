/**
 * Draw Integration Module
 * Connects the drawing editor to the 4K Studio CMS
 * Handles saving artwork to hero backgrounds and character folders
 */

class StudioDrawIntegration {
  constructor() {
    this.storageKey = '4k_artwork';
    this.init();
  }

  init() {
    console.log('Studio Draw Integration initialized');
  }

  /**
   * Save artwork to hero backgrounds
   * @param {string} canvasDataURL - Canvas image as data URL
   * @param {string} filename - Filename for the image
   * @returns {Object} Result with success status and path
   */
  saveToHeroBackgrounds(canvasDataURL, filename) {
    try {
      // Ensure filename has extension
      if (!filename.endsWith('.png')) {
        filename += '.png';
      }

      // Create hero background entry
      const heroData = {
        id: this.generateId(),
        filename: filename,
        path: `/assets/images/hero-backgrounds/${filename}`,
        imageData: canvasDataURL,
        created: new Date().toISOString(),
        type: 'hero-background',
        dimensions: this.getCanvasDimensions()
      };

      // Save to localStorage (will be synced to GitHub later)
      const heroBackgrounds = this.getHeroBackgrounds();
      heroBackgrounds[heroData.id] = heroData;
      localStorage.setItem('4k_hero_backgrounds', JSON.stringify(heroBackgrounds));

      // Update hero-backgrounds.json structure
      this.updateHeroBackgroundsJSON(heroData);

      // Log activity
      this.logActivity('hero_background_created', {
        filename: filename,
        id: heroData.id
      });

      return {
        success: true,
        path: heroData.path,
        id: heroData.id,
        message: `Hero background saved: ${filename}`
      };
    } catch (error) {
      console.error('Error saving hero background:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save artwork to character folder
   * @param {string} characterId - Character ID
   * @param {string} album - Album name (digital/analog/in-progress)
   * @param {string} canvasDataURL - Canvas image as data URL
   * @param {string} filename - Filename for the image
   * @returns {Object} Result with success status and path
   */
  saveToCharacterFolder(characterId, album, canvasDataURL, filename) {
    try {
      // Validate inputs
      if (!characterId) {
        throw new Error('Character ID is required');
      }

      const validAlbums = ['digital', 'analog', 'in-progress'];
      if (!validAlbums.includes(album)) {
        throw new Error('Invalid album type');
      }

      // Ensure filename has extension
      if (!filename.endsWith('.png')) {
        filename += '.png';
      }

      // Get character name for path
      const characters = JSON.parse(localStorage.getItem('4k_characters') || '{}');
      const character = characters[characterId];
      
      if (!character) {
        throw new Error('Character not found');
      }

      const characterSlug = character.slug || characterId;

      // Create image entry
      const imageData = {
        id: this.generateId(),
        characterId: characterId,
        filename: filename,
        path: `/assets/oc/${characterSlug}/${album}/${filename}`,
        album: album,
        imageData: canvasDataURL,
        created: new Date().toISOString(),
        type: 'character-artwork',
        dimensions: this.getCanvasDimensions(),
        tags: ['drawn-in-studio']
      };

      // Save to images storage
      const images = JSON.parse(localStorage.getItem('4k_images') || '{}');
      images[imageData.id] = imageData;
      localStorage.setItem('4k_images', JSON.stringify(images));

      // Log activity
      this.logActivity('character_artwork_created', {
        characterId: characterId,
        album: album,
        filename: filename,
        id: imageData.id
      });

      return {
        success: true,
        path: imageData.path,
        id: imageData.id,
        message: `Artwork saved to ${character.name}'s ${album} album`
      };
    } catch (error) {
      console.error('Error saving character artwork:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load image for editing
   * @param {string} imageId - Image ID to load
   * @returns {Object} Image data or null
   */
  loadImageForEditing(imageId) {
    try {
      // Check in images
      const images = JSON.parse(localStorage.getItem('4k_images') || '{}');
      if (images[imageId]) {
        return {
          success: true,
          imageData: images[imageId].imageData,
          metadata: images[imageId]
        };
      }

      // Check in hero backgrounds
      const heroBackgrounds = this.getHeroBackgrounds();
      if (heroBackgrounds[imageId]) {
        return {
          success: true,
          imageData: heroBackgrounds[imageId].imageData,
          metadata: heroBackgrounds[imageId]
        };
      }

      return {
        success: false,
        error: 'Image not found'
      };
    } catch (error) {
      console.error('Error loading image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all hero backgrounds
   * @returns {Array} Array of hero background objects
   */
  getAllHeroBackgrounds() {
    const heroBackgrounds = this.getHeroBackgrounds();
    return Object.values(heroBackgrounds).sort((a, b) => 
      new Date(b.created) - new Date(a.created)
    );
  }

  /**
   * Get all images for a character
   * @param {string} characterId - Character ID
   * @returns {Array} Array of image objects
   */
  getCharacterImages(characterId) {
    const images = JSON.parse(localStorage.getItem('4k_images') || '{}');
    return Object.values(images)
      .filter(img => img.characterId === characterId)
      .sort((a, b) => new Date(b.created) - new Date(a.created));
  }

  /**
   * Get all characters
   * @returns {Array} Array of character objects
   */
  getAllCharacters() {
    const characters = JSON.parse(localStorage.getItem('4k_characters') || '{}');
    return Object.values(characters).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Update hero-backgrounds.json structure
   * @param {Object} heroData - Hero background data
   */
  updateHeroBackgroundsJSON(heroData) {
    const jsonData = JSON.parse(localStorage.getItem('4k_hero_backgrounds_json') || '{"backgrounds": []}');
    
    jsonData.backgrounds.push({
      name: heroData.filename.replace('.png', ''),
      url: heroData.path,
      active: false
    });

    localStorage.setItem('4k_hero_backgrounds_json', JSON.stringify(jsonData));
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return 'art_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get canvas dimensions from the active canvas
   * @returns {Object} Width and height
   */
  getCanvasDimensions() {
    const canvas = document.getElementById('drawingCanvas');
    if (canvas) {
      return {
        width: canvas.width,
        height: canvas.height
      };
    }
    return { width: 800, height: 600 };
  }

  /**
   * Get hero backgrounds from storage
   * @returns {Object} Hero backgrounds object
   */
  getHeroBackgrounds() {
    return JSON.parse(localStorage.getItem('4k_hero_backgrounds') || '{}');
  }

  /**
   * Log activity
   * @param {string} action - Action type
   * @param {Object} data - Activity data
   */
  logActivity(action, data) {
    const activity = {
      action: action,
      data: data,
      timestamp: new Date().toISOString(),
      user: 'studio-user'
    };

    const activityLog = JSON.parse(localStorage.getItem('4k_activity_log') || '[]');
    activityLog.push(activity);

    // Keep only last 100 activities
    if (activityLog.length > 100) {
      activityLog.shift();
    }

    localStorage.setItem('4k_activity_log', JSON.stringify(activityLog));
  }

  /**
   * Generate suggested filename based on type and date
   * @param {string} type - 'hero' or 'character'
   * @param {string} characterName - Character name (if applicable)
   * @returns {string} Suggested filename
   */
  generateFilename(type, characterName = null) {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.getTime();

    if (type === 'hero') {
      return `hero-bg-${dateStr}-${timeStr}.png`;
    } else if (type === 'character' && characterName) {
      const slug = characterName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      return `${slug}-art-${dateStr}-${timeStr}.png`;
    }

    return `artwork-${dateStr}-${timeStr}.png`;
  }

  /**
   * Validate filename
   * @param {string} filename - Filename to validate
   * @returns {Object} Validation result
   */
  validateFilename(filename) {
    if (!filename || filename.trim() === '') {
      return {
        valid: false,
        error: 'Filename cannot be empty'
      };
    }

    // Remove extension for validation
    const name = filename.replace(/\.(png|jpg|jpeg|gif)$/i, '');

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      return {
        valid: false,
        error: 'Filename contains invalid characters'
      };
    }

    // Check length
    if (name.length > 100) {
      return {
        valid: false,
        error: 'Filename is too long (max 100 characters)'
      };
    }

    return {
      valid: true,
      filename: name + '.png'
    };
  }

  /**
   * Check if GitHub sync is pending
   * @returns {boolean} True if sync is pending
   */
  hasPendingSync() {
    const syncQueue = JSON.parse(localStorage.getItem('4k_github_sync_queue') || '[]');
    return syncQueue.length > 0;
  }

  /**
   * Add to GitHub sync queue
   * @param {Object} fileData - File data to sync
   */
  addToSyncQueue(fileData) {
    const syncQueue = JSON.parse(localStorage.getItem('4k_github_sync_queue') || '[]');
    syncQueue.push({
      ...fileData,
      queuedAt: new Date().toISOString()
    });
    localStorage.setItem('4k_github_sync_queue', JSON.stringify(syncQueue));
  }
}

// Initialize integration when script loads
const studioDrawIntegration = new StudioDrawIntegration();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StudioDrawIntegration;
}