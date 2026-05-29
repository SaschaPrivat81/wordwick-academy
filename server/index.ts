import express from 'express';
import session from 'express-session';
import path from 'path';
import { db } from './db';
import { fileURLToPath } from 'url'; 
import Papa from 'papaparse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));   
const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'wordwick-academy-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// ─── Auth-Middleware ───
function requirePin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.userId) return res.status(401).json({ error: 'Nicht eingeloggt' });
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.session.role !== 'parent' && req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Kein Admin' });
  }
  next();
}

// ─── Auth ───
app.post('/api/login', (req, res) => {
  const { name, pin } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE name = ? AND pin = ?').get(name, pin) as any;
  if (!user) return res.status(401).json({ error: 'Falscher Name oder PIN' });
  req.session.userId = user.id;
  req.session.role = user.role;
  res.json({ id: user.id, name: user.name, role: user.role, coins: user.coins, streak: user.streak, avatar: user.avatar });
});

app.post('/api/register', (req, res) => {
  const { name, pin } = req.body;
  if (!name || !pin || pin.length !== 4) return res.status(400).json({ error: 'Name und 4-stelliger PIN nötig' });
  const exists = db.prepare('SELECT id FROM users WHERE name = ?').get(name);
  if (exists) return res.status(400).json({ error: 'Name bereits vergeben' });
  const now = new Date().toISOString();
  const result = db.prepare('INSERT INTO users (name, pin, role, createdAt) VALUES (?, ?, ?, ?)').run(name, pin, 'child', now);
  req.session.userId = Number(result.lastInsertRowid);
  req.session.role = 'child';
  res.json({ id: Number(result.lastInsertRowid), name, role: 'child', coins: 0, streak: 0, avatar: 'blocky' });
});

app.post('/api/logout', (_req, res) => {
  (_req as any).session.destroy(() => {});
  res.json({ ok: true });
});

app.get('/api/me', requirePin, (req, res) => {
  const user = db.prepare('SELECT id, name, role, coins, streak, lastPlayed, avatar FROM users WHERE id = ?').get(req.session.userId) as any;
  if (!user) return res.status(404).json({ error: 'Nicht gefunden' });
  res.json(user);
});

// ─── Wörter ───
app.get('/api/words', requirePin, (_req, res) => {
  const words = db.prepare('SELECT * FROM words ORDER BY id').all() as any[];
  res.json(words);
});

app.get('/api/words/:id', requirePin, (req, res) => {
  const word = db.prepare('SELECT * FROM words WHERE id = ?').get(req.params.id) as any;
  if (!word) return res.status(404).json({ error: 'Nicht gefunden' });
  res.json(word);
});

// ─── Fortschritt ───
app.get('/api/progress', requirePin, (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, w.german, w.english, w.type, w.category, w.past, w.participle
    FROM progress p
    JOIN words w ON w.id = p.wordId
    WHERE p.userId = ?
  `).all(req.session.userId) as any[];
  res.json(rows);
});

app.post('/api/progress', requirePin, (req, res) => {
  const { wordId, correct } = req.body;
  const userId = req.session.userId;
  const now = new Date().toISOString();
  
  const existing = db.prepare('SELECT * FROM progress WHERE userId = ? AND wordId = ?').get(userId, wordId) as any;
  if (existing) {
    const correctCount = existing.correctCount + (correct ? 1 : 0);
    const wrongCount = existing.wrongCount + (correct ? 0 : 1);
    const mastered = correctCount >= 3 ? 1 : 0;
    db.prepare('UPDATE progress SET correctCount = ?, wrongCount = ?, lastSeen = ?, mastered = ? WHERE id = ?')
      .run(correctCount, wrongCount, now, mastered, existing.id);
  } else {
    db.prepare('INSERT INTO progress (userId, wordId, correctCount, wrongCount, lastSeen, mastered) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, wordId, correct ? 1 : 0, correct ? 0 : 1, now, correct ? 0 : 0);
  }
  
  // Coins vergeben
  if (correct) {
    db.prepare('UPDATE users SET coins = coins + 1 WHERE id = ?').run(userId);
  }
  
  // Streak aktualisieren
  const user = db.prepare('SELECT lastPlayed FROM users WHERE id = ?').get(userId) as any;
  const today = now.slice(0, 10);
  const lastDay = user.lastPlayed ? user.lastPlayed.slice(0, 10) : null;
  if (lastDay !== today) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    if (lastDay === yStr) {
      db.prepare('UPDATE users SET streak = streak + 1, lastPlayed = ? WHERE id = ?').run(now, userId);
    } else {
      db.prepare('UPDATE users SET streak = 1, lastPlayed = ? WHERE id = ?').run(now, userId);
    }
  }
  
  res.json({ ok: true });
});

// ─── Belohnungen ───
app.get('/api/rewards', requirePin, (req, res) => {
  const rewards = db.prepare('SELECT * FROM rewards').all() as any[];
  const claimed = db.prepare('SELECT rewardId FROM claimed_rewards WHERE userId = ?').all(req.session.userId) as any[];
  const claimedIds = new Set(claimed.map(c => c.rewardId));
  res.json(rewards.map(r => ({ ...r, claimed: claimedIds.has(r.id) })));
});

app.post('/api/rewards/:id/claim', requirePin, (req, res) => {
  const userId = req.session.userId;
  const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(req.params.id) as any;
  const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId) as any;
  if (!reward) return res.status(404).json({ error: 'Nicht gefunden' });
  if (user.coins < reward.cost) return res.status(400).json({ error: 'Nicht genug Münzen' });
  
  db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(reward.cost, userId);
  db.prepare('INSERT INTO claimed_rewards (userId, rewardId, claimedAt) VALUES (?, ?, ?)')
    .run(userId, reward.id, new Date().toISOString());
  res.json({ ok: true });
});

// ─── Admin: CSV-Upload ───
app.post('/api/admin/words/import', requireAdmin, (req, res) => {
  const { csv } = req.body;
  if (!csv) return res.status(400).json({ error: 'Kein CSV' });
  
  const result = Papa.parse(csv, { header: true, skipEmptyLines: true });
  const now = new Date().toISOString();
  const insert = db.prepare('INSERT INTO words (german, english, type, category, past, participle, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
  
  let count = 0;
  for (const row of result.data as any[]) {
    if (!row.german || !row.english) continue;
    insert.run(
      row.german.trim(),
      row.english.trim(),
      row.type?.trim() || 'vocab',
      row.category?.trim() || null,
      row.past?.trim() || null,
      row.participle?.trim() || null,
      now
    );
    count++;
  }
  res.json({ imported: count });
});

app.get('/api/admin/stats/:userId', requireAdmin, (req, res) => {
  const userId = Number(req.params.userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  const progress = db.prepare(`
    SELECT p.*, w.german, w.english
    FROM progress p
    JOIN words w ON w.id = p.wordId
    WHERE p.userId = ?
    ORDER BY p.lastSeen DESC
  `).all(userId) as any[];
  const weakWords = progress.filter(p => p.wrongCount > p.correctCount).slice(0, 10);
  res.json({ user, progressCount: progress.length, masteredCount: progress.filter(p => p.mastered).length, weakWords });
});

// ─── Static files ───
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Wordwick Academy laeuft auf http://localhost:${PORT}`);
});
