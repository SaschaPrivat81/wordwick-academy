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
    subtitle: 'Die ersten Zauberworte fuer Tiere',
    chapter: 'Haupthalle',
    kind: 'vocab',
    x: 53,
    y: 53,
    sigil: 'paw',
    words: [1, 2],
    reward: 'Bronzefeder',
    guide: 'In der Haupthalle beginnt jedes Abenteuer mit den ersten starken Woertern.',
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
    guide: 'Unregelmaessige Verben sind eigensinnig. Im Workshop mischen wir ihre drei Formen.',
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
    guide: 'Auf dem Uebungsplatz zaehlt Tempo: sehen, erkennen, richtig antworten.',
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
];

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
