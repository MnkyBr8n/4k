import { useState, useEffect, useRef, useCallback } from 'react';
import { PageHeader } from '../components/layout';
import { Card, Button, Modal } from '../components/ui';
import {
  createLayer,
  isValidHex,
  COLOR_SWATCHES,
  CANVAS_PRESETS,
  DRAWING_CONFIG,
  type Layer,
  type BrushType,
} from '../types';

export function DrawEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Brush settings
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [brushType, setBrushType] = useState<BrushType>('round');

  // Canvas size
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);

  // Modals
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  // Initialize canvas and layers
  useEffect(() => {
    if (layers.length === 0) {
      const bgLayer = createLayer(canvasWidth, canvasHeight, 'Background');
      const ctx = bgLayer.canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      const drawLayer = createLayer(canvasWidth, canvasHeight, 'Layer 1');

      setLayers([bgLayer, drawLayer]);
      setActiveLayerIndex(1);
    }
  }, [canvasWidth, canvasHeight, layers.length]);

  // Render all layers to main canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and fill with white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw each visible layer
    layers.forEach(layer => {
      if (layer.visible) {
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(layer.canvas, 0, 0);
      }
    });

    ctx.globalAlpha = 1;
  }, [layers, canvasWidth, canvasHeight]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Get active layer
  const getActiveLayer = () => layers[activeLayerIndex];

  // Save layer state for undo
  const saveLayerState = (layer: Layer) => {
    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
    layer.undoStack.push(imageData);

    if (layer.undoStack.length > DRAWING_CONFIG.maxUndoSteps) {
      layer.undoStack.shift();
    }

    layer.redoStack = [];
  };

  // Drawing handlers
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCanvasPos(e);
    setIsDrawing(true);
    setLastPos(pos);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || layers.length === 0) return;

    const layer = getActiveLayer();
    if (!layer || layer.name === 'Background') return;

    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e);

    ctx.globalAlpha = brushOpacity / 100;
    ctx.strokeStyle = brushColor;
    ctx.fillStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (brushType === 'spray') {
      // Spray paint effect
      for (let i = 0; i < 10; i++) {
        const offsetX = (Math.random() - 0.5) * brushSize;
        const offsetY = (Math.random() - 0.5) * brushSize;
        ctx.fillRect(pos.x + offsetX, pos.y + offsetY, 1, 1);
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    setLastPos(pos);
    renderCanvas();
  };

  const stopDrawing = () => {
    if (isDrawing && layers.length > 0) {
      const layer = getActiveLayer();
      if (layer) {
        saveLayerState(layer);
      }
    }
    setIsDrawing(false);
  };

  // Undo/Redo
  const undo = () => {
    const layer = getActiveLayer();
    if (!layer || layer.undoStack.length <= 1) return;

    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    const currentState = layer.undoStack.pop()!;
    layer.redoStack.push(currentState);

    const previousState = layer.undoStack[layer.undoStack.length - 1];
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
    }

    setLayers([...layers]);
    renderCanvas();
  };

  const redo = () => {
    const layer = getActiveLayer();
    if (!layer || layer.redoStack.length === 0) return;

    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    const state = layer.redoStack.pop()!;
    layer.undoStack.push(state);
    ctx.putImageData(state, 0, 0);

    setLayers([...layers]);
    renderCanvas();
  };

  // Layer management
  const addLayer = () => {
    const newLayer = createLayer(canvasWidth, canvasHeight, `Layer ${layers.length}`);
    setLayers([...layers, newLayer]);
    setActiveLayerIndex(layers.length);
  };

  const deleteLayer = (index: number) => {
    if (layers.length <= 1 || layers[index].name === 'Background') return;
    if (!confirm('Delete this layer?')) return;

    const newLayers = layers.filter((_, i) => i !== index);
    setLayers(newLayers);
    setActiveLayerIndex(Math.min(activeLayerIndex, newLayers.length - 1));
  };

  const toggleLayerVisibility = (index: number) => {
    const newLayers = [...layers];
    newLayers[index].visible = !newLayers[index].visible;
    setLayers(newLayers);
    renderCanvas();
  };

  const setLayerOpacity = (index: number, opacity: number) => {
    const newLayers = [...layers];
    newLayers[index].opacity = opacity;
    setLayers(newLayers);
    renderCanvas();
  };

  // Clear active layer
  const clearLayer = () => {
    const layer = getActiveLayer();
    if (!layer || layer.name === 'Background') return;

    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return;

    saveLayerState(layer);
    ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    renderCanvas();
  };

  // Save as image
  const saveAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `artwork-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Resize canvas
  const resizeCanvas = (width: number, height: number) => {
    if (!confirm('Resizing will clear your drawing. Continue?')) return;

    setCanvasWidth(width);
    setCanvasHeight(height);
    setLayers([]);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            setShowSaveModal(true);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [layers, activeLayerIndex]);

  return (
    <div className="h-[calc(100vh-120px)]">
      <PageHeader
        title="Draw Editor"
        icon="🎨"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowLoadModal(true)}>
              📂 Load
            </Button>
            <Button variant="primary" onClick={() => setShowSaveModal(true)}>
              💾 Save
            </Button>
          </div>
        }
      />

      <div className="flex gap-4 h-[calc(100%-80px)]">
        {/* Left sidebar - Tools */}
        <Card className="w-64 flex-shrink-0 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Brush</h3>

          {/* Brush type */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 dark:text-gray-400">Type</label>
            <select
              value={brushType}
              onChange={(e) => setBrushType(e.target.value as BrushType)}
              className="input mt-1"
            >
              <option value="round">Round</option>
              <option value="square">Square</option>
              <option value="spray">Spray</option>
            </select>
          </div>

          {/* Brush size */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Size: {brushSize}px
            </label>
            <input
              type="range"
              min={DRAWING_CONFIG.minBrushSize}
              max={DRAWING_CONFIG.maxBrushSize}
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full mt-1"
            />
          </div>

          {/* Brush opacity */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Opacity: {brushOpacity}%
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={brushOpacity}
              onChange={(e) => setBrushOpacity(parseInt(e.target.value))}
              className="w-full mt-1"
            />
          </div>

          {/* Color */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 dark:text-gray-400">Color</label>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-8 h-8 rounded border border-gray-300 dark:border-dark-border"
                style={{ backgroundColor: brushColor }}
              />
              <input
                type="text"
                value={brushColor}
                onChange={(e) => {
                  if (isValidHex(e.target.value)) {
                    setBrushColor(e.target.value);
                  }
                }}
                className="input flex-1"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Color swatches */}
          <div className="grid grid-cols-6 gap-1 mb-4">
            {COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                onClick={() => setBrushColor(color)}
                className={`w-6 h-6 rounded border ${
                  brushColor === color
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-gray-300 dark:border-dark-border'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 dark:border-dark-border pt-4 mt-4">
            <div className="flex gap-2 mb-2">
              <Button variant="secondary" size="sm" onClick={undo} className="flex-1">
                ↩ Undo
              </Button>
              <Button variant="secondary" size="sm" onClick={redo} className="flex-1">
                ↪ Redo
              </Button>
            </div>
            <Button variant="secondary" size="sm" onClick={clearLayer} className="w-full">
              🗑️ Clear Layer
            </Button>
          </div>

          {/* Canvas presets */}
          <div className="border-t border-gray-200 dark:border-dark-border pt-4 mt-4">
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
              Canvas Size
            </label>
            <div className="flex flex-wrap gap-1">
              {CANVAS_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => resizeCanvas(preset.width, preset.height)}
                  className={`px-2 py-1 text-xs rounded ${
                    canvasWidth === preset.width && canvasHeight === preset.height
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-dark-tertiary'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-dark-tertiary rounded-lg flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="bg-white shadow-lg cursor-crosshair"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        </div>

        {/* Right sidebar - Layers */}
        <Card className="w-64 flex-shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Layers</h3>
            <Button variant="secondary" size="sm" onClick={addLayer}>
              + Add
            </Button>
          </div>

          <div className="space-y-2">
            {[...layers].reverse().map((layer, reversedIndex) => {
              const index = layers.length - 1 - reversedIndex;
              return (
                <div
                  key={layer.id}
                  onClick={() => setActiveLayerIndex(index)}
                  className={`p-2 rounded border transition-colors cursor-pointer ${
                    index === activeLayerIndex
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-dark-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(index); }}
                      className={`text-sm ${layer.visible ? '' : 'opacity-30'}`}
                    >
                      👁️
                    </button>
                    <span className="flex-1 text-sm truncate">{layer.name}</span>
                    {layer.name !== 'Background' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteLayer(index); }}
                        className="text-error text-sm opacity-50 hover:opacity-100"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={layer.opacity * 100}
                    onChange={(e) => setLayerOpacity(index, parseInt(e.target.value) / 100)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full mt-2"
                  />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Save modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save Artwork"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => { saveAsImage(); setShowSaveModal(false); }}>
              Download PNG
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Save your artwork as a PNG image file.
        </p>
      </Modal>

      {/* Load modal */}
      <Modal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        title="Load Image"
        size="sm"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Load an image to edit. This will replace your current canvas.
        </p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                  // Create new layers with image
                  const bgLayer = createLayer(img.width, img.height, 'Background');
                  const ctx = bgLayer.canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(img, 0, 0);
                  }
                  const drawLayer = createLayer(img.width, img.height, 'Layer 1');

                  setCanvasWidth(img.width);
                  setCanvasHeight(img.height);
                  setLayers([bgLayer, drawLayer]);
                  setActiveLayerIndex(1);
                  setShowLoadModal(false);
                };
                img.src = event.target?.result as string;
              };
              reader.readAsDataURL(file);
            }
          }}
          className="block w-full text-sm"
        />
      </Modal>
    </div>
  );
}
