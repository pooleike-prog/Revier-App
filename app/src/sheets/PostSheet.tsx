import { useApp } from '../state/store';
import type { Post } from '../types';
import { gps } from '../lib/geo';
import { treibenName } from '../lib/selectors';
import { inputStyle, label } from '../lib/styles';
import { sheetBody } from '../components/Sheet';

export function PostSheet({ post }: { post: Post }) {
  const { state: s, set } = useApp();

  return (
    <div style={sheetBody}>
      <div>
        <div style={{ ...label, marginBottom: 6 }}>Besetzung</div>
        <input
          value={post.name}
          onChange={(e) => {
            const v = e.target.value;
            set(p => ({ posts: p.posts.map(x => (x.id === p.selPost ? { ...x, name: v } : x)) }));
          }}
          placeholder="Name des Schützen"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <div style={label}>Zugehörig</div>
          <div style={{ fontSize: 15 }}>{treibenName(s, post.treiben)}</div>
        </div>
        <div>
          <div style={label}>Position</div>
          <div style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{gps(post.x, post.y)}</div>
        </div>
      </div>

      <button
        onClick={() => set(p => ({ posts: p.posts.filter(x => x.id !== p.selPost), sheet: null, selPost: null }))}
        style={{
          minHeight: 52, border: '2px solid var(--line)', background: 'transparent',
          color: 'var(--ink)', fontSize: 14, textAlign: 'left', padding: '0 14px', cursor: 'pointer',
        }}
      >Stand löschen</button>
    </div>
  );
}
