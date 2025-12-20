// character-data.js - Character data persistence with GitHub integration

class CharacterDataManager {
    constructor() {
        this.characters = [];
        this.dataFile = '/data/characters.js';
        this.githubSync = null;
    }

    // Initialize with GitHub sync
    async init(githubSync) {
        this.githubSync = githubSync;
        await this.loadCharacters();
    }

    // Load characters from GitHub
    async loadCharacters() {
        try {
            if (!this.githubSync) {
                console.warn('GitHub sync not initialized, loading from localStorage');
                const cached = localStorage.getItem('characters_cache');
                this.characters = cached ? JSON.parse(cached) : [];
                return this.characters;
            }

            // Fetch from GitHub
            const response = await this.githubSync.getFile(this.dataFile);
            
            if (response && response.content) {
                // Decode base64 content
                const content = atob(response.content);
                
                // Extract CHARACTERS object from the JS file
                // Expected format: export const CHARACTERS = { ... };
                const match = content.match(/export\s+const\s+CHARACTERS\s*=\s*(\{[\s\S]*?\});/);
                
                if (match && match[1]) {
                    const charactersObject = JSON.parse(match[1]);
                    // Convert object to array for internal use
                    this.characters = Object.values(charactersObject);
                } else {
                    console.warn('Could not parse characters.js, using empty array');
                    this.characters = [];
                }
            } else {
                console.warn('characters.js not found, starting with empty array');
                this.characters = [];
            }

            // Cache in localStorage
            localStorage.setItem('characters_cache', JSON.stringify(this.characters));
            
            return this.characters;
        } catch (error) {
            console.error('Error loading characters:', error);
            
            // Try to load from cache
            const cached = localStorage.getItem('characters_cache');
            this.characters = cached ? JSON.parse(cached) : [];
            
            return this.characters;
        }
    }

    // Save characters to GitHub
    async saveCharacters() {
        try {
            if (!this.githubSync) {
                console.warn('GitHub sync not initialized, saving to localStorage only');
                localStorage.setItem('characters_cache', JSON.stringify(this.characters));
                return { success: true, cached: true };
            }

            // Generate the JavaScript file content
            const fileContent = this.generateCharactersJS();

            // Get current file SHA (needed for updates)
            let sha = null;
            try {
                const currentFile = await this.githubSync.getFile(this.dataFile);
                if (currentFile && currentFile.sha) {
                    sha = currentFile.sha;
                }
            } catch (e) {
                // File doesn't exist yet, that's okay
                console.log('Creating new characters.js file');
            }

            // Save to GitHub
            const result = await this.githubSync.updateFile(
                this.dataFile,
                fileContent,
                `Update characters data - ${new Date().toISOString()}`,
                sha
            );

            // Cache in localStorage
            localStorage.setItem('characters_cache', JSON.stringify(this.characters));

            return { success: true, result };
        } catch (error) {
            console.error('Error saving characters:', error);
            
            // Save to localStorage as backup
            localStorage.setItem('characters_cache', JSON.stringify(this.characters));
            
            throw error;
        }
    }

    // Generate the characters.js file content
    generateCharactersJS() {
        // Convert array to object with character names as keys
        const charactersObject = {};
        this.characters.forEach(char => {
            const key = char.name || char.id;
            charactersObject[key] = char;
        });
        
        // Format as proper JavaScript export matching live site format
        const entries = Object.entries(charactersObject);
        let output = '// data/characters.js\nexport const CHARACTERS = {\n';
        
        entries.forEach(([key, char], index) => {
            // Add character entry with name as key
            output += `  "${key}": {\n`;
            
            // Add all character properties with proper indentation
            Object.entries(char).forEach(([prop, value]) => {
                if (value === undefined || value === null) return;
                
                // Format value based on type
                let formattedValue;
                if (typeof value === 'string') {
                    formattedValue = `"${value}"`;
                } else if (Array.isArray(value)) {
                    formattedValue = JSON.stringify(value);
                } else if (typeof value === 'object') {
                    formattedValue = JSON.stringify(value);
                } else {
                    formattedValue = value;
                }
                
                output += `    ${prop}: ${formattedValue},\n`;
            });
            
            // Remove trailing comma from last property
            output = output.slice(0, -2) + '\n';
            
            // Close character object
            output += '  }';
            
            // Add comma and spacing between characters
            if (index < entries.length - 1) {
                output += ',\n\n';
            } else {
                output += '\n';
            }
        });
        
        output += '};';
        
        return output;
    }

    // Get all characters
    getAll() {
        return this.characters;
    }

    // Get character by ID
    getById(id) {
        return this.characters.find(c => c.id === id);
    }

    // Get characters by template type
    getByTemplate(template) {
        return this.characters.filter(c => c.template === template);
    }

    // Get characters by category
    getByCategory(category) {
        return this.characters.filter(c => c.category === category);
    }

    // Create new character
    async createCharacter(characterData) {
        // Validate required fields
        if (!characterData.id || !characterData.name || !characterData.template) {
            throw new Error('Missing required fields: id, name, template');
        }

        // Check for duplicate ID
        if (this.getById(characterData.id)) {
            throw new Error(`Character with ID "${characterData.id}" already exists`);
        }

        // Add timestamps
        const newCharacter = {
            ...characterData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add to array
        this.characters.push(newCharacter);

        // Save to GitHub
        await this.saveCharacters();

        return newCharacter;
    }

    // Update existing character
    async updateCharacter(id, updates) {
        const index = this.characters.findIndex(c => c.id === id);
        
        if (index === -1) {
            throw new Error(`Character with ID "${id}" not found`);
        }

        // Update character
        this.characters[index] = {
            ...this.characters[index],
            ...updates,
            id: this.characters[index].id, // Prevent ID changes
            createdAt: this.characters[index].createdAt, // Preserve creation date
            updatedAt: new Date().toISOString()
        };

        // Save to GitHub
        await this.saveCharacters();

        return this.characters[index];
    }

    // Delete character
    async deleteCharacter(id) {
        const index = this.characters.findIndex(c => c.id === id);
        
        if (index === -1) {
            throw new Error(`Character with ID "${id}" not found`);
        }

        // Remove character
        const deleted = this.characters.splice(index, 1)[0];

        // Save to GitHub
        await this.saveCharacters();

        return deleted;
    }

    // Bulk operations
    async bulkUpdate(updates) {
        const results = [];
        
        for (const update of updates) {
            try {
                const result = await this.updateCharacter(update.id, update.data);
                results.push({ success: true, id: update.id, character: result });
            } catch (error) {
                results.push({ success: false, id: update.id, error: error.message });
            }
        }

        return results;
    }

    // Export characters as JSON
    exportJSON() {
        return JSON.stringify(this.characters, null, 2);
    }

    // Import characters from JSON
    async importJSON(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            
            if (!Array.isArray(imported)) {
                throw new Error('Invalid format: expected array of characters');
            }

            // Validate each character has required fields
            for (const char of imported) {
                if (!char.id || !char.name || !char.template) {
                    throw new Error('Invalid character data: missing required fields');
                }
            }

            // Merge with existing characters (avoid duplicates)
            const existingIds = new Set(this.characters.map(c => c.id));
            const newCharacters = imported.filter(c => !existingIds.has(c.id));

            this.characters.push(...newCharacters);

            // Save to GitHub
            await this.saveCharacters();

            return {
                success: true,
                imported: newCharacters.length,
                skipped: imported.length - newCharacters.length
            };
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }

    // Get statistics
    getStats() {
        return {
            total: this.characters.length,
            byTemplate: {
                dandy: this.characters.filter(c => c.template === 'dandy').length,
                passport: this.characters.filter(c => c.template === 'passport').length,
                classic: this.characters.filter(c => c.template === 'classic').length
            },
            byCategory: this.characters.reduce((acc, char) => {
                const cat = char.category || 'uncategorized';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {}),
            recentlyUpdated: this.characters
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 5)
                .map(c => ({ id: c.id, name: c.name, updatedAt: c.updatedAt }))
        };
    }

    // Search characters
    search(query) {
        const lowerQuery = query.toLowerCase();
        
        return this.characters.filter(char => {
            // Search in name
            if (char.name.toLowerCase().includes(lowerQuery)) return true;
            
            // Search in template-specific data
            if (char.template === 'dandy' && char.dandy) {
                if (char.dandy.ability1?.toLowerCase().includes(lowerQuery)) return true;
                if (char.dandy.ability2?.toLowerCase().includes(lowerQuery)) return true;
            }
            
            if (char.template === 'passport' && char.passport) {
                if (char.passport.bio?.toLowerCase().includes(lowerQuery)) return true;
                if (char.passport.major?.toLowerCase().includes(lowerQuery)) return true;
            }
            
            if (char.template === 'classic' && char.classic) {
                if (char.classic.bio?.toLowerCase().includes(lowerQuery)) return true;
            }
            
            return false;
        });
    }
}

// Create singleton instance
const characterDataManager = new CharacterDataManager();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = characterDataManager;
}