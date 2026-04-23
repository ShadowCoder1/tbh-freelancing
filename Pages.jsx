// Remaining pages: Discover, Archive, PostView, Composer, Login, Create

// ============ DISCOVER ============
function DiscoverPage({ nav }) {
  window.useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all'); // all | live | new | active
  const papers = window.getAllPapers().filter(p => !p.isPrivate);

  let list = papers;
  if (q) list = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.tagline.toLowerCase().includes(q.toLowerCase()));
  if (filter === 'live') list = list.filter(p => window.isPaperLive(p));
  if (filter === 'new') list = list.filter(p => Date.now() - p.createdAt < 7 * 24 * 3600 * 1000);
  if (filter === 'active') list = list.filter(p => window.getPaperPosts(p.id).length > 0);
  list = list.sort((a, b) => {
    if (a.isFlagship) return -1;
    if (b.isFlagship) return 1;
    return b.createdAt - a.createdAt;
  });

  return (
    <main style={{ maxWidth: 1320, margin: '0 auto', padding: '20px 28px 80px' }}>
      <div className="flex between center mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <window.Kicker red>◈ DISCOVERY WIRE</window.Kicker>
          <h1 className="f-head" style={{ fontSize: 56, lineHeight: .95, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-.02em', marginTop: 8 }}>EVERYONE'S PAPER.</h1>
          <p className="f-type mt-8" style={{ fontSize: 15, maxWidth: 520, lineHeight: 1.5 }}>
            Scroll through every public paper. Filter by what's live, what's new, what's got posts.
          </p>
        </div>
        <button className="btn solid" onClick={() => nav({ view: 'create' })}>+ START YOUR OWN</button>
      </div>

      <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="SEARCH PAPERS…" className="f-mono"
          style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: '8px 12px', fontSize: 12, letterSpacing: '.1em', outline: 'none', width: 260 }} />
        {[['all','ALL'],['live','● LIVE NOW'],['new','○ NEW THIS WEEK'],['active','✎ HAS POSTS']].map(([k,l]) => (
          <button key={k} className={'rxn' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>{l}</button>
        ))}
        <span className="f-mono" style={{ fontSize: 10, opacity: .6, marginLeft: 'auto' }}>{list.length} PAPERS</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {list.map(p => <window.PaperCard key={p.id} paper={p} onOpen={id => nav({ view: 'home', paperId: id })} />)}
      </div>
      {list.length === 0 && <Empty label="NOTHING MATCHES" note="Loosen the filter or start your own paper." />}
    </main>
  );
}

// ============ ARCHIVE ============
function ArchivePage({ paperId, editorId, nav }) {
  window.useStore();
  const paper = window.getPaper(paperId);
  if (!paper) return <Empty label="NO PAPER" />;
  const [filterEditor, setFilterEditor] = useState(editorId || 'all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const editors = Object.values(paper.editors);
  let posts = window.getPaperPosts(paperId);
  if (filterEditor !== 'all') posts = posts.filter(p => p.editorId === filterEditor);
  if (filterType !== 'all') posts = posts.filter(p => p.type === filterType);
  posts = posts.slice().sort((a, b) => sortBy === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);
  // group by month
  const groups = {};
  posts.forEach(p => {
    const k = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    if (!groups[k]) groups[k] = [];
    groups[k].push(p);
  });

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 28px 80px' }}>
      <button className="btn mb-16" onClick={() => nav({ view: 'home', paperId })}>← BACK TO FRONT PAGE</button>
      <window.Kicker red>⎗ THE ARCHIVE — {paper.name.toUpperCase()}</window.Kicker>
      <h1 className="f-head" style={{ fontSize: 56, lineHeight: .95, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-.02em', marginTop: 8, marginBottom: 20 }}>
        EVERYTHING ON THE RECORD.
      </h1>

      <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
        <span className="f-mono" style={{ fontSize: 10, letterSpacing: '.2em', alignSelf: 'center' }}>FILTER:</span>
        <button className={'rxn' + (filterEditor === 'all' ? ' active' : '')} onClick={() => setFilterEditor('all')}>ALL EDITORS</button>
        {editors.map(e => (
          <button key={e.id} className={'rxn' + (filterEditor === e.id ? ' active' : '')} onClick={() => setFilterEditor(e.id)} style={{ borderColor: e.color, color: filterEditor === e.id ? undefined : e.color }}>{e.name}</button>
        ))}
        <span className="f-mono" style={{ fontSize: 10, letterSpacing: '.2em', alignSelf: 'center', marginLeft: 12 }}>TYPE:</span>
        {[['all','ALL'],['dispatch','DISPATCHES'],['take','HOT TAKES']].map(([k,l]) => (
          <button key={k} className={'rxn' + (filterType === k ? ' active' : '')} onClick={() => setFilterType(k)}>{l}</button>
        ))}
        <button className="rxn" onClick={() => setSortBy(s => s === 'newest' ? 'oldest' : 'newest')} style={{ marginLeft: 'auto' }}>
          ↕ {sortBy === 'newest' ? 'NEWEST' : 'OLDEST'} FIRST
        </button>
      </div>

      {posts.length === 0 ? <Empty label="NO ENTRIES" note="No posts match this filter yet." />
        : Object.entries(groups).map(([month, items]) => (
          <section key={month} className="mb-24">
            <div className="rule-b-th" style={{ paddingBottom: 6, marginBottom: 12 }}>
              <h3 className="f-head" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 900 }}>{month}</h3>
              <div className="f-mono" style={{ fontSize: 10, opacity: .6, letterSpacing: '.12em' }}>{items.length} ENTRIES</div>
            </div>
            {items.map(p => {
              const e = paper.editors[p.editorId];
              return (
                <div key={p.id} onClick={() => nav({ view: 'post', postId: p.id })}
                  style={{ padding: '14px 0', borderBottom: '1px dashed var(--ink)', cursor: 'pointer' }}>
                  <div className="flex between center" style={{ flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div className="f-mono" style={{ fontSize: 9, letterSpacing: '.18em', color: e?.color, fontWeight: 700 }}>
                        {e?.tag} {e?.name} — {p.type === 'take' ? 'HOT TAKE' : 'DISPATCH'} {p.archived && '— ARCHIVED'}
                      </div>
                      <div className="f-head" style={{ fontSize: 22, lineHeight: 1.1, fontStyle: 'italic', fontWeight: 900, marginTop: 2 }}>
                        {p.headline || (p.body.slice(0, 80) + (p.body.length > 80 ? '…' : ''))}
                      </div>
                    </div>
                    <span className="f-mono" style={{ fontSize: 10, opacity: .6 }}>{window.fmtDateFull(p.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </section>
        ))
      }
    </main>
  );
}

// ============ POST VIEW ============
function PostView({ postId, nav, session }) {
  window.useStore();
  const post = window.getPost(postId);
  const [commentText, setCommentText] = useState('');
  if (!post) return <Empty label="POST NOT FOUND" />;
  const paper = window.getPaper(post.paperId);
  const editor = paper?.editors[post.editorId];
  const canEdit = session && session.paperId === post.paperId;
  const isFav = canEdit && (paper.favoriteIds[session.editorId] || []).includes(post.id);
  const isPinned = paper.pinnedIds.includes(post.id);

  const words = post.body.split(/(\s+)/);
  const redacted = new Set(post.redactedWordIndices || []);

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '20px 28px 80px' }}>
      <button className="btn mb-16" onClick={() => nav({ view: 'home', paperId: post.paperId })}>← BACK TO {paper?.name.toUpperCase()}</button>
      <article>
        <div className="flex between center mb-8">
          <window.Kicker red>{post.type === 'take' ? 'HOT TAKE' : 'DISPATCH'}{post.archived && ' — ARCHIVED'}{isPinned && ' — PINNED'}</window.Kicker>
          <span className="f-mono" style={{ fontSize: 10, letterSpacing: '.18em' }}>{window.fmtDateFull(post.createdAt)}</span>
        </div>
        {post.headline && (
          <h1 className="f-head" style={{ fontSize: 64, lineHeight: .95, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-.02em', marginBottom: 14 }}>{post.headline}</h1>
        )}
        <div className="flex gap-16 center mb-16" style={{ flexWrap: 'wrap', paddingTop: 14, paddingBottom: 14, borderTop: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)' }}>
          <window.BylineStamp editor={editor} />
          <span className="f-mono" style={{ fontSize: 10, letterSpacing: '.18em' }}>— {window.fmtDateFull(post.createdAt)}</span>
        </div>
        <div className="longread">
          {post.type === 'take'
            ? <p className="f-type" style={{ fontSize: 28, lineHeight: 1.35 }}>"{post.body}"</p>
            : words.map((w, i) => /^\s+$/.test(w) ? <span key={i}>{w}</span> :
                <span key={i} className={redacted.has(i) ? 'redact' : ''} style={{ padding: redacted.has(i) ? '0 2px' : 0 }}>{w}</span>)
          }
        </div>

        <div className="rule-dbl mt-24" style={{ paddingTop: 20 }}>
          <div className="flex between center" style={{ flexWrap: 'wrap', gap: 12 }}>
            <window.Reactions postId={post.id} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canEdit && (
                <>
                  <button className="btn" onClick={() => window.toggleFavorite(post.paperId, session.editorId, post.id)}>
                    {isFav ? '★ FAVORITED' : '☆ FAVORITE'}
                  </button>
                  <button className="btn" onClick={() => window.togglePin(post.paperId, post.id)}>
                    {isPinned ? '◉ UNPIN' : '◎ PIN TO FRONT'}
                  </button>
                  <button className="btn" onClick={() => window.moveToArchive(post.id, !post.archived)}>
                    {post.archived ? '↑ BACK TO FRONT' : '⎗ MOVE TO ARCHIVE'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-24">
          <div className="rule-b-th" style={{ paddingBottom: 6, marginBottom: 16 }}>
            <h3 className="f-head" style={{ fontSize: 28, fontStyle: 'italic', fontWeight: 900 }}>LETTERS TO THE EDITORS</h3>
            <div className="f-mono" style={{ fontSize: 10, letterSpacing: '.18em', marginTop: 4, opacity: .7 }}>{post.comments.length} LETTERS</div>
          </div>
          <div style={{ border: '1px solid var(--ink)', padding: 14, marginBottom: 20 }}>
            <textarea className="f-type" value={commentText} onChange={e => setCommentText(e.target.value)}
              style={{ width: '100%', minHeight: 70, background: 'transparent', border: '1px dashed var(--ink)', padding: 10, fontSize: 14, resize: 'vertical', outline: 'none' }}
              placeholder="write in. anonymous."/>
            <div className="flex between center mt-8">
              <span className="f-mono" style={{ fontSize: 10, opacity: .6 }}>ANONYMOUS</span>
              <button className="btn solid" onClick={() => {
                if (!commentText.trim()) return;
                window.addComment(post.id, { text: commentText.trim() });
                setCommentText('');
              }}>✎ TRANSMIT LETTER</button>
            </div>
          </div>
          {post.comments.length === 0
            ? <Empty label="NO LETTERS YET" />
            : post.comments.map(c => (
              <div key={c.id} style={{ padding: '14px 0', borderBottom: '1px dashed var(--ink)' }}>
                <div className="flex between center mb-8">
                  <span className="f-mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em' }}>✉ {c.handle.toUpperCase()}</span>
                  <span className="f-mono" style={{ fontSize: 10, opacity: .55 }}>— {window.fmtDate(c.createdAt)}</span>
                </div>
                <p className="f-body" style={{ fontSize: 16, lineHeight: 1.45 }}>"{c.text}"</p>
              </div>
            ))
          }
        </div>
      </article>
    </main>
  );
}

// ============ COMPOSER ============
function Composer({ session, nav }) {
  const { paper, editor, paperId, editorId } = session;
  const [mode, setMode] = useState('dispatch');
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [redactMode, setRedactMode] = useState(false);
  const [redacted, setRedacted] = useState(new Set());
  const [soundOn, setSoundOn] = useState(true);
  const audioCtxRef = useRef(null);

  const playKey = () => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 1800 + Math.random() * 400;
      g.gain.setValueAtTime(0.05, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.05);
    } catch (e) {}
    window.pingLiveTyping(paperId, editorId);
  };

  const words = body.split(/(\s+)/);
  const toggleRedactWord = i => {
    if (!redactMode) return;
    setRedacted(r => { const n = new Set(r); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  };
  const addTag = () => { const t = tagInput.trim().toUpperCase(); if (t && !tags.includes(t)) setTags([...tags, t]); setTagInput(''); };

  const transmit = () => {
    if (!body.trim()) return;
    const id = window.publishPost({
      paperId, editorId, type: mode,
      headline: mode === 'dispatch' ? headline : '',
      body, tags,
      redactedWordIndices: Array.from(redacted),
    });
    nav({ view: 'post', postId: id });
  };

  const wc = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 28px 80px' }}>
      <div className="flex between center mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <button className="btn" onClick={() => nav({ view: 'home', paperId })}>← BACK TO DESK</button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="f-mono wide" style={{ fontSize: 10 }}>FILING AS:</span>
          <span className="btn solid" style={{ background: editor.color, borderColor: editor.color }}>{editor.tag} {editor.name} @ {paper.name}</span>
          <button className="btn red" onClick={() => { window.logout(); nav({ view: 'home', paperId }); }}>⎋ SIGN OUT</button>
        </div>
      </div>
      <div className="rule-dbl mb-16"></div>

      <div className="flex between center mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="flex gap-8">
          <button className={'btn' + (mode === 'dispatch' ? ' solid' : '')} onClick={() => setMode('dispatch')}>⎙ DISPATCH / ESSAY</button>
          <button className={'btn' + (mode === 'take' ? ' solid' : '')} onClick={() => setMode('take')}>⚡ HOT TAKE</button>
        </div>
        <div className="flex gap-8 center">
          <button className={'rxn' + (soundOn ? ' active' : '')} onClick={() => setSoundOn(s => !s)}>{soundOn ? '■ SFX ON' : '□ SFX OFF'}</button>
          <button className={'rxn' + (redactMode ? ' active' : '')} onClick={() => setRedactMode(r => !r)}>▇ REDACT {redactMode ? 'ON' : 'OFF'}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        <div>
          <div style={{ border: '1px solid var(--ink)', padding: '10px 14px', background: 'var(--paper-dark)', display: 'flex', gap: 20, flexWrap: 'wrap', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '.15em' }}>
            <span>DESK: {mode === 'dispatch' ? 'LONG-FORM' : 'WIRE'}</span>
            <span>AUTHOR: <span style={{ color: editor.color, fontWeight: 700 }}>{editor.name}</span></span>
            <span>PAPER: {paper.name.toUpperCase()}</span>
            <span style={{ marginLeft: 'auto' }}>{window.fmtDateFull(Date.now())}</span>
          </div>
          <div className="paper-sheet">
            {mode === 'dispatch' && (
              <input className="typewriter-input" value={headline} onChange={e => setHeadline(e.target.value)} onKeyDown={playKey}
                style={{ fontSize: 34, fontWeight: 900, fontFamily: 'Playfair Display, serif', fontStyle: 'italic', lineHeight: 1.1, marginBottom: 20 }}
                placeholder="HEADLINE. SHARPEN YOUR POINT." />
            )}
            {!redactMode ? (
              <textarea className="typewriter-input" value={body} onChange={e => setBody(e.target.value)} onKeyDown={playKey}
                style={{ minHeight: mode === 'take' ? 180 : 360, fontSize: mode === 'take' ? 22 : 17, lineHeight: '28px' }}
                placeholder={mode === 'take' ? '/ drop the take. 280 chars. /' : '/ start here. write the full story. /'}
                maxLength={mode === 'take' ? 280 : 20000} />
            ) : (
              <div style={{ fontFamily: 'Special Elite, monospace', fontSize: 17, lineHeight: '28px', minHeight: 360 }}>
                <div className="f-mono mb-8" style={{ fontSize: 10, color: 'var(--red)', letterSpacing: '.18em' }}>▇ CLICK WORDS TO REDACT</div>
                {words.map((w, i) => /^\s+$/.test(w) ? <span key={i}>{w}</span> :
                  <span key={i} onClick={() => toggleRedactWord(i)} className={redacted.has(i) ? 'redact' : ''} style={{ cursor: 'pointer' }}>{w}</span>
                )}
                {!body && <span style={{ opacity: .4 }}>/ write in normal mode first /</span>}
              </div>
            )}
            {mode === 'take' && (
              <div className="f-mono" style={{ fontSize: 10, marginTop: 12, textAlign: 'right', color: body.length > 260 ? 'var(--red)' : 'var(--ink-faded)' }}>{body.length} / 280</div>
            )}
          </div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ border: '1px solid var(--ink)', padding: 12 }}>
            <div className="f-mono mb-8" style={{ fontSize: 10, letterSpacing: '.24em' }}>DRAFT STATS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Special Elite, monospace' }}>{wc}</div><div className="f-mono" style={{ fontSize: 9, opacity: .6 }}>WORDS</div></div>
              <div><div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Special Elite, monospace' }}>{redacted.size}</div><div className="f-mono" style={{ fontSize: 9, opacity: .6 }}>REDACTED</div></div>
            </div>
          </div>
          <div style={{ border: '1px solid var(--ink)', padding: 12 }}>
            <div className="f-mono mb-8" style={{ fontSize: 10, letterSpacing: '.24em' }}>FILE UNDER</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {tags.map(t => <span key={t} className="rxn" style={{ cursor: 'pointer' }} onClick={() => setTags(tags.filter(x => x !== t))}>#{t} ×</span>)}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="ADD TAG" className="f-mono"
                style={{ flex: 1, border: '1px solid var(--ink)', padding: '6px 8px', background: 'var(--paper)', fontSize: 11, outline: 'none', textTransform: 'uppercase' }} />
              <button className="btn" onClick={addTag}>+</button>
            </div>
          </div>
          <button className="btn solid" style={{ background: 'var(--red)', borderColor: 'var(--red)', fontSize: 13 }} onClick={transmit}>⎆ TRANSMIT →</button>
        </aside>
      </div>
    </main>
  );
}

// ============ LOGIN ============
function LoginPicker({ paperId, nav }) {
  window.useStore();
  const paper = window.getPaper(paperId);
  const editors = Object.values(paper?.editors || {});
  return (
    <main style={{ maxWidth: 860, margin: '40px auto 120px', padding: '0 28px' }}>
      <button className="btn mb-16" onClick={() => nav({ view: 'home', paperId })}>← BACK</button>
      <div style={{ border: '3px double var(--ink)', padding: 32, background: 'var(--paper-dark)' }}>
        <div className="f-mono" style={{ fontSize: 10, letterSpacing: '.28em', color: 'var(--red)', fontWeight: 700 }}>⌠ EDITORIAL ACCESS — {paper.name.toUpperCase()} ⌡</div>
        <h1 className="f-head" style={{ fontSize: 48, lineHeight: .95, fontWeight: 900, fontStyle: 'italic', marginTop: 4 }}>WHO ARE YOU?</h1>
        <p className="f-type mt-8" style={{ fontSize: 14, lineHeight: 1.5 }}>Only editors can file. Pick your codename.</p>
        <div className="mt-16" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(editors.length, 3)}, 1fr)`, gap: 12 }}>
          {editors.map(e => (
            <button key={e.id} onClick={() => nav({ view: 'login', paperId, editorId: e.id })}
              style={{ border: `3px solid ${e.color}`, padding: 16, background: 'var(--paper)', textAlign: 'left', cursor: 'pointer' }}>
              <div className="f-mono" style={{ fontSize: 10, letterSpacing: '.2em', color: e.color, fontWeight: 700 }}>{e.tag} {e.role}</div>
              <div className="f-head" style={{ fontSize: 36, lineHeight: 1, fontStyle: 'italic', fontWeight: 900 }}>{e.name}</div>
              <div className="f-mono mt-8" style={{ fontSize: 9, letterSpacing: '.2em', color: e.passHash ? 'var(--ink-faded)' : 'var(--red)', fontWeight: 700 }}>
                {e.passHash ? '● PASSPHRASE SET' : '○ NEW — SET PASSPHRASE'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

function LoginScreen({ paperId, editorId, nav, onSuccess }) {
  window.useStore();
  const paper = window.getPaper(paperId);
  const editor = paper?.editors[editorId];
  const isFirst = !editor?.passHash;
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);
  if (!editor) return <Empty label="EDITOR NOT FOUND" />;
  const submit = () => {
    if (isFirst) {
      if (pass.length < 4) return setErr('minimum 4 characters.');
      if (pass !== confirm) return setErr('passphrases do not match.');
    }
    if (!window.login(paperId, editorId, pass)) {
      setErr('wrong passphrase.'); setShake(true); setTimeout(() => setShake(false), 400); return;
    }
    onSuccess();
  };
  return (
    <main style={{ maxWidth: 540, margin: '40px auto 120px', padding: '0 28px' }}>
      <button className="btn mb-16" onClick={() => nav({ view: 'login-pick', paperId })}>← BACK</button>
      <div style={{ border: '3px double var(--ink)', padding: 32, background: 'var(--paper-dark)', animation: shake ? 'shakeX .4s' : 'none' }}>
        <div className="f-mono" style={{ fontSize: 10, letterSpacing: '.28em', color: 'var(--red)', fontWeight: 700 }}>⌠ CREDENTIALS REQUIRED ⌡</div>
        <h1 className="f-head" style={{ fontSize: 48, lineHeight: .95, fontWeight: 900, fontStyle: 'italic', color: editor.color, marginTop: 4 }}>SIGN IN AS {editor.name}.</h1>
        <p className="f-type mt-12" style={{ fontSize: 14, lineHeight: 1.5 }}>
          {isFirst ? <>First time — set a passphrase. You'll use it every sign-in.</> : <>Enter {editor.name}'s passphrase.</>}
        </p>
        <div className="mt-16" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="password" autoFocus value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            className="f-type" placeholder="PASSPHRASE"
            style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: '10px 12px', fontSize: 18, outline: 'none' }} />
          {isFirst && (
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              className="f-type" placeholder="CONFIRM PASSPHRASE"
              style={{ border: '1px solid var(--ink)', background: 'var(--paper)', padding: '10px 12px', fontSize: 18, outline: 'none' }} />
          )}
          {err && <div className="f-mono" style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700 }}>✕ {err}</div>}
          <button className="btn solid" onClick={submit} style={{ background: editor.color, borderColor: editor.color }}>⎆ {isFirst ? 'SET & ENTER' : 'TRANSMIT'}</button>
        </div>
      </div>
    </main>
  );
}

// ============ CREATE PAPER ============
function CreatePaper({ nav }) {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [editorName, setEditorName] = useState('');
  const [editorPass, setEditorPass] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [err, setErr] = useState('');
  const submit = () => {
    if (!name.trim()) return setErr('your paper needs a name.');
    if (!editorName.trim()) return setErr('pick your codename.');
    if (editorPass.length < 4) return setErr('passphrase: min 4 characters.');
    const { paperId } = window.createPaper({
      name: name.trim().toLowerCase(), tagline: tagline.trim().toUpperCase(),
      editorName: editorName.trim(), editorPass, isPrivate,
    });
    nav({ view: 'home', paperId });
  };
  return (
    <main style={{ maxWidth: 640, margin: '40px auto 120px', padding: '0 28px' }}>
      <button className="btn mb-16" onClick={() => nav({ view: 'discover' })}>← BACK</button>
      <div style={{ border: '3px double var(--ink)', padding: 32, background: 'var(--paper-dark)' }}>
        <div className="f-mono" style={{ fontSize: 10, letterSpacing: '.28em', color: 'var(--red)', fontWeight: 700 }}>+ START YOUR OWN PAPER</div>
        <h1 className="f-head" style={{ fontSize: 48, lineHeight: .95, fontWeight: 900, fontStyle: 'italic', marginTop: 4 }}>HANG A MASTHEAD.</h1>
        <p className="f-type mt-8" style={{ fontSize: 14, lineHeight: 1.5 }}>
          Write solo or bring your friends. Public by default — flip private anytime.
        </p>
        <div className="mt-24" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="PAPER NAME" value={name} onChange={setName} placeholder="e.g. nightshift gazette" />
          <Field label="TAGLINE (OPTIONAL)" value={tagline} onChange={setTagline} placeholder="WRITTEN FROM THE 3AM SHIFT" />
          <Field label="YOUR CODENAME" value={editorName} onChange={setEditorName} placeholder="what byline goes on your posts" />
          <Field label="PASSPHRASE" value={editorPass} onChange={setEditorPass} type="password" placeholder="min 4 characters" />
          <label className="f-mono" style={{ fontSize: 11, letterSpacing: '.12em', display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} style={{ accentColor: 'var(--red)' }} />
            PRIVATE — DON'T LIST ME ON THE DISCOVERY WIRE
          </label>
          {err && <div className="f-mono" style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700 }}>✕ {err}</div>}
          <button className="btn solid" onClick={submit}>⎆ HANG THE MASTHEAD</button>
          <div className="f-mono" style={{ fontSize: 9, opacity: .6, lineHeight: 1.4 }}>
            YOU CAN ADD CO-EDITORS FROM YOUR PAPER SETTINGS AFTER SIGNING IN.
          </div>
        </div>
      </div>
    </main>
  );
}
function Field({ label, value, onChange, placeholder, type }) {
  return (
    <label className="f-mono" style={{ fontSize: 10, letterSpacing: '.24em' }}>
      {label}
      <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="f-type"
        style={{ width: '100%', border: '1px solid var(--ink)', background: 'var(--paper)', padding: '10px 12px', fontSize: 16, outline: 'none', marginTop: 6 }} />
    </label>
  );
}

Object.assign(window, { DiscoverPage, ArchivePage, PostView, Composer, LoginPicker, LoginScreen, CreatePaper });
