import { useApp } from '../state/store';
import { CROPS } from '../data/constants';
import type { Field } from '../types';
import { fmt, ha } from '../lib/geo';
import { chip, label } from '../lib/styles';
import { sheetBody } from '../components/Sheet';

export function FieldSheet({ field }: { field: Field }) {
  const { set } = useApp();

  return (
    <div style={sheetBody}>
      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <div style={label}>Größe</div>
          <div style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{fmt(ha(field.points), 2)} ha</div>
        </div>
        <div>
          <div style={label}>Bewirtschafter</div>
          <div style={{ fontSize: 15 }}>{field.farmer}</div>
        </div>
      </div>

      <div>
        <div style={{ ...label, marginBottom: 6 }}>Ackerfrucht 2026</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CROPS.map(c => (
            <button
              key={c}
              onClick={() => set(p => ({
                fieldData: p.fieldData.map(f => (f.id === p.selField ? { ...f, crop: c } : f)),
              }))}
              style={chip(field.crop === c, { minHeight: 44, fontSize: 13 })}
            >{c}</button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ ...label, marginBottom: 8 }}>Historie</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {field.history.map(h => (
            <div key={h.year} style={{ display: 'flex', gap: 14, padding: '9px 0', borderBottom: '1px solid var(--rule)' }}>
              <span style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums', color: 'var(--muted)', width: 44 }}>{h.year}</span>
              <span style={{ fontSize: 14, flex: 1 }}>{h.crop}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{h.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
