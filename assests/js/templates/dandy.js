// assets/js/templates/dandy.js
import { registerTemplate } from "../oc-modal-core.js";

registerTemplate("dandy", (c, { UI })=>{
  const stats = `
    <div class="oc-row"><div class="oc-label">Skill Check</div><div class="oc-stars">${UI.stars(c.stats?.skill||0)}</div></div>
    <div class="oc-row"><div class="oc-label">Movement Speed</div><div class="oc-stars">${UI.stars(c.stats?.move||0)}</div></div>
    <div class="oc-row"><div class="oc-label">Stamina</div>${UI.meter(c.stats?.stamina||0)}</div>
    <div class="oc-row"><div class="oc-label">Stealth</div><div class="oc-stars">${UI.stars(c.stats?.stealth||0)}</div></div>
    <div class="oc-row"><div class="oc-label">Extraction Speed</div>${UI.meter(c.stats?.extract||0)}</div>
  `;

  const chips = (c.companionTags||[]).map(t=>`<span class="oc-chip">${t}</span>`).join("");

  const html = `
    <button class="oc-close" aria-label="Close">✕</button>
    <button class="oc-prev" aria-label="Previous">⟨</button>
    <button class="oc-next" aria-label="Next">⟩</button>

    <div class="oc-grid-3">
      <div class="oc-tile oc-portrait">
        <img src="${c.portrait}" alt="${c.name} portrait">
      </div>

      <div class="oc-tile">
        <div class="oc-row" style="justify-content:space-between">
          <div>
            <h2 style="margin:0 0 2px;font-size:22px">${c.name}</h2>
            <small>${c.role||""}</small>
          </div>
          <span class="oc-badge">Health <span class="oc-hearts">${UI.hearts(c.stats?.hearts||0)}</span></span>
        </div>

        ${stats}

        <div class="oc-grid-2" style="margin-top:12px">
          <div class="oc-tile" style="padding:12px">
            <h3 style="margin-bottom:6px">${c.companionTitle||"Companion"}</h3>
            ${chips}
          </div>
          <div class="oc-tile" style="padding:12px">
            <h3 style="margin-bottom:6px">Quote</h3>
            <small>${c.quote||""}</small>
          </div>
        </div>

        <div class="oc-cta-row">
          <a class="oc-cta" href="${c.link}" target="_self" rel="noopener">View Character Page →</a>
          <a class="oc-cta secondary" href="${c.link}" target="_blank" rel="noopener">Open in New Tab</a>
        </div>
      </div>

      <div class="oc-tile">
        <h3>Identity</h3>
        <div class="kv"><b>Full Name:</b> <span>${c.fullName||c.name}</span></div>
        <div class="kv"><b>Pronouns:</b> <span>${c.pronouns||""}</span></div>
        ${(c.abilities||[]).slice(0,2).map(a=>`
          <div class="oc-ability"><h4>${a.title}</h4><p>${a.text}</p></div>
        `).join("")}
      </div>

      <div class="oc-tile" style="grid-column:1/-1">
        <div class="dandy oc-bio">
          <h3>main character</h3>
          <small>${c.bio||""}</small>
        </div>
      </div>

      <div class="dandy oc-fullart" style="grid-column:1/-1">
        <img src="${c.fullArt||c.portrait}" alt="${c.name} full art">
      </div>
    </div>
  `;
  return { html, wrapperClass: "dandy" };
});