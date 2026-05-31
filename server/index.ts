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

const allowedRoles = new Set(['child', 'parent', 'admin']);
const canManageAcademy = (role: string) => role === 'parent' || role === 'admin';
const isValidPin = (pin: unknown) => typeof pin === 'string' && /^\d{4}$/.test(pin);
const QUEST_COMPLETION_PERCENT = 80;

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

// ─── Quests / Level ───
function getQuests() {
  const quests = db.prepare('SELECT * FROM quests ORDER BY sortOrder, id').all() as any[];
  const rows = db.prepare('SELECT questId, wordId FROM quest_words ORDER BY sortOrder, wordId').all() as any[];
  const wordsByQuest = new Map<number, number[]>();
  for (const row of rows) {
    const words = wordsByQuest.get(row.questId) ?? [];
    words.push(row.wordId);
    wordsByQuest.set(row.questId, words);
  }

  return quests.map(quest => ({
    ...quest,
    words: wordsByQuest.get(quest.id) ?? [],
  }));
}

function isQuestCompleted(userId: number, questId: number) {
  const result = db.prepare('SELECT completed FROM quest_results WHERE userId = ? AND questId = ?')
    .get(userId, questId) as { completed: number } | undefined;
  return result?.completed === 1;
}

function rewardAccess(userId: number, reward: any, userCoins: number) {
  const unlockType = reward.unlockType ?? 'coins';
  const questUnlocked = unlockType === 'quest' || unlockType === 'final'
    ? Boolean(reward.questId && isQuestCompleted(userId, reward.questId))
    : true;
  const coinsUnlocked = userCoins >= reward.cost;
  const unlocked = unlockType === 'coins' ? coinsUnlocked : questUnlocked && (reward.cost > 0 ? coinsUnlocked : true);
  const lockedReason = unlocked
    ? ''
    : unlockType === 'coins'
      ? `${reward.cost} Wortfunken nötig`
      : reward.cost > 0
        ? `Level abschließen und ${reward.cost} Wortfunken sammeln`
        : 'Level noch nicht abgeschlossen';

  return { unlocked, lockedReason };
}

app.get('/api/quests', requirePin, (_req, res) => {
  res.json(getQuests());
});

app.get('/api/quests/:id', requirePin, (req, res) => {
  const quest = getQuests().find(item => item.id === Number(req.params.id));
  if (!quest) return res.status(404).json({ error: 'Quest nicht gefunden' });
  res.json(quest);
});

app.get('/api/quests/:id/words', requirePin, (req, res) => {
  const words = db.prepare(`
    SELECT w.*
    FROM quest_words qw
    JOIN words w ON w.id = qw.wordId
    WHERE qw.questId = ?
    ORDER BY qw.sortOrder, w.id
  `).all(req.params.id) as any[];
  res.json(words);
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

app.get('/api/quest-results', requirePin, (req, res) => {
  const rows = db.prepare(`
    SELECT questId, attempts, bestPercent, bestCorrect, bestTotal, completed, lastPlayed, completedAt
    FROM quest_results
    WHERE userId = ?
  `).all(req.session.userId) as any[];
  res.json(rows);
});

app.post('/api/quest-results', requirePin, (req, res) => {
  const userId = Number(req.session.userId);
  const questId = Number(req.body.questId);
  const correct = Math.max(0, Number(req.body.correct));
  const total = Math.max(0, Number(req.body.total));
  const quest = db.prepare('SELECT id FROM quests WHERE id = ?').get(questId);
  if (!quest || !Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) {
    return res.status(400).json({ error: 'Quest-Ergebnis konnte nicht gespeichert werden' });
  }

  const percent = Math.max(0, Math.min(100, Math.round((correct / total) * 100)));
  const completed = percent >= QUEST_COMPLETION_PERCENT ? 1 : 0;
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM quest_results WHERE userId = ? AND questId = ?')
    .get(userId, questId) as any;

  if (existing) {
    const isNewBest = percent > existing.bestPercent;
    db.prepare(`
      UPDATE quest_results
      SET attempts = attempts + 1,
          bestPercent = ?,
          bestCorrect = ?,
          bestTotal = ?,
          completed = ?,
          lastPlayed = ?,
          completedAt = CASE WHEN ? = 1 AND completedAt IS NULL THEN ? ELSE completedAt END
      WHERE id = ?
    `).run(
      isNewBest ? percent : existing.bestPercent,
      isNewBest ? Math.floor(correct) : existing.bestCorrect,
      isNewBest ? Math.floor(total) : existing.bestTotal,
      existing.completed === 1 || completed === 1 ? 1 : 0,
      now,
      completed,
      now,
      existing.id,
    );
  } else {
    db.prepare(`
      INSERT INTO quest_results (userId, questId, attempts, bestPercent, bestCorrect, bestTotal, completed, lastPlayed, completedAt)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
    `).run(userId, questId, percent, Math.floor(correct), Math.floor(total), completed, now, completed ? now : null);
  }

  const saved = db.prepare(`
    SELECT questId, attempts, bestPercent, bestCorrect, bestTotal, completed, lastPlayed, completedAt
    FROM quest_results
    WHERE userId = ? AND questId = ?
  `).get(userId, questId);
  res.json(saved);
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

// ─── Belohnungsschrank ───
app.get('/api/rewards', requirePin, (req, res) => {
  const userId = Number(req.session.userId);
  const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId) as { coins: number };
  const rewards = db.prepare(`
    SELECT r.*, q.title as questTitle
    FROM rewards r
    LEFT JOIN quests q ON q.id = r.questId
    WHERE r.active = 1
    ORDER BY r.sortOrder, r.id
  `).all() as any[];
  const claimed = db.prepare('SELECT id, rewardId, status, claimedAt FROM claimed_rewards WHERE userId = ?').all(userId) as any[];
  const claimedByReward = new Map(claimed.map(row => [row.rewardId, row]));
  const visibleRewards = rewards.map(reward => {
    const claim = claimedByReward.get(reward.id);
    const access = rewardAccess(userId, reward, user.coins);
    return {
      ...reward,
      parentNote: undefined,
      claimed: Boolean(claim),
      claimId: claim?.id ?? null,
      claimStatus: claim?.status ?? null,
      claimedAt: claim?.claimedAt ?? null,
      ...access,
    };
  }).filter(reward => reward.visibility !== 'unlocked' || reward.unlocked || reward.claimed);
  res.json(visibleRewards);
});

app.post('/api/rewards/:id/claim', requirePin, (req, res) => {
  const userId = Number(req.session.userId);
  const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(req.params.id) as any;
  const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId) as any;
  if (!reward || reward.active !== 1) return res.status(404).json({ error: 'Nicht gefunden' });
  const existingClaim = db.prepare('SELECT id FROM claimed_rewards WHERE userId = ? AND rewardId = ?').get(userId, reward.id);
  if (existingClaim) return res.status(400).json({ error: 'Belohnung wurde bereits gewählt' });

  const access = rewardAccess(userId, reward, user.coins);
  if (!access.unlocked) return res.status(400).json({ error: access.lockedReason });
  
  if (reward.cost > 0) {
    db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(reward.cost, userId);
  }
  const status = reward.requiresApproval === 1 ? 'requested' : 'claimed';
  const result = db.prepare('INSERT INTO claimed_rewards (userId, rewardId, status, claimedAt) VALUES (?, ?, ?, ?)')
    .run(userId, reward.id, status, new Date().toISOString());
  res.json({ ok: true, claimId: Number(result.lastInsertRowid), status });
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
  if (!user) return res.status(404).json({ error: 'Nutzer nicht gefunden' });
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

app.get('/api/admin/users', requireAdmin, (_req, res) => {
  const users = db.prepare(`
    SELECT
      u.id,
      u.name,
      u.pin,
      u.role,
      u.coins,
      u.streak,
      u.lastPlayed,
      u.avatar,
      u.createdAt,
      COUNT(p.id) as progressCount,
      COALESCE(SUM(p.mastered), 0) as masteredCount
    FROM users u
    LEFT JOIN progress p ON p.userId = u.id
    GROUP BY u.id
    ORDER BY
      CASE u.role WHEN 'admin' THEN 0 WHEN 'parent' THEN 1 ELSE 2 END,
      lower(u.name)
  `).all() as any[];
  res.json(users);
});

app.post('/api/admin/users', requireAdmin, (req, res) => {
  const name = req.body.name?.trim();
  const pin = req.body.pin;
  const role = allowedRoles.has(req.body.role) ? req.body.role : 'child';
  if (!name || !isValidPin(pin)) {
    return res.status(400).json({ error: 'Name und 4-stelliger Zahlencode sind Pflichtfelder' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE lower(name) = lower(?)').get(name);
  if (exists) return res.status(400).json({ error: 'Name bereits vergeben' });

  const now = new Date().toISOString();
  const result = db.prepare('INSERT INTO users (name, pin, role, createdAt) VALUES (?, ?, ?, ?)')
    .run(name, pin, role, now);
  const user = db.prepare('SELECT id, name, pin, role, coins, streak, lastPlayed, avatar, createdAt FROM users WHERE id = ?')
    .get(Number(result.lastInsertRowid));
  res.status(201).json(user);
});

app.patch('/api/admin/users/:id', requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  const existing = db.prepare('SELECT id, name, pin, role, coins, streak, avatar FROM users WHERE id = ?').get(userId) as any;
  if (!existing) return res.status(404).json({ error: 'Nutzer nicht gefunden' });

  const name = typeof req.body.name === 'string' ? req.body.name.trim() : existing.name;
  const pin = req.body.pin === undefined || req.body.pin === '' ? existing.pin : req.body.pin;
  const role = allowedRoles.has(req.body.role) ? req.body.role : existing.role;
  const coins = req.body.coins === undefined ? existing.coins : Math.max(0, Number(req.body.coins));
  const streak = req.body.streak === undefined ? existing.streak : Math.max(0, Number(req.body.streak));
  const avatar = typeof req.body.avatar === 'string' && req.body.avatar.trim() ? req.body.avatar.trim() : existing.avatar;

  if (!name || !isValidPin(pin) || Number.isNaN(coins) || Number.isNaN(streak)) {
    return res.status(400).json({ error: 'Bitte Name, PIN, Münzen und Serie prüfen' });
  }

  const duplicate = db.prepare('SELECT id FROM users WHERE lower(name) = lower(?) AND id != ?').get(name, userId);
  if (duplicate) return res.status(400).json({ error: 'Name bereits vergeben' });

  if (canManageAcademy(existing.role) && !canManageAcademy(role)) {
    const academyManagers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role IN ('parent', 'admin') AND id != ?")
      .get(userId) as { c: number };
    if (academyManagers.c === 0) {
      return res.status(400).json({ error: 'Mindestens ein Eltern/Admin-Zugang muss erhalten bleiben' });
    }
  }

  db.prepare('UPDATE users SET name = ?, pin = ?, role = ?, coins = ?, streak = ?, avatar = ? WHERE id = ?')
    .run(name, pin, role, Math.floor(coins), Math.floor(streak), avatar, userId);

  if (req.session.userId === userId) {
    req.session.role = role;
  }

  const user = db.prepare('SELECT id, name, pin, role, coins, streak, lastPlayed, avatar, createdAt FROM users WHERE id = ?')
    .get(userId);
  res.json(user);
});

const allowedRewardKinds = new Set(['real', 'game']);
const allowedUnlockTypes = new Set(['coins', 'quest', 'final']);
const allowedRewardVisibility = new Set(['visible', 'unlocked']);
const allowedClaimStatuses = new Set(['requested', 'approved', 'claimed', 'fulfilled', 'cancelled']);

function sanitizeRewardInput(body: any, existing?: any) {
  const title = typeof body.title === 'string' ? body.title.trim() : existing?.title;
  const description = typeof body.description === 'string' ? body.description.trim() : existing?.description ?? '';
  const icon = typeof body.icon === 'string' && body.icon.trim() ? body.icon.trim() : existing?.icon ?? '🎁';
  const kind = allowedRewardKinds.has(body.kind) ? body.kind : existing?.kind ?? 'real';
  const unlockType = allowedUnlockTypes.has(body.unlockType) ? body.unlockType : existing?.unlockType ?? 'coins';
  const cost = body.cost === undefined ? existing?.cost ?? 0 : Math.max(0, Number(body.cost));
  const questId = body.questId === undefined || body.questId === '' ? null : Number(body.questId);
  const active = body.active === undefined ? existing?.active ?? 1 : body.active ? 1 : 0;
  const sortOrder = body.sortOrder === undefined || body.sortOrder === '' ? existing?.sortOrder ?? 0 : Number(body.sortOrder);
  const requiresApproval = body.requiresApproval === undefined
    ? existing?.requiresApproval ?? (kind === 'real' ? 1 : 0)
    : body.requiresApproval ? 1 : 0;
  const visibility = allowedRewardVisibility.has(body.visibility) ? body.visibility : existing?.visibility ?? 'visible';
  const parentNote = typeof body.parentNote === 'string' ? body.parentNote.trim() : existing?.parentNote ?? '';

  if (!title || Number.isNaN(cost) || Number.isNaN(sortOrder) || (questId !== null && Number.isNaN(questId))) {
    return { error: 'Bitte Titel, Kosten und Sortierung prüfen' };
  }
  if ((unlockType === 'quest' || unlockType === 'final') && questId === null) {
    return { error: 'Level-Belohnungen brauchen ein verbundenes Level' };
  }
  if (questId !== null) {
    const quest = db.prepare('SELECT id FROM quests WHERE id = ?').get(questId);
    if (!quest) return { error: 'Verbundenes Level wurde nicht gefunden' };
  }

  return {
    reward: {
      title,
      description,
      icon,
      kind,
      unlockType,
      cost: Math.floor(cost),
      questId,
      active,
      sortOrder: Math.floor(sortOrder),
      requiresApproval,
      visibility,
      parentNote,
    },
  };
}

app.get('/api/admin/rewards', requireAdmin, (_req, res) => {
  const rewards = db.prepare(`
    SELECT r.*, q.title as questTitle
    FROM rewards r
    LEFT JOIN quests q ON q.id = r.questId
    ORDER BY r.active DESC, r.sortOrder, r.id
  `).all() as any[];
  const claims = db.prepare(`
    SELECT cr.id, cr.userId, cr.rewardId, cr.status, cr.claimedAt, u.name as userName, r.title as rewardTitle, r.icon, r.kind, r.parentNote
    FROM claimed_rewards cr
    JOIN users u ON u.id = cr.userId
    JOIN rewards r ON r.id = cr.rewardId
    ORDER BY
      CASE cr.status WHEN 'requested' THEN 0 WHEN 'approved' THEN 1 WHEN 'claimed' THEN 2 WHEN 'fulfilled' THEN 3 ELSE 4 END,
      cr.claimedAt DESC
  `).all() as any[];
  res.json({ rewards, claims });
});

app.post('/api/admin/rewards', requireAdmin, (req, res) => {
  const parsed = sanitizeRewardInput(req.body);
  if ('error' in parsed) return res.status(400).json({ error: parsed.error });
  const reward = parsed.reward;
  const result = db.prepare(`
    INSERT INTO rewards (title, description, cost, icon, kind, unlockType, questId, active, sortOrder, requiresApproval, visibility, parentNote, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reward.title,
    reward.description,
    reward.cost,
    reward.icon,
    reward.kind,
    reward.unlockType,
    reward.questId,
    reward.active,
    reward.sortOrder,
    reward.requiresApproval,
    reward.visibility,
    reward.parentNote,
    new Date().toISOString(),
  );
  res.status(201).json(db.prepare('SELECT * FROM rewards WHERE id = ?').get(Number(result.lastInsertRowid)));
});

app.patch('/api/admin/rewards/:id', requireAdmin, (req, res) => {
  const rewardId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM rewards WHERE id = ?').get(rewardId) as any;
  if (!existing) return res.status(404).json({ error: 'Belohnung nicht gefunden' });
  const parsed = sanitizeRewardInput(req.body, existing);
  if ('error' in parsed) return res.status(400).json({ error: parsed.error });
  const reward = parsed.reward;

  db.prepare(`
    UPDATE rewards
    SET title = ?, description = ?, cost = ?, icon = ?, kind = ?, unlockType = ?, questId = ?, active = ?, sortOrder = ?, requiresApproval = ?, visibility = ?, parentNote = ?
    WHERE id = ?
  `).run(
    reward.title,
    reward.description,
    reward.cost,
    reward.icon,
    reward.kind,
    reward.unlockType,
    reward.questId,
    reward.active,
    reward.sortOrder,
    reward.requiresApproval,
    reward.visibility,
    reward.parentNote,
    rewardId,
  );
  res.json(db.prepare('SELECT * FROM rewards WHERE id = ?').get(rewardId));
});

app.patch('/api/admin/reward-claims/:id', requireAdmin, (req, res) => {
  const claimId = Number(req.params.id);
  const status = allowedClaimStatuses.has(req.body.status) ? req.body.status : null;
  if (!status) return res.status(400).json({ error: 'Ungültiger Status' });
  const existing = db.prepare('SELECT id FROM claimed_rewards WHERE id = ?').get(claimId);
  if (!existing) return res.status(404).json({ error: 'Anforderung nicht gefunden' });
  db.prepare('UPDATE claimed_rewards SET status = ? WHERE id = ?').run(status, claimId);
  res.json({ ok: true, status });
});

app.post('/api/admin/words', requireAdmin, (req, res) => {
  const parsed = sanitizeWordInput(req.body);
  if ('error' in parsed) return res.status(400).json({ error: parsed.error });
  const word = parsed.word;

  const duplicate = db.prepare('SELECT id FROM words WHERE lower(german) = lower(?) AND lower(english) = lower(?)')
    .get(word.german, word.english);
  if (duplicate) return res.status(400).json({ error: 'Dieses Wort ist bereits in der Wortbank' });

  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO words (german, english, type, category, past, participle, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    word.german,
    word.english,
    word.type,
    word.category,
    word.past,
    word.participle,
    now,
  );

  const saved = db.prepare('SELECT id, german, english, type, category, past, participle FROM words WHERE id = ?')
    .get(Number(result.lastInsertRowid));
  res.status(201).json(saved);
});

function sanitizeWordInput(body: any, existing?: any) {
  const german = typeof body.german === 'string' ? body.german.trim() : existing?.german;
  const english = typeof body.english === 'string' ? body.english.trim() : existing?.english;
  const type = body.type === 'irregular' || body.type === 'vocab' ? body.type : existing?.type ?? 'vocab';
  const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : null;
  const past = typeof body.past === 'string' && body.past.trim() ? body.past.trim() : null;
  const participle = typeof body.participle === 'string' && body.participle.trim() ? body.participle.trim() : null;

  if (!german || !english) {
    return { error: 'Deutsch und Englisch sind Pflichtfelder' };
  }
  if (type === 'irregular' && (!past || !participle)) {
    return { error: 'Unregelmäßige Verben brauchen Past Simple und Past Participle' };
  }

  return {
    word: {
      german,
      english,
      type,
      category,
      past: type === 'irregular' ? past : null,
      participle: type === 'irregular' ? participle : null,
    },
  };
}

app.patch('/api/admin/words/:id', requireAdmin, (req, res) => {
  const wordId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM words WHERE id = ?').get(wordId) as any;
  if (!existing) return res.status(404).json({ error: 'Wort nicht gefunden' });

  const parsed = sanitizeWordInput(req.body, existing);
  if ('error' in parsed) return res.status(400).json({ error: parsed.error });
  const word = parsed.word;

  const duplicate = db.prepare('SELECT id FROM words WHERE lower(german) = lower(?) AND lower(english) = lower(?) AND id != ?')
    .get(word.german, word.english, wordId);
  if (duplicate) return res.status(400).json({ error: 'Dieses Wort ist bereits in der Wortbank' });

  db.prepare(`
    UPDATE words
    SET german = ?, english = ?, type = ?, category = ?, past = ?, participle = ?
    WHERE id = ?
  `).run(word.german, word.english, word.type, word.category, word.past, word.participle, wordId);

  const saved = db.prepare('SELECT id, german, english, type, category, past, participle FROM words WHERE id = ?')
    .get(wordId);
  res.json(saved);
});

app.delete('/api/admin/words/:id', requireAdmin, (req, res) => {
  const wordId = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM words WHERE id = ?').get(wordId);
  if (!existing) return res.status(404).json({ error: 'Wort nicht gefunden' });

  db.prepare('DELETE FROM quest_words WHERE wordId = ?').run(wordId);
  db.prepare('DELETE FROM progress WHERE wordId = ?').run(wordId);
  db.prepare('DELETE FROM words WHERE id = ?').run(wordId);
  res.json({ ok: true });
});

app.patch('/api/admin/quests/:id', requireAdmin, (req, res) => {
  const questId = Number(req.params.id);
  const allowedGameTypes = new Set(['spark-catcher', 'library-sorter', 'verb-assembler', 'text-input']);
  const allowedKinds = new Set(['vocab', 'verb', 'mixed']);
  const existing = db.prepare('SELECT * FROM quests WHERE id = ?').get(questId) as any;
  if (!existing) return res.status(404).json({ error: 'Quest nicht gefunden' });

  const title = req.body.title?.trim();
  const subtitle = req.body.subtitle?.trim();
  const chapter = req.body.chapter?.trim();
  const kind = allowedKinds.has(req.body.kind) ? req.body.kind : existing.kind;
  const gameType = allowedGameTypes.has(req.body.gameType) ? req.body.gameType : existing.gameType;
  const reward = typeof req.body.reward === 'string' ? req.body.reward.trim() : existing.reward;
  const guide = req.body.guide?.trim();

  if (!title || !subtitle || !chapter || !guide) {
    return res.status(400).json({ error: 'Titel, Untertitel, Kapitel und Pips Hinweis sind Pflichtfelder' });
  }

  db.prepare(`
    UPDATE quests
    SET title = ?, subtitle = ?, chapter = ?, kind = ?, gameType = ?, reward = ?, guide = ?
    WHERE id = ?
  `).run(title, subtitle, chapter, kind, gameType, reward, guide, questId);

  res.json(getQuests().find(item => item.id === questId));
});

app.post('/api/admin/quests/:id/words', requireAdmin, (req, res) => {
  const questId = Number(req.params.id);
  const wordId = Number(req.body.wordId);
  const quest = db.prepare('SELECT id FROM quests WHERE id = ?').get(questId);
  const word = db.prepare('SELECT id FROM words WHERE id = ?').get(wordId);
  if (!quest || !word) return res.status(404).json({ error: 'Quest oder Wort nicht gefunden' });

  const row = db.prepare('SELECT COALESCE(MAX(sortOrder), 0) + 1 as nextOrder FROM quest_words WHERE questId = ?').get(questId) as { nextOrder: number };
  db.prepare('INSERT OR IGNORE INTO quest_words (questId, wordId, sortOrder) VALUES (?, ?, ?)')
    .run(questId, wordId, row.nextOrder);
  res.json({ ok: true });
});

app.delete('/api/admin/quests/:questId/words/:wordId', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM quest_words WHERE questId = ? AND wordId = ?').run(Number(req.params.questId), Number(req.params.wordId));
  res.json({ ok: true });
});

app.get('/api/admin/content', requireAdmin, (_req, res) => {
  const quests = getQuests();
  const words = db.prepare('SELECT id, german, english, type, category, past, participle FROM words ORDER BY id').all() as any[];
  const wordsById = new Map(words.map(word => [word.id, word]));
  res.json({
    quests: quests.map(quest => ({
      ...quest,
      wordItems: quest.words.map((wordId: number) => wordsById.get(wordId)).filter(Boolean),
    })),
    words,
  });
});

// ─── Static files ───
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Wordwick Academy läuft auf http://localhost:${PORT}`);
});
