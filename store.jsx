// Global store — papers, posts, editors. localStorage-backed.

const STORE_KEY = 'tbh_store_v2';

// ---------- default seed ----------
function _defaultState() {
  return {
    currentUserId: null, // which editor is signed in, cross-paper (e.g. "tobehonest:rae")
    papers: {
      'tobehonest': {
        id: 'tobehonest',
        name: 'tobehonest',
        tagline: 'THREE VOICES. ONE DISPATCH. NO HANDLERS.',
        isPrivate: false,
        isFlagship: true,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
        editors: {
          rae: { id: 'rae', name: 'RAE', color: '#c1272d', tag: '//R', role: 'EDITOR-AT-LARGE', bio: 'Writes the lead most weeks. Keeps the receipts in a shoebox. Texts in paragraphs.', passHash: null },
          age: { id: 'age', name: 'AGE', color: '#0a0908', tag: '//A', role: 'STAFF COLUMNIST', bio: 'Thinks too much. Says it anyway. Will die on the hill.', passHash: null },
          old: { id: 'old', name: 'OLD', color: '#1f4e79', tag: '//O', role: 'CRITIC-AT-LARGE', bio: 'Has been watching. Has notes. Remembers the 2016 timeline.', passHash: null },
        },
        postIds: [],
        pinnedIds: [],
        favoriteIds: {}, // per-editor favorites { rae: [ids], age: [...] }
        liveTyping: {}, // { editorId: timestamp }
      },
    },
    posts: {}, // id -> post
    demoSeeded: false,
  };
}

function _seedDemoPapers(state) {
  if (state.demoSeeded) return state;
  const demos = [
    { id: 'graveshift', name: 'graveshift gazette', tagline: 'WRITTEN FROM THE NIGHT SHIFT', color: '#6b5b95' },
    { id: 'bedsitsdaily', name: 'bedsits daily', tagline: 'ROOMMATES. RANTS. RECEIPTS.', color: '#2a7f5a' },
    { id: 'soloprint', name: 'solo print', tagline: 'ONE PERSON. ONE PAPER. ONE GRUDGE.', color: '#b8860b' },
    { id: 'lastcar', name: 'the last car', tagline: 'WE RIDE THE LAST TRAIN HOME EVERY NIGHT', color: '#1f4e79' },
  ];
  demos.forEach((d, i) => {
    state.papers[d.id] = {
      id: d.id,
      name: d.name,
      tagline: d.tagline,
      isPrivate: false,
      isFlagship: false,
      isDemo: true,
      createdAt: Date.now() - 1000 * 60 * 60 * (3 + i * 12),
      editors: {
        one: { id: 'one', name: 'ONE', color: d.color, tag: '//1', role: 'SOLE EDITOR', bio: 'editing from somewhere.', passHash: null },
      },
      postIds: [],
      pinnedIds: [],
      favoriteIds: {},
      liveTyping: i === 0 ? { one: Date.now() } : {},
    };
  });
  state.demoSeeded = true;
  return state;
}

// ---------- persistence ----------
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return _seedDemoPapers(_defaultState());
    return JSON.parse(raw);
  } catch (e) { return _seedDemoPapers(_defaultState()); }
}
function saveState(s) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
}

let _state = loadState();
const _listeners = new Set();
function _emit() { _listeners.forEach(l => l()); }
function _update(fn) {
  _state = fn(_state) || _state;
  saveState(_state);
  _emit();
}

function useStore() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force(x => x + 1);
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }, []);
  return _state;
}

// ---------- hash ----------
function _hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return 'h_' + (h >>> 0).toString(36);
}

// ---------- paper actions ----------
function createPaper({ id, name, tagline, editorName, editorPass, isPrivate }) {
  id = id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) + '-' + Math.random().toString(36).slice(2, 6);
  const editorId = editorName.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'ed';
  _update(s => {
    const colors = ['#c1272d', '#1f4e79', '#2a7f5a', '#6b5b95', '#b8860b', '#8f1d22'];
    s.papers[id] = {
      id,
      name,
      tagline: tagline || 'ONE MORE HONEST VOICE.',
      isPrivate: !!isPrivate,
      isFlagship: false,
      createdAt: Date.now(),
      editors: {
        [editorId]: {
          id: editorId,
          name: editorName.toUpperCase(),
          color: colors[Object.keys(s.papers).length % colors.length],
          tag: '//' + editorName[0].toUpperCase(),
          role: 'FOUNDER',
          bio: '',
          passHash: _hash(editorPass),
        },
      },
      postIds: [],
      pinnedIds: [],
      favoriteIds: {},
      liveTyping: {},
    };
    s.currentUserId = `${id}:${editorId}`;
    return s;
  });
  return { paperId: id, editorId };
}

function addEditor(paperId, { editorName, editorPass, bio, role }) {
  const editorId = editorName.toLowerCase().replace(/[^a-z0-9]+/g, '');
  _update(s => {
    const colors = ['#c1272d', '#1f4e79', '#2a7f5a', '#6b5b95', '#b8860b'];
    const p = s.papers[paperId];
    if (!p) return s;
    p.editors[editorId] = {
      id: editorId,
      name: editorName.toUpperCase(),
      color: colors[Object.keys(p.editors).length % colors.length],
      tag: '//' + editorName[0].toUpperCase(),
      role: role || 'CONTRIBUTOR',
      bio: bio || '',
      passHash: editorPass ? _hash(editorPass) : null,
    };
    return s;
  });
  return editorId;
}

function setEditorPassphrase(paperId, editorId, pass) {
  _update(s => {
    if (!s.papers[paperId] || !s.papers[paperId].editors[editorId]) return s;
    s.papers[paperId].editors[editorId].passHash = _hash(pass);
    return s;
  });
}

function login(paperId, editorId, pass) {
  const p = _state.papers[paperId];
  if (!p) return false;
  const e = p.editors[editorId];
  if (!e) return false;
  if (!e.passHash) {
    // first-time set
    setEditorPassphrase(paperId, editorId, pass);
  } else if (e.passHash !== _hash(pass)) {
    return false;
  }
  _update(s => { s.currentUserId = `${paperId}:${editorId}`; return s; });
  return true;
}

function logout() { _update(s => { s.currentUserId = null; return s; }); }

function getSession() {
  if (!_state.currentUserId) return null;
  const [paperId, editorId] = _state.currentUserId.split(':');
  const p = _state.papers[paperId];
  if (!p) return null;
  const e = p.editors[editorId];
  if (!e) return null;
  return { paperId, editorId, paper: p, editor: e };
}

// ---------- posts ----------
function publishPost({ paperId, editorId, type, headline, body, tags, redactedWordIndices }) {
  const id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const post = {
    id, paperId, editorId, type, // type: dispatch | take
    headline: headline || '',
    body: body || '',
    tags: tags || [],
    redactedWordIndices: redactedWordIndices || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    archived: false,
    comments: [],
    reactions: { fire: 0, cosign: 0, sideeye: 0, receipts: 0 },
  };
  _update(s => {
    s.posts[id] = post;
    const p = s.papers[paperId];
    if (!p) return s;
    // archive the oldest front-page dispatch of same type in this paper if already have N unarchived
    const liveIds = p.postIds.filter(pid => s.posts[pid] && !s.posts[pid].archived);
    const liveSame = liveIds.map(pid => s.posts[pid]).filter(x => x.type === type).sort((a,b) => b.createdAt - a.createdAt);
    const keepN = type === 'dispatch' ? 3 : 6;
    liveSame.slice(keepN - 1).forEach(old => {
      if (!p.pinnedIds.includes(old.id)) s.posts[old.id].archived = true;
    });
    p.postIds.unshift(id);
    // clear live-typing for this editor
    if (p.liveTyping[editorId]) delete p.liveTyping[editorId];
    return s;
  });
  return id;
}

function addComment(postId, { handle, text }) {
  _update(s => {
    if (!s.posts[postId]) return s;
    s.posts[postId].comments.unshift({
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 4),
      handle: handle || 'anon_' + Math.floor(Math.random() * 9999).toString().padStart(4, '0'),
      text, createdAt: Date.now(),
    });
    return s;
  });
}

function toggleReaction(postId, key) {
  _update(s => {
    if (!s.posts[postId]) return s;
    s.posts[postId].reactions[key] = (s.posts[postId].reactions[key] || 0) + 1;
    return s;
  });
}

function togglePin(paperId, postId) {
  _update(s => {
    const p = s.papers[paperId];
    if (!p) return s;
    const i = p.pinnedIds.indexOf(postId);
    if (i >= 0) p.pinnedIds.splice(i, 1);
    else p.pinnedIds.unshift(postId);
    return s;
  });
}

function toggleFavorite(paperId, editorId, postId) {
  _update(s => {
    const p = s.papers[paperId];
    if (!p) return s;
    if (!p.favoriteIds[editorId]) p.favoriteIds[editorId] = [];
    const arr = p.favoriteIds[editorId];
    const i = arr.indexOf(postId);
    if (i >= 0) arr.splice(i, 1);
    else arr.unshift(postId);
    return s;
  });
}

function moveToArchive(postId, archived) {
  _update(s => {
    if (s.posts[postId]) s.posts[postId].archived = !!archived;
    return s;
  });
}

function pingLiveTyping(paperId, editorId) {
  _update(s => {
    if (!s.papers[paperId]) return s;
    s.papers[paperId].liveTyping[editorId] = Date.now();
    return s;
  });
}
// helper to check if someone typed in last 90s
function isPaperLive(paper) {
  const cutoff = Date.now() - 90 * 1000;
  return Object.values(paper.liveTyping || {}).some(t => t > cutoff);
}

// ---------- queries ----------
function getPaper(paperId) { return _state.papers[paperId]; }
function getAllPapers() { return Object.values(_state.papers); }
function getPost(id) { return _state.posts[id]; }
function getPaperPosts(paperId, { includeArchived = true } = {}) {
  const p = _state.papers[paperId];
  if (!p) return [];
  return p.postIds.map(id => _state.posts[id]).filter(Boolean).filter(x => includeArchived || !x.archived);
}
function getFrontPagePosts(paperId) {
  const p = _state.papers[paperId];
  if (!p) return { dispatches: [], takes: [], pinned: [] };
  const all = p.postIds.map(id => _state.posts[id]).filter(Boolean);
  const pinned = p.pinnedIds.map(id => _state.posts[id]).filter(Boolean);
  const live = all.filter(x => !x.archived);
  return {
    pinned,
    dispatches: live.filter(x => x.type === 'dispatch').slice(0, 3),
    takes: live.filter(x => x.type === 'take').slice(0, 6),
  };
}

Object.assign(window, {
  useStore,
  createPaper, addEditor, login, logout, getSession,
  publishPost, addComment, toggleReaction, togglePin, toggleFavorite, moveToArchive,
  pingLiveTyping, isPaperLive,
  getPaper, getAllPapers, getPost, getPaperPosts, getFrontPagePosts,
});
