// character-forms.js - Template-specific form handling

// Template field definitions
export const TEMPLATES = {
  dandy: {
    name: 'Dandy',
    description: "Dandy's World game character",
    fields: ['name', 'age', 'portrait', 'stats', 'abilities', 'aboutQuick', 'aboutLong'],
    hasStats: true,
    albums: ['digital', 'analog']
  },
  passport: {
    name: 'Passport / College ID',
    description: 'University ID card style',
    fields: ['name', 'age', 'portrait', 'role', 'university', 'faculty', 'nationality', 'placeOfBirth', 'dateOfBirth', 'aboutQuick', 'aboutLong'],
    hasStats: false,
    albums: ['digital', 'analog']
  },
  classic: {
    name: 'Classic',
    description: 'Simple bio card',
    fields: ['name', 'age', 'portrait', 'dateOfBirth', 'placeOfBirth', 'aboutQuick'],
    hasStats: false,
    albums: ['digital', 'analog']
  }
};

// Get template configuration
export function getTemplate(templateId) {
  return TEMPLATES[templateId] || TEMPLATES.classic;
}

// Validate character data based on template
export function validateCharacter(char) {
  const errors = [];
  
  if (!char.name || char.name.trim() === '') {
    errors.push('Name is required');
  }
  
  if (!char.template) {
    errors.push('Template is required');
  }
  
  if (!char.portrait || char.portrait === '') {
    errors.push('Portrait image is required');
  }
  
  const template = getTemplate(char.template);
  
  // Template-specific validation
  if (template.hasStats && char.template === 'dandy') {
    if (!char.stats) {
      errors.push('Stats are required for Dandy template');
    } else {
      if (char.stats.health === undefined || char.stats.health < 0 || char.stats.health > 3) {
        errors.push('Health must be between 0 and 3');
      }
      
      const statFields = ['stealth', 'movementSpeed', 'stamina', 'extractionSpeed', 'skillCheck'];
      statFields.forEach(field => {
        if (char.stats[field] === undefined || char.stats[field] < 0 || char.stats[field] > 5) {
          errors.push(`${field} must be between 0 and 5`);
        }
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Generate character ID from name
export function generateCharacterId(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Create default character object
export function createDefaultCharacter(template) {
  const char = {
    id: '',
    name: '',
    template: template,
    category: 'ocs',
    portrait: '',
    aboutQuick: '',
    images: [],
    tags: [],
    link: '',
    website: ''
  };
  
  // Add template-specific fields
  if (template === 'dandy') {
    char.age = '';
    char.stats = {
      health: 2,
      stealth: 3,
      movementSpeed: 3,
      stamina: 3,
      extractionSpeed: 3,
      skillCheck: 3
    };
    char.abilities = '';
    char.aboutLong = '';
  } else if (template === 'passport') {
    char.age = '';
    char.role = '';
    char.university = '';
    char.faculty = '';
    char.nationality = '';
    char.placeOfBirth = '';
    char.dateOfBirth = '';
    char.aboutLong = '';
    char.studentId = '';
    char.advisor = '';
    char.semester = '';
    char.motto = '';
  } else if (template === 'classic') {
    char.age = '';
    char.dateOfBirth = '';
    char.placeOfBirth = '';
  }
  
  return char;
}

// Render stats picker (hearts/stars)
export function renderStatsPicker(containerId, stats) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const html = `
    <div class="stats-picker">
      <!-- Health (Hearts 0-3) -->
      <div class="stat-row">
        <label>Health</label>
        <div class="hearts-picker" data-stat="health" data-max="3">
          ${renderHearts(stats?.health || 2, 3)}
        </div>
        <span class="stat-value">${stats?.health || 2}/3</span>
      </div>
      
      <!-- Stealth (Stars 0-5) -->
      <div class="stat-row">
        <label>Stealth</label>
        <div class="stars-picker" data-stat="stealth" data-max="5">
          ${renderStars(stats?.stealth || 3, 5)}
        </div>
        <span class="stat-value">${stats?.stealth || 3}/5</span>
      </div>
      
      <!-- Movement Speed (Stars 0-5) -->
      <div class="stat-row">
        <label>Movement Speed</label>
        <div class="stars-picker" data-stat="movementSpeed" data-max="5">
          ${renderStars(stats?.movementSpeed || 3, 5)}
        </div>
        <span class="stat-value">${stats?.movementSpeed || 3}/5</span>
      </div>
      
      <!-- Stamina (Stars 0-5) -->
      <div class="stat-row">
        <label>Stamina</label>
        <div class="stars-picker" data-stat="stamina" data-max="5">
          ${renderStars(stats?.stamina || 3, 5)}
        </div>
        <span class="stat-value">${stats?.stamina || 3}/5</span>
      </div>
      
      <!-- Extraction Speed (Stars 0-5) -->
      <div class="stat-row">
        <label>Extraction Speed</label>
        <div class="stars-picker" data-stat="extractionSpeed" data-max="5">
          ${renderStars(stats?.extractionSpeed || 3, 5)}
        </div>
        <span class="stat-value">${stats?.extractionSpeed || 3}/5</span>
      </div>
      
      <!-- Skill Check (Stars 0-5) -->
      <div class="stat-row">
        <label>Skill Check</label>
        <div class="stars-picker" data-stat="skillCheck" data-max="5">
          ${renderStars(stats?.skillCheck || 3, 5)}
        </div>
        <span class="stat-value">${stats?.skillCheck || 3}/5</span>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  attachStatsHandlers(container);
}

function renderHearts(value, max) {
  let html = '';
  for (let i = 1; i <= max; i++) {
    const filled = i <= value ? 'filled' : '';
    html += `<span class="heart ${filled}" data-value="${i}">♥</span>`;
  }
  return html;
}

function renderStars(value, max) {
  let html = '';
  for (let i = 1; i <= max; i++) {
    const filled = i <= value ? 'filled' : '';
    html += `<span class="star ${filled}" data-value="${i}">★</span>`;
  }
  return html;
}

function attachStatsHandlers(container) {
  // Hearts click handler
  container.querySelectorAll('.hearts-picker').forEach(picker => {
    const hearts = picker.querySelectorAll('.heart');
    const statName = picker.dataset.stat;
    const valueSpan = picker.parentElement.querySelector('.stat-value');
    
    hearts.forEach(heart => {
      heart.addEventListener('click', () => {
        const value = parseInt(heart.dataset.value);
        
        // Update visual
        hearts.forEach((h, idx) => {
          if (idx < value) {
            h.classList.add('filled');
          } else {
            h.classList.remove('filled');
          }
        });
        
        // Update value display
        valueSpan.textContent = `${value}/${picker.dataset.max}`;
        
        // Store value
        picker.dataset.currentValue = value;
        
        // Dispatch event
        picker.dispatchEvent(new CustomEvent('statchange', {
          detail: { stat: statName, value }
        }));
      });
    });
  });
  
  // Stars click handler
  container.querySelectorAll('.stars-picker').forEach(picker => {
    const stars = picker.querySelectorAll('.star');
    const statName = picker.dataset.stat;
    const valueSpan = picker.parentElement.querySelector('.stat-value');
    
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value);
        
        // Update visual
        stars.forEach((s, idx) => {
          if (idx < value) {
            s.classList.add('filled');
          } else {
            s.classList.remove('filled');
          }
        });
        
        // Update value display
        valueSpan.textContent = `${value}/${picker.dataset.max}`;
        
        // Store value
        picker.dataset.currentValue = value;
        
        // Dispatch event
        picker.dispatchEvent(new CustomEvent('statchange', {
          detail: { stat: statName, value }
        }));
      });
    });
  });
}

// Get stats from picker
export function getStatsFromPicker(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  const stats = {};
  
  const heartsPicker = container.querySelector('.hearts-picker');
  if (heartsPicker) {
    const filled = heartsPicker.querySelectorAll('.heart.filled').length;
    stats.health = filled;
  }
  
  container.querySelectorAll('.stars-picker').forEach(picker => {
    const statName = picker.dataset.stat;
    const filled = picker.querySelectorAll('.star.filled').length;
    stats[statName] = filled;
  });
  
  return stats;
}

// Get category options
export function getCategoryOptions() {
  return [
    { value: 'ocs', label: 'Original Characters' },
    { value: 'commissions', label: 'Commissions' },
    { value: 'fanart', label: 'Fan Art' },
    { value: 'progress', label: 'Work in Progress' }
  ];
}

// Get page link options
export function getPageLinkOptions() {
  return [
    { value: '', label: '-- No dedicated page --' },
    { value: 'assets/oc/pages/university.html', label: 'University (shared)' },
    { value: 'assets/oc/pages/dandy.html', label: "Dandy's World (shared)" },
    { value: 'assets/oc/pages/commissions.html', label: 'Commissions (shared)' },
    { value: 'dedicated', label: 'Create dedicated page' }
  ];
}