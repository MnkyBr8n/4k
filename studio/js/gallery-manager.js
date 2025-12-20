// gallery-manager.js - Album management, reordering, and batch operations

import { 
  loadImagesByAlbum, 
  updateImage, 
  deleteImage,
  batchDeleteImages,
  batchMoveImages,
  reorderImages,
  toggleCarousel,
  setPortraitImage,
  addTagsToImages,
  removeTagsFromImages,
  getCharacterTags
} from './image-manager.js';

import { logActivity } from './image-logger.js';

// Gallery state
let currentCharacterId = null;
let currentAlbum = 'digital';
let selectedImages = new Set();
let draggedElement = null;
let touchStartY = 0;

// Initialize gallery for a character
export function initGallery(characterId, album = 'digital') {
  currentCharacterId = characterId;
  currentAlbum = album;
  selectedImages.clear();
  renderGallery();
}

// Render gallery grid
export function renderGallery() {
  const images = loadImagesByAlbum(currentCharacterId, currentAlbum);
  const container = document.getElementById('galleryGrid');
  
  if (!container) {
    console.error('Gallery container not found');
    return;
  }
  
  container.innerHTML = '';
  
  if (images.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🖼️</div>
        <p>No images in this album</p>
        <button onclick="window.location.href='image-uploader.html'" class="btn-primary">
          Upload Images
        </button>
      </div>
    `;
    return;
  }
  
  images.forEach((image, index) => {
    const item = createGalleryItem(image, index);
    container.appendChild(item);
  });
  
  updateBatchControls();
}

// Create a gallery item element
function createGalleryItem(image, index) {
  const item = document.createElement('div');
  item.className = 'gallery-item';
  item.dataset.imageId = image.id;
  item.dataset.index = index;
  item.draggable = true;
  
  const isSelected = selectedImages.has(image.id);
  if (isSelected) {
    item.classList.add('selected');
  }
  
  // Build badges
  let badges = '';
  if (image.isPortrait) {
    badges += '<span class="badge badge-portrait" title="Portrait">👤</span>';
  }
  if (image.isCarousel) {
    badges += '<span class="badge badge-carousel" title="In Carousel">🎠</span>';
  }
  
  // Build tags
  let tagsHtml = '';
  if (image.tags && image.tags.length > 0) {
    tagsHtml = image.tags.slice(0, 3).map(tag => 
      `<span class="tag">${tag}</span>`
    ).join('');
    if (image.tags.length > 3) {
      tagsHtml += `<span class="tag">+${image.tags.length - 3}</span>`;
    }
  }
  
  item.innerHTML = `
    <div class="select-overlay" onclick="toggleImageSelection('${image.id}')">
      <div class="select-checkbox">
        <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation()">
      </div>
    </div>
    
    <div class="drag-handle" title="Drag to reorder">
      <span>☰</span>
    </div>
    
    <img src="${image.thumbnailUrl || image.url}" 
         alt="${image.altText || image.fileName}"
         class="gallery-image"
         onclick="openImageModal('${image.id}')"
         loading="lazy">
    
    <div class="gallery-info">
      <div class="gallery-badges">${badges}</div>
      <div class="gallery-name" title="${image.fileName}">${image.fileName}</div>
      ${image.caption ? `<div class="gallery-caption">${image.caption}</div>` : ''}
      <div class="gallery-tags">${tagsHtml}</div>
      <div class="gallery-meta">
        ${formatFileSize(image.fileSize)}
        ${image.dimensions ? ` • ${image.dimensions.width}×${image.dimensions.height}` : ''}
      </div>
    </div>
    
    <div class="gallery-actions">
      <button onclick="quickEdit('${image.id}')" title="Quick Edit">
        ✏️
      </button>
      <button onclick="toggleCarouselQuick('${image.id}')" title="Toggle Carousel">
        🎠
      </button>
      <button onclick="setAsPortrait('${image.id}')" title="Set as Portrait">
        👤
      </button>
      <button onclick="deleteImageQuick('${image.id}')" title="Delete" class="danger">
        🗑️
      </button>
    </div>
  `;
  
  // Add drag and drop listeners
  item.addEventListener('dragstart', handleDragStart);
  item.addEventListener('dragover', handleDragOver);
  item.addEventListener('drop', handleDrop);
  item.addEventListener('dragend', handleDragEnd);
  
  // Touch events for mobile
  item.addEventListener('touchstart', handleTouchStart);
  item.addEventListener('touchmove', handleTouchMove);
  item.addEventListener('touchend', handleTouchEnd);
  
  return item;
}

// Toggle image selection
window.toggleImageSelection = function(imageId) {
  if (selectedImages.has(imageId)) {
    selectedImages.delete(imageId);
  } else {
    selectedImages.add(imageId);
  }
  renderGallery();
};

// Select all images
export function selectAll() {
  const images = loadImagesByAlbum(currentCharacterId, currentAlbum);
  images.forEach(img => selectedImages.add(img.id));
  renderGallery();
}

// Deselect all images
export function deselectAll() {
  selectedImages.clear();
  renderGallery();
}

// Update batch controls visibility
function updateBatchControls() {
  const controls = document.getElementById('batchControls');
  const count = document.getElementById('selectedCount');
  
  if (!controls) return;
  
  if (selectedImages.size > 0) {
    controls.style.display = 'flex';
    if (count) count.textContent = selectedImages.size;
  } else {
    controls.style.display = 'none';
  }
}

// Batch delete selected images
export function batchDelete() {
  if (selectedImages.size === 0) return;
  
  const count = selectedImages.size;
  if (!confirm(`Delete ${count} image${count > 1 ? 's' : ''}? This cannot be undone.`)) {
    return;
  }
  
  const result = batchDeleteImages(Array.from(selectedImages));
  
  if (result.success.length > 0) {
    showNotification(`Deleted ${result.success.length} images`, 'success');
    selectedImages.clear();
    renderGallery();
  }
  
  if (result.failed.length > 0) {
    showNotification(`Failed to delete ${result.failed.length} images`, 'error');
  }
}

// Batch move selected images
export function batchMove(targetAlbum) {
  if (selectedImages.size === 0) return;
  
  const result = batchMoveImages(Array.from(selectedImages), targetAlbum);
  
  if (result.success.length > 0) {
    showNotification(`Moved ${result.success.length} images to ${targetAlbum}`, 'success');
    selectedImages.clear();
    renderGallery();
  }
  
  if (result.failed.length > 0) {
    showNotification(`Failed to move ${result.failed.length} images`, 'error');
  }
}

// Batch add tags
export function batchAddTags() {
  if (selectedImages.size === 0) return;
  
  const tags = prompt('Enter tags (comma-separated):');
  if (!tags) return;
  
  const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
  
  addTagsToImages(Array.from(selectedImages), tagArray);
  showNotification(`Added tags to ${selectedImages.size} images`, 'success');
  renderGallery();
}

// Batch remove tags
export function batchRemoveTags() {
  if (selectedImages.size === 0) return;
  
  const allTags = getCharacterTags(currentCharacterId);
  
  // Show tag selection dialog (simplified for now)
  const tags = prompt(`Enter tags to remove (comma-separated):\n\nAvailable tags: ${allTags.join(', ')}`);
  if (!tags) return;
  
  const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
  
  removeTagsFromImages(Array.from(selectedImages), tagArray);
  showNotification(`Removed tags from ${selectedImages.size} images`, 'success');
  renderGallery();
}

// Download selected images as ZIP
export async function downloadSelectedAsZip() {
  if (selectedImages.size === 0) return;
  
  showNotification('Preparing download... (not yet implemented)', 'info');
  // TODO: Implement ZIP download using JSZip library
}

// Drag and drop handlers
function handleDragStart(e) {
  draggedElement = e.target.closest('.gallery-item');
  if (!draggedElement) return;
  
  draggedElement.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', draggedElement.innerHTML);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const target = e.target.closest('.gallery-item');
  if (!target || target === draggedElement) return;
  
  const container = document.getElementById('galleryGrid');
  const allItems = [...container.querySelectorAll('.gallery-item')];
  const draggedIndex = allItems.indexOf(draggedElement);
  const targetIndex = allItems.indexOf(target);
  
  if (draggedIndex < targetIndex) {
    target.parentNode.insertBefore(draggedElement, target.nextSibling);
  } else {
    target.parentNode.insertBefore(draggedElement, target);
  }
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
  }
  
  // Get new order
  const container = document.getElementById('galleryGrid');
  const items = [...container.querySelectorAll('.gallery-item')];
  const newOrder = items.map(item => item.dataset.imageId);
  
  // Save new order
  reorderImages(newOrder);
  showNotification('Order saved', 'success');
}

function handleDragEnd(e) {
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
  }
  draggedElement = null;
}

// Touch handlers for mobile drag-to-reorder
function handleTouchStart(e) {
  const item = e.target.closest('.gallery-item');
  if (!item) return;
  
  const handle = e.target.closest('.drag-handle');
  if (!handle) return;
  
  draggedElement = item;
  touchStartY = e.touches[0].clientY;
  item.classList.add('dragging');
}

function handleTouchMove(e) {
  if (!draggedElement) return;
  e.preventDefault();
  
  const touchY = e.touches[0].clientY;
  const deltaY = touchY - touchStartY;
  
  draggedElement.style.transform = `translateY(${deltaY}px)`;
  
  // Find nearest item to swap with
  const container = document.getElementById('galleryGrid');
  const items = [...container.querySelectorAll('.gallery-item')];
  const draggedRect = draggedElement.getBoundingClientRect();
  
  items.forEach(item => {
    if (item === draggedElement) return;
    
    const rect = item.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    
    if (draggedRect.top < midpoint && draggedRect.bottom > midpoint) {
      const draggedIndex = items.indexOf(draggedElement);
      const targetIndex = items.indexOf(item);
      
      if (draggedIndex < targetIndex) {
        item.parentNode.insertBefore(draggedElement, item.nextSibling);
      } else {
        item.parentNode.insertBefore(draggedElement, item);
      }
    }
  });
}

function handleTouchEnd(e) {
  if (!draggedElement) return;
  
  draggedElement.style.transform = '';
  draggedElement.classList.remove('dragging');
  
  // Save new order
  const container = document.getElementById('galleryGrid');
  const items = [...container.querySelectorAll('.gallery-item')];
  const newOrder = items.map(item => item.dataset.imageId);
  
  reorderImages(newOrder);
  showNotification('Order saved', 'success');
  
  draggedElement = null;
}

// Quick actions
window.toggleCarouselQuick = function(imageId) {
  try {
    const isCarousel = toggleCarousel(imageId, currentCharacterId);
    showNotification(isCarousel ? 'Added to carousel' : 'Removed from carousel', 'success');
    renderGallery();
  } catch (error) {
    showNotification(error.message, 'error');
  }
};

window.setAsPortrait = function(imageId) {
  setPortraitImage(currentCharacterId, imageId);
  showNotification('Portrait updated', 'success');
  renderGallery();
};

window.deleteImageQuick = function(imageId) {
  if (!confirm('Delete this image? This cannot be undone.')) {
    return;
  }
  
  deleteImage(imageId);
  showNotification('Image deleted', 'success');
  renderGallery();
};

window.quickEdit = function(imageId) {
  openEditModal(imageId);
};

// Open image in modal
window.openImageModal = function(imageId) {
  const images = loadImagesByAlbum(currentCharacterId, currentAlbum);
  const image = images.find(img => img.id === imageId);
  
  if (!image) return;
  
  // Create modal (simplified - full implementation would be more complex)
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
    <div class="modal-content">
      <button class="modal-close" onclick="this.closest('.image-modal').remove()">×</button>
      <img src="${image.url}" alt="${image.altText || image.fileName}">
      <div class="modal-info">
        <h3>${image.fileName}</h3>
        ${image.caption ? `<p>${image.caption}</p>` : ''}
        <div class="modal-meta">
          ${image.dimensions ? `${image.dimensions.width}×${image.dimensions.height} • ` : ''}
          ${formatFileSize(image.fileSize)}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
};

// Open edit modal
function openEditModal(imageId) {
  // Redirect to dedicated edit page or open inline editor
  window.location.href = `image-edit.html?id=${imageId}&character=${currentCharacterId}`;
}

// Switch album view
export function switchAlbum(album) {
  currentAlbum = album;
  selectedImages.clear();
  renderGallery();
  
  // Update active tab
  document.querySelectorAll('.album-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-album="${album}"]`)?.classList.add('active');
}

// Filter by tags
export function filterByTags(tags) {
  // Implementation would filter displayed images
  console.log('Filter by tags:', tags);
}

// Sort images
export function sortImages(sortBy) {
  const images = loadImagesByAlbum(currentCharacterId, currentAlbum);
  
  switch(sortBy) {
    case 'name':
      images.sort((a, b) => a.fileName.localeCompare(b.fileName));
      break;
    case 'date':
      images.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
      break;
    case 'size':
      images.sort((a, b) => b.fileSize - a.fileSize);
      break;
  }
  
  renderGallery();
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Helper: Format file size
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// Export functions for global use
window.galleryManager = {
  initGallery,
  renderGallery,
  selectAll,
  deselectAll,
  batchDelete,
  batchMove,
  batchAddTags,
  batchRemoveTags,
  downloadSelectedAsZip,
  switchAlbum,
  filterByTags,
  sortImages
};

console.log('Gallery Manager initialized');
