// Character types for 4K Studio

export type TemplateType = 'dandy' | 'passport' | 'classic';

export type CategoryType = 'ocs' | 'commissions' | 'fanart' | 'progress';

// Dandy template stats (game character style)
export interface DandyStats {
  health: number; // 1-10 hearts
  strength: number; // 1-5 stars
  speed: number; // 1-5 stars
  intelligence: number; // 1-5 stars
  charisma: number; // 1-5 stars
}

export interface DandyData {
  abilities: string;
  aboutLong: string;
  stats: DandyStats;
}

// Passport template data (university ID style)
export interface PassportData {
  role: string;
  university: string;
  faculty: string;
  nationality: string;
  placeOfBirth: string;
  dateOfBirth: string;
  motto: string;
  bio: string;
}

// Classic template data (simple bio card)
export interface ClassicData {
  dateOfBirth: string;
  placeOfBirth: string;
  bio: string;
}

// Base character interface
export interface Character {
  id: string;
  name: string;
  age?: number;
  template: TemplateType;
  category: CategoryType;
  aboutQuick: string;

  // Template-specific data
  dandy?: DandyData;
  passport?: PassportData;
  classic?: ClassicData;

  // Page & links
  pageLink: string;
  website?: string;

  // Portrait
  portraitUrl?: string;
  showInHero: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Form data for character creation wizard
export interface CharacterFormData {
  // Step 1: Template
  template: TemplateType;

  // Step 2: Basic info
  name: string;
  age?: number;
  category: CategoryType;
  aboutQuick: string;

  // Step 3: Template details
  dandy?: DandyData;
  passport?: PassportData;
  classic?: ClassicData;
  pageLink: string;
  website?: string;

  // Step 4: Portrait
  portraitFile?: File;
  portraitUrl?: string;
  showInHero: boolean;
}

// Default stats for Dandy template
export const DEFAULT_DANDY_STATS: DandyStats = {
  health: 5,
  strength: 3,
  speed: 3,
  intelligence: 3,
  charisma: 3,
};

// Default form data
export const DEFAULT_CHARACTER_FORM: CharacterFormData = {
  template: 'classic',
  name: '',
  category: 'ocs',
  aboutQuick: '',
  pageLink: '',
  showInHero: false,
};

// Generate unique character ID
export function generateCharacterId(): string {
  return `char_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
