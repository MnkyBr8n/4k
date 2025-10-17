import { registerTemplate, UI } from "../oc-modal-core.js";

registerTemplate("fortnite", (c) => {
  const stat = (label, val, node) => `
    <div class="fn-stat">
      <h4>${label}</h4>
      ${node || `<div>${val ?? "—"}</div>`}
    </div>`;

  const html = `
    <button class="oc-close">✕</button>
    <div class="fortnite fn-card">
      <div class="fn-top">
        <div class="fn-portrait">
          <img src="${c.portrait}" alt="${c.name}">
        </div>
        <div class="fn-info">
          <h2>${c.name}</h2>
          <div class="fn-role">${c.role || "Fortnite Hero"}</div>
        </div>
      </div>

      <div class="fn-stats">
        ${stat("Health", "", UI.hearts(c.stats?.hearts || 0))}
        ${stat("Skill", "", `<div class="oc-stars">${UI.stars(c.stats?.skill || 0)}</div>`)}
        ${stat("Stamina", "", UI.meter(c.stats?.stamina || 0))}
        ${stat("Movement", "", `<div class="oc-stars">${UI.stars(c.stats?.move || 0)}</div>`)}
        ${stat("Stealth", "", `<div class="oc-stars">${UI.stars(c.stats?.stealth || 0)}</div>`)}
      </div>

      <div class="fn-story">
        <strong>Backstory:</strong>
        <p>${c.backstoryTeaser || "A mysterious figure dropped from the Battle Bus..."}</p>
      </div>

      <div class="fn-cta">
        <a class="fn-btn" href="${c.link}" target="_self">View Loadout</a>
        <a class="fn-btn secondary" href="${c.website || '#'}" target="_blank">Visit Profile</a>
      </div>
    </div>
  `;
  return { html, wrapperClass: "fortnite" };
});