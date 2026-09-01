// Prüft die Einzeldatei-Fassung: lädt sie ohne Server, achtet auf Fehler und
// auf seitliches Scrollen. Kernprüfung: derselbe relative Tipp auf der Karte
// muss auf jedem Display dieselbe Koordinate ergeben — sonst rechnet die
// verkleinerte Bühne die Zeigerposition falsch um.
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const FILE = process.argv[2];
const preinstalled = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(existsSync(preinstalled) ? { executablePath: preinstalled } : {});

const problems = [];
const fixes = [];

for (const [name, viewport] of [
  ['Desktop 1100', { width: 1100, height: 1400 }],
  ['Telefon  390', { width: 390, height: 844 }],
  ['schmal   360', { width: 360, height: 780 }],
]) {
  const page = await browser.newPage({ viewport });
  page.on('pageerror', e => problems.push(`${name}: ${e.message}`));
  page.on('console', m => {
    // Google Fonts ist in dieser Umgebung gesperrt — kein App-Fehler.
    if (m.type() === 'error' && !/ERR_CONNECTION_RESET|fonts\.googleapis/.test(m.text())) {
      problems.push(`${name}: ${m.text()}`);
    }
  });
  await page.goto('file://' + FILE);
  await page.locator('.app').waitFor({ timeout: 5000 });

  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 0) problems.push(`${name}: Seite scrollt ${overflow}px seitlich`);

  await page.locator('button:has-text("Salzlecke")').last().click();
  const surface = page.locator('.app div[style*="crosshair"]').first();
  const box = await surface.boundingBox();
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.4);

  // Das Sheet zeigt die Koordinate des gesetzten Markers.
  await page.getByText('Position', { exact: true }).waitFor({ timeout: 3000 });
  const coords = await page.getByText(/\d+,\d+ N {2}\d+,\d+ E/).first().textContent();
  fixes.push({ name, coords: coords.trim() });
  await page.close();
}

await browser.close();

for (const f of fixes) console.log(`     ${f.name} → ${f.coords}`);
const unique = new Set(fixes.map(f => f.coords));
if (unique.size === 1) console.log(`ok   gleicher Tipp, gleiche Koordinate auf allen drei Displays`);
else problems.push('Tipp landet je nach Displaybreite woanders: ' + [...unique].join(' / '));

console.log(problems.length ? '\nPROBLEME:\n- ' + problems.join('\n- ') : '\nAlles sauber.');
process.exit(problems.length ? 1 : 0);
