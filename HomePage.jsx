// Pages: Home, Discover, Archive, PostView, Composer, Login, CreatePaper

function HomePage({ paperId, nav, session, onWelcomeBrowse, onWelcomeWrite }) {
  window.useStore();
  const paper = window.getPaper(paperId);
  const { pinned, dispatches, takes } = window.getFrontPagePosts(paperId);
  const A = paper.editors;
  const editors = Object.values(A);
  const canWrite = session && session.paperId === paperId;

  const showWelcome = paperId === 'tobehonest';

  return (
    <main style={{ maxWidth: 1320, margin: '0 auto', padding: '0 28px 80px' }}>
      {showWelcome && <window.WelcomePopup onBrowse={onWelcomeBrowse} onWrite={onWelcomeWrite} />}

      <section className="mt-16" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
        <article>
          {pinned[0] ? <LeadCard post={pinned[0]} paper={paper} nav={nav} pinned /> :
            dispatches[0] ? <LeadCard post={dispatches[0]} paper={paper} nav={nav} /> :
            <EmptyLead paper={paper} canWrite={canWrite} nav={nav} />
          }

          <div className="mt-16" style={{ border: '1px solid var(--ink)', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div className="f-mono" style={{ fontSize: 10, letterSpacing: '.24em', color: 'var(--red)', fontWeight: 700 }}>⎙ THE DESK</div>
              <div className="f-type" style={{ fontSize: 14, marginTop: 4 }}>
                {canWrite ? <>Signed in as <b style={{ color: session.editor.color }}>{session.editor.name}</b>.</>
                  : <>Only this paper's editors can file. Sign in to write — or <a className="ink-link" onClick={() => nav({ view: 'create' })} style={{ cursor: 'pointer' }}>start your own paper</a>.</>
                }
              </div>
            </div>
            <button className="btn solid" onClick={() => canWrite ? nav({ view: 'composer' }) : nav({ view: 'login-pick' })}>
              {canWrite ? '→ OPEN COMPOSER' : '⎙ SIGN IN TO WRITE'}
            </button>
          </div>
        </article>

        <aside style={{ borderLeft: '1px solid var(--ink)', paddingLeft: 20 }}>
          <div className="mb-16">
            <div className="rule-b-th" style={{ paddingBottom: 6, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h3 className="f-head" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 900 }}>HOT TAKES</h3>
              <span className="f-mono" style={{ fontSize: 9, letterSpacing: '.18em', opacity: .6 }}>WIRE</span>
            </div>
            {takes.length === 0 ? <Empty label="NO TAKES YET" note="Short, sharp, 280 chars."/>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {takes.map(t => <TakeCard key={t.id} post={t} editor={A[t.editorId]} nav={nav} />)}
                </div>
            }
          </div>

          <div style={{ border: '3px double var(--ink)', padding: 14, background: 'var(--paper-dark)' }}>
            <div className="f-mono" style={{ fontSize: 10, letterSpacing: '.24em', color: 'var(--red)', fontWeight: 700 }}>⌠ ENCRYPTED TIP LINE ⌡</div>
            <div className="f-head" style={{ fontSize: 22, fontWeight: 900, fontStyle: 'italic', lineHeight: 1, marginTop: 8 }}>
              SEND US WHAT YOU KNOW.
            </div>
            <div className="f-type" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.4 }}>No name. No IP. No handlers.</div>
            <button className="btn red mt-12" style={{ width: '100%' }}>DROP A TIP →</button>
          </div>
        </aside>
      </section>

      <div className="rule-dbl mt-24 mb-24" style={{ borderTopWidth: 6 }}></div>

      {/* Masthead / editors */}
      <section>
        <div className="flex between center mb-16">
          <h3 className="f-head" style={{ fontSize: 32, fontStyle: 'italic', fontWeight: 900 }}>THE MASTHEAD</h3>
          <span className="f-mono wide" style={{ fontSize: 10 }}>EDITORS / WRITERS / PROPRIETORS</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(editors.length, 3)}, 1fr)`, gap: 28 }}>
          {editors.map(e => (
            <div key={e.id} style={{ borderTop: `4px solid ${e.color}`, paddingTop: 12 }}>
              <div className="f-mono" style={{ fontSize: 10, letterSpacing: '.2em', color: e.color, fontWeight: 700 }}>{e.tag} {e.role}</div>
              <div className="f-head" style={{ fontSize: 44, lineHeight: 1, fontWeight: 900, fontStyle: 'italic', marginTop: 6 }}>{e.name}</div>
              {e.bio && <p className="f-type mt-8" style={{ fontSize: 14, lineHeight: 1.5 }}>{e.bio}</p>}
              <div className="mt-12 flex gap-8" style={{ flexWrap: 'wrap' }}>
                <button className="btn" onClick={() => nav({ view: 'archive', paperId, editorId: e.id })} style={{ borderColor: e.color, color: e.color }}>
                  ⎗ {e.name}'S COLUMNS
                </button>
                <button className="btn" onClick={() => nav({ view: 'login', paperId, editorId: e.id })} style={{ borderColor: e.color, color: e.color }}>
                  ⎙ SIGN IN
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="rule-dbl mt-24 mb-24" style={{ borderTopWidth: 6 }}></div>

      {/* Columns — one latest dispatch per editor */}
      <section>
        <div className="flex between center mb-16">
          <h3 className="f-head" style={{ fontSize: 32, fontStyle: 'italic', fontWeight: 900 }}>THE COLUMNS</h3>
          <span className="f-mono wide" style={{ fontSize: 10 }}>ONE VOICE PER SLOT</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(editors.length, 3)}, 1fr)`, gap: 28 }}>
          {editors.map(e => {
            const latest = window.getPaperPosts(paperId, { includeArchived: false }).find(p => p.editorId === e.id && p.type === 'dispatch');
            if (!latest) return (
              <div key={e.id} style={{ border: '1px dashed var(--ink)', padding: 20, minHeight: 240, background: 'var(--paper-dark)' }}>
                <window.Kicker ghost>COLUMN // {e.name}</window.Kicker>
                <div className="f-head" style={{ fontSize: 22, fontStyle: 'italic', fontWeight: 900, color: e.color, opacity: .4, marginTop: 12 }}>
                  "{e.name.toLowerCase()} has not filed yet."
                </div>
              </div>
            );
            return <ColumnCard key={e.id} post={latest} editor={e} nav={nav} />;
          })}
        </div>
      </section>

      <div className="rule-dbl mt-24" style={{ borderTopWidth: 6 }}></div>
      <footer className="mt-16 tac">
        <div className="f-mast" style={{ fontSize: 40 }}>{paper.name}</div>
        <div className="f-mono wide mt-8" style={{ fontSize: 10 }}>PUBLISHED IRREGULARLY — READ BY YOU</div>
      </footer>
    </main>
  );
}

function LeadCard({ post, paper, nav, pinned }) {
  const editor = paper.editors[post.editorId];
  return (
    <div>
      <div className="flex between center mb-8">
        <window.Kicker red>{pinned ? 'PINNED — ' : ''}DISPATCH / {editor?.role}</window.Kicker>
        <span className="f-mono" style={{ fontSize: 10, letterSpacing: '.18em' }}>{window.fmtDateFull(post.createdAt)}</span>
      </div>
      <h2 className="f-head" style={{ fontSize: 72, lineHeight: .95, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-.02em', cursor: 'pointer', marginBottom: 12 }}
          onClick={() => nav({ view: 'post', postId: post.id })}>
        {post.headline || '(untitled)'}
      </h2>
      <div className="flex gap-12 center mb-16"><window.BylineStamp editor={editor} /></div>
      <p className="f-body" style={{ fontSize: 16, lineHeight: 1.5 }}>{post.body.slice(0, 400)}{post.body.length > 400 && '…'}</p>
      <button className="btn solid mt-16" onClick={() => nav({ view: 'post', postId: post.id })}>READ FULL →</button>
    </div>
  );
}
function EmptyLead({ paper, canWrite, nav }) {
  return (
    <div style={{ border: '1px dashed var(--ink)', padding: 40, minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12, background: 'var(--paper-dark)', textAlign: 'center' }}>
      <div className="f-mono" style={{ fontSize: 10, letterSpacing: '.24em', color: 'var(--red)', fontWeight: 700 }}>▢ LEAD — NOT YET TRANSMITTED</div>
      <div className="f-head" style={{ fontSize: 48, lineHeight: 1, fontWeight: 900, fontStyle: 'italic', maxWidth: 500 }}>
        The record is blank for {paper.name}.
      </div>
      <div className="f-type" style={{ fontSize: 15, maxWidth: 480, lineHeight: 1.5 }}>
        Your first dispatch lands here in 80pt italic. Sign in and transmit something bold.
      </div>
    </div>
  );
}
function TakeCard({ post, editor, nav }) {
  return (
    <div className="take" style={{ cursor: 'pointer' }} onClick={() => nav({ view: 'post', postId: post.id })}>
      <div className="th">
        <span style={{ color: editor?.color, fontWeight: 700 }}>{editor?.tag} {editor?.name}</span>
        <span>{window.fmtDate(post.createdAt)}</span>
      </div>
      <p>"{post.body}"</p>
    </div>
  );
}
function ColumnCard({ post, editor, nav }) {
  return (
    <article onClick={() => nav({ view: 'post', postId: post.id })} style={{ cursor: 'pointer' }}>
      <window.Kicker ghost>COLUMN // {editor.name}</window.Kicker>
      <h4 className="f-head" style={{ fontSize: 28, lineHeight: 1, fontWeight: 900, fontStyle: 'italic', marginTop: 10, marginBottom: 10 }}>{post.headline || '(untitled)'}</h4>
      <p className="f-body" style={{ fontSize: 14, lineHeight: 1.5 }}>{post.body.slice(0, 180)}{post.body.length > 180 && '…'}</p>
      <div className="flex between center mt-12" style={{ paddingTop: 8, borderTop: '1px dashed var(--ink)' }}>
        <window.BylineStamp editor={editor} />
        <span className="f-mono" style={{ fontSize: 10 }}>{window.fmtDate(post.createdAt)}</span>
      </div>
    </article>
  );
}
function Empty({ label, note }) {
  return (
    <div style={{ border: '1px dashed var(--ink)', padding: 20, background: 'var(--paper-dark)', textAlign: 'center' }}>
      <div className="f-mono" style={{ fontSize: 10, letterSpacing: '.24em', color: 'var(--red)', fontWeight: 700 }}>▢ {label}</div>
      {note && <div className="f-type mt-8" style={{ fontSize: 13, opacity: .75 }}>{note}</div>}
    </div>
  );
}

Object.assign(window, { HomePage });
