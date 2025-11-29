// create-character-logic.js
import { requireAuth } from './auth.js';
import { createDefaultCharacter, generateCharacterId, validateCharacter, renderStatsPicker, getStatsFromPicker } from './character-forms.js';

// Require authentication
requireAuth();

// State
let currentStep = 1;
let selectedTemplate = '';
let characterData = {};
let portraitFile = null;
let portraitURL = '';

// Elements
const steps = document.querySelectorAll('.wizard-step');
const stepContents = document.querySelectorAll('.step-content');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const createBtn = document.getElementById('createBtn');
const templateCards = document.querySelectorAll('.template-card');

// Template selection
templateCards.forEach(card => {
  card.addEventListener('click', () => {
    templateCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedTemplate = card.dataset.template;
    
    // Initialize character data
    characterData = createDefaultCharacter(selectedTemplate);
  });
});

// Portrait upload
document.getElementById('charPortrait').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Validate
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }
  
  if (file.size > 10 * 1024 * 1024) {
    alert('Image too large (max 10MB)');
    return;
  }
  
  portraitFile = file;
  
  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    portraitURL = e.target.result;
    document.getElementById('previewImage').src = portraitURL;
    document.getElementById('portraitPreview').style.display = 'block';
    
    const sizeKB = (file.size / 1024).toFixed(1);
    document.getElementById('imageInfo').textContent = `${file.name} (${sizeKB} KB)`;
  };
  reader.readAsDataURL(file);
});

// Navigation
prevBtn.addEventListener('click', () => {
  if (currentStep > 1) {
    goToStep(currentStep - 1);
  }
});

nextBtn.addEventListener('click', () => {
  if (validateCurrentStep()) {
    if (currentStep < 4) {
      goToStep(currentStep + 1);
    }
  }
});

createBtn.addEventListener('click', () => {
  if (validateCurrentStep()) {
    createCharacter();
  }
});

function goToStep(step) {
  // Save current step data
  saveCurrentStepData();
  
  // Update step
  currentStep = step;
  
  // Update UI
  steps.forEach((s, i) => {
    if (i + 1 < step) {
      s.classList.add('completed');
      s.classList.remove('active');
    } else if (i + 1 === step) {
      s.classList.add('active');
      s.classList.remove('completed');
    } else {
      s.classList.remove('active', 'completed');
    }
  });
  
  stepContents.forEach((content, i) => {
    content.classList.toggle('active', i + 1 === step);
  });
  
  // Update buttons
  prevBtn.style.display = step > 1 ? 'block' : 'none';
  nextBtn.style.display = step < 4 ? 'block' : 'none';
  createBtn.style.display = step === 4 ? 'block' : 'none';
  
  // Load step-specific content
  if (step === 3) {
    loadStep3Fields();
  }
}

function validateCurrentStep() {
  if (currentStep === 1) {
    if (!selectedTemplate) {
      alert('Please select a template');
      return false;
    }
  } else if (currentStep === 2) {
    const name = document.getElementById('charName').value.trim();
    if (!name) {
      alert('Please enter a character name');
      return false;
    }
  } else if (currentStep === 4) {
    if (!portraitURL) {
      alert('Please upload a portrait image');
      return false;
    }
  }
  
  return true;
}

function saveCurrentStepData() {
  if (currentStep === 2) {
    characterData.name = document.getElementById('charName').value.trim();
    characterData.age = document.getElementById('charAge').value;
    characterData.category = document.getElementById('charCategory').value;
    characterData.aboutQuick = document.getElementById('charAboutQuick').value.trim();
  } else if (currentStep === 3) {
    if (selectedTemplate === 'dandy') {
      characterData.abilities = document.getElementById('charAbilities').value.trim();
      characterData.aboutLong = document.getElementById('charAboutLong').value.trim();
      characterData.stats = getStatsFromPicker('statsPickerContainer');
    } else if (selectedTemplate === 'passport') {
      characterData.role = document.getElementById('charRole').value.trim();
      characterData.university = document.getElementById('charUniversity').value.trim();
      characterData.faculty = document.getElementById('charFaculty').value.trim();
      characterData.nationality = document.getElementById('charNationality').value.trim();
      characterData.placeOfBirth = document.getElementById('charPlaceOfBirth').value.trim();
      characterData.dateOfBirth = document.getElementById('charDateOfBirth').value;
      characterData.motto = document.getElementById('charMotto').value.trim();
      characterData.aboutLong = document.getElementById('charPassportAbout').value.trim();
    } else if (selectedTemplate === 'classic') {
      characterData.dateOfBirth = document.getElementById('charClassicDOB').value;
      characterData.placeOfBirth = document.getElementById('charClassicPOB').value.trim();
    }
    
    characterData.link = document.getElementById('charPageLink').value;
    characterData.website = document.getElementById('charWebsite').value.trim();
  } else if (currentStep === 4) {
    characterData.showInHero = document.getElementById('charShowInHero').checked;
  }
}

function loadStep3Fields() {
  // Hide all template-specific fields
  document.getElementById('dandyFields').style.display = 'none';
  document.getElementById('passportFields').style.display = 'none';
  document.getElementById('classicFields').style.display = 'none';
  
  // Show relevant fields
  if (selectedTemplate === 'dandy') {
    document.getElementById('step3Title').textContent = 'Dandy Character Details';
    document.getElementById('dandyFields').style.display = 'block';
    renderStatsPicker('statsPickerContainer', characterData.stats);
  } else if (selectedTemplate === 'passport') {
    document.getElementById('step3Title').textContent = 'Passport / ID Details';
    document.getElementById('passportFields').style.display = 'block';
  } else if (selectedTemplate === 'classic') {
    document.getElementById('step3Title').textContent = 'Classic Bio Details';
    document.getElementById('classicFields').style.display = 'block';
  }
}

function createCharacter() {
  saveCurrentStepData();
  
  // Generate ID
  characterData.id = generateCharacterId(characterData.name);
  characterData.portrait = portraitURL;
  
  // Handle page link
  if (characterData.link === 'dedicated') {
    characterData.link = `assets/oc/${characterData.id}/page.html`;
  }
  
  // Add image to images array
  characterData.images = [{
    src: portraitURL,
    album: 'digital',
    carousel: characterData.showInHero || false
  }];
  
  // Validate
  const validation = validateCharacter(characterData);
  if (!validation.valid) {
    alert('Validation errors:\n' + validation.errors.join('\n'));
    return;
  }
  
  // Save to localStorage
  const characters = JSON.parse(localStorage.getItem('4k_characters') || '{}');
  
  // Check for duplicate
  if (characters[characterData.id]) {
    alert('A character with this name already exists!');
    return;
  }
  
  characters[characterData.id] = characterData;
  localStorage.setItem('4k_characters', JSON.stringify(characters));
  
  // ✨ NEW: Add to GitHub sync queue
  if (window.githubSyncUI && window.githubSyncUI.isConfigured()) {
    try {
      // Convert characters object to array format for characters.js
      const charactersArray = Object.values(characters);
      const charactersJS = `export const CHARACTERS = ${JSON.stringify(charactersArray, null, 2)};`;
      
      // Add to sync queue
      window.githubSyncUI.addToQueue({
        action: 'create',
        path: 'data/characters.js',
        content: charactersJS,
        commitMessage: `Add character: ${characterData.name}`
      });
      
      console.log('✅ Character added to sync queue');
    } catch (error) {
      console.error('❌ Failed to add to sync queue:', error);
    }
  }
  
  alert(`✓ Character "${characterData.name}" created successfully!\n\nYou can now add more images and details in the edit page.`);
  
  // Redirect to edit page
  window.location.href = `edit-character.html?id=${encodeURIComponent(characterData.id)}`;
}

// Initialize
console.log('Create character wizard loaded');
