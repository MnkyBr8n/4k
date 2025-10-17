// assets/js/templates/storycard.js
import { registerTemplate, UI } from "../oc-modal-core.js";

registerTemplate("storycard", (c)=>{
  const pills = (c.highlights||[]).map(h=>`<span class="sc-pill">${h}</span>`).join("");

  const html = `
    <button class="oc-close" aria-label="Close">✕</button>
    <button class="oc-prev" aria-label="Previous">⟨</button>
    <button class="oc-next" aria-label="Next">⟩</button>

    <div class="storycard sc-wrap">
      <div class="sc-left">
        <div class="sc-img"><img src="${c.portrait}" alt="${c.name}"></div>
      </div>

      <div>
        <h2>${c.name}</h2>
        <div class="sc-meta">${c.role || ""}</div>

        <div class="sc-high">${pills}</div>

        <div class="sc-box">
          <b>About Me</b>
          <p style="margin:.5rem 0 0">${c.aboutQuick || ""}</p>
        </div>

        <div class="sc-row"><div style="min-width:120px;color:#d6deff">Health</div>${UI.hearts(c.stats?.hearts||0)}</div>
        <div class="sc-row"><div style="min-width:120px;color:#d6deff">Skill</div><div class="oc-stars">${UI.stars(c.stats?.skill||0)}</div></div>
        <div class="sc-row"><div style="min-width:120px;color:#d6deff">Stamina</div>${UI.meter(c.stats?.stamina||0)}</div>

        <div class="sc-box" style="margin-top:12px">
          <b>Backstory (teaser)</b>
          <p style="margin:.5rem 0 0">${c.backstoryTeaser || "…"}</p>
        </div>

        <div class="oc-cta-row">
          <a class="oc-cta" href="${c.link}" target="_self" rel="noopener">Full Character Page →</a>
          <a class="oc-cta secondary" href="${c.website || c.link}" target="_blank" rel="noopener">Personal Website</a>
        </div>
      </div>
    </div>
  `;
  return { html, wrapperClass: "storycard" };
});