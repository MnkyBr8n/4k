// assets/js/templates/classic.js
import { registerTemplate } from "../oc-modal-core.js";

registerTemplate("classic", (c) => {
  // Build thumbnail gallery if images exist
  const thumbnails = (c.images || []).map(img => `
    <div class="oc-thumbnail">
      <img src="${img.src}" alt="${img.title || 'Artwork'}">
      <div class="oc-thumbnail-label">${img.title || 'Artwork'}</div>
    </div>
  `).join('');

  const html = `
    <button class="oc-close" aria-label="Close">✕</button>
    <button class="oc-prev" aria-label="Previous">⟨</button>
    <button class="oc-next" aria-label="Next">⟩</button>

    <div class="classic">
      <!-- Portrait - Top Center -->
      <div class="oc-portrait-wrapper">
        <div class="oc-portrait">
          <img src="${c.portrait}" alt="${c.name} portrait" class="portrait-image">
        </div>
      </div>

      <!-- Name -->
      <h2>${c.name}</h2>

      <!-- Info: Age, Birthday, Place -->
      <div class="oc-info">
        <div class="oc-info-row">
          <div class="oc-info-item">
            <span class="oc-info-label">Age</span>
            <span class="oc-info-value">${c.age || '—'}</span>
          </div>
          <div class="oc-info-item">
            <span class="oc-info-label">Birthday</span>
            <span class="oc-info-value">${c.dateOfBirth || '—'}</span>
          </div>
          <div class="oc-info-item">
            <span class="oc-info-label">Birthplace</span>
            <span class="oc-info-value">${c.placeOfBirth || '—'}</span>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="oc-divider"></div>

      <!-- About Me -->
      <div class="oc-about">
        <h3>About Me</h3>
        <p>${c.aboutQuick || c.bio || ''}</p>
      </div>

      <!-- Website Link -->
      ${c.website ? `<a href="${c.website}" class="oc-website-link" target="_blank" rel="noopener">🌐 Visit My Website</a>` : ''}

      <!-- Thumbnails -->
      ${thumbnails ? `
        <div class="oc-thumbnails">
          <h3>Gallery</h3>
          <div class="oc-thumbnail-grid">
            ${thumbnails}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  return { html, wrapperClass: "classic" };
});
