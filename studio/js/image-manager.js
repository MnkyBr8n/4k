// image-manager.js - Core image management system for 4K Studio
// Handles upload, CRUD, compression, and GitHub sync

import { logActivity } from './image-logger.js';
import { syncToGitHub } from './github-sync.js';

// Configuration
const CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxImageWidth: 2000, // Resize if larger
  thumbnailSize: 300,
  supportedFormats: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'],
  albums: ['digital', 'analog', 'in-progress'],
  maxCarouselImages: 5
};

// Image data structure
export class CharacterImage {
  constructor(data) {
    this.id = data.id || generateImageId();
    this.characterId = data.characterId;
    this.fileName = data.fileName;
    this.album = data.album || 'digital'; // digital, analog, or in-progress
    this.url = data.url; // GitHub raw URL or data URL
    this.thumbnailUrl = data.thumbnailUrl;
    this.caption = data.caption || '';
    this.altText = data.altText || '';
    this.tags = data.tags || [];
    this.fileSize = data.fileSize;
    this.dimensions = data.dimensions || { width: 0, height: 0 };
    this.colorPalette = data.colorPalette || [];
    this.isPortrait = data.isPortrait || false; // Main character portrait
    this.isCarousel = data.isCarousel || false; // Include in hero carousel
    this.carouselOrder = data.carouselOrder || 999;
    this.uploadDate = data.uploadDate || new Date().toISOString();
    this.lastModified = data.lastModified || new Date().toISOString();
  }

  // Get GitHub path for this image
  getGitHubPath() {
    const characterName = this.getCharacterName();
    return `assets/oc/${characterName}/${this.album}/${this.fileName}`;
  }

  getCharacterName() {
    const characters = JSON.parse(localStorage.getItem('4k_characters') || '{}');
    const character = characters[this.characterId];
    return character ? character.name.toLowerCase().replace(/\s+/g, '-') : 'unknown';
  }

  // Convert to JSON for storage
  toJSON() {
    return {
      id: this.id,
      characterId: this.characterId,
      fileName: this.fileName,
      album: this.album,
      url: this.url,
      thumbnailUrl: this.thumbnailUrl,
      caption: this.caption,
      altText: this.altText,
      tags: this.tags,
      fileSize: this.fileSize,
      dimensions: this.dimensions,
      colorPalette: this.colorPalette,
      isPortrait: this.isPortrait,
      isCarousel: this.isCarousel,
      carouselOrder: this.carouselOrder,
      uploadDate: this.uploadDate,
      lastModified: this.lastModified
    };
  }
}

// Generate unique image ID
function generateImageId() {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Load all images for a character
export function loadCharacterImages(characterId) {
  const allImages = JSON.parse(localStorage.getItem('4k_images') || '{}');
  return Object.values(allImages).filter(img => img.characterId === characterId)
    .map(img => new CharacterImage(img));
}

// Load images by album
export function loadImagesByAlbum(characterId, album) {
  return loadCharacterImages(characterId).filter(img => img.album === album);
}

// Get carousel images (sorted by order)
export function getCarouselImages(characterId) {
  return loadCharacterImages(characterId)
    .filter(img => img.isCarousel)
    .sort((a, b) => a.carouselOrder - b.carouselOrder)
    .slice(0, CONFIG.maxCarouselImages);
}

// Get portrait image
export function getPortraitImage(characterId) {
  const images = loadCharacterImages(characterId);
  return images.find(img => img.isPortrait) || images[0] || null;
}

// Save image to storage
export function saveImage(imageData) {
  const allImages = JSON.parse(localStorage.getItem('4k_images') || '{}');
  const image = new CharacterImage(imageData);
  allImages[image.id] = image.toJSON();
  localStorage.setItem('4k_images', JSON.stringify(allImages));
  
  logActivity('image_created', {
    imageId: image.id,
    characterId: image.characterId,
    fileName: image.fileName,
    album: image.album
  });
  
  return image;
}

// Update image metadata
export function updateImage(imageId, updates) {
  const allImages = JSON.parse(localStorage.getItem('4k_images') || '{}');
  if (!allImages[imageId]) {
    throw new Error('Image not found');
  }
  
  const oldData = { ...allImages[imageId] };
  allImages[imageId] = {
    ...allImages[imageId],
    ...updates,
    lastModified: new Date().toISOString()
  };
  
  localStorage.setItem('4k_images', JSON.stringify(allImages));
  
  logActivity('image_updated', {
    imageId,
    characterId: allImages[imageId].characterId,
    changes: updates,
    oldData
  });
  
  return new CharacterImage(allImages[imageId]);
}

// Delete image
export function deleteImage(imageId) {
  const allImages = JSON.parse(localStorage.getItem('4k_images') || '{}');
  const image = allImages[imageId];
  
  if (!image) {
    throw new Error('Image not found');
  }
  
  delete allImages[imageId];
  localStorage.setItem('4k_images', JSON.stringify(allImages));
  
  logActivity('image_deleted', {
    imageId,
    characterId: image.characterId,
    fileName: image.fileName,
    album: image.album
  });
  
  return true;
}

// Batch delete images
export function batchDeleteImages(imageIds) {
  const results = {
    success: [],
    failed: []
  };
  
  imageIds.forEach(id => {
    try {
      deleteImage(id);
      results.success.push(id);
    } catch (error) {
      results.failed.push({ id, error: error.message });
    }
  });
  
  logActivity('batch_delete', {
    total: imageIds.length,
    success: results.success.length,
    failed: results.failed.length
  });
  
  return results;
}

// Move image to different album
export function moveImageToAlbum(imageId, newAlbum) {
  if (!CONFIG.albums.includes(newAlbum)) {
    throw new Error(`Invalid album: ${newAlbum}`);
  }
  
  const oldImage = JSON.parse(localStorage.getItem('4k_images') || '{}')[imageId];
  const oldAlbum = oldImage?.album;
  
  const updatedImage = updateImage(imageId, { album: newAlbum });
  
  logActivity('image_moved', {
    imageId,
    characterId: updatedImage.characterId,
    fromAlbum: oldAlbum,
    toAlbum: newAlbum
  });
  
  return updatedImage;
}

// Batch move images
export function batchMoveImages(imageIds, newAlbum) {
  const results = {
    success: [],
    failed: []
  };
  
  imageIds.forEach(id => {
    try {
      moveImageToAlbum(id, newAlbum);
      results.success.push(id);
    } catch (error) {
      results.failed.push({ id, error: error.message });
    }
  });
  
  logActivity('batch_move', {
    total: imageIds.length,
    success: results.success.length,
    failed: results.failed.length,
    targetAlbum: newAlbum
  });
  
  return results;
}

// Reorder images (for carousel)
export function reorderImages(imageIds) {
  const allImages = JSON.parse(localStorage.getItem('4k_images') || '{}');
  
  imageIds.forEach((id, index) => {
    if (allImages[id]) {
      allImages[id].carouselOrder = index;
      allImages[id].lastModified = new Date().toISOString();
    }
  });
  
  localStorage.setItem('4k_images', JSON.stringify(allImages));
  
  logActivity('images_reordered', {
    imageIds,
    newOrder: imageIds
  });
}

// Set portrait image (only one per character)
export function setPortraitImage(characterId, imageId) {
  const allImages = JSON.parse(localStorage.getItem('4k_images') || '{}');
  
  // Clear existing portrait for this character
  Object.values(allImages).forEach(img => {
    if (img.characterId === characterId && img.isPortrait) {
      img.isPortrait = false;
    }
  });
  
  // Set new portrait
  if (allImages[imageId]) {
    allImages[imageId].isPortrait = true;
    allImages[imageId].lastModified = new Date().toISOString();
  }
  
  localStorage.setItem('4k_images', JSON.stringify(allImages));
  
  logActivity('portrait_changed', {
    characterId,
    newPortraitId: imageId
  });
}


// Toggle carousel inclusion
export function toggleCarousel(imageId, characterId) {
  const allImages = JSON.parse(localStorage.getItem('4k_images') || '{}');
  const image = allImages[imageId];
  
  if (!image) {
    throw new Error('Image not found');
  }
  
  // Check carousel limit
  const carouselImages = getCarouselImages(characterId);
  
  if (!image.isCarousel && carouselImages.length >= CONFIG.maxCarouselImages) {
    throw new Error(`Maximum ${CONFIG.maxCarouselImages} carousel images allowed`);
  }
  
  image.isCarousel = !image.isCarousel;
  image.lastModified = new Date().toISOString();
  
  // Set carousel order if adding
  if (image.isCarousel) {
    image.carouselOrder = carouselImages.length;
  }
  
  localStorage.setItem('4k_images', JSON.stringify(allImages));
  
  logActivity('carousel_toggled', {
    imageId,
    characterId,
    isCarousel: image.isCarousel
  });
  
  return image.isCarousel;
}

// Validate file before upload
export function validateFile(file) {
  const errors = [];
  
  // Check file type
  if (!CONFIG.supportedFormats.includes(file.type)) {
    errors.push(`Unsupported format: ${file.type}. Supported: PNG, JPG, WebP, GIF, SVG`);
  }
  
  // Check file size
  if (file.size > CONFIG.maxFileSize) {
    errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: ${CONFIG.maxFileSize / 1024 / 1024}MB`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Compress and resize image
export async function processImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const img = new Image();
      
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > CONFIG.maxImageWidth) {
          height = (height * CONFIG.maxImageWidth) / width;
          width = CONFIG.maxImageWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Create thumbnail
        const thumbCanvas = document.createElement('canvas');
        const thumbCtx = thumbCanvas.getContext('2d');
        const thumbSize = CONFIG.thumbnailSize;
        const thumbScale = Math.min(thumbSize / width, thumbSize / height);
        
        thumbCanvas.width = width * thumbScale;
        thumbCanvas.height = height * thumbScale;
        thumbCtx.drawImage(img, 0, 0, thumbCanvas.width, thumbCanvas.height);
        
        // Convert to blobs
        canvas.toBlob((blob) => {
          thumbCanvas.toBlob((thumbBlob) => {
            resolve({
              originalFile: file,
              processedBlob: blob,
              thumbnailBlob: thumbBlob,
              dimensions: { width, height },
              originalDimensions: { width: img.width, height: img.height }
            });
          }, 'image/jpeg', 0.85);
        }, 'image/jpeg', 0.9);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Extract dominant colors from image
export async function extractColorPalette(imageUrl, numColors = 5) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Use smaller canvas for performance
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      
      ctx.drawImage(img, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size);
      const pixels = imageData.data;
      const colorMap = {};
      
      // Sample colors
      for (let i = 0; i < pixels.length; i += 4) {
        const r = Math.round(pixels[i] / 10) * 10;
        const g = Math.round(pixels[i + 1] / 10) * 10;
        const b = Math.round(pixels[i + 2] / 10) * 10;
        const rgb = `rgb(${r},${g},${b})`;
        colorMap[rgb] = (colorMap[rgb] || 0) + 1;
      }
      
      // Get top colors
      const sortedColors = Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, numColors)
        .map(([color]) => color);
      
      resolve(sortedColors);
    };
    
    img.onerror = () => resolve([]); // Return empty array on error
    img.src = imageUrl;
  });
}

// Upload image from file
export async function uploadImage(file, characterId, album = 'digital', metadata = {}) {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }
  
  // Process image
  const processed = await processImage(file);
  
  // Create data URLs (temporary until GitHub sync)
  const mainDataUrl = await blobToDataUrl(processed.processedBlob);
  const thumbDataUrl = await blobToDataUrl(processed.thumbnailBlob);
  
  // Extract color palette
  const colorPalette = await extractColorPalette(mainDataUrl);
  
  // Create image object
  const imageData = {
    characterId,
    fileName: file.name,
    album,
    url: mainDataUrl,
    thumbnailUrl: thumbDataUrl,
    fileSize: processed.processedBlob.size,
    dimensions: processed.dimensions,
    colorPalette,
    ...metadata
  };
  
  const savedImage = saveImage(imageData);
  
  // Sync to GitHub in background
  syncImageToGitHub(savedImage, processed.processedBlob);
  
  return savedImage;
}

// Upload from URL
export async function uploadFromUrl(url, characterId, album = 'digital', metadata = {}) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], url.split('/').pop() || 'image.jpg', { type: blob.type });
    
    return await uploadImage(file, characterId, album, metadata);
  } catch (error) {
    throw new Error(`Failed to upload from URL: ${error.message}`);
  }
}

// Upload from clipboard
export async function uploadFromClipboard(characterId, album = 'digital', metadata = {}) {
  try {
    const items = await navigator.clipboard.read();
    
    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type);
          const file = new File([blob], `clipboard-${Date.now()}.png`, { type });
          return await uploadImage(file, characterId, album, metadata);
        }
      }
    }
    
    throw new Error('No image found in clipboard');
  } catch (error) {
    throw new Error(`Failed to upload from clipboard: ${error.message}`);
  }
}

// Helper: Convert blob to data URL
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Sync image to GitHub
async function syncImageToGitHub(image, blob) {
  try {
    const path = image.getGitHubPath();
    
    // Convert blob to base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    // Upload to GitHub
    await syncToGitHub(path, base64, true); // true = binary file
    
    // Update image with GitHub URL
    const githubUrl = `https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/${path}`;
    updateImage(image.id, { url: githubUrl });
    
    console.log(`✓ Image synced to GitHub: ${path}`);
  } catch (error) {
    console.error('Failed to sync image to GitHub:', error);
    logActivity('github_sync_failed', {
      imageId: image.id,
      error: error.message
    });
  }
}

// Search images by tags
export function searchImagesByTags(characterId, tags) {
  const allImages = loadCharacterImages(characterId);
  
  return allImages.filter(img => {
    return tags.some(tag => img.tags.includes(tag));
  });
}

// Get all unique tags for a character
export function getCharacterTags(characterId) {
  const allImages = loadCharacterImages(characterId);
  const tagSet = new Set();
  
  allImages.forEach(img => {
    img.tags.forEach(tag => tagSet.add(tag));
  });
  
  return Array.from(tagSet).sort();
}

// Add tags to images
export function addTagsToImages(imageIds, tags) {
  const allImages = JSON.parse(localStorage.getItem('4k_images') || '{}');
  
  imageIds.forEach(id => {
    if (allImages[id]) {
      const existingTags = allImages[id].tags || [];
      allImages[id].tags = [...new Set([...existingTags, ...tags])];
      allImages[id].lastModified = new Date().toISOString();
    }
  });
  
  localStorage.setItem('4k_images', JSON.stringify(allImages));
  
  logActivity('tags_added', {
    imageIds,
    tags,
    count: imageIds.length
  });
}

// Remove tags from images
export function removeTagsFromImages(imageIds, tags) {
  const allImages = JSON.parse(localStorage.getItem('4k_images') || '{}');
  
  imageIds.forEach(id => {
    if (allImages[id]) {
      allImages[id].tags = allImages[id].tags.filter(tag => !tags.includes(tag));
      allImages[id].lastModified = new Date().toISOString();
    }
  });
  
  localStorage.setItem('4k_images', JSON.stringify(allImages));
  
  logActivity('tags_removed', {
    imageIds,
    tags,
    count: imageIds.length
  });
}

// Get storage statistics
export function getStorageStats() {
  const allImages = JSON.parse(localStorage.getItem('4k_images') || '{}');
  const images = Object.values(allImages);
  
  const stats = {
    totalImages: images.length,
    totalSize: images.reduce((sum, img) => sum + (img.fileSize || 0), 0),
    byAlbum: {
      digital: images.filter(img => img.album === 'digital').length,
      analog: images.filter(img => img.album === 'analog').length,
      'in-progress': images.filter(img => img.album === 'in-progress').length
    },
    byCharacter: {}
  };
  
  images.forEach(img => {
    if (!stats.byCharacter[img.characterId]) {
      stats.byCharacter[img.characterId] = {
        count: 0,
        size: 0
      };
    }
    stats.byCharacter[img.characterId].count++;
    stats.byCharacter[img.characterId].size += img.fileSize || 0;
  });
  
  return stats;
}

console.log('Image Manager initialized');