export type QuestKind = 'vocab' | 'verb' | 'mixed';

export interface AcademyQuest {
  id: number;
  title: string;
  subtitle: string;
  chapter: string;
  kind: QuestKind;
  x: number;
  y: number;
  sigil: string;
  words: number[];
  reward: string;
  guide: string;
}

export const academyQuests: AcademyQuest[] = [
  {
    id: 1,
    title: 'Wordwick Hall',
    subtitle: 'Die ersten Zauberworte für Tiere',
    chapter: 'Haupthalle',
    kind: 'vocab',
    x: 53,
    y: 53,
    sigil: 'paw',
    words: [1, 2],
    reward: 'Bronzefeder',
    guide: 'In der Haupthalle beginnt jedes Abenteuer mit den ersten starken Wörtern.',
  },
  {
    id: 2,
    title: 'Moonlit Library',
    subtitle: 'Worte aus Zimmern und Fluren',
    chapter: 'Bibliothek',
    kind: 'vocab',
    x: 29,
    y: 78,
    sigil: 'home',
    words: [3],
    reward: 'Silbertinte',
    guide: 'Zwischen alten Regalen lernt jedes Ding seinen englischen Namen.',
  },
  {
    id: 3,
    title: 'Wordbrew Workshop',
    subtitle: 'go, went, gone und Freunde',
    chapter: 'Wortbrauerei',
    kind: 'verb',
    x: 39,
    y: 41,
    sigil: 'spark',
    words: [4, 5, 6],
    reward: 'Sternenstempel',
    guide: 'Unregelmäßige Verben sind eigensinnig. Im Workshop mischen wir ihre drei Formen.',
  },
  {
    id: 4,
    title: 'Sky Practice Yards',
    subtitle: 'sehen, trinken und merken',
    chapter: 'Flugplatz',
    kind: 'verb',
    x: 18,
    y: 66,
    sigil: 'water',
    words: [7, 8],
    reward: 'Mondkristall',
    guide: 'Auf dem Übungsplatz zählt Tempo: sehen, erkennen, richtig antworten.',
  },
  {
    id: 5,
    title: 'Stargazer Tower',
    subtitle: 'ruhige Worte, starke Formen',
    chapter: 'Sternenturm',
    kind: 'mixed',
    x: 58,
    y: 20,
    sigil: 'book',
    words: [9, 10],
    reward: 'Goldenes Lesezeichen',
    guide: 'Im Sternenturm sammelt sich alles, was du bisher gelernt hast.',
  },
  {
    id: 6,
    title: 'Glasshouse Garden',
    subtitle: 'Pflanzen, Farben und kleine Dinge',
    chapter: 'Glashaus',
    kind: 'vocab',
    x: 26,
    y: 51,
    sigil: 'spark',
    words: [],
    reward: 'Kristallsamen',
    guide: 'Das Glashaus wartet auf neue Vokabeln aus deinem Eltern-Dashboard.',
  },
  {
    id: 7,
    title: 'Whispering Woods',
    subtitle: 'Laute, Tiere und Waldwörter',
    chapter: 'Flüsterwald',
    kind: 'vocab',
    x: 78,
    y: 28,
    sigil: 'trees',
    words: [],
    reward: 'Silberblatt',
    guide: 'Der Wald ist schon auf der Karte, aber sein Wortschatz wird später gefüllt.',
  },
  {
    id: 8,
    title: 'Wyrm Cave',
    subtitle: 'Mutprobe für starke Verben',
    chapter: 'Drachenhöhle',
    kind: 'verb',
    x: 82,
    y: 52,
    sigil: 'spark',
    words: [],
    reward: 'Drachenmarke',
    guide: 'Die Höhle wird ein Hauptlevel mit einer größeren Prüfung.',
  },
  {
    id: 9,
    title: 'Moonwell Lake',
    subtitle: 'Wiederholen und festigen',
    chapter: 'Mondsee',
    kind: 'mixed',
    x: 77,
    y: 72,
    sigil: 'water',
    words: [],
    reward: 'Mondperle',
    guide: 'Am Mondsee werden schwierige Wörter später gezielt wiederholt.',
  },
  {
    id: 10,
    title: 'Mastery Grounds',
    subtitle: 'Finale des ersten Kapitels',
    chapter: 'Abschlussplatz',
    kind: 'mixed',
    x: 55,
    y: 83,
    sigil: 'graduation',
    words: [],
    reward: 'Meisterabzeichen',
    guide: 'Hier kann später eine echte Belohnung freigeschaltet werden.',
  },
];

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
