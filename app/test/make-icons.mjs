// Erzeugt aus public/revierpilot-logo.png alles Abgeleitete: die Web-Icons,
// die Android-Launcher-Icons in allen Dichten und die Startbildschirme.
// Aufruf: node test/make-icons.mjs   (nur nötig, wenn das Logo sich ändert)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { PNG } from 'pngjs';

const SRC = 'public/revierpilot-logo.png';
const OUT = 'public/icons';
mkdirSync(OUT, { recursive: true });

const src = PNG.sync.read(readFileSync(SRC));

/** Mittelt über den ganzen Quellbereich je Zielpixel — bei starker
 *  Verkleinerung deutlich sauberer als einzelne Pixel zu greifen. */
function resize(img, size) {
  const out = new PNG({ width: size, height: size });
  const sx = img.width / size, sy = img.height / size;
  for (let y = 0; y < size; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    for (let x = 0; x < size; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * img.width + xx) << 2;
          r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; a += img.data[i + 3];
          n++;
        }
      }
      const o = (y * size + x) << 2;
      out.data[o] = r / n; out.data[o + 1] = g / n; out.data[o + 2] = b / n; out.data[o + 3] = a / n;
    }
  }
  return out;
}

/** Adaptive Icons auf Android werden rund oder eckig beschnitten — das Logo
 *  muss deshalb innerhalb der inneren 80 % bleiben, außen Pergament. */
function padded(img, size, inner, [br, bg, bb]) {
  const small = resize(img, inner);
  const out = new PNG({ width: size, height: size });
  const off = Math.round((size - inner) / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) << 2;
      const ix = x - off, iy = y - off;
      if (ix >= 0 && iy >= 0 && ix < inner && iy < inner) {
        const i = (iy * inner + ix) << 2;
        const alpha = small.data[i + 3] / 255;
        // Über den Pergamentgrund legen, damit keine Transparenz übrig bleibt.
        out.data[o] = small.data[i] * alpha + br * (1 - alpha);
        out.data[o + 1] = small.data[i + 1] * alpha + bg * (1 - alpha);
        out.data[o + 2] = small.data[i + 2] * alpha + bb * (1 - alpha);
      } else {
        out.data[o] = br; out.data[o + 1] = bg; out.data[o + 2] = bb;
      }
      out.data[o + 3] = 255;
    }
  }
  return out;
}

/** Logo mittig auf einer Fläche — für die Startbildschirme, die quer wie
 *  hochkant in festen Maßen vorliegen. */
function centred(img, width, height, logoPx, [br, bg, bb]) {
  const logo = resize(img, logoPx);
  const out = new PNG({ width, height });
  const ox = Math.round((width - logoPx) / 2), oy = Math.round((height - logoPx) / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) << 2;
      const ix = x - ox, iy = y - oy;
      if (ix >= 0 && iy >= 0 && ix < logoPx && iy < logoPx) {
        const i = (iy * logoPx + ix) << 2;
        const alpha = logo.data[i + 3] / 255;
        out.data[o] = logo.data[i] * alpha + br * (1 - alpha);
        out.data[o + 1] = logo.data[i + 1] * alpha + bg * (1 - alpha);
        out.data[o + 2] = logo.data[i + 2] * alpha + bb * (1 - alpha);
      } else {
        out.data[o] = br; out.data[o + 1] = bg; out.data[o + 2] = bb;
      }
      out.data[o + 3] = 255;
    }
  }
  return out;
}

const PERGAMENT = [0xf2, 0xee, 0xe2];
const written = [];

// ── Web ──
for (const size of [64, 192, 512]) {
  const name = size === 64 ? 'favicon-64.png' : `icon-${size}.png`;
  writeFileSync(`${OUT}/${name}`, PNG.sync.write(resize(src, size)));
  written.push(name);
}
writeFileSync(`${OUT}/icon-maskable-512.png`, PNG.sync.write(padded(src, 512, 410, PERGAMENT)));
written.push('icon-maskable-512.png');
console.log(`${SRC} (${src.width}×${src.height}) → ${written.join(', ')}`);

// ── Android ──
const RES = 'android/app/src/main/res';
if (!existsSync(RES)) {
  console.log(`${RES} fehlt — Android-Icons übersprungen (npx cap add android)`);
  process.exit(0);
}

// Launcher-Icon je Bildschirmdichte. Das Vordergrund-Bild eines adaptiven
// Icons ist 108 dp groß, sichtbar bleibt nur die innere Fläche — deshalb
// sitzt das Logo dort auf zwei Dritteln.
const DICHTEN = [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]];
let n = 0;
for (const [dichte, px] of DICHTEN) {
  const dir = `${RES}/mipmap-${dichte}`;
  const icon = PNG.sync.write(resize(src, px));
  writeFileSync(`${dir}/ic_launcher.png`, icon);
  writeFileSync(`${dir}/ic_launcher_round.png`, icon);
  const fg = Math.round(px * 108 / 48);
  writeFileSync(`${dir}/ic_launcher_foreground.png`, PNG.sync.write(padded(src, fg, Math.round(fg * 2 / 3), PERGAMENT)));
  n += 3;
}
writeFileSync(
  `${RES}/values/ic_launcher_background.xml`,
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
  + '    <color name="ic_launcher_background">#F2EEE2</color>\n</resources>\n',
);
console.log(`${n} Launcher-Icons in ${DICHTEN.length} Dichten, Hintergrund auf Pergament`);

// Startbildschirme in den vorhandenen Maßen ersetzen — die legt Capacitor an.
let s = 0;
for (const dir of ['drawable', ...['port', 'land'].flatMap(o => DICHTEN.map(([d]) => `drawable-${o}-${d}`))]) {
  const file = `${RES}/${dir}/splash.png`;
  if (!existsSync(file)) continue;
  const { width, height } = PNG.sync.read(readFileSync(file));
  const logoPx = Math.round(Math.min(width, height) / 3);
  writeFileSync(file, PNG.sync.write(centred(src, width, height, logoPx, PERGAMENT)));
  s++;
}
console.log(`${s} Startbildschirme auf Pergament mit zentriertem Logo`);
