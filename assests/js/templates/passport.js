// assets/js/templates/passport.js
import { registerTemplate, UI } from "../oc-modal-core.js";

registerTemplate("passport", (c)=>{
  const flag = `<div class="oc-flag"><img alt="DE flag" src="https://upload.wikimedia.org/wikipedia/en/b/ba/Flag_of_Germany.svg"></div>`;
  const idbar = `
    <div class="oc-idbar">
      <div><b>Studenten-ID:</b> ${c.studentId || "—"}</div>
      <div><b>Geburtsdatum:</b> ${c.dateOfBirth || "—"} &nbsp; • &nbsp; <b>Alter:</b> ${c.age ?? "—"}</div>
    </div>`;

  const left = `
    <div class="oc-card">
      <div class="oc-photo"><img src="${c.portrait}" alt="${c.name}"></div>
      <div class="oc-row"><span class="oc-label">Name</span><div class="oc-field">${c.name}</div></div>
      <div class="oc-row"><span class="oc-label">Nationalität</span><div class="oc-field">${c.nationality||"Deutsch"}</div></div>
      <div class="oc-row"><span class="oc-label">Geburtsort</span><div class="oc-field">${c.placeOfBirth||"—"}</div></div>
    </div>`;

  const right = `
    <div class="oc-card">
      <div class="oc-head">
        ${flag}
        <div class="oc-title">${c.university || "Universität"}</div>
      </div>
      <div class="oc-row"><span class="oc-label">Fakultät</span><div class="oc-field">${c.faculty||"—"}</div></div>
      <div class="oc-row"><span class="oc-label">Studiengang</span><div class="oc-field">${c.role||"—"}</div></div>
      <div class="oc-row"><span class="oc-label">Semester</span><div class="oc-field">${c.semester||"—"}</div></div>
      <div class="oc-row"><span class="oc-label">Betreuer:in</span><div class="oc-field">${c.advisor||"—"}</div></div>
      ${idbar}

      <div class="oc-section">
        <h3>Leitsatz (Motto)</h3>
        <div class="oc-field">${c.motto || "—"}</div>
      </div>

      <div class="oc-section">
        <h3>Kurzprofil</h3>
        <div class="oc-about">${c.aboutQuick || ""}</div>
      </div>

      <div class="oc-section">
        <h3>Über mich</h3>
        <div class="oc-about">${c.aboutLong || ""}</div>
      </div>

      <div class="oc-cta-row">
        <a class="oc-cta" href="${c.website || c.link}" target="_blank" rel="noopener">Personal Website →</a>
        <a class="oc-cta secondary" href="${c.link}" target="_self" rel="noopener">Full Character Page</a>
      </div>
    </div>`;

  const html = `
    <button class="oc-close" aria-label="Close">✕</button>
    <button class="oc-prev" aria-label="Previous">⟨</button>
    <button class="oc-next" aria-label="Next">⟩</button>

    <div class="passport oc-grid-2">
      ${left}
      ${right}

      <div class="oc-card" style="grid-column:1/-1">
        <h3>Gesundheit & Attribute</h3>
        <div class="oc-row"><span class="oc-label">Health</span>${UI.hearts(c.stats?.hearts||0)}</div>
        <div class="oc-row"><span class="oc-label">Skill</span><div class="oc-stars">${UI.stars(c.stats?.skill||0)}</div></div>
        <div class="oc-row"><span class="oc-label">Stamina</span>${UI.meter(c.stats?.stamina||0)}</div>
        <div class="oc-row"><span class="oc-label">Movement</span><div class="oc-stars">${UI.stars(c.stats?.move||0)}</div></div>
        <div class="oc-row"><span class="oc-label">Stealth</span><div class="oc-stars">${UI.stars(c.stats?.stealth||0)}</div></div>
        <div class="oc-row"><span class="oc-label">Extract</span>${UI.meter(c.stats?.extract||0)}</div>
      </div>
    </div>
  `;
  return { html, wrapperClass: "passport" };
});