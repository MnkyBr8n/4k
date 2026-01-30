// assets/js/templates/classic.js
import { registerTemplate } from '../oc-modal-core.js';

registerTemplate('classic', (character) => {
  const html = `
    <div class="oc-modal classic-theme">
      <button class="oc-close" aria-label="Close">×</button>
      <button class="oc-prev" aria-label="Previous">‹</button>
      <button class="oc-next" aria-label="Next">›</button>
      
      <div class="classic-container">
        <div class="classic-portrait">
          <img src="${character.portrait || character.fullArt || ''}" alt="${character.name}">
        </div>
        
        <div class="classic-info">
          <h2 class="classic-name">${character.name}</h2>
          
          ${character.age ? `<p class="classic-detail"><strong>Age:</strong> ${character.age}</p>` : ''}
          ${character.dateOfBirth ? `<p class="classic-detail"><strong>Born:</strong> ${character.dateOfBirth}</p>` : ''}
          ${character.placeOfBirth ? `<p class="classic-detail"><strong>Birthplace:</strong> ${character.placeOfBirth}</p>` : ''}
          ${character.role ? `<p class="classic-detail"><strong>Role:</strong> ${character.role}</p>` : ''}
          
          ${character.aboutQuick ? `
            <div class="classic-about">
              <h3>About</h3>
              <p>${character.aboutQuick}</p>
            </div>
          ` : ''}
          
          ${character.aboutLong ? `
            <div class="classic-about-long">
              <p>${character.aboutLong}</p>
            </div>
          ` : ''}
          
          ${character.tags && character.tags.length ? `
            <div class="classic-tags">
              ${character.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
          
          ${character.images && character.images.length ? `
            <div class="classic-gallery">
              <h3>Gallery</h3>
              <div class="gallery-thumbnails">
                ${character.images.map(img => `
                  <div class="thumbnail">
                    <img src="${img.src}" alt="${img.title || character.name}">
                    ${img.title ? `<p>${img.title}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${character.link ? `<a href="${character.link}" class="classic-link">Learn More</a>` : ''}
          ${character.website ? `<a href="${character.website}" class="classic-website" target="_blank">Visit Website</a>` : ''}
        </div>
      </div>
    </div>
  `;
  
  return { html, wrapperClass: 'classic-wrapper' };
});
