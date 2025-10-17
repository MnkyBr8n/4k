// Small helpers used by multiple Studio pages
export function slugify(name){
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)/g,'');
}
export function pickColor(seed){
  const hues=[210,260,300,180,20,35,150,0]; // calm palette
  const h=hues[Math.abs(hash(seed))%hues.length];
  return `hsl(${h} 70% 45%)`;
}
function hash(s){ let h=0; for (let i=0;i<s.length;i++) h=(h<<5)-h+s.charCodeAt(i)|0; return h; }

// Turn a File into a local object URL (Stage 1); in prod upload to storage and use the remote URL.
export async function fileToObjectURL(file){
  return URL.createObjectURL(file);
}

// Download a Blob as a file
export function downloadBlob(blob, filename){
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}