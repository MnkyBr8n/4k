// assets/js/templates/passport.js
import { registerTemplate } from '../oc-modal-core.js';

registerTemplate('passport', (character) => {
  const html = `
    <div class="oc-modal passport-theme">
      <button class="oc-close" aria-label="Close">×</button>
      <button class="oc-prev" aria-label="Previous">‹</button>
      <button class="oc-next" aria-label="Next">›</button>
      
      <div class="passport-container">
        <div class="passport-card">
          <div class="passport-header">
            <h2>${character.university || 'University'}</h2>
            <p class="passport-faculty">${character.faculty || ''}</p>
          </div>
          
          <div class="passport-body">
            <div class="passport-photo">
              <img src="${character.portrait || character.fullArt || ''}" alt="${character.name}">
            </div>
            
            <div class="passport-details">
              <div class="passport-field">
                <span class="field-label">Name:</span>
                <span class="field-value">${character.name}</span>
              </div>
              
              ${character.studentId ? `
                <div class="passport-field">
                  <span class="field-label">Student ID:</span>
                  <span class="field-value">${character.studentId}</span>
                </div>
              ` : ''}
              
              ${character.role ? `
                <div class="passport-field">
                  <span class="field-label">Program:</span>
                  <span class="field-value">${character.role}</span>
                </div>
              ` : ''}
              
              ${character.semester ? `
                <div class="passport-field">
                  <span class="field-label">Semester:</span>
                  <span class="field-value">${character.semester}</span>
                </div>
              ` : ''}
              
              ${character.dateOfBirth ? `
                <div class="passport-field">
                  <span class="field-label">Date of Birth:</span>
                  <span class="field-value">${character.dateOfBirth}</span>
                </div>
              ` : ''}
              
              ${character.age ? `
                <div class="passport-field">
                  <span class="field-label">Age:</span>
                  <span class="field-value">${character.age}</span>
                </div>
              ` : ''}
              
              ${character.placeOfBirth ? `
                <div class="passport-field">
                  <span class="field-label">Place of Birth:</span>
                  <span class="field-value">${character.placeOfBirth}</span>
                </div>
              ` : ''}
              
              ${character.nationality ? `
                <div class="passport-field">
                  <span class="field-label">Nationality:</span>
                  <span class="field-value">${character.nationality}</span>
                </div>
              ` : ''}
              
              ${character.advisor ? `
                <div class="passport-field">
                  <span class="field-label">Advisor:</span>
                  <span class="field-value">${character.advisor}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          ${character.motto ? `
            <div class="passport-motto">
              <p>"${character.motto}"</p>
            </div>
          ` : ''}
          
          ${character.aboutQuick ? `
            <div class="passport-about">
              <h3>About</h3>
              <p>${character.aboutQuick}</p>
            </div>
          ` : ''}
          
          ${character.aboutLong ? `
            <div class="passport-about-long">
              <p>${character.aboutLong}</p>
            </div>
          ` : ''}
          
          ${character.highlights && character.highlights.length ? `
            <div class="passport-highlights">
              <h3>Highlights</h3>
              <div class="highlights-list">
                ${character.highlights.map(h => `<span class="highlight-badge">${h}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          
          ${character.backstoryTeaser ? `
            <div class="passport-backstory">
              <p>${character.backstoryTeaser}</p>
            </div>
          ` : ''}
          
          ${character.link ? `<a href="${character.link}" class="passport-link">Learn More</a>` : ''}
        </div>
      </div>
    </div>
  `;
  
  return { html, wrapperClass: 'passport-wrapper' };
});
