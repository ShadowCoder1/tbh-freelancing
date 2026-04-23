// Shared primitives + overlays + routing helpers

const useState = React.useState;
const useEffect = React.useEffect;
const useRef = React.useRef;
const useMemo = React.useMemo;

function fmtDate(ts) {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60*1000) return 'JUST NOW';
  if (diff < 60*60*1000) return Math.floor(diff / 60000) + 'M AGO';
  if (diff < 24*60*60*1000) return Math.floor(diff / 3600000) + 'H AGO';
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' }).toUpperCase();
}
function fmtDateFull(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() + ' — ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function Kicker({ children, red, ghost }) {
  return <span className={'kicker' + (red ? ' red' : '') + (ghost ? ' ghost' : '')}>{children}</span>;
}

function BylineStamp({ editor }) {
  if (!editor) return null;
  return (
    <span className="byline-stamp">
      <span className="dash">//</span>
      <span style={{ color: editor.color }}>BY {editor.name}</span>
    </span>
  );
}

function Reactions({ postId }) {
  const post = window.getPost(postId);
  if (!post) return null;
  const glyphs = {
    fire: '※ FIRE',
    cosign: '✓ COSIGN',
    sideeye: '◉ SIDE-EYE',
    receipts: '❏ RECEIPTS',
  };
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {Object.entries(glyphs).map(([k, label]) => (
        <button key={k} className="rxn" onClick={() => window.toggleReaction(postId, k)}>
          <span className="glyph">{label}</span>
          <span>{post.reactions[k] || 0}</span>
        </button>
      ))}
    </div>
  );
}

function Ticker({ items }) {
  const content = [...items, ...items];
  return (
    <div className="topbar">
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <span style={{ background: 'var(--red)', padding: '2px 6px' }}>● LIVE</span>
      </div>
      <div className="ticker" style={{ maxWidth: '55%' }}>
        <div className="ticker-track">
          {content.map((t, i) => <span key={i}>◆ {t}</span>)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14 }}><span>ENC / E2E</span><span>SIG CHECK ✓</span></div>
    </div>
  );
}

function Masthead({ nav, route, session, paper }) {
  const name = paper ? paper.name : 'tobehonest';
  const tagline = paper ? paper.tagline : 'THREE VOICES. ONE DISPATCH. NO HANDLERS.';
  return (
    <>
      <div className="folio" style={{ borderTop: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)' }}>
        <span>VOL. I — {new Date(paper?.createdAt || Date.now()).getFullYear()}</span>
        <span className="center">{fmtDateFull(Date.now())}</span>
        <span>PRICE: YOUR ATTENTION</span>
      </div>
      <div className="masthead">
        <h1 className="f-mast" style={{ cursor: 'pointer' }} onClick={() => nav({ view: 'home' })}>{name}</h1>
        <div className="tag">{tagline}</div>
      </div>
      <div className="folio rule-b-dbl" style={{ paddingBottom: 10, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <a className="ink-link" onClick={() => nav({ view: 'home' })} style={{ cursor: 'pointer' }}>FRONT PAGE</a>
          <a className="ink-link" onClick={() => nav({ view: 'archive', paperId: paper?.id })} style={{ cursor: 'pointer' }}>ARCHIVE</a>
          <a className="ink-link" onClick={() => nav({ view: 'discover' })} style={{ cursor: 'pointer' }}>◈ DISCOVER PAPERS</a>
          <a className="ink-link" onClick={() => nav({ view: 'create' })} style={{ cursor: 'pointer' }}>+ START A PAPER</a>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {session ? (
            <>
              <span style={{ color: session.editor.color, fontWeight: 700 }}>● {session.editor.name} @ {session.paper.name}</span>
              <a className="ink-link" onClick={() => nav({ view: 'composer' })} style={{ cursor: 'pointer' }}>→ COMPOSE</a>
              <a className="ink-link" onClick={() => { window.logout(); nav({ view: 'home' }); }} style={{ cursor: 'pointer' }}>⎋ OUT</a>
            </>
          ) : (
            <a className="ink-link" onClick={() => nav({ view: 'login-pick' })} style={{ cursor: 'pointer' }}>⎙ SIGN IN</a>
          )}
        </div>
      </div>
    </>
  );
}

// First-visit popup for tobehonest
function WelcomePopup({ onBrowse, onWrite, onClose }) {
  const [open, setOpen] = useState(() => {
    try { return !localStorage.getItem('tbh_welcomed_v2'); } catch(e) { return true; }
  });
  if (!open) return null;
  const close = () => {
    try { localStorage.setItem('tbh_welcomed_v2', '1'); } catch(e) {}
    setOpen(false);
    onClose && onClose();
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,9,8,.7)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--paper)', border: '3px double var(--ink)', boxShadow: '8px 8px 0 var(--ink)', padding: 32, maxWidth: 540 }}>
        <div className="f-mono" style={{ fontSize: 10, letterSpacing: '.24em', color: 'var(--red)', fontWeight: 700 }}>⌠ WELCOME TO TOBEHONEST ⌡</div>
        <h2 className="f-head" style={{ fontSize: 44, lineHeight: .95, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-.02em', marginTop: 8 }}>
          This is our paper.<br/>Make your own.
        </h2>
        <p className="f-type mt-12" style={{ fontSize: 15, lineHeight: 1.5 }}>
          <em>tobehonest</em> is written by Rae, Age, and Old. You're reading our lives. But anyone can start
          their own paper here — solo, with friends, public or private. Scroll through everyone else, or
          claim your own masthead.
        </p>
        <div className="flex gap-8 mt-24" style={{ flexWrap: 'wrap' }}>
          <button className="btn solid" onClick={() => { close(); onBrowse(); }}>◈ BROWSE OTHER PAPERS</button>
          <button className="btn red" onClick={() => { close(); onWrite(); }}>+ START YOUR OWN</button>
          <button className="btn" onClick={close}>→ JUST READ TOBEHONEST</button>
        </div>
      </div>
    </div>
  );
}

// Paper front-page "card" for discover feed
function PaperCard({ paper, onOpen }) {
  const live = window.isPaperLive(paper);
  const posts = window.getPaperPosts(paper.id, { includeArchived: false });
  const lead = posts.find(p => p.type === 'dispatch');
  const takes = posts.filter(p => p.type === 'take').slice(0, 2);
  const editors = Object.values(paper.editors);
  return (
    <article
      onClick={() => onOpen(paper.id)}
      style={{
        border: '1px solid var(--ink)',
        padding: 18,
        cursor: 'pointer',
        background: 'var(--paper)',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'transform .08s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translate(-2px, -2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      <div className="flex between center">
        <span className="f-mast" style={{ fontSize: 28, lineHeight: 1 }}>{paper.name}</span>
        {live && <span className="f-mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--red)', fontWeight: 700 }}>● LIVE — TYPING</span>}
      </div>
      <div className="f-mono" style={{ fontSize: 9, letterSpacing: '.18em', opacity: .7 }}>{paper.tagline}</div>
      <div className="rule-dash" style={{ margin: '4px 0' }}></div>
      {lead ? (
        <div>
          <div className="f-mono" style={{ fontSize: 9, letterSpacing: '.18em', color: 'var(--red)', fontWeight: 700 }}>LEAD — {fmtDate(lead.createdAt)}</div>
          <div className="f-head" style={{ fontSize: 22, lineHeight: 1.05, fontWeight: 900, fontStyle: 'italic', marginTop: 4 }}>{lead.headline || '(untitled)'}</div>
        </div>
      ) : (
        <div className="f-type" style={{ fontSize: 13, opacity: .55, fontStyle: 'italic' }}>no dispatch yet — masthead freshly hung</div>
      )}
      {takes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {takes.map(t => (
            <div key={t.id} className="f-type" style={{ fontSize: 13, lineHeight: 1.4, borderLeft: '2px solid var(--ink)', paddingLeft: 8, opacity: .8 }}>
              "{t.body.slice(0, 120)}{t.body.length > 120 ? '…' : ''}"
            </div>
          ))}
        </div>
      )}
      <div className="flex between center mt-8" style={{ paddingTop: 8, borderTop: '1px dashed var(--ink)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {editors.slice(0, 4).map(e => (
            <span key={e.id} className="f-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', color: e.color }}>{e.tag}{e.name}</span>
          ))}
        </div>
        <span className="f-mono" style={{ fontSize: 9, opacity: .6 }}>{posts.length} FILED</span>
      </div>
    </article>
  );
}

Object.assign(window, { fmtDate, fmtDateFull, Kicker, BylineStamp, Reactions, Ticker, Masthead, WelcomePopup, PaperCard });
