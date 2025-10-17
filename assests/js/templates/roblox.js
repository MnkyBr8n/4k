import { registerTemplate, UI } from "../oc-modal-core.js";

registerTemplate("roblox", (c) => {
  const badges = (c.highlights || ["Creative", "Builder", "Explorer"])
    .map(b => `<div class="rb-badge">${b}</div>`).join("");

  const html = `
    <button class="oc-close">✕</button>
    <div class="roblox rb-card">
      <div class="rb-header">
        <div class="rb-avatar">
          <img src="${c.portrait}" alt="${c.name}">
        </div>
        <div>
          <div class="rb-username">${c.name}</div>
          <div class="rb-role">${c.role || "Roblox Creator"}</div>
        </div>
      </div>
      <div class="rb-about">${c.aboutQuick || "Hey there! I'm into building worlds and meeting friends!"}</div>
      <div class="rb-badges">${badges}</div>
      <div class="rb-cta-row">
        <a class="rb-btn" href="${c.link}" target="_self">View Full Character</a>
        <a class="rb-btn secondary" href="${c.website || '#'}" target="_blank">Visit Website</a>
      </div>
    </div>
  `;
  return { html, wrapperClass: "roblox" };
});