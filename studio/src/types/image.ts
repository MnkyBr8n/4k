// Image types for 4K Studio

export type AlbumType = 'digital' | 'analog' | 'in-progress';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CharacterImage {
  id: string;
  characterId: string;
  fileName: string;
  album: AlbumType;
  url: string;
  thumbnailUrl?: string;
  caption: string;
  altText: string;
  tags: string[];
  fileSize: number;
  dimensions: ImageDimensions;
  colorPalette: string[];
  isPortrait: boolean;
  isCarousel: boolean;
  carouselOrder: number;
  uploadDate: string;
  lastModified: string;
}

export interface HeroBackground {
  id: string;
  filename: string;
  url: string;
  createdAt: string;
}

// Image upload configuration
export const IMAGE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxImageWidth: 2000,
  thumbnailSize: 300,
  supportedFormats: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'],
  albums: ['digital', 'analog', 'in-progress'] as const,
  maxCarouselImages: 5,
};

// Validation result for file uploads
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

// Processed image result
export interface ProcessedImage {
  originalFile: File;
  processedBlob: Blob;
  thumbnailBlob: Blob;
  dimensions: ImageDimensions;
  originalDimensions: ImageDimensions;
}

// Batch operation results
export interface BatchOperationResult {
  success: string[];
  failed: { id: string; error: string }[];
}

// Image storage stats
export interface ImageStorageStats {
  totalImages: number;
  totalSize: number;
  byAlbum: Record<AlbumType, number>;
  byCharacter: Record<string, { count: number; size: number }>;
}

// Generate unique image ID
export function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Validate file before upload
export function validateImageFile(file: File): FileValidationResult {
  const errors: string[] = [];

  if (!IMAGE_CONFIG.supportedFormats.includes(file.type)) {
    errors.push(`Unsupported format: ${file.type}. Supported: PNG, JPG, WebP, GIF, SVG`);
  }

  if (file.size > IMAGE_CONFIG.maxFileSize) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    const maxMB = IMAGE_CONFIG.maxFileSize / 1024 / 1024;
    errors.push(`File too large: ${sizeMB}MB. Max: ${maxMB}MB`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
