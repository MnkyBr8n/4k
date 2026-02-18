// assets/js/oc-modal-core.js
import { CHARACTERS } from "../../data/characters.js";

// registry
const TEMPLATES = new Map();
/** Register a template renderer */
export function registerTemplate(id, renderFn){ TEMPLATES.set(id, renderFn); }

const rootId = "ocm-root";
let ids = Object.keys(CHARACTERS);
let cursor = 0;

const $ = (s, el=document) => el.querySelector(s);
const on = (el, ev, fn, opts) => el.addEventListener(ev, fn, opts);

function ensureRoot(){
  let r = document.getElementById(rootId);
  if(!r){
    r = document.createElement("div");
    r.id = rootId;
    r.hidden = true;
    document.body.appendChild(r);
  }
  return r;
}

function stars(n){ return Array.from({length:5},(_,i)=>`<i class="oc-star${i<n?' on':''}"></i>`).join(""); }
function hearts(n){ return Array.from({length:5},(_,i)=>`<i class="oc-heart${i<n?' on':''}"></i>`).join(""); }
function meter(v){ return `<div class="oc-meter"><span style="width:${(v||0)*100}%"></span></div>`; }
export const UI = { stars, hearts, meter }; // shared primitives for templates

function mount(html, wrapperClass=""){
  const root = ensureRoot();
  root.innerHTML = `<div class="oc-sheet ${wrapperClass}">${html}</div>`;
  root.hidden = false;

  // backdrop click to close
  on(root, "click", (e)=>{ if(e.target === root) close(); }, { once:true });

  // wire common controls if present
  const prev = $(".oc-prev", root), next = $(".oc-next", root), closeBtn = $(".oc-close", root);
  if(prev) prev.onclick = ()=> step(-1);
  if(next) next.onclick = ()=> step(1);
  if(closeBtn) closeBtn.onclick = close;

  // keyboard
  on(document, "keydown", keyNav);
}

function keyNav(e){
  const root = document.getElementById(rootId);
  if(root?.hidden) return;
  if(e.key === "Escape") close();
  if(e.key === "ArrowRight") step(1);
  if(e.key === "ArrowLeft") step(-1);
}

export function close(){
  const root = ensureRoot();
  root.hidden = true;
  root.innerHTML = "";
  document.removeEventListener("keydown", keyNav);
}

export function openCharacter(id, templateOverride){
  const c = CHARACTERS[id]; if(!c) return;
  cursor = ids.indexOf(id);
  const templateId = templateOverride || c.template || "classic";
  const render = TEMPLATES.get(templateId);
  if(!render) throw new Error(`template "${templateId}" not registered`);
  const { html, wrapperClass } = render(c, { UI });
  mount(html, wrapperClass);
}

function step(delta){
  cursor = (cursor + delta + ids.length) % ids.length;
  const id = ids[cursor];
  openCharacter(id); // uses each character's own template
}

// Auto-bind any element with .oc-open or data-character
document.addEventListener("DOMContentLoaded", ()=>{
  document.querySelectorAll("[data-character]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const id = el.dataset.character;
      const tpl = el.dataset.template; // optional per-button override
      openCharacter(id, tpl);
    });
  });
});
