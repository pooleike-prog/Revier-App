import type { ReactNode } from 'react';
import { useApp, typeDef } from '../state/store';
import { currentJagd, treibenName } from '../lib/selectors';
import { Sheet } from '../components/Sheet';
import { MarkerSheet } from './MarkerSheet';
import { FieldSheet } from './FieldSheet';
import { ReviereSheet } from './ReviereSheet';
import { LegendSheet } from './LegendSheet';
import { ListeSheet } from './ListeSheet';
import { PostSheet } from './PostSheet';
import { NewJagdSheet } from './NewJagdSheet';
import { EntrySheet } from './EntrySheet';
import { NamingSheet } from './NamingSheet';

/** Wählt Kopfzeile und Inhalt des offenen Sheets. */
export function SheetHost() {
  const { state: s, set } = useApp();
  if (!s.sheet) return null;

  const marker = s.markers.find(m => m.id === s.sel);
  const field = s.fieldData.find(f => f.id === s.selField);
  const post = s.posts.find(p => p.id === s.selPost);
  const jagd = currentJagd(s);
  const isDrueck = jagd.art === 'Drückjagd';

  const kicker: Record<string, string> = {
    marker: marker ? typeDef(marker.type).label : '',
    field: 'Ackerfläche',
    reviere: 'Reviere',
    legend: 'Kartenzeichen',
    entry: 'Tagebuch',
    naming: 'Neues Revier',
    liste: jagd.art + ' · ' + jagd.datum,
    post: post ? treibenName(s, post.treiben) : '',
    newjagd: 'Jagdplanung',
  };

  const title: Record<string, string> = {
    marker: marker ? marker.name : '',
    field: field ? field.name : '',
    reviere: 'Reviere verwalten',
    legend: 'Was liegt auf der Karte',
    entry: 'Eintrag anlegen',
    naming: 'Grenze übernehmen',
    liste: isDrueck ? 'Stände und Gebiete' : 'Treiben in Reihenfolge',
    post: post ? (isDrueck ? 'Stand ' : 'Vorstehschütze ') + post.nr : '',
    newjagd: 'Neue Jagd anlegen',
  };

  let body: ReactNode = null;
  switch (s.sheet) {
    case 'marker': body = marker ? <MarkerSheet marker={marker} /> : null; break;
    case 'field': body = field ? <FieldSheet field={field} /> : null; break;
    case 'reviere': body = <ReviereSheet />; break;
    case 'legend': body = <LegendSheet />; break;
    case 'liste': body = <ListeSheet />; break;
    case 'post': body = post ? <PostSheet post={post} /> : null; break;
    case 'newjagd': body = <NewJagdSheet />; break;
    case 'entry': body = <EntrySheet />; break;
    case 'naming': body = <NamingSheet />; break;
  }

  return (
    <Sheet
      kicker={kicker[s.sheet] ?? ''}
      title={title[s.sheet] ?? ''}
      onClose={() => set({ sheet: null, pickTarget: false })}
    >
      {body}
    </Sheet>
  );
}
