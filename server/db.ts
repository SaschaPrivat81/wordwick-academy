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

  CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    chapter TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'vocab',
    x REAL NOT NULL,
    y REAL NOT NULL,
    sigil TEXT NOT NULL,
    reward TEXT,
    guide TEXT NOT NULL,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quest_words (
    questId INTEGER NOT NULL,
    wordId INTEGER NOT NULL,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (questId, wordId)
  );
`);

const userColumns = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
if (!userColumns.some(column => column.name === 'role')) {
  db.prepare("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'child'").run();
}

const questColumns = db.prepare('PRAGMA table_info(quests)').all() as { name: string }[];
if (!questColumns.some(column => column.name === 'sortOrder')) {
  db.prepare('ALTER TABLE quests ADD COLUMN sortOrder INTEGER NOT NULL DEFAULT 0').run();
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

const questCount = db.prepare('SELECT COUNT(*) as c FROM quests').get() as { c: number };
if (questCount.c === 0) {
  const now = new Date().toISOString();
  const quests = [
    [1, 'Wordwick Hall', 'Die ersten Zauberworte fuer Tiere', 'Haupthalle', 'vocab', 53, 53, 'paw', 'Bronzefeder', 'In der Haupthalle beginnt jedes Abenteuer mit den ersten starken Woertern.'],
    [2, 'Moonlit Library', 'Worte aus Zimmern und Fluren', 'Bibliothek', 'vocab', 29, 78, 'home', 'Silbertinte', 'Zwischen alten Regalen lernt jedes Ding seinen englischen Namen.'],
    [3, 'Wordbrew Workshop', 'go, went, gone und Freunde', 'Wortbrauerei', 'verb', 39, 41, 'spark', 'Sternenstempel', 'Unregelmaessige Verben sind eigensinnig. Im Workshop mischen wir ihre drei Formen.'],
    [4, 'Sky Practice Yards', 'sehen, trinken und merken', 'Flugplatz', 'verb', 18, 66, 'water', 'Mondkristall', 'Auf dem Uebungsplatz zaehlt Tempo: sehen, erkennen, richtig antworten.'],
    [5, 'Stargazer Tower', 'ruhige Worte, starke Formen', 'Sternenturm', 'mixed', 58, 20, 'book', 'Goldenes Lesezeichen', 'Im Sternenturm sammelt sich alles, was du bisher gelernt hast.'],
    [6, 'Glasshouse Garden', 'Pflanzen, Farben und kleine Dinge', 'Glashaus', 'vocab', 26, 51, 'spark', 'Kristallsamen', 'Das Glashaus wartet auf neue Vokabeln aus deinem Eltern-Dashboard.'],
    [7, 'Whispering Woods', 'Laute, Tiere und Waldwoerter', 'Fluesterwald', 'vocab', 78, 28, 'trees', 'Silberblatt', 'Der Wald ist schon auf der Karte, aber sein Wortschatz wird spaeter gefuellt.'],
    [8, 'Wyrm Cave', 'Mutprobe fuer starke Verben', 'Drachenhoehle', 'verb', 82, 52, 'spark', 'Drachenmarke', 'Die Hoehle wird ein Hauptlevel mit einer groesseren Pruefung.'],
    [9, 'Moonwell Lake', 'Wiederholen und festigen', 'Mondsee', 'mixed', 77, 72, 'water', 'Mondperle', 'Am Mondsee werden schwierige Woerter spaeter gezielt wiederholt.'],
    [10, 'Mastery Grounds', 'Finale des ersten Kapitels', 'Abschlussplatz', 'mixed', 55, 83, 'graduation', 'Meisterabzeichen', 'Hier kann spaeter eine echte Belohnung freigeschaltet werden.'],
  ];
  const insertQuest = db.prepare(`
    INSERT INTO quests (id, title, subtitle, chapter, kind, x, y, sigil, reward, guide, sortOrder, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const quest of quests) {
    insertQuest.run(...quest, quest[0], now);
  }

  const questWords = [
    [1, 1], [1, 2],
    [2, 3],
    [3, 4], [3, 5], [3, 6],
    [4, 7], [4, 8],
    [5, 9], [5, 10],
  ];
  const insertQuestWord = db.prepare('INSERT INTO quest_words (questId, wordId, sortOrder) VALUES (?, ?, ?)');
  for (const [index, relation] of questWords.entries()) {
    insertQuestWord.run(relation[0], relation[1], index);
  }
}

export { db };
