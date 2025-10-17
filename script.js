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
        this.updateBrushPreview();
        this.updateLayersPanel();
        this.renderCanvas();
    }

    setupCanvas() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    createDefaultLayers() {
        // Background layer
        const bgLayer = new Layer(this.canvas.width, this.canvas.height, 'Background');
        bgLayer.ctx.fillStyle = 'white';
        bgLayer.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        bgLayer.saveState();
        this.layers.push(bgLayer);
        
        // Drawing layer
        const drawLayer = new Layer(this.canvas.width, this.canvas.height, 'Layer 1');
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
                        this.saveProject();
                        break;
                }
            }
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
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            const radius = Math.min(centerX, centerY);
            
            if (distance <= radius) {
                const hue = ((angle * 180 / Math.PI) + 360) % 360;
                const saturation = Math.min(distance / radius * 100, 100);
                const lightness = 50;
                
                const color = this.hslToHex(hue, saturation, lightness);
                this.setColor(color);
                
                // Update picker position
                this.colorPicker.style.left = x + 'px';
                this.colorPicker.style.top = y + 'px';
            }
        });
        
        // Set initial picker position
        this.colorPicker.style.left = '90px';
        this.colorPicker.style.top = '90px';
    }

    setupColorSwatches() {
        const swatchesContainer = document.getElementById('colorSwatches');
        const commonColors = [
            '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
            '#FF00FF', '#00FFFF', '#800000', '#008000', '#000080', '#808000',
            '#800080', '#008080', '#C0C0C0', '#808080', '#FFC0CB', '#FFB6C1',
            '#FF69B4', '#FF1493', '#DC143C', '#B22222', '#8B0000', '#FF6347',
            '#FF7F50', '#FF4500', '#FF8C00', '#FFA500', '#FFD700', '#9ACD32'
        ];

        commonColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.title = color;
            swatch.addEventListener('click', () => this.setColor(color));
            swatchesContainer.appendChild(swatch);
        });
    }

    setColor(color) {
        if (!this.isValidHex(color)) return;
        
        this.currentColor = color;
        document.getElementById('currentColor').style.backgroundColor = color;
        document.getElementById('hexInput').value = color;
        this.updateBrushPreview();
    }

    isValidHex(color) {
        return /^#[0-9A-F]{6}$/i.test(color);
    }

    hslToHex(h, s, l) {
        h = h / 360;
        s = s / 100;
        l = l / 100;
        
        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h * 12) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    getMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    startDrawing(e) {
        if (this.layers.length === 0) return;
        
        this.isDrawing = true;
        const pos = this.getMousePosition(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        // Save state for undo
        this.getActiveLayer().saveState();
    }

    draw(e) {
        if (!this.isDrawing || this.layers.length === 0) return;
        
        const pos = this.getMousePosition(e);
        const layer = this.getActiveLayer();
        const ctx = layer.ctx;
        
        ctx.save();
        ctx.globalAlpha = this.currentOpacity;
        
        // Different brush types
        switch (this.currentTool) {
            case 'round':
                this.drawRoundBrush(ctx, pos);
                break;
            case 'square':
                this.drawSquareBrush(ctx, pos);
                break;
            case 'spray':
                this.drawSprayBrush(ctx, pos);
                break;
            case 'marker':
                this.drawMarker(ctx, pos);
                break;
            case 'pencil':
                this.drawPencil(ctx, pos);
                break;
            case 'eraser':
                this.drawEraser(ctx, pos);
                break;
        }
        
        ctx.restore();
        
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        this.renderCanvas();
    }

    drawRoundBrush(ctx, pos) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = this.currentColor;
        ctx.lineWidth = this.currentSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    drawSquareBrush(ctx, pos) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = this.currentColor;
        ctx.fillRect(pos.x - this.currentSize/2, pos.y - this.currentSize/2, this.currentSize, this.currentSize);
    }

    drawSprayBrush(ctx, pos) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = this.currentColor;
        
        const density = 20;
        for (let i = 0; i < density; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.currentSize;
            const x = pos.x + Math.cos(angle) * distance;
            const y = pos.y + Math.sin(angle) * distance;
            
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 2 + 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawMarker(ctx, pos) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = this.currentColor;
        ctx.lineWidth = this.currentSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha *= 0.7;
        
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    drawPencil(ctx, pos) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = this.currentColor;
        ctx.lineWidth = Math.max(1, this.currentSize * 0.5);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha *= 0.8;
        
        // Add some texture
        const jitter = 0.5;
        const jitterX = (Math.random() - 0.5) * jitter;
        const jitterY = (Math.random() - 0.5) * jitter;
        
        ctx.beginPath();
        ctx.moveTo(this.lastX + jitterX, this.lastY + jitterY);
        ctx.lineTo(pos.x + jitterX, pos.y + jitterY);
        ctx.stroke();
    }

    drawEraser(ctx, pos) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = this.currentSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    updateBrushPreview() {
        const canvas = document.getElementById('brushPreview');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw preview stroke
        ctx.save();
        ctx.globalAlpha = this.currentOpacity;
        ctx.strokeStyle = this.currentColor;
        ctx.fillStyle = this.currentColor;
        ctx.lineWidth = this.currentSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const centerY = canvas.height / 2;
        const startX = 20;
        const endX = canvas.width - 20;
        
        switch (this.currentTool) {
            case 'round':
            case 'marker':
            case 'pencil':
                ctx.beginPath();
                ctx.moveTo(startX, centerY);
                ctx.lineTo(endX, centerY);
                ctx.stroke();
                break;
            case 'square':
                for (let x = startX; x < endX; x += this.currentSize + 2) {
                    ctx.fillRect(x - this.currentSize/2, centerY - this.currentSize/2, this.currentSize, this.currentSize);
                }
                break;
            case 'spray':
                for (let x = startX; x < endX; x += 8) {
                    for (let i = 0; i < 10; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = Math.random() * this.currentSize;
                        const px = x + Math.cos(angle) * distance;
                        const py = centerY + Math.sin(angle) * distance;
                        ctx.beginPath();
                        ctx.arc(px, py, 1, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                break;
            case 'eraser':
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.moveTo(startX, centerY);
                ctx.lineTo(endX, centerY);
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }

    getActiveLayer() {
        return this.layers[this.activeLayerIndex];
    }

    addLayer(name = null) {
        const layerName = name || `Layer ${this.layers.length}`;
        const newLayer = new Layer(this.canvas.width, this.canvas.height, layerName);
        this.layers.push(newLayer);
        this.activeLayerIndex = this.layers.length - 1;
        this.updateLayersPanel();
    }

    duplicateLayer() {
        if (this.layers.length === 0) return;
        
        const activeLayer = this.getActiveLayer();
        const newLayer = new Layer(this.canvas.width, this.canvas.height, activeLayer.name + ' Copy');
        newLayer.ctx.drawImage(activeLayer.canvas, 0, 0);
        newLayer.saveState();
        
        this.layers.splice(this.activeLayerIndex + 1, 0, newLayer);
        this.activeLayerIndex = this.activeLayerIndex + 1;
        this.updateLayersPanel();
    }

    deleteLayer() {
        if (this.layers.length <= 1) return;
        
        this.layers.splice(this.activeLayerIndex, 1);
        this.activeLayerIndex = Math.min(this.activeLayerIndex, this.layers.length - 1);
        this.updateLayersPanel();
        this.renderCanvas();
    }

    setActiveLayer(index) {
        if (index >= 0 && index < this.layers.length) {
            this.activeLayerIndex = index;
            this.updateLayersPanel();
        }
    }

    toggleLayerVisibility(index) {
        if (index >= 0 && index < this.layers.length) {
            this.layers[index].visible = !this.layers[index].visible;
            this.updateLayersPanel();
            this.renderCanvas();
        }
    }

    setLayerOpacity(index, opacity) {
        if (index >= 0 && index < this.layers.length) {
            this.layers[index].opacity = opacity;
            this.renderCanvas();
        }
    }

    updateLayersPanel() {
        const layersList = document.getElementById('layersList');
        layersList.innerHTML = '';
        
        // Render layers in reverse order (top to bottom)
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            const layerDiv = document.createElement('div');
            layerDiv.className = 'layer-item';
            if (i === this.activeLayerIndex) {
                layerDiv.classList.add('active');
            }
            
            layerDiv.innerHTML = `
                <input type="checkbox" class="layer-visibility" ${layer.visible ? 'checked' : ''}>
                <input type="text" class="layer-name" value="${layer.name}">
                <input type="range" class="layer-opacity" min="0" max="100" value="${Math.round(layer.opacity * 100)}">
            `;
            
            // Event listeners
            const visibilityCheckbox = layerDiv.querySelector('.layer-visibility');
            const nameInput = layerDiv.querySelector('.layer-name');
            const opacitySlider = layerDiv.querySelector('.layer-opacity');
            
            visibilityCheckbox.addEventListener('change', () => {
                this.toggleLayerVisibility(i);
            });
            
            nameInput.addEventListener('change', () => {
                layer.name = nameInput.value;
            });
            
            opacitySlider.addEventListener('input', () => {
                this.setLayerOpacity(i, opacitySlider.value / 100);
            });
            
            layerDiv.addEventListener('click', (e) => {
                if (e.target === layerDiv) {
                    this.setActiveLayer(i);
                }
            });
            
            layersList.appendChild(layerDiv);
        }
    }

    renderCanvas() {
        // Clear the display canvas
        this.ctx.save();
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render all visible layers
        for (const layer of this.layers) {
            if (layer.visible) {
                this.ctx.globalAlpha = layer.opacity;
                this.ctx.drawImage(layer.canvas, 0, 0);
            }
        }
        
        this.ctx.restore();
    }

    clearActiveLayer() {
        if (this.layers.length > 0) {
            this.getActiveLayer().clear();
            this.renderCanvas();
        }
    }

    clearAllLayers() {
        this.layers.forEach(layer => {
            if (layer.name !== 'Background') {
                layer.clear();
            }
        });
        this.renderCanvas();
    }

    undoLastStroke() {
        if (this.layers.length > 0) {
            const layer = this.getActiveLayer();
            if (layer.undo()) {
                this.renderCanvas();
            }
        }
    }

    redoLastStroke() {
        if (this.layers.length > 0) {
            const layer = this.getActiveLayer();
            if (layer.redo()) {
                this.renderCanvas();
            }
        }
    }

    handleImageUpload(e) {
        const files = e.target.files;
        this.handleFiles(files);
    }

    handleFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                this.loadImageToLayer(file);
            }
        }
    }

    loadImageToLayer(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Create new layer for the image
                const layerName = `Image: ${file.name.substring(0, 15)}`;
                this.addLayer(layerName);
                
                const layer = this.getActiveLayer();
                const ctx = layer.ctx;
                
                // Calculate scaling to fit the image in the canvas
                const scale = Math.min(
                    this.canvas.width / img.width,
                    this.canvas.height / img.height
                );
                
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const x = (this.canvas.width - scaledWidth) / 2;
                const y = (this.canvas.height - scaledHeight) / 2;
                
                ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
                layer.saveState();
                this.renderCanvas();
                this.updateLayersPanel();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    saveAsImage() {
        // Create a temporary canvas to flatten all layers
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // White background
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Render all visible layers
        for (const layer of this.layers) {
            if (layer.visible) {
                tempCtx.globalAlpha = layer.opacity;
                tempCtx.drawImage(layer.canvas, 0, 0);
            }
        }
        
        // Download
        const link = document.createElement('a');
        link.download = `artwork-${new Date().getTime()}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    }

    saveProject() {
        const projectData = {
            version: '1.0',
            width: this.canvas.width,
            height: this.canvas.height,
            activeLayerIndex: this.activeLayerIndex,
            layers: this.layers.map(layer => ({
                id: layer.id,
                name: layer.name,
                visible: layer.visible,
                opacity: layer.opacity,
                imageData: layer.canvas.toDataURL('image/png')
            }))
        };
        
        const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `project-${new Date().getTime()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const projectData = JSON.parse(e.target.result);
                        this.loadProjectData(projectData);
                    } catch (error) {
                        alert('Error loading project: Invalid file format');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    async loadProjectData(projectData) {
        // Clear current layers
        this.layers = [];
        
        // Recreate layers
        for (const layerData of projectData.layers) {
            const layer = new Layer(projectData.width || this.canvas.width, projectData.height || this.canvas.height, layerData.name);
            layer.id = layerData.id;
            layer.visible = layerData.visible;
            layer.opacity = layerData.opacity;
            
            // Load image data
            if (layerData.imageData) {
                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = () => {
                        layer.ctx.drawImage(img, 0, 0);
                        layer.saveState();
                        resolve();
                    };
                    img.onerror = () => resolve(); // Skip broken images
                    img.src = layerData.imageData;
                });
            }
            
            this.layers.push(layer);
        }
        
        this.activeLayerIndex = Math.min(projectData.activeLayerIndex || 0, this.layers.length - 1);
        this.updateLayersPanel();
        this.renderCanvas();
        
        alert('Project loaded successfully!');
    }
}

// Initialize the app when page loads
let drawingApp;

document.addEventListener('DOMContentLoaded', () => {
    drawingApp = new DrawingApp();
    
    // Set initial color display
    document.getElementById('currentColor').style.backgroundColor = '#000000';
});