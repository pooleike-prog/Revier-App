/* Rauchtest: klickt alle sechs Reiter durch und prüft, dass Karte, Planung,
   Tagebuch, Jagdzeiten, Büchsenlicht und Einstellungen das tun, was der Entwurf
   beschreibt. Voraussetzung: `npm run build && npm run preview` läuft.

   Aufruf: npm run smoke   (oder URL=http://… node test/smoke.mjs) */

import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const URL = process.env.URL || 'http://localhost:4173/';
const errors = [];
const notes = [];

// Vorinstalliertes Chromium nutzen, wenn eines bereitliegt.
const preinstalled = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(existsSync(preinstalled) ? { executablePath: preinstalled } : {});
const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });

page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('requestfailed', r => notes.push('     netfail ' + r.url().slice(0, 70) + ' — ' + (r.failure()?.errorText || '')));

await page.goto(URL, { waitUntil: 'networkidle' });

const nav = page.locator('.app > div:last-child');
const navBtn = (label) => nav.locator(`button:has(span:text-is("${label}"))`);
const app = page.locator('.app');
const headerTitle = app.locator('> div').first().locator('.serif').first();

async function check(name, fn) {
  try { await fn(); notes.push('ok   ' + name); }
  catch (e) { notes.push('FAIL ' + name + ' — ' + e.message); errors.push(name + ': ' + e.message); }
}

await check('Karte rendert mit aktivem Revier im Kopf', async () => {
  const t = await headerTitle.textContent();
  if (t.trim() !== 'Revier Eichenkamp') throw new Error(`Kopfzeile = "${t}"`);
});

await check('Marker-Pins liegen auf der Karte', async () => {
  const pins = await page.locator('.app svg[viewBox="0 0 24 24"]').count();
  if (pins < 8) throw new Error(`nur ${pins} Symbole`);
});

await check('Fruchtart-Labels sichtbar', async () => {
  const n = await page.getByText('Winterweizen', { exact: true }).count();
  if (n < 1) throw new Error('kein Fruchtart-Label');
});

await check('Kartenstil auf Satellit umschaltbar', async () => {
  await page.getByRole('button', { name: 'Satellit' }).click();
  const v = await app.getAttribute('data-mapstyle');
  if (v !== 'sat') throw new Error('data-mapstyle=' + v);
  await page.getByRole('button', { name: 'Topografie' }).click();
});

await check('Rotlichtmodus schaltet die Palette um', async () => {
  await page.getByRole('button', { name: /Rotlichtmodus einschalten/ }).click();
  const v = await app.getAttribute('data-night');
  if (v !== '1') throw new Error('data-night=' + v);
  await page.getByRole('button', { name: /Tagmodus einschalten/ }).click();
});

await check('Revier-Sheet öffnet und schließt', async () => {
  await page.getByRole('button', { name: 'REV', exact: true }).click();
  await page.getByText('Reviere verwalten').waitFor({ timeout: 2000 });
  await page.getByRole('button', { name: 'Schließen' }).click();
});

await check('Legenden-Sheet zeigt alle sieben Kartenzeichen', async () => {
  await page.getByRole('button', { name: 'i', exact: true }).click();
  await page.getByText('Was liegt auf der Karte').waitFor({ timeout: 2000 });
  for (const l of ['Ansitz / Hochsitz', 'Falle', 'Wechsel', 'Kirrung / Luderplatz', 'Tierbestätigung', 'Salzlecke', 'Erlegungsort']) {
    if (await page.getByText(l, { exact: true }).count() < 1) throw new Error('fehlt: ' + l);
  }
  await page.getByRole('button', { name: 'Schließen' }).click();
});

await check('Marker setzen öffnet das Marker-Sheet', async () => {
  await page.locator('button:has-text("Wechsel")').last().click();
  const box = await app.locator('div[style*="cursor:crosshair"], div[style*="cursor: crosshair"]').first().boundingBox();
  await page.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.55);
  await page.getByText('Bezeichnung').waitFor({ timeout: 2000 });
  await page.getByText('Wechsel gesetzt', { exact: false }).first().waitFor({ timeout: 2000 });
  await page.getByRole('button', { name: 'Schließen' }).click();
});

await check('Messen-Modus lässt sich einschalten', async () => {
  await page.getByRole('button', { name: 'MESSEN' }).click();
  await page.getByText(/Über die Karte ziehen/).waitFor({ timeout: 2000 });
  await page.getByRole('button', { name: 'MESSEN' }).click();
});

await check('Grenze zeichnen zeigt den Hinweis', async () => {
  await page.getByRole('button', { name: 'GRENZE' }).click();
  await page.getByText('Reviergrenze zeichnen').waitFor({ timeout: 2000 });
  await page.getByRole('button', { name: 'Abbr.' }).click();
});

await check('Planung: Treiben, Werkzeuge und Liste', async () => {
  await navBtn('Planung').click();
  await page.getByText('1. Eichenkamp Nord').first().waitFor({ timeout: 2000 });
  await page.getByRole('button', { name: 'LISTE' }).click();
  await page.getByText('Treiben in Reihenfolge').waitFor({ timeout: 2000 });
  await page.getByText('3 Vorstehschützen').first().waitFor({ timeout: 2000 });
  await page.getByRole('button', { name: 'Schließen' }).click();
});

await check('Planung: Drückjagd benennt Stände statt Schützen', async () => {
  await page.locator('button:has-text("14.11.2026")').click();
  await page.getByRole('button', { name: 'LISTE' }).click();
  await page.getByText('Stände und Gebiete').waitFor({ timeout: 2000 });
  await page.getByRole('button', { name: 'Schließen' }).click();
  await page.locator('button:has-text("28.10.2026")').click();
});

await check('Tagebuch listet Einträge und filtert', async () => {
  await navBtn('Tagebuch').click();
  await page.getByText('Rehbock, 18,5 kg').waitFor({ timeout: 2000 });
  await page.getByRole('button', { name: 'Abschuss', exact: true }).click();
  if (await page.getByText('Ansitz 2 h, kein Anblick').count() > 0) throw new Error('Filter greift nicht');
  await page.getByRole('button', { name: 'Alle', exact: true }).click();
});

await check('Jagdzeiten: vier Kategorien, Schalenwild offen', async () => {
  await navBtn('Zeiten').click();
  for (const g of ['Schalenwild', 'Haarwild', 'Raubwild', 'Federwild']) {
    await page.getByText(g, { exact: true }).first().waitFor({ timeout: 2000 });
  }
  await page.getByText('Muffelwild', { exact: true }).waitFor({ timeout: 2000 });
  await page.locator('button:has-text("Federwild")').click();
  await page.getByText('Waldschnepfe', { exact: true }).waitFor({ timeout: 2000 });
});

await check('Ansitz: Büchsenlicht ist gerechnet, nicht leer', async () => {
  await navBtn('Ansitz').click();
  const times = await app.locator('.serif').filter({ hasText: /^\d{2}:\d{2}$/ }).allTextContents();
  if (times.length < 2) throw new Error('Büchsenlicht-Zeiten fehlen: ' + JSON.stringify(times));
  notes.push('     Büchsenlicht ' + times.join(' – '));
  const moon = await page.getByText(/Mond zu \d+ %|Dunkle Nacht|Helle Nacht/).count();
  if (!moon) throw new Error('Mondbewertung fehlt');
});

await check('Ansitz: Tagesnavigation rechnet neu', async () => {
  const before = await app.locator('.serif').nth(1).textContent();
  await page.getByRole('button', { name: 'Nächster Tag' }).click();
  const after = await app.locator('.serif').nth(1).textContent();
  if (before === after) throw new Error('Datum unverändert: ' + before);
  await page.getByRole('button', { name: 'Vorheriger Tag' }).click();
});

await check('Mehr: Kartenzeichen auf Buchstaben umschaltbar', async () => {
  await navBtn('Mehr').click();
  await page.getByText('Buchstaben', { exact: true }).click();
  await navBtn('Karte').click();
  const codes = await page.locator('.app span').filter({ hasText: /^[AFWKTSE]$/ }).count();
  if (codes < 5) throw new Error('nur ' + codes + ' Kürzel');
  await navBtn('Mehr').click();
  await page.getByText('Symbole', { exact: true }).click();
});

await check('Zielkreuz-Variante zeigt den FAB', async () => {
  await page.getByText('Variante B · Zielkreuz').click();
  await navBtn('Karte').click();
  await page.getByRole('button', { name: 'Marker setzen' }).click();
  await page.getByText('Salzlecke', { exact: true }).first().click();
  await page.getByText('Hier setzen').waitFor({ timeout: 2000 });
  await page.getByRole('button', { name: 'Abbrechen' }).click();
});

await browser.close();

console.log(notes.join('\n'));
console.log('\n' + (errors.length ? `${errors.length} PROBLEM(E):\n- ` + errors.join('\n- ') : 'Keine Fehler, keine Konsolenmeldungen.'));
process.exit(errors.length ? 1 : 0);
