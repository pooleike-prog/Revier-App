// Packt den Vite-Build in eine einzelne HTML-Datei für die Artifact-Vorschau:
// CSS und JS inline, das Logo als data:-URI.
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

const logo = readFileSync('public/revierpilot-logo.png').toString('base64');
const logoUri = 'data:image/png;base64,' + logo;

const before = js.length;
js = js.split('./revierpilot-logo.png').join(logoUri);
if (js.length === before) throw new Error('Logo-Referenz im Bundle nicht gefunden');

// Ein "</script>" in einer Zeichenkette würde den Inline-Block beenden.
js = js.split('</script').join('<\\/script');

const html = `<title>Revierpilot</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;

writeFileSync(OUT, html);
console.log(`${OUT}  ${(html.length / 1024 / 1024).toFixed(2)} MB`);
