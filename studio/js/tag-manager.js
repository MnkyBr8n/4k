/**
 * Tag Management System
 * Auto-tags images based on type and purpose
 */

class TagManager {
  constructor() {
    this.predefinedTags = {
      hero: ['hero', 'background', 'seasonal'],
      character: ['carousel', 'profile', 'gallery', 'digital', 'analog', 'sketch', 'wip']
    };
    this.init();
  }

  init() {
    console.log('Tag Manager initialized');
  }

  autoTagHeroBackground(imageData) {
    const tags = ['hero'];
    const filename = (imageData.filename || '').toLowerCase();
    
    const seasonalKeywords = {
      'winter': ['winter', 'christmas', 'holiday', 'snow'],
      'spring': ['spring', 'easter', 'flower'],
      'summer': ['summer', 'beach', 'sun'],
      'fall': ['fall', 'autumn', 'halloween', 'thanksgiving'],
      'halloween': ['halloween', 'spooky', 'pumpkin'],
      'christmas': ['christmas', 'xmas', 'santa'],
      'valentine': ['valentine', 'love', 'heart'],
      'easter': ['easter', 'bunny', 'egg']
    };

    for (const [tag, keywords] of Object.entries(seasonalKeywords)) {
      if (keywords.some(keyword => filename.includes(keyword))) {
        tags.push(tag);
      }
    }

    tags.push('background');
    return [...new Set(tags)];
  }

  autoTagCharacterImage(imageData, purpose = 'gallery') {
    const tags = [];

    if (purpose === 'profile') {
      tags.push('profile', 'portrait', 'main');
    } else if (purpose === 'carousel') {
      tags.push('carousel', 'featured', 'slideshow');
    } else {
      tags.push('gallery');
    }

    if (imageData.album) {
      tags.push(imageData.album);
    }

    const filename = (imageData.filename || '').toLowerCase();
    
    const contextKeywords = {
      'sketch': ['sketch', 'draft', 'wip', 'rough'],
      'lineart': ['line', 'ink', 'outline'],
      'color': ['color', 'painted', 'final'],
      'reference': ['ref', 'reference', 'study'],
      'commission': ['commission', 'comm', 'client'],
      'fanart': ['fanart', 'fan', 'tribute']
    };

    for (const [tag, keywords] of Object.entries(contextKeywords)) {
      if (keywords.some(keyword => filename.includes(keyword))) {
        tags.push(tag);
      }
    }

    if (imageData.characterId) {
      const characters = JSON.parse(localStorage.getItem('4k_characters') || '{}');
      const character = characters[imageData.characterId];
      if (character) {
        tags.push(character.name.toLowerCase().replace(/\s+/g, '-'));
        if (character.template) {
          tags.push(character.template);
        }
      }
    }

    return [...new Set(tags)];
  }

  applyTags(imageId, tags) {
    const images = JSON.parse(localStorage.getItem('4k_images') || '{}');
    
    if (!images[imageId]) {
      console.error('Image not found:', imageId);
      return false;
    }

    if (!images[imageId].tags) {
      images[imageId].tags = [];
    }

    tags.forEach(tag => {
      const normalizedTag = tag.toLowerCase().trim();
      if (normalizedTag && !images[imageId].tags.includes(normalizedTag)) {
        images[imageId].tags.push(normalizedTag);
      }
    });

    localStorage.setItem('4k_images', JSON.stringify(images));
    return true;
  }

  removeTags(imageId, tags) {
    const images = JSON.parse(localStorage.getItem('4k_images') || '{}');
    
    if (!images[imageId] || !images[imageId].tags) {
      return false;
    }

    images[imageId].tags = images[imageId].tags.filter(
      tag => !tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
    );

    localStorage.setItem('4k_images', JSON.stringify(images));
    return true;
  }

  getAllTags() {
    const images = JSON.parse(localStorage.getItem('4k_images') || '{}');
    const heroBackgrounds = JSON.parse(localStorage.getItem('4k_hero_backgrounds') || '{}');
    
    const tagCounts = {};

    Object.values(images).forEach(image => {
      if (image.tags) {
        image.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    Object.values(heroBackgrounds).forEach(bg => {
      if (bg.tags) {
        bg.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  getImagesByTag(tag) {
    const images = JSON.parse(localStorage.getItem('4k_images') || '{}');
    const heroBackgrounds = JSON.parse(localStorage.getItem('4k_hero_backgrounds') || '{}');
    
    const normalizedTag = tag.toLowerCase();
    const results = [];

    Object.values(images).forEach(image => {
      if (image.tags && image.tags.map(t => t.toLowerCase()).includes(normalizedTag)) {
        results.push({
          ...image,
          type: 'character-image'
        });
      }
    });

    Object.values(heroBackgrounds).forEach(bg => {
      if (bg.tags && bg.tags.map(t => t.toLowerCase()).includes(normalizedTag)) {
        results.push({
          ...bg,
          type: 'hero-background'
        });
      }
    });

    return results;
  }

  suggestTags(imageData, type = 'character') {
    if (type === 'hero') {
      return this.autoTagHeroBackground(imageData);
    } else {
      return this.autoTagCharacterImage(imageData, 'gallery');
    }
  }

  bulkUpdateTags(imageIds, options) {
    const results = {
      success: [],
      failed: []
    };

    imageIds.forEach(imageId => {
      try {
        if (options.add && options.add.length > 0) {
          this.applyTags(imageId, options.add);
        }
        if (options.remove && options.remove.length > 0) {
          this.removeTags(imageId, options.remove);
        }
        results.success.push(imageId);
      } catch (e) {
        results.failed.push({ imageId, error: e.message });
      }
    });

    return results;
  }

  renameTag(oldTag, newTag) {
    const images = JSON.parse(localStorage.getItem('4k_images') || '{}');
    const heroBackgrounds = JSON.parse(localStorage.getItem('4k_hero_backgrounds') || '{}');
    
    let count = 0;

    Object.values(images).forEach(image => {
      if (image.tags && image.tags.includes(oldTag)) {
        image.tags = image.tags.map(tag => tag === oldTag ? newTag : tag);
        count++;
      }
    });

    Object.values(heroBackgrounds).forEach(bg => {
      if (bg.tags && bg.tags.includes(oldTag)) {
        bg.tags = bg.tags.map(tag => tag === oldTag ? newTag : tag);
        count++;
      }
    });

    localStorage.setItem('4k_images', JSON.stringify(images));
    localStorage.setItem('4k_hero_backgrounds', JSON.stringify(heroBackgrounds));

    return count;
  }

  deleteTag(tag) {
    const images = JSON.parse(localStorage.getItem('4k_images') || '{}');
    const heroBackgrounds = JSON.parse(localStorage.getItem('4k_hero_backgrounds') || '{}');
    
    let count = 0;

    Object.values(images).forEach(image => {
      if (image.tags && image.tags.includes(tag)) {
        image.tags = image.tags.filter(t => t !== tag);
        count++;
      }
    });

    Object.values(heroBackgrounds).forEach(bg => {
      if (bg.tags && bg.tags.includes(tag)) {
        bg.tags = bg.tags.filter(t => t !== tag);
        count++;
      }
    });

    localStorage.setItem('4k_images', JSON.stringify(images));
    localStorage.setItem('4k_hero_backgrounds', JSON.stringify(heroBackgrounds));

    return count;
  }

  getPredefinedTags(type = 'character') {
    return this.predefinedTags[type] || [];
  }

  validateTag(tag) {
    if (!tag || tag.trim() === '') {
      return { valid: false, error: 'Tag cannot be empty' };
    }

    if (tag.length > 50) {
      return { valid: false, error: 'Tag too long (max 50 characters)' };
    }

    if (!/^[a-z0-9\-_]+$/i.test(tag)) {
      return { valid: false, error: 'Tag can only contain letters, numbers, hyphens, and underscores' };
    }

    return { valid: true };
  }

  getTagStats() {
    const allTags = this.getAllTags();
    const totalImages = Object.keys(JSON.parse(localStorage.getItem('4k_images') || '{}')).length;
    const totalHeroBackgrounds = Object.keys(JSON.parse(localStorage.getItem('4k_hero_backgrounds') || '{}')).length;

    return {
      totalTags: allTags.length,
      totalImages: totalImages + totalHeroBackgrounds,
      mostUsedTags: allTags.slice(0, 10),
      allTags: allTags
    };
  }
}

const tagManager = new TagManager();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TagManager;
}