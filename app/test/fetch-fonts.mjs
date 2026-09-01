// Lädt Cormorant Garamond und Lora einmalig von Google herunter und legt sie
// als WOFF2 unter public/fonts/ ab, dazu ein lokales fonts.css. Danach braucht
// die App zum Starten kein Netz mehr — im Revier gibt es keins.
//
// Aufruf: node test/fetch-fonts.mjs   (nur nötig, wenn Schriften erneuert werden)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CSS_URL = 'https://fonts.googleapis.com/css2'
  + '?family=Cormorant+Garamond:wght@400;500;600'
  + '&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap';

// Ein Browser-UA, sonst liefert Google die veralteten TTF-Varianten aus.
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

const OUT_DIR = 'public/fonts';
mkdirSync(OUT_DIR, { recursive: true });

const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text();

// Die Antwort ist nach Zeichensatz-Blöcken gegliedert ("/* latin */" usw.).
// Deutsch braucht latin und latin-ext; der Rest wäre unnötiger Ballast.
const KEEP = new Set(['latin', 'latin-ext']);
const blocks = css.split('/*').slice(1);

let out = '/* Selbst gehostete Schriften — von test/fetch-fonts.mjs erzeugt, nicht von Hand ändern. */\n';
let count = 0;

for (const raw of blocks) {
  const subset = raw.slice(0, raw.indexOf('*/')).trim();
  const face = raw.slice(raw.indexOf('*/') + 2);
  if (!KEEP.has(subset) || !face.includes('@font-face')) continue;

  const url = face.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)?.[1];
  const family = face.match(/font-family:\s*'([^']+)'/)?.[1];
  const weight = face.match(/font-weight:\s*(\d+)/)?.[1] ?? '400';
  const style = face.match(/font-style:\s*(\w+)/)?.[1] ?? 'normal';
  if (!url || !family) continue;

  const name = `${family.toLowerCase().replace(/\s+/g, '-')}-${weight}${style === 'italic' ? 'i' : ''}-${subset}.woff2`;
  const bytes = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
  writeFileSync(join(OUT_DIR, name), bytes);
  count++;

  out += face
    .replace(/url\(https:\/\/fonts\.gstatic\.com[^)]+\)/, `url(./fonts/${name})`)
    .replace(/^\s*\n/gm, '')
    .trimEnd() + '\n\n';
}

writeFileSync('public/fonts.css', out);
console.log(`${count} Schriftschnitte nach ${OUT_DIR}/, Stylesheet nach public/fonts.css`);
