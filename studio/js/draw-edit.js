/**
 * 4K Studio Draw Editor
 * Main drawing application with CMS integration
 */

// Layer class to manage individual layers
class Layer {
  constructor(width, height, name = "Layer") {
    this.id = Date.now() + Math.random();
    this.name = name;
    this.visible = true;
    this.opacity = 1.0;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    this.undoStack = [];
    this.redoStack = [];
    
    // Initialize transparent
    this.ctx.clearRect(0, 0, width, height);
    this.saveState();
  }

  saveState() {
    try {
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.undoStack.push(imageData);
      if (this.undoStack.length > 30) {
        this.undoStack.shift();
      }
      this.redoStack = [];
    } catch (e) {
      console.log('Could not save state');
    }
  }

  undo() {
    if (this.undoStack.length <= 1) return false;
    
    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState);
    
    const previousState = this.undoStack[this.undoStack.length - 1];
    this.ctx.putImageData(previousState, 0, 0);
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    
    const state = this.redoStack.pop();
    this.undoStack.push(state);
    this.ctx.putImageData(state, 0, 0);
    return true;
  }

  clear() {
    this.saveState();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

// Main Drawing App
class DrawingApp {
  constructor() {
    this.canvas = document.getElementById('drawingCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.layers = [];
    this.activeLayerIndex = 0;
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.currentColor = '#000000';
    this.currentOpacity = 1;
    this.currentSize = 5;
    this.currentTool = 'round';
    
    this.init();
  }

  init() {
    this.setupCanvas();
    this.createDefaultLayers();
    this.setupEventListeners();
    this.setupColorWheel();
    this.setupColorSwatches();
    this.setupCanvasPresets();
    this.updateBrushPreview();
    this.updateLayersPanel();
    this.renderCanvas();
  }

  setupCanvas() {
    // Set display size
    const rect = this.canvas.getBoundingClientRect();
    
    // Set actual size in memory
    this.canvas.width = this.canvas.width * this.dpr;
    this.canvas.height = this.canvas.height * this.dpr;
    
    // Scale context
    this.ctx.scale(this.dpr, this.dpr);
    
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  setupCanvasPresets() {
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const width = parseInt(btn.dataset.width);
        const height = parseInt(btn.dataset.height);
        this.resizeCanvas(width, height);
        
        // Update active state
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  resizeCanvas(width, height) {
    if (confirm('Resizing will clear your current drawing. Continue?')) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.layers = [];
      this.createDefaultLayers();
      this.updateLayersPanel();
      this.renderCanvas();
    }
  }

  createDefaultLayers() {
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    
    // Background layer
    const bgLayer = new Layer(w, h, 'Background');
    bgLayer.ctx.fillStyle = 'white';
    bgLayer.ctx.fillRect(0, 0, w, h);
    bgLayer.saveState();
    this.layers.push(bgLayer);
    
    // Drawing layer
    const drawLayer = new Layer(w, h, 'Layer 1');
    this.layers.push(drawLayer);
    this.activeLayerIndex = 1;
  }

  setupEventListeners() {
    // Canvas drawing events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      this.canvas.dispatchEvent(mouseEvent);
    });

    // Control events
    document.getElementById('brushSize').addEventListener('input', (e) => {
      this.currentSize = parseInt(e.target.value);
      document.getElementById('sizeDisplay').textContent = e.target.value + 'px';
      this.updateBrushPreview();
    });

    document.getElementById('brushOpacity').addEventListener('input', (e) => {
      this.currentOpacity = e.target.value / 100;
      document.getElementById('opacityDisplay').textContent = e.target.value + '%';
      this.updateBrushPreview();
    });

    document.getElementById('brushType').addEventListener('change', (e) => {
      this.currentTool = e.target.value;
      this.updateBrushPreview();
    });

    // Hex input
    document.getElementById('hexInput').addEventListener('input', (e) => {
      const color = e.target.value;
      if (this.isValidHex(color)) {
        this.setColor(color);
      }
    });

    // Image upload
    document.getElementById('imageUpload').addEventListener('change', (e) => {
      this.handleImageUpload(e);
    });

    // Drag and drop
    this.setupDragAndDrop();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              this.redoLastStroke();
            } else {
              this.undoLastStroke();
            }
            break;
          case 'y':
            e.preventDefault();
            this.redoLastStroke();
            break;
          case 's':
            e.preventDefault();
            openSaveDialog();
            break;
        }
      }
    });

    // Save type radio buttons
    document.querySelectorAll('input[name="saveType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const characterOptions = document.getElementById('characterOptions');
        if (e.target.value === 'character') {
          characterOptions.classList.add('active');
          populateCharacterSelect('characterSelect');
        } else {
          characterOptions.classList.remove('active');
        }
        
        // Update filename suggestion
        updateFilenameSuggestion(e.target.value);
      });
    });

    // Load type radio buttons
    document.querySelectorAll('input[name="loadType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const loadCharacterOptions = document.getElementById('loadCharacterOptions');
        if (e.target.value === 'character') {
          loadCharacterOptions.classList.add('active');
          populateCharacterSelect('loadCharacterSelect');
        } else {
          loadCharacterOptions.classList.remove('active');
        }
        updateImageList(e.target.value);
      });
    });
  }

  setupDragAndDrop() {
    const uploadArea = document.querySelector('.upload-area');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => {
        uploadArea.classList.remove('dragover');
      });
    });

    uploadArea.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      this.handleFiles(files);
    });
  }

  setupColorWheel() {
    this.colorWheel = document.getElementById('colorWheel');
    this.colorPicker = document.getElementById('colorPicker');
    
    this.colorWheel.addEventListener('click', (e) => {
      const rect = this.colorWheel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const angle = Math.atan2(y - centerY, x - centerX);
      const hue = (angle * 180 / Math.PI + 360) % 360;
      
      const color = `hsl(${hue}, 100%, 50%)`;
      this.setColor(this.hslToHex(hue, 100, 50));
      
      // Update picker position
      const radius = rect.width / 2;
      const pickerX = centerX + Math.cos(angle) * radius * 0.85;
      const pickerY = centerY + Math.sin(angle) * radius * 0.85;
      this.colorPicker.style.left = pickerX + 'px';
      this.colorPicker.style.top = pickerY + 'px';
    });
  }

  setupColorSwatches() {
    const swatches = [
      '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
      '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#800000',
      '#808080', '#C0C0C0', '#FF69B4', '#4B0082', '#20B2AA', '#F4A460'
    ];
    
    const container = document.getElementById('colorSwatches');
    swatches.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = color;
      swatch.addEventListener('click', () => this.setColor(color));
      container.appendChild(swatch);
    });
  }

  setColor(color) {
    this.currentColor = color;
    document.getElementById('currentColor').style.backgroundColor = color;
    document.getElementById('hexInput').value = color;
    this.updateBrushPreview();
  }
  
  isValidHex(color) {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    
    const toHex = (n) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  updateBrushPreview() {
    const previewCanvas = document.getElementById('brushPreviewCanvas');
    const ctx = previewCanvas.getContext('2d');
    
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    ctx.globalAlpha = this.currentOpacity;
    ctx.fillStyle = this.currentColor;
    
    const x = previewCanvas.width / 2;
    const y = previewCanvas.height / 2;
    
    if (this.currentTool === 'round') {
      ctx.beginPath();
      ctx.arc(x, y, this.currentSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.currentTool === 'square') {
      ctx.fillRect(x - this.currentSize / 2, y - this.currentSize / 2, this.currentSize, this.currentSize);
    } else if (this.currentTool === 'spray') {
      for (let i = 0; i < 50; i++) {
        const offsetX = (Math.random() - 0.5) * this.currentSize;
        const offsetY = (Math.random() - 0.5) * this.currentSize;
        ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
      }
    }
    
    ctx.globalAlpha = 1;
  }

  getActiveLayer() {
    return this.layers[this.activeLayerIndex];
  }

  isBackgroundActive() {
    return this.layers[this.activeLayerIndex]?.name === 'Background';
  }

  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.lastX = (e.clientX - rect.left) * (this.canvas.width / this.dpr / rect.width);
    this.lastY = (e.clientY - rect.top) * (this.canvas.height / this.dpr / rect.height);
  }

  draw(e) {
    if (!this.isDrawing || !this.layers.length) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / this.dpr / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / this.dpr / rect.height);
    
    const layer = this.getActiveLayer();
    const ctx = layer.ctx;
    
    ctx.globalAlpha = this.currentOpacity;
    ctx.strokeStyle = this.currentColor;
    ctx.fillStyle = this.currentColor;
    ctx.lineWidth = this.currentSize;
    
    if (this.currentTool === 'spray') {
      for (let i = 0; i < 10; i++) {
        const offsetX = (Math.random() - 0.5) * this.currentSize;
        const offsetY = (Math.random() - 0.5) * this.currentSize;
        ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(this.lastX, this.lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    this.lastX = x;
    this.lastY = y;
    this.renderCanvas();
  }

  stopDrawing() {
    if (this.isDrawing && this.layers.length) {
      this.getActiveLayer().saveState();
      this.isDrawing = false;
    }
  }

  addLayer(name) {
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    const layerName = name || `Layer ${this.layers.length}`;
    const newLayer = new Layer(w, h, layerName);
    this.layers.push(newLayer);
    this.activeLayerIndex = this.layers.length - 1;
    this.updateLayersPanel();
    this.renderCanvas();
  }

  deleteActiveLayer() {
    if (this.layers.length <= 1) {
      alert('Cannot delete the last layer');
      return;
    }
    
    if (this.isBackgroundActive()) {
      alert('Cannot delete the Background layer');
      return;
    }
    
    if (confirm('Delete this layer?')) {
      this.layers.splice(this.activeLayerIndex, 1);
      this.activeLayerIndex = Math.min(this.activeLayerIndex, this.layers.length - 1);
      this.updateLayersPanel();
      this.renderCanvas();
    }
  }

  mergeDown() {
    if (this.activeLayerIndex === 0) {
      alert('Cannot merge down the bottom layer');
      return;
    }
    
    const topLayer = this.layers[this.activeLayerIndex];
    const bottomLayer = this.layers[this.activeLayerIndex - 1];
    
    bottomLayer.ctx.globalAlpha = topLayer.opacity;
    bottomLayer.ctx.drawImage(topLayer.canvas, 0, 0);
    bottomLayer.saveState();
    
    this.layers.splice(this.activeLayerIndex, 1);
    this.activeLayerIndex--;
    this.updateLayersPanel();
    this.renderCanvas();
  }

  setActiveLayer(index) {
    this.activeLayerIndex = index;
    this.updateLayersPanel();
  }

  toggleLayerVisibility(index) {
    this.layers[index].visible = !this.layers[index].visible;
    this.updateLayersPanel();
    this.renderCanvas();
  }

  setLayerOpacity(index, opacity) {
    this.layers[index].opacity = opacity;
    this.renderCanvas();
  }

  updateLayersPanel() {
    const layersList = document.getElementById('layersList');
    layersList.innerHTML = '';

    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      const row = document.createElement('div');
      row.className = 'layer-item' + (i === this.activeLayerIndex ? ' active' : '');

      row.innerHTML = `
        <input type="checkbox" class="layer-visibility" ${layer.visible ? 'checked' : ''} aria-label="Toggle visibility">
        <input type="text" class="layer-name" value="${layer.name}">
        <input type="range" class="layer-opacity" min="0" max="100" value="${Math.round(layer.opacity * 100)}" aria-label="Layer opacity">
      `;

      const vis = row.querySelector('.layer-visibility');
      const name = row.querySelector('.layer-name');
      const op = row.querySelector('.layer-opacity');

      [vis, name, op].forEach(el => el.addEventListener('click', e => e.stopPropagation()));

      vis.addEventListener('change', () => this.toggleLayerVisibility(i));
      name.addEventListener('change', () => { layer.name = name.value; });
      op.addEventListener('input', () => this.setLayerOpacity(i, op.value / 100));

      row.addEventListener('click', () => this.setActiveLayer(i));
      layersList.appendChild(row);
    }
  }

  renderCanvas() {
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;

    this.ctx.save();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, w, h);

    for (const layer of this.layers) {
      if (layer.visible) {
        this.ctx.globalAlpha = layer.opacity;
        this.ctx.drawImage(layer.canvas, 0, 0);
      }
    }
    this.ctx.restore();
  }

  clearActiveLayer() {
    if (!this.layers.length) return;
    if (this.isBackgroundActive()) return;
    this.getActiveLayer().clear();
    this.renderCanvas();
  }

  undoLastStroke() {
    if (!this.layers.length) return;
    const layer = this.getActiveLayer();
    if (layer.undo()) this.renderCanvas();
  }

  redoLastStroke() {
    if (!this.layers.length) return;
    const layer = this.getActiveLayer();
    if (layer.redo()) this.renderCanvas();
  }

  handleImageUpload(e) {
    this.handleFiles(e.target.files);
  }

  handleFiles(files) {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) this.loadImageToLayer(file);
    });
  }

  loadImageToLayer(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const layerName = `Image: ${file.name.substring(0, 15)}`;
        this.addLayer(layerName);
        const layer = this.getActiveLayer();
        const ctx = layer.ctx;
        const cw = this.canvas.width / this.dpr;
        const ch = this.canvas.height / this.dpr;
        const scale = Math.min(cw / img.width, ch / img.height);
        const sw = img.width * scale;
        const sh = img.height * scale;
        const x = (cw - sw) / 2;
        const y = (ch - sh) / 2;
        ctx.drawImage(img, x, y, sw, sh);
        layer.saveState();
        this.renderCanvas();
        this.updateLayersPanel();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  saveAsImage() {
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    const temp = document.createElement('canvas');
    temp.width = w;
    temp.height = h;
    const tctx = temp.getContext('2d');

    tctx.fillStyle = 'white';
    tctx.fillRect(0, 0, w, h);
    for (const layer of this.layers) {
      if (layer.visible) {
        tctx.globalAlpha = layer.opacity;
        tctx.drawImage(layer.canvas, 0, 0);
      }
    }
    const link = document.createElement('a');
    link.download = `artwork-${Date.now()}.png`;
    link.href = temp.toDataURL('image/png');
    link.click();
  }

  getCanvasDataURL() {
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    const temp = document.createElement('canvas');
    temp.width = w;
    temp.height = h;
    const tctx = temp.getContext('2d');

    tctx.fillStyle = 'white';
    tctx.fillRect(0, 0, w, h);
    for (const layer of this.layers) {
      if (layer.visible) {
        tctx.globalAlpha = layer.opacity;
        tctx.drawImage(layer.canvas, 0, 0);
      }
    }
    return temp.toDataURL('image/png');
  }

  loadFromDataURL(dataURL) {
    const img = new Image();
    img.onload = () => {
      // Clear current layers
      this.layers = [];
      
      // Resize canvas to match image
      this.canvas.width = img.width;
      this.canvas.height = img.height;
      
      // Create background with the image
      const w = this.canvas.width / this.dpr;
      const h = this.canvas.height / this.dpr;
      const bgLayer = new Layer(w, h, 'Background');
      bgLayer.ctx.drawImage(img, 0, 0);
      bgLayer.saveState();
      this.layers.push(bgLayer);
      
      // Add empty drawing layer
      const drawLayer = new Layer(w, h, 'Layer 1');
      this.layers.push(drawLayer);
      this.activeLayerIndex = 1;
      
      this.updateLayersPanel();
      this.renderCanvas();
    };
    img.src = dataURL;
  }
}


// UI Helper Functions
function openSaveDialog() {
  const modal = document.getElementById('saveModal');
  modal.classList.add('active');
  
  // Reset to hero background by default
  document.getElementById('saveHero').checked = true;
  document.getElementById('characterOptions').classList.remove('active');
  
  // Generate suggested filename
  updateFilenameSuggestion('hero');
}

function closeSaveDialog() {
  const modal = document.getElementById('saveModal');
  modal.classList.remove('active');
}

function openLoadDialog() {
  const modal = document.getElementById('loadModal');
  modal.classList.add('active');
  
  // Reset to hero backgrounds by default
  document.getElementById('loadHero').checked = true;
  document.getElementById('loadCharacterOptions').classList.remove('active');
  
  // Load hero backgrounds list
  updateImageList('hero');
}

function closeLoadDialog() {
  const modal = document.getElementById('loadModal');
  modal.classList.remove('active');
}

function updateFilenameSuggestion(type) {
  const filenameInput = document.getElementById('filenameInput');
  const characterSelect = document.getElementById('characterSelect');
  
  let characterName = null;
  if (type === 'character' && characterSelect.value) {
    const characters = JSON.parse(localStorage.getItem('4k_characters') || '{}');
    const character = characters[characterSelect.value];
    if (character) {
      characterName = character.name;
    }
  }
  
  const suggestedName = studioDrawIntegration.generateFilename(type, characterName);
  filenameInput.value = suggestedName;
}

function populateCharacterSelect(selectId) {
  const select = document.getElementById(selectId);
  const characters = studioDrawIntegration.getAllCharacters();
  
  select.innerHTML = '<option value="">Select character...</option>';
  characters.forEach(char => {
    const option = document.createElement('option');
    option.value = char.id;
    option.textContent = char.name;
    select.appendChild(option);
  });
}

function updateImageList(type) {
  const imageList = document.getElementById('imageList');
  imageList.innerHTML = '';
  
  if (type === 'hero') {
    const heroBackgrounds = studioDrawIntegration.getAllHeroBackgrounds();
    if (heroBackgrounds.length === 0) {
      imageList.innerHTML = '<option value="">No hero backgrounds found</option>';
      return;
    }
    
    heroBackgrounds.forEach(bg => {
      const option = document.createElement('option');
      option.value = bg.id;
      option.textContent = bg.filename;
      imageList.appendChild(option);
    });
  } else if (type === 'character') {
    const characterSelect = document.getElementById('loadCharacterSelect');
    if (!characterSelect.value) {
      imageList.innerHTML = '<option value="">Select a character first</option>';
      return;
    }
    
    const images = studioDrawIntegration.getCharacterImages(characterSelect.value);
    if (images.length === 0) {
      imageList.innerHTML = '<option value="">No images found for this character</option>';
      return;
    }
    
    images.forEach(img => {
      const option = document.createElement('option');
      option.value = img.id;
      option.textContent = `${img.filename} (${img.album})`;
      imageList.appendChild(option);
    });
  }
}

function saveToStudio() {
  const saveType = document.querySelector('input[name="saveType"]:checked').value;
  const filenameInput = document.getElementById('filenameInput');
  
  // Validate filename
  const validation = studioDrawIntegration.validateFilename(filenameInput.value);
  if (!validation.valid) {
    showNotification(validation.error, 'error');
    return;
  }
  
  const filename = validation.filename;
  const canvasData = drawingApp.getCanvasDataURL();
  
  let result;
  
  if (saveType === 'hero') {
    result = studioDrawIntegration.saveToHeroBackgrounds(canvasData, filename);
  } else if (saveType === 'character') {
    const characterId = document.getElementById('characterSelect').value;
    const album = document.getElementById('albumSelect').value;
    
    if (!characterId) {
      showNotification('Please select a character', 'error');
      return;
    }
    
    result = studioDrawIntegration.saveToCharacterFolder(characterId, album, canvasData, filename);
  } else {
    // Just download
    drawingApp.saveAsImage();
    closeSaveDialog();
    return;
  }
  
  if (result.success) {
    showNotification(result.message, 'success');
    closeSaveDialog();
  } else {
    showNotification('Error: ' + result.error, 'error');
  }
}

function loadFromStudio() {
  const imageList = document.getElementById('imageList');
  const selectedImageId = imageList.value;
  
  if (!selectedImageId) {
    showNotification('Please select an image', 'error');
    return;
  }
  
  const result = studioDrawIntegration.loadImageForEditing(selectedImageId);
  
  if (result.success) {
    drawingApp.loadFromDataURL(result.imageData);
    showNotification('Image loaded successfully', 'success');
    closeLoadDialog();
  } else {
    showNotification('Error: ' + result.error, 'error');
  }
}

function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = 'notification ' + type + ' active';
  
  setTimeout(() => {
    notification.classList.remove('active');
  }, 3000);
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = 'login.html';
  }
}

// Initialize the app
let drawingApp;
document.addEventListener('DOMContentLoaded', () => {
  drawingApp = new DrawingApp();
  document.getElementById('currentColor').style.backgroundColor = '#000000';
  
  // Update character select when load character option changes
  document.getElementById('loadCharacterSelect').addEventListener('change', () => {
    updateImageList('character');
  });
});