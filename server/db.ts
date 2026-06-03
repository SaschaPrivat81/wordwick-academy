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
    grade TEXT,
    unit TEXT,
    difficulty INTEGER NOT NULL DEFAULT 1,
    past TEXT,
    participle TEXT,
    imagePath TEXT,
    imageAlt TEXT,
    imageSource TEXT,
    audioPath TEXT,
    audioText TEXT,
    audioVoice TEXT,
    audioSource TEXT,
    notes TEXT,
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

  CREATE TABLE IF NOT EXISTS quest_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    questId INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    bestPercent INTEGER NOT NULL DEFAULT 0,
    bestCorrect INTEGER NOT NULL DEFAULT 0,
    bestTotal INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    lastPlayed TEXT NOT NULL,
    completedAt TEXT,
    UNIQUE(userId, questId)
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

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS story_audio (
    storyId TEXT PRIMARY KEY,
    audioPath TEXT NOT NULL,
    audioText TEXT,
    audioVoice TEXT,
    audioSource TEXT,
    updatedAt TEXT NOT NULL
  );
`);

const userColumns = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
if (!userColumns.some(column => column.name === 'role')) {
  db.prepare("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'child'").run();
}

const rewardColumns = db.prepare('PRAGMA table_info(rewards)').all() as { name: string }[];
if (!rewardColumns.some(column => column.name === 'description')) {
  db.prepare("ALTER TABLE rewards ADD COLUMN description TEXT NOT NULL DEFAULT ''").run();
}
if (!rewardColumns.some(column => column.name === 'kind')) {
  db.prepare("ALTER TABLE rewards ADD COLUMN kind TEXT NOT NULL DEFAULT 'real'").run();
}
if (!rewardColumns.some(column => column.name === 'unlockType')) {
  db.prepare("ALTER TABLE rewards ADD COLUMN unlockType TEXT NOT NULL DEFAULT 'coins'").run();
}
if (!rewardColumns.some(column => column.name === 'questId')) {
  db.prepare('ALTER TABLE rewards ADD COLUMN questId INTEGER').run();
}
if (!rewardColumns.some(column => column.name === 'active')) {
  db.prepare('ALTER TABLE rewards ADD COLUMN active INTEGER NOT NULL DEFAULT 1').run();
}
if (!rewardColumns.some(column => column.name === 'sortOrder')) {
  db.prepare('ALTER TABLE rewards ADD COLUMN sortOrder INTEGER NOT NULL DEFAULT 0').run();
}
if (!rewardColumns.some(column => column.name === 'requiresApproval')) {
  db.prepare('ALTER TABLE rewards ADD COLUMN requiresApproval INTEGER NOT NULL DEFAULT 1').run();
}
if (!rewardColumns.some(column => column.name === 'visibility')) {
  db.prepare("ALTER TABLE rewards ADD COLUMN visibility TEXT NOT NULL DEFAULT 'visible'").run();
}
if (!rewardColumns.some(column => column.name === 'parentNote')) {
  db.prepare("ALTER TABLE rewards ADD COLUMN parentNote TEXT NOT NULL DEFAULT ''").run();
}

const claimedRewardColumns = db.prepare('PRAGMA table_info(claimed_rewards)').all() as { name: string }[];
if (!claimedRewardColumns.some(column => column.name === 'status')) {
  db.prepare("ALTER TABLE claimed_rewards ADD COLUMN status TEXT NOT NULL DEFAULT 'claimed'").run();
}

const questColumns = db.prepare('PRAGMA table_info(quests)').all() as { name: string }[];
if (!questColumns.some(column => column.name === 'sortOrder')) {
  db.prepare('ALTER TABLE quests ADD COLUMN sortOrder INTEGER NOT NULL DEFAULT 0').run();
}
const addedGameTypeColumn = !questColumns.some(column => column.name === 'gameType');
if (addedGameTypeColumn) {
  db.prepare("ALTER TABLE quests ADD COLUMN gameType TEXT NOT NULL DEFAULT 'text-input'").run();
}
if (!questColumns.some(column => column.name === 'taskLimit')) {
  db.prepare('ALTER TABLE quests ADD COLUMN taskLimit INTEGER').run();
}

const wordColumns = db.prepare('PRAGMA table_info(words)').all() as { name: string }[];
if (!wordColumns.some(column => column.name === 'grade')) {
  db.prepare("ALTER TABLE words ADD COLUMN grade TEXT").run();
}
if (!wordColumns.some(column => column.name === 'unit')) {
  db.prepare("ALTER TABLE words ADD COLUMN unit TEXT").run();
}
if (!wordColumns.some(column => column.name === 'difficulty')) {
  db.prepare('ALTER TABLE words ADD COLUMN difficulty INTEGER NOT NULL DEFAULT 1').run();
}
if (!wordColumns.some(column => column.name === 'notes')) {
  db.prepare("ALTER TABLE words ADD COLUMN notes TEXT").run();
}
if (!wordColumns.some(column => column.name === 'imagePath')) {
  db.prepare("ALTER TABLE words ADD COLUMN imagePath TEXT").run();
}
if (!wordColumns.some(column => column.name === 'imageAlt')) {
  db.prepare("ALTER TABLE words ADD COLUMN imageAlt TEXT").run();
}
if (!wordColumns.some(column => column.name === 'imageSource')) {
  db.prepare("ALTER TABLE words ADD COLUMN imageSource TEXT").run();
}
if (!wordColumns.some(column => column.name === 'audioPath')) {
  db.prepare("ALTER TABLE words ADD COLUMN audioPath TEXT").run();
}
if (!wordColumns.some(column => column.name === 'audioText')) {
  db.prepare("ALTER TABLE words ADD COLUMN audioText TEXT").run();
}
if (!wordColumns.some(column => column.name === 'audioVoice')) {
  db.prepare("ALTER TABLE words ADD COLUMN audioVoice TEXT").run();
}
if (!wordColumns.some(column => column.name === 'audioSource')) {
  db.prepare("ALTER TABLE words ADD COLUMN audioSource TEXT").run();
}

// ─── Seed Demo-Daten ───
const wordCount = db.prepare('SELECT COUNT(*) as c FROM words').get() as { c: number };
if (wordCount.c === 0) {
  const now = new Date().toISOString();
  const words = [
    ['Hund', 'dog', 'vocab', 'tiere'],
    ['Katze', 'cat', 'vocab', 'tiere'],
    ['Buch', 'book', 'vocab', 'schule'],
    ['Hand', 'hand', 'vocab', 'körper'],
    ['Auge', 'eye', 'vocab', 'körper'],
    ['Wasser', 'water', 'vocab', 'getränke'],
    ['Milch', 'milk', 'vocab', 'getränke'],
    ['glücklich', 'happy', 'vocab', 'gefühle'],
    ['müde', 'tired', 'vocab', 'gefühle'],
    ['klatsche in die Hände', 'clap your hands', 'vocab', 'bewegung'],
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
    [1, 'Wordwick Hall', 'Die ersten Zauberworte für Tiere', 'Haupthalle', 'vocab', 64, 49, 'hall', 'Bronzefeder', 'In der Haupthalle beginnt jedes Abenteuer mit den ersten starken Wörtern.'],
    [2, 'Moonlit Library', 'Worte aus Zimmern und Fluren', 'Bibliothek', 'vocab', 29, 78, 'library', 'Silbertinte', 'Zwischen alten Regalen lernt jedes Ding seinen englischen Namen.'],
    [3, 'Wordbrew Workshop', 'Satzbausteine und Alltagswörter mischen', 'Wortbrauerei', 'mixed', 39, 41, 'brew', 'Sternenstempel', 'Im Workshop braut Pip kurze Satzbausteine und Phrasen, die in der Schule wirklich vorkommen.'],
    [4, 'Sky Practice Yards', 'Bewegungswörter schnell erkennen', 'Flugplatz', 'vocab', 18, 66, 'sky', 'Mondkristall', 'Auf dem Übungsplatz zählt Tempo: hören, erkennen, richtig antworten.'],
    [5, 'Stargazer Tower', 'ruhige Worte, starke Formen', 'Sternenturm', 'mixed', 58, 20, 'tower', 'Goldenes Lesezeichen', 'Im Sternenturm sammelt sich alles, was du bisher gelernt hast.'],
    [6, 'Glasshouse Garden', 'Pflanzen, Farben und kleine Dinge', 'Glashaus', 'vocab', 26, 51, 'garden', 'Kristallsamen', 'Das Glashaus wartet auf neue Vokabeln aus deinem Eltern-Dashboard.'],
    [7, 'Whispering Woods', 'Laute, Tiere und Waldwörter', 'Flüsterwald', 'vocab', 78, 28, 'woods', 'Silberblatt', 'Der Wald ist schon auf der Karte, aber sein Wortschatz wird später gefüllt.'],
    [8, 'Wyrm Cave', 'Mutprobe für lange Phrasen', 'Drachenhöhle', 'mixed', 82, 52, 'cave', 'Drachenmarke', 'Die Höhle prüft längere Wörter und Phrasen, aber noch keine unregelmäßigen Verben.'],
    [9, 'Moonwell Lake', 'Verdrehte Zaubersprüche entwirren', 'Mondsee', 'mixed', 77, 72, 'moonwell', 'Mondperle', 'Am Mondsee sieht alles friedlich aus, doch im Wasser treiben die Wortfunken kreuz und quer. Ordne die Zaubersprüche wieder richtig, bevor Pip aus Versehen den See nach Hausaufgaben fragt.'],
    [10, 'Spark Practice Grounds', 'Erste Übungsrunde für sichere Wortfunken', 'Übungshof', 'mixed', 55, 83, 'spark', 'Funkenkompass', 'Auf dem Übungshof lernt Pip mit dir, wie Wortfunken ruhig bleiben, bevor der Pfad weiterleuchtet.'],
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
    [9, 7], [9, 8],
    [5, 9], [5, 10],
  ];
  const insertQuestWord = db.prepare('INSERT INTO quest_words (questId, wordId, sortOrder) VALUES (?, ?, ?)');
  for (const [index, relation] of questWords.entries()) {
    insertQuestWord.run(relation[0], relation[1], index);
  }
}

const umlautQuestFixes = [
  { id: 1, field: 'subtitle', oldValue: 'Die ersten Zauberworte fuer Tiere', newValue: 'Die ersten Zauberworte für Tiere' },
  { id: 1, field: 'guide', oldValue: 'In der Haupthalle beginnt jedes Abenteuer mit den ersten starken Woertern.', newValue: 'In der Haupthalle beginnt jedes Abenteuer mit den ersten starken Wörtern.' },
  { id: 3, field: 'guide', oldValue: 'Unregelmaessige Verben sind eigensinnig. Im Workshop mischen wir ihre drei Formen.', newValue: 'Unregelmäßige Verben sind eigensinnig. Im Workshop mischen wir ihre drei Formen.' },
  { id: 4, field: 'guide', oldValue: 'Auf dem Uebungsplatz zaehlt Tempo: sehen, erkennen, richtig antworten.', newValue: 'Auf dem Übungsplatz zählt Tempo: sehen, erkennen, richtig antworten.' },
  { id: 7, field: 'subtitle', oldValue: 'Laute, Tiere und Waldwoerter', newValue: 'Laute, Tiere und Waldwörter' },
  { id: 7, field: 'chapter', oldValue: 'Fluesterwald', newValue: 'Flüsterwald' },
  { id: 7, field: 'guide', oldValue: 'Der Wald ist schon auf der Karte, aber sein Wortschatz wird spaeter gefuellt.', newValue: 'Der Wald ist schon auf der Karte, aber sein Wortschatz wird später gefüllt.' },
  { id: 8, field: 'subtitle', oldValue: 'Mutprobe fuer starke Verben', newValue: 'Mutprobe für starke Verben' },
  { id: 8, field: 'chapter', oldValue: 'Drachenhoehle', newValue: 'Drachenhöhle' },
  { id: 8, field: 'guide', oldValue: 'Die Hoehle wird ein Hauptlevel mit einer groesseren Pruefung.', newValue: 'Die Höhle wird ein Hauptlevel mit einer größeren Prüfung.' },
  { id: 9, field: 'guide', oldValue: 'Am Mondsee werden schwierige Woerter spaeter gezielt wiederholt.', newValue: 'Am Mondsee werden schwierige Wörter später gezielt wiederholt.' },
  { id: 9, field: 'subtitle', oldValue: 'Wiederholen und festigen', newValue: 'Verdrehte Zaubersprüche entwirren' },
  { id: 9, field: 'guide', oldValue: 'Am Mondsee werden schwierige Wörter später gezielt wiederholt.', newValue: 'Am Mondsee sieht alles friedlich aus, doch im Wasser treiben die Wortfunken kreuz und quer. Ordne die Zaubersprüche wieder richtig, bevor Pip aus Versehen den See nach Hausaufgaben fragt.' },
  { id: 10, field: 'guide', oldValue: 'Hier kann spaeter eine echte Belohnung freigeschaltet werden.', newValue: 'Hier kann später eine echte Belohnung freigeschaltet werden.' },
];

for (const fix of umlautQuestFixes) {
  db.prepare(`UPDATE quests SET ${fix.field} = ? WHERE id = ? AND ${fix.field} = ?`).run(fix.newValue, fix.id, fix.oldValue);
}

const libraryWords = [
  ['Zimmer', 'room', 'vocab', 'wohnen'],
  ['Tür', 'door', 'vocab', 'wohnen'],
  ['Fenster', 'window', 'vocab', 'wohnen'],
  ['Buch', 'book', 'vocab', 'schule'],
];

const findWord = db.prepare('SELECT id FROM words WHERE english = ?');
const insertLibraryWord = db.prepare('INSERT INTO words (german, english, type, category, createdAt) VALUES (?, ?, ?, ?, ?)');
const insertLibraryQuestWord = db.prepare('INSERT OR IGNORE INTO quest_words (questId, wordId, sortOrder) VALUES (?, ?, ?)');
for (const [index, word] of libraryWords.entries()) {
  const existing = findWord.get(word[1]) as { id: number } | undefined;
  const wordId = existing?.id ?? Number(insertLibraryWord.run(word[0], word[1], word[2], word[3], new Date().toISOString()).lastInsertRowid);
  insertLibraryQuestWord.run(2, wordId, 20 + index);
}

const questGameTypes = [
  { id: 1, gameType: 'spark-catcher' },
  { id: 2, gameType: 'library-sorter' },
  { id: 3, gameType: 'text-input' },
  { id: 4, gameType: 'text-input' },
  { id: 5, gameType: 'text-input' },
];

if (addedGameTypeColumn) {
  for (const quest of questGameTypes) {
    db.prepare('UPDATE quests SET gameType = ? WHERE id = ?')
      .run(quest.gameType, quest.id);
  }
}

const progressionMigration = db.prepare("SELECT value FROM app_settings WHERE key = 'map-progression-v1'").get();
if (!progressionMigration) {
  const questProgressionOrder = [
    { id: 1, sortOrder: 1 },
    { id: 2, sortOrder: 2 },
    { id: 3, sortOrder: 3 },
    { id: 9, sortOrder: 4 },
    { id: 5, sortOrder: 5 },
    { id: 4, sortOrder: 6 },
    { id: 6, sortOrder: 7 },
    { id: 7, sortOrder: 8 },
    { id: 8, sortOrder: 9 },
    { id: 10, sortOrder: 10 },
  ];

  for (const quest of questProgressionOrder) {
    db.prepare('UPDATE quests SET sortOrder = ? WHERE id = ?').run(quest.sortOrder, quest.id);
  }

  db.prepare('DELETE FROM quest_words WHERE questId = 4 AND wordId IN (7, 8)').run();
  const movePracticeWordsToMoonwell = db.prepare('INSERT OR IGNORE INTO quest_words (questId, wordId, sortOrder) VALUES (9, ?, ?)');
  movePracticeWordsToMoonwell.run(7, 1);
  movePracticeWordsToMoonwell.run(8, 2);
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('map-progression-v1', 'applied')").run();
}

const lightPathMigration = db.prepare("SELECT value FROM app_settings WHERE key = 'map-progression-v2-light-path'").get();
if (!lightPathMigration) {
  const questProgressionOrder = [
    { id: 1, sortOrder: 1 },
    { id: 10, sortOrder: 2 },
    { id: 2, sortOrder: 3 },
    { id: 4, sortOrder: 4 },
    { id: 6, sortOrder: 5 },
    { id: 3, sortOrder: 6 },
    { id: 9, sortOrder: 7 },
    { id: 8, sortOrder: 8 },
    { id: 7, sortOrder: 9 },
    { id: 5, sortOrder: 10 },
  ];

  for (const quest of questProgressionOrder) {
    db.prepare('UPDATE quests SET sortOrder = ? WHERE id = ?').run(quest.sortOrder, quest.id);
  }
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('map-progression-v2-light-path', 'applied')").run();
}

const mapSigilsMigration = db.prepare("SELECT value FROM app_settings WHERE key = 'map-sigils-v1'").get();
if (!mapSigilsMigration) {
  const questSigils = [
    { id: 1, sigil: 'hall' },
    { id: 2, sigil: 'library' },
    { id: 3, sigil: 'brew' },
    { id: 4, sigil: 'sky' },
    { id: 5, sigil: 'tower' },
    { id: 6, sigil: 'garden' },
    { id: 7, sigil: 'woods' },
    { id: 8, sigil: 'cave' },
    { id: 9, sigil: 'moonwell' },
    { id: 10, sigil: 'spark' },
  ];

  for (const quest of questSigils) {
    db.prepare('UPDATE quests SET sigil = ? WHERE id = ?').run(quest.sigil, quest.id);
  }
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('map-sigils-v1', 'applied')").run();
}

const mapProloguePositionMigration = db.prepare("SELECT value FROM app_settings WHERE key = 'map-prologue-position-v1'").get();
if (!mapProloguePositionMigration) {
  db.prepare('UPDATE quests SET x = 59, y = 55 WHERE id = 1').run();
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('map-prologue-position-v1', 'applied')").run();
}

const stepOnePositionMigration = db.prepare("SELECT value FROM app_settings WHERE key = 'map-step-one-position-v2'").get();
if (!stepOnePositionMigration) {
  db.prepare('UPDATE quests SET x = 64, y = 49 WHERE id = 1').run();
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('map-step-one-position-v2', 'applied')").run();
}

const freshPlayStateMigration = db.prepare("SELECT value FROM app_settings WHERE key = 'fresh-play-state-v1'").get();
if (!freshPlayStateMigration) {
  db.prepare('DELETE FROM progress').run();
  db.prepare('DELETE FROM claimed_rewards').run();
  db.prepare('DELETE FROM quest_results').run();
  db.prepare('UPDATE users SET coins = 0, streak = 0, lastPlayed = NULL').run();
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('fresh-play-state-v1', 'applied')").run();
}

const sparkPracticeMigration = db.prepare("SELECT value FROM app_settings WHERE key = 'spark-practice-grounds-v1'").get();
if (!sparkPracticeMigration) {
  db.prepare(`
    UPDATE quests
    SET title = ?,
        subtitle = ?,
        chapter = ?,
        sigil = ?,
        reward = ?,
        guide = ?
    WHERE id = 10
  `).run(
    'Spark Practice Grounds',
    'Erste Übungsrunde für sichere Wortfunken',
    'Übungshof',
    'spark',
    'Funkenkompass',
    'Auf dem Übungshof lernt Pip mit dir, wie Wortfunken ruhig bleiben, bevor der Pfad weiterleuchtet.',
  );
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('spark-practice-grounds-v1', 'applied')").run();
}

const taskLimitsMigration = db.prepare("SELECT value FROM app_settings WHERE key = 'quest-task-limits-v1'").get();
if (!taskLimitsMigration) {
  const taskLimits = [
    { id: 1, taskLimit: 12 },
    { id: 2, taskLimit: 4 },
    { id: 3, taskLimit: 10 },
    { id: 4, taskLimit: 10 },
    { id: 5, taskLimit: 14 },
    { id: 6, taskLimit: 10 },
    { id: 7, taskLimit: 10 },
    { id: 8, taskLimit: 10 },
    { id: 9, taskLimit: 12 },
    { id: 10, taskLimit: 10 },
  ];

  for (const quest of taskLimits) {
    db.prepare('UPDATE quests SET taskLimit = ? WHERE id = ? AND taskLimit IS NULL')
      .run(quest.taskLimit, quest.id);
  }
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('quest-task-limits-v1', 'applied')").run();
}

const classThreePhraseLevelsMigration = db.prepare("SELECT value FROM app_settings WHERE key = 'class-three-phrase-levels-v1'").get();
if (!classThreePhraseLevelsMigration) {
  const questUpdates = [
    {
      id: 3,
      subtitle: 'Satzbausteine und Alltagswörter mischen',
      chapter: 'Wortbrauerei',
      kind: 'mixed',
      gameType: 'text-input',
      guide: 'Im Workshop braut Pip kurze Satzbausteine und Phrasen, die in der Schule wirklich vorkommen.',
    },
    {
      id: 4,
      subtitle: 'Bewegungswörter schnell erkennen',
      chapter: 'Flugplatz',
      kind: 'vocab',
      gameType: 'text-input',
      guide: 'Auf dem Übungsplatz zählt Tempo: hören, erkennen, richtig antworten.',
    },
    {
      id: 8,
      subtitle: 'Mutprobe für lange Phrasen',
      chapter: 'Drachenhöhle',
      kind: 'mixed',
      gameType: 'text-input',
      guide: 'Die Höhle prüft längere Wörter und Phrasen, aber noch keine unregelmäßigen Verben.',
    },
  ];

  for (const quest of questUpdates) {
    db.prepare(`
      UPDATE quests
      SET subtitle = ?, chapter = ?, kind = ?, gameType = ?, guide = ?
      WHERE id = ?
    `).run(quest.subtitle, quest.chapter, quest.kind, quest.gameType, quest.guide, quest.id);
  }

  const phraseBuckets = [
    { questId: 3, categories: ['morning routine', 'food', 'drinks'] },
    { questId: 4, categories: ['body actions', 'body'] },
    { questId: 8, categories: ['beach', 'comparisons'] },
  ];
  const insertQuestWord = db.prepare('INSERT OR IGNORE INTO quest_words (questId, wordId, sortOrder) VALUES (?, ?, ?)');

  for (const bucket of phraseBuckets) {
    const findWordsByCategory = db.prepare(`
      SELECT id
      FROM words
      WHERE type = 'vocab'
        AND lower(COALESCE(category, '')) IN (${bucket.categories.map(() => '?').join(', ')})
      ORDER BY difficulty DESC, id
      LIMIT 12
    `);
    const rows = findWordsByCategory.all(...bucket.categories) as { id: number }[];
    for (const [index, row] of rows.entries()) {
      insertQuestWord.run(bucket.questId, row.id, 200 + index);
    }
  }

  db.prepare("INSERT INTO app_settings (key, value) VALUES ('class-three-phrase-levels-v1', 'applied')").run();
}

const classThreeSeedVerbCleanup = db.prepare("SELECT value FROM app_settings WHERE key = 'class-three-seed-verb-cleanup-v1'").get();
if (!classThreeSeedVerbCleanup) {
  db.prepare(`
    UPDATE words
    SET type = 'vocab',
        category = 'actions',
        past = NULL,
        participle = NULL,
        notes = CASE
          WHEN notes IS NULL OR notes = '' THEN 'Als normales Aktionswort für Klasse 3 genutzt.'
          ELSE notes
        END
    WHERE type = 'irregular'
      AND lower(COALESCE(category, '')) = 'verben'
      AND lower(english) IN ('go', 'run', 'eat', 'see', 'drink', 'sleep', 'write')
  `).run();
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('class-three-seed-verb-cleanup-v1', 'applied')").run();
}

const wordImageCardsMigration = db.prepare("SELECT value FROM app_settings WHERE key = 'word-image-cards-v1'").get();
if (!wordImageCardsMigration) {
  const wordImages = [
    { english: 'bat', path: '/assets/word-images/wordwick-bat.jpg', alt: 'Wordwick Bildkarte: Fledermaus' },
    { english: 'book', path: '/assets/word-images/wordwick-book.jpg', alt: 'Wordwick Bildkarte: Buch' },
    { english: 'cat', path: '/assets/word-images/wordwick-cat.jpg', alt: 'Wordwick Bildkarte: Katze' },
    { english: 'chair', path: '/assets/word-images/wordwick-chair.jpg', alt: 'Wordwick Bildkarte: Stuhl' },
    { english: 'dog', path: '/assets/word-images/wordwick-dog.jpg', alt: 'Wordwick Bildkarte: Hund' },
    { english: 'eye', path: '/assets/word-images/wordwick-eye.jpg', alt: 'Wordwick Bildkarte: Auge' },
    { english: 'hand', path: '/assets/word-images/wordwick-hand.jpg', alt: 'Wordwick Bildkarte: Hand' },
    { english: 'nose', path: '/assets/word-images/wordwick-nose.jpg', alt: 'Wordwick Bildkarte: Nase' },
    { english: 'owl', path: '/assets/word-images/wordwick-owl.jpg', alt: 'Wordwick Bildkarte: Eule' },
    { english: 'ruler', path: '/assets/word-images/wordwick-ruler.jpg', alt: 'Wordwick Bildkarte: Lineal' },
    { english: 'scissors', path: '/assets/word-images/wordwick-scissors.jpg', alt: 'Wordwick Bildkarte: Schere' },
    { english: 'toast', path: '/assets/word-images/wordwick-toast.jpg', alt: 'Wordwick Bildkarte: Toast' },
  ];

  for (const image of wordImages) {
    db.prepare(`
      UPDATE words
      SET imagePath = ?,
          imageAlt = ?,
          imageSource = 'AI-generierte Wordwick Bildkarte'
      WHERE lower(english) = ?
        AND (imagePath IS NULL OR imagePath = '')
    `).run(image.path, image.alt, image.english);
  }
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('word-image-cards-v1', 'applied')").run();
}

const whisperingWoodsAudioMigration = db.prepare("SELECT value FROM app_settings WHERE key = 'whispering-woods-audio-v1'").get();
if (!whisperingWoodsAudioMigration) {
  const wordAudioFiles = [
    'angry',
    'friendly',
    'funny',
    'glasses',
    'grumpy',
    'happy',
    'helpful',
    'honest',
    'sad',
    'scared',
    'smart',
    'thirsty',
    'tired',
  ];

  for (const english of wordAudioFiles) {
    db.prepare(`
      UPDATE words
      SET audioPath = ?,
          audioText = ?,
          audioVoice = NULL,
          audioSource = 'ElevenLabs'
      WHERE lower(english) = ?
        AND (audioPath IS NULL OR audioPath = '')
    `).run(`/assets/word-audio/whispering-woods-${english}.mp3`, english, english);
  }
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('whispering-woods-audio-v1', 'applied')").run();
}

const stargazerFinalMigration = db.prepare("SELECT value FROM app_settings WHERE key = 'stargazer-final-game-v1'").get();
if (!stargazerFinalMigration) {
  db.prepare(`
    UPDATE quests
    SET gameType = 'constellation-trial',
        taskLimit = 14,
        subtitle = 'Die Sternbild-Prüfung im Turmfinale',
        guide = 'Im Stargazer Tower verbindet Pip Bildkarten, Hörzauber, Wort-Bausteine und Zaubersprüche zu einer letzten Sternbild-Prüfung.'
    WHERE id = 5
  `).run();
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('stargazer-final-game-v1', 'applied')").run();
}

const rewardDefaults = [
  { title: '20 Min Minecraft', description: 'Ein echtes Eltern-Fach: 20 Minuten Spielzeit nach Absprache.', kind: 'real', unlockType: 'coins', cost: 30, icon: '🎮', sortOrder: 1, requiresApproval: 1, visibility: 'visible' },
  { title: 'Eis essen gehen', description: 'Eine größere echte Belohnung für fleißig gesammelte Wortfunken.', kind: 'real', unlockType: 'coins', cost: 50, icon: '🍦', sortOrder: 2, requiresApproval: 1, visibility: 'visible' },
  { title: 'Neues Buch', description: 'Ein besonderes Schrankfach für ein starkes Lernziel.', kind: 'real', unlockType: 'coins', cost: 100, icon: '📚', sortOrder: 3, requiresApproval: 1, visibility: 'unlocked' },
];

for (const reward of rewardDefaults) {
  db.prepare(`
    UPDATE rewards
    SET description = CASE WHEN description = '' THEN ? ELSE description END,
        kind = ?,
        unlockType = ?,
        cost = ?,
        icon = ?,
        sortOrder = ?,
        requiresApproval = ?,
        visibility = ?
    WHERE title = ?
  `).run(reward.description, reward.kind, reward.unlockType, reward.cost, reward.icon, reward.sortOrder, reward.requiresApproval, reward.visibility, reward.title);
}

export { db };
