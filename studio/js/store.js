// Simple localStorage-based store for Stage 1.
// You can swap these with Firebase later without changing the Studio UI.

const KEYS = {
  characters: "oc.characters",       // array of character objects
  heroBackgrounds: "oc.heroBackgrounds" // { active: string, items: [string] }
};

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function listCharacters() {
  return read(KEYS.characters, []);
}
export function saveCharacters(arr) {
  write(KEYS.characters, arr);
}
export function getCharacter(id) {
  return listCharacters().find(c => c.id === id);
}
export function upsertCharacter(char) {
  const all = listCharacters();
  const ix = all.findIndex(c => c.id === char.id);
  if (ix >= 0) all[ix] = char; else all.push(char);
  saveCharacters(all);
}
export function deleteCharacter(id) {
  saveCharacters(listCharacters().filter(c => c.id !== id));
}

// Images: just store relative paths + flags (carousel)
export function addImage(id, imageObj) {
  const c = getCharacter(id); if (!c) return;
  c.images = c.images || [];
  c.images.push(imageObj); // {src, album: 'analog'|'digital', carousel: bool}
  upsertCharacter(c);
}
export function removeImage(id, src) {
  const c = getCharacter(id); if (!c) return;
  c.images = (c.images || []).filter(i => i.src !== src);
  upsertCharacter(c);
}
export function setCarousel(id, src, on) {
  const c = getCharacter(id); if (!c) return;
  c.images = (c.images || []).map(i => i.src === src ? {...i, carousel: !!on} : i);
  upsertCharacter(c);
}

// Hero backgrounds
export function getHeroConfig() {
  return read(KEYS.heroBackgrounds, { active: "", items: [] });
}
export function setHeroActive(src) {
  const cfg = getHeroConfig(); cfg.active = src; write(KEYS.heroBackgrounds, cfg);
}
export function addHeroBackground(src) {
  const cfg = getHeroConfig();
  if (!cfg.items.includes(src)) cfg.items.push(src);
  write(KEYS.heroBackgrounds, cfg);
}

// Exporters to feed your public /data files
export function exportCharactersJS() {
  const chars = listCharacters();
  // Convert to /data/characters.js (ES module)
  const payload =
`export const CHARACTERS = ${JSON.stringify(chars, null, 2)};`;
  return new Blob([payload], { type: "text/javascript" });
}
export function exportHeroBackgroundsJSON() {
  const cfg = getHeroConfig();
  return new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
}