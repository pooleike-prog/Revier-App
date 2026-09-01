// Packt den Vite-Build in eine einzelne HTML-Datei für die Artifact-Vorschau:
// CSS, JS, Schriften und Logo inline. Service Worker und Manifest fallen weg —
// die gibt es in einer Einzeldatei nicht.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const OUT = process.argv[2];

const assets = readdirSync(join(DIST, 'assets'));
const jsName = assets.find(f => f.endsWith('.js'));
const cssName = assets.find(f => f.endsWith('.css'));
if (!jsName || !cssName) throw new Error('Build-Assets nicht gefunden: ' + assets.join(', '));

const css = readFileSync(join(DIST, 'assets', cssName), 'utf8');
let js = readFileSync(join(DIST, 'assets', jsName), 'utf8');

const dataUri = (path, mime) =>
  `data:${mime};base64,` + readFileSync(path).toString('base64');

// Schriften einbetten, damit die Vorschau auch ohne Netz richtig setzt.
let fonts = readFileSync(join(DIST, 'fonts.css'), 'utf8');
let eingebettet = 0;
fonts = fonts.replace(/url\(\.\/fonts\/([^)]+)\)/g, (_, file) => {
  eingebettet++;
  return `url(${dataUri(join(DIST, 'fonts', file), 'font/woff2')})`;
});

const logo = dataUri(join(DIST, 'revierpilot-logo.png'), 'image/png');
const vorher = js.length;
js = js.split('./revierpilot-logo.png').join(logo);
if (js.length === vorher) throw new Error('Logo-Referenz im Bundle nicht gefunden');

// Ein "</script>" in einer Zeichenkette würde den Inline-Block beenden.
js = js.split('</script').join('<\\/script');

const html = `<title>Revierpilot</title>
<style>
${fonts}
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;

writeFileSync(OUT, html);
console.log(`${OUT}  ${(html.length / 1024 / 1024).toFixed(2)} MB, ${eingebettet} Schriftschnitte eingebettet`);
