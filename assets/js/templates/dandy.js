import { registerTemplate, UI } from '../oc-modal-core.js';
registerTemplate('dandy', (character) => {
const stats = character.stats || {};
const hearts = stats.hearts || 0;
const skill = stats.skill || 0;
const move = stats.move || 0;
const stealth = stats.stealth || 0;
const stamina = stats.stamina || 0;
const extract = stats.extract || 0;
const html = `
<div class="dandy-card">
<button class="oc-close" aria-label="Close"></button>
<button class="oc-prev" aria-label="Previous"></button>
<button class="oc-next" aria-label="Next"></button>
<div class="left-column">
    <div class="portrait-container">
      <img src="${character.portrait || character.fullArt || ''}" alt="${character.name}" class="character-portrait">
    </div>
    
    <div class="stats-column">
      <div class="stat-row">
        <div class="stat-name">Health</div>
        <div class="stat-value">
          ${Array.from({length: 3}, (_, i) => `<span class="stat-icon${i < hearts ? ' filled' : ''}">♥</span>`).join('')}
        </div>
      </div>
      
      <div class="stat-row">
        <div class="stat-name">Skill Check</div>
        <div class="stat-value">
          ${Array.from({length: 5}, (_, i) => `<span class="stat-icon${i < skill ? ' filled' : ''}">★</span>`).join('')}
        </div>
      </div>
      
      <div class="stat-row">
        <div class="stat-name">Movement Speed</div>
        <div class="stat-value">
          ${Array.from({length: 5}, (_, i) => `<span class="stat-icon${i < move ? ' filled' : ''}">★</span>`).join('')}
        </div>
      </div>
      
      <div class="stat-row">
        <div class="stat-name">Stealth</div>
        <div class="stat-value">
          ${Array.from({length: 5}, (_, i) => `<span class="stat-icon${i < stealth ? ' filled' : ''}">★</span>`).join('')}
        </div>
      </div>
      
      <div class="stat-row">
        <div class="stat-name">Stamina</div>
        <div class="stat-value">
          ${Array.from({length: 5}, (_, i) => `<span class="stat-icon${i < stamina ? ' filled' : ''}">★</span>`).join('')}
        </div>
      </div>
      
      <div class="stat-row">
        <div class="stat-name">Extraction Speed</div>
        <div class="stat-value">
          ${Array.from({length: 5}, (_, i) => `<span class="stat-icon${i < extract ? ' filled' : ''}">★</span>`).join('')}
        </div>
      </div>
    </div>
  </div>
  
  <div class="right-column">
    <div class="character-info">
      <div class="character-name">${character.name}</div>
      <div class="character-age">Age: ${character.age || ''}</div>
    </div>
    
    <div class="ability-container">
      <div class="ability-header">Ability 1</div>
      <div class="ability-content">
        <div class="ability-text">${character.ability1 || character.aboutQuick || ''}</div>
      </div>
    </div>
    
    <div class="ability-container">
      <div class="ability-header">Ability 2</div>
      <div class="ability-content">
        <div class="ability-text">${character.ability2 || character.backstoryTeaser || ''}</div>
      </div>
    </div>
    
    ${character.link ? `<a href="${character.link}" class="select-button">SELECT</a>` : ''}
  </div>
</div>

`;
return { html, wrapperClass: 'dandy-wrapper' };
});
