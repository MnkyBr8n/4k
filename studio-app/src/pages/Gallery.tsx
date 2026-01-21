import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, EmptyState } from '../components/layout';
import { Card, Button, Badge, Modal, ConfirmDialog, useNotification } from '../components/ui';
import {
  getCharacter,
  getCharacters,
  getImagesByAlbum,
  deleteImage,
  batchDeleteImages,
  saveImage,
  setPortraitImage,
  reorderImages,
  logActivity,
} from '../services/storage';
import {
  formatFileSize,
  validateImageFile,
  generateImageId,
  type CharacterImage,
  type AlbumType,
  type Character,
} from '../types';

const ALBUMS: { value: AlbumType; label: string }[] = [
  { value: 'digital', label: 'Digital' },
  { value: 'analog', label: 'Analog' },
  { value: 'in-progress', label: 'In Progress' },
];

export function Gallery() {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [currentAlbum, setCurrentAlbum] = useState<AlbumType>('digital');
  const [images, setImages] = useState<CharacterImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [viewImage, setViewImage] = useState<CharacterImage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CharacterImage | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load characters on mount
  useEffect(() => {
    const chars = getCharacters();
    setCharacters(chars);

    if (characterId) {
      const char = getCharacter(characterId);
      if (char) {
        setSelectedCharacter(char);
      }
    } else if (chars.length > 0) {
      setSelectedCharacter(chars[0]);
    }
  }, [characterId]);

  // Load images when character or album changes
  useEffect(() => {
    if (selectedCharacter) {
      const imgs = getImagesByAlbum(selectedCharacter.id, currentAlbum);
      setImages(imgs);
      setSelectedImages(new Set());
    }
  }, [selectedCharacter, currentAlbum]);

  const refreshImages = useCallback(() => {
    if (selectedCharacter) {
      setImages(getImagesByAlbum(selectedCharacter.id, currentAlbum));
    }
  }, [selectedCharacter, currentAlbum]);

  // Selection handlers
  const toggleSelection = (imageId: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImages(newSelection);
  };

  const selectAll = () => {
    setSelectedImages(new Set(images.map(img => img.id)));
  };

  const deselectAll = () => {
    setSelectedImages(new Set());
  };

  // Delete handlers
  const handleDeleteSingle = () => {
    if (deleteTarget) {
      deleteImage(deleteTarget.id);
      refreshImages();
      setDeleteTarget(null);
      showNotification('success', 'Image deleted');
    }
  };

  const handleBatchDelete = () => {
    if (selectedImages.size === 0) return;
    if (!confirm(`Delete ${selectedImages.size} image(s)?`)) return;

    batchDeleteImages(Array.from(selectedImages));
    refreshImages();
    setSelectedImages(new Set());
    showNotification('success', `Deleted ${selectedImages.size} images`);
  };

  // Set as portrait
  const handleSetPortrait = (imageId: string) => {
    if (selectedCharacter) {
      setPortraitImage(selectedCharacter.id, imageId);
      refreshImages();
      showNotification('success', 'Portrait updated');
    }
  };

  // Upload handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedCharacter) return;

    for (const file of Array.from(files)) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        showNotification('error', validation.errors[0]);
        continue;
      }

      // Read file and create image
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const image: CharacterImage = {
          id: generateImageId(),
          characterId: selectedCharacter.id,
          fileName: file.name,
          album: currentAlbum,
          url: dataUrl,
          thumbnailUrl: dataUrl,
          caption: '',
          altText: file.name,
          tags: [],
          fileSize: file.size,
          dimensions: { width: 0, height: 0 },
          colorPalette: [],
          isPortrait: false,
          isCarousel: false,
          carouselOrder: images.length,
          uploadDate: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };
        saveImage(image);
        logActivity('image_uploaded', `Uploaded: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }

    setTimeout(refreshImages, 100);
    setShowUploadModal(false);
    showNotification('success', 'Images uploaded');
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    setDraggedId(imageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const newImages = [...images];
    const draggedIndex = newImages.findIndex(img => img.id === draggedId);
    const targetIndex = newImages.findIndex(img => img.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [removed] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, removed);

    reorderImages(newImages.map(img => img.id));
    setImages(newImages);
    setDraggedId(null);
    showNotification('success', 'Order saved');
  };

  return (
    <div>
      <PageHeader
        title="Gallery"
        subtitle={selectedCharacter ? `${selectedCharacter.name} - ${images.length} images` : 'Select a character'}
        icon="🖼️"
        action={
          selectedCharacter && (
            <Button variant="primary" onClick={() => setShowUploadModal(true)}>
              📤 Upload Images
            </Button>
          )
        }
      />

      {/* Character selector */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Character:</span>
          <div className="flex gap-2 flex-wrap">
            {characters.map(char => (
              <button
                key={char.id}
                onClick={() => setSelectedCharacter(char)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  selectedCharacter?.id === char.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-dark-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-border'
                }`}
              >
                {char.name}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {selectedCharacter ? (
        <>
          {/* Album tabs */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              {ALBUMS.map(album => (
                <button
                  key={album.value}
                  onClick={() => setCurrentAlbum(album.value)}
                  className={`px-4 py-2 text-sm rounded-t border-b-2 transition-colors ${
                    currentAlbum === album.value
                      ? 'border-primary text-primary bg-white dark:bg-dark-panel'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {album.label}
                </button>
              ))}
            </div>

            {/* Batch controls */}
            <div className="flex items-center gap-2">
              {images.length > 0 && selectedImages.size === 0 && (
                <Button variant="secondary" size="sm" onClick={selectAll}>
                  Select All
                </Button>
              )}
              {selectedImages.size > 0 && (
                <>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedImages.size} selected
                  </span>
                  <Button variant="secondary" size="sm" onClick={deselectAll}>
                    Deselect
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleBatchDelete}>
                    Delete Selected
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Gallery grid */}
          {images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map(image => (
                <GalleryItem
                  key={image.id}
                  image={image}
                  isSelected={selectedImages.has(image.id)}
                  isDragging={draggedId === image.id}
                  onSelect={() => toggleSelection(image.id)}
                  onClick={() => setViewImage(image)}
                  onDelete={() => setDeleteTarget(image)}
                  onSetPortrait={() => handleSetPortrait(image.id)}
                  onDragStart={(e) => handleDragStart(e, image.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, image.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🖼️"
              title="No images in this album"
              description="Upload some images to get started"
              action={
                <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                  Upload Images
                </Button>
              }
            />
          )}
        </>
      ) : (
        <EmptyState
          icon="👤"
          title="No character selected"
          description="Create a character to start managing their gallery"
          action={
            <Button variant="primary" onClick={() => navigate('/characters/new')}>
              Create Character
            </Button>
          }
        />
      )}

      {/* Image viewer modal */}
      <Modal
        isOpen={!!viewImage}
        onClose={() => setViewImage(null)}
        title={viewImage?.fileName}
        size="xl"
      >
        {viewImage && (
          <div className="text-center">
            <img
              src={viewImage.url}
              alt={viewImage.altText || viewImage.fileName}
              className="max-w-full max-h-[60vh] mx-auto rounded"
            />
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {viewImage.dimensions.width > 0 && (
                <span>{viewImage.dimensions.width}×{viewImage.dimensions.height} • </span>
              )}
              {formatFileSize(viewImage.fileSize)}
            </div>
            {viewImage.caption && (
              <p className="mt-2 text-gray-700 dark:text-gray-300">{viewImage.caption}</p>
            )}
          </div>
        )}
      </Modal>

      {/* Upload modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Images"
        size="md"
      >
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="text-4xl mb-4 block">📤</span>
            <p className="text-gray-700 dark:text-gray-300">
              Click to select files or drag and drop
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              PNG, JPG, WebP, GIF • Max 10MB each
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSingle}
        title="Delete Image"
        message={`Are you sure you want to delete "${deleteTarget?.fileName}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

// Gallery item component
interface GalleryItemProps {
  image: CharacterImage;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onClick: () => void;
  onDelete: () => void;
  onSetPortrait: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

function GalleryItem({
  image,
  isSelected,
  isDragging,
  onSelect,
  onClick,
  onDelete,
  onSetPortrait,
  onDragStart,
  onDragOver,
  onDrop,
}: GalleryItemProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        relative group rounded-lg overflow-hidden border-2 transition-all cursor-grab
        ${isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}
        ${isDragging ? 'opacity-50' : ''}
        hover:border-primary/50
      `}
    >
      {/* Selection checkbox */}
      <div
        className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            isSelected
              ? 'bg-primary border-primary text-white'
              : 'bg-white/80 border-gray-400'
          }`}
        >
          {isSelected && '✓'}
        </div>
      </div>

      {/* Badges */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {image.isPortrait && (
          <Badge variant="info" className="text-xs">👤</Badge>
        )}
        {image.isCarousel && (
          <Badge variant="success" className="text-xs">🎠</Badge>
        )}
      </div>

      {/* Image */}
      <div
        className="aspect-square bg-gray-100 dark:bg-dark-tertiary"
        onClick={onClick}
      >
        <img
          src={image.thumbnailUrl || image.url}
          alt={image.altText || image.fileName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="p-2 bg-white dark:bg-dark-panel">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {image.fileName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(image.fileSize)}
        </p>
      </div>

      {/* Actions (on hover) */}
      <div className="absolute bottom-12 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex justify-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onSetPortrait(); }}
            className="p-1.5 bg-white/90 rounded hover:bg-white transition-colors"
            title="Set as portrait"
          >
            👤
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 bg-white/90 rounded hover:bg-white transition-colors text-error"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
