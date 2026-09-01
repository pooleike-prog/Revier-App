import { useMemo } from 'react';
import { AppProvider, useApp } from './state/store';
import { DEVICE_H, DEVICE_W } from './data/constants';
import { BUECHSENLICHT } from './data/settings';
import type { CtrlMode, Screen } from './types';
import { computeLight } from './lib/astro';
import { fmt, ha } from './lib/geo';
import { activeRevier, currentJagd, kindLabel, treibenOf } from './lib/selectors';
import { logoCrop } from './lib/assets';
import { AndroidDevice } from './components/AndroidDevice';
import { Header } from './components/Header';
import { NavBar } from './components/NavBar';
import { KarteScreen } from './screens/KarteScreen';
import { PlanungScreen } from './screens/PlanungScreen';
import { TagebuchScreen } from './screens/TagebuchScreen';
import { ZeitenScreen } from './screens/ZeitenScreen';
import { AnsitzScreen } from './screens/AnsitzScreen';
import { MehrScreen } from './screens/MehrScreen';
import { SheetHost } from './sheets/SheetHost';

export default function App() {
  return (
    <AppProvider>
      <Canvas />
    </AppProvider>
  );
}

/** Die Präsentationsseite um das Gerät herum — Titel, Beschreibung und der
 *  Umschalter für die beiden Bedienvarianten. */
function Canvas() {
  const { state: s, set } = useApp();

  return (
    <div className="canvas" style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 13, fontWeight: 600, letterSpacing: '.14em',
            textTransform: 'uppercase', color: '#3c4a35',
          }}>Prototyp 02</span>
          <span style={{
            fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase', color: '#66705c',
          }}>Revierkarte · Jagdplanung · Tagebuch · Jagdzeiten</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div role="img" aria-label="Revierpilot" style={{ width: 74, height: 74, flex: 'none', ...logoCrop }} />
          <h1 className="serif" style={{
            margin: 0, fontSize: 38, fontWeight: 500, letterSpacing: '-.01em',
            color: '#26301f', lineHeight: 1.05,
          }}>Revierpilot</h1>
        </div>
        <div style={{ height: 1, background: '#2f3a28' }} />
        <p style={{
          margin: 0, maxWidth: '62ch', fontSize: 15, lineHeight: 1.55,
          color: '#4b5344', textWrap: 'pretty',
        }}>
          Neu: Reiter <b>Planung</b> mit Vorstehschützen, Treibrichtungs-Pfeilen, Flächenteilung und
          wählbaren Kartenausschnitten — für Treibjagd und Drückjagd. Marker tragen jetzt Symbole; in{' '}
          <b>Mehr → Kartenzeichen</b> auf Buchstaben umschaltbar. Jagdzeiten sind nach Schalenwild,
          Haarwild, Raubwild und Federwild gegliedert.
        </p>
      </div>

      <div className="stage">
        <AndroidDevice width={DEVICE_W} height={DEVICE_H} dark={s.night}>
          <AppFrame />
        </AndroidDevice>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{
          fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6b6663',
        }}>Kartenbedienung</span>
        {([['werkzeug', 'A · Werkzeugleiste'], ['zielkreuz', 'B · Zielkreuz']] as Array<[CtrlMode, string]>).map(([id, text]) => {
          const on = s.ctrl === id;
          return (
            <button
              key={id}
              onClick={() => set({ ctrl: id, tool: null, radial: false, aim: null })}
              style={{
                minHeight: 44, padding: '0 16px', fontSize: 13, fontWeight: on ? 600 : 400,
                border: '2px solid ' + (on ? '#6f5a23' : '#3a3a2c'),
                background: on ? '#6f5a23' : 'transparent',
                color: on ? '#faf6ec' : '#23231c', cursor: 'pointer',
              }}
            >{text}</button>
          );
        })}
      </div>
    </div>
  );
}

function AppFrame() {
  const { state: s, set } = useApp();
  const light = useMemo(() => computeLight(s.dayOff, BUECHSENLICHT), [s.dayOff]);

  const act = activeRevier(s);
  const jagd = currentJagd(s);
  const isDrueck = jagd.art === 'Drückjagd';
  const myTreiben = treibenOf(s, jagd.id);
  const treibenIds = myTreiben.map(t => t.id);

  const title: Record<Screen, string> = {
    karte: act.name,
    planung: jagd.art + ' ' + jagd.datum,
    tagebuch: 'Jagdtagebuch',
    zeiten: 'Jagdzeiten',
    ansitz: 'Ansitz-Planung',
    mehr: 'Einstellungen',
  };

  const sub: Record<Screen, string> = {
    karte: `${fmt(ha(act.points), 0)} ha · ${kindLabel(act.kind)} · ${s.markers.filter(m => (m.revier || 'r1') === act.id).length} Marker`,
    planung: myTreiben.length + (isDrueck ? ' Gebiete · ' : ' Treiben · ')
      + s.posts.filter(p => treibenIds.indexOf(p.treiben) >= 0).length + (isDrueck ? ' Stände' : ' Schützen'),
    tagebuch: `${s.journal.length} Einträge · Jagdjahr 2026/27`,
    zeiten: 'Niedersachsen · 4 Kategorien',
    ansitz: light.sub,
    mehr: 'Offline · Recht · Bedienung',
  };

  return (
    <div
      className="app"
      data-night={s.night ? '1' : '0'}
      data-mapstyle={s.mapStyle}
      style={{
        position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
        background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'Lora, Georgia, serif', overflow: 'hidden',
      }}
    >
      <Header
        title={title[s.screen]}
        sub={sub[s.screen]}
        night={s.night}
        onToggleNight={() => set(p => ({ night: !p.night }))}
      />

      {s.screen === 'karte' && <KarteScreen />}
      {s.screen === 'planung' && <PlanungScreen />}
      {s.screen === 'tagebuch' && <TagebuchScreen />}
      {s.screen === 'zeiten' && <ZeitenScreen />}
      {s.screen === 'ansitz' && <AnsitzScreen light={light} />}
      {s.screen === 'mehr' && <MehrScreen />}

      <SheetHost />

      <NavBar
        screen={s.screen}
        onSelect={(screen) => set({
          screen, sheet: null, tool: null, radial: false, aim: null, pTool: null, pPend: null,
        })}
      />
    </div>
  );
}
