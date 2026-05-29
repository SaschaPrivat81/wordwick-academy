import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_PATH || 'wordwick-academy.db';
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// ─── Schema ───
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'child',
    coins INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    lastPlayed TEXT,
    avatar TEXT DEFAULT 'blocky',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    german TEXT NOT NULL,
    english TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'vocab',
    category TEXT,
    past TEXT,
    participle TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    wordId INTEGER NOT NULL,
    correctCount INTEGER NOT NULL DEFAULT 0,
    wrongCount INTEGER NOT NULL DEFAULT 0,
    lastSeen TEXT,
    mastered INTEGER NOT NULL DEFAULT 0,
    UNIQUE(userId, wordId)
  );

  CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    cost INTEGER NOT NULL,
    icon TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS claimed_rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    rewardId INTEGER NOT NULL,
    claimedAt TEXT NOT NULL
  );
`);

const userColumns = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
if (!userColumns.some(column => column.name === 'role')) {
  db.prepare("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'child'").run();
}

// ─── Seed Demo-Daten ───
const wordCount = db.prepare('SELECT COUNT(*) as c FROM words').get() as { c: number };
if (wordCount.c === 0) {
  const now = new Date().toISOString();
  const words = [
    ['Hund', 'dog', 'vocab', 'tiere'],
    ['Katze', 'cat', 'vocab', 'tiere'],
    ['Haus', 'house', 'vocab', 'wohnen'],
    ['gehen', 'go', 'irregular', 'verben', 'went', 'gone'],
    ['laufen', 'run', 'irregular', 'verben', 'ran', 'run'],
    ['essen', 'eat', 'irregular', 'verben', 'ate', 'eaten'],
    ['sehen', 'see', 'irregular', 'verben', 'saw', 'seen'],
    ['trinken', 'drink', 'irregular', 'verben', 'drank', 'drunk'],
    ['schlafen', 'sleep', 'irregular', 'verben', 'slept', 'slept'],
    ['schreiben', 'write', 'irregular', 'verben', 'wrote', 'written'],
  ];
  const insert = db.prepare('INSERT INTO words (german, english, type, category, past, participle, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const w of words) {
    insert.run(w[0], w[1], w[2], w[3], w[4] ?? null, w[5] ?? null, now);
  }

  // Demo-Belohnungen
  db.prepare('INSERT INTO rewards (title, cost, icon, createdAt) VALUES (?, ?, ?, ?)')
    .run('20 Min Minecraft', 30, '🎮', now);
  db.prepare('INSERT INTO rewards (title, cost, icon, createdAt) VALUES (?, ?, ?, ?)')
    .run('Eis essen gehen', 50, '🍦', now);
  db.prepare('INSERT INTO rewards (title, cost, icon, createdAt) VALUES (?, ?, ?, ?)')
    .run('Neues Buch', 100, '📚', now);
}

export { db };
