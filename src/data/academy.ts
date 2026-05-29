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
    title: 'Tor der Tiernamen',
    subtitle: 'Die ersten Zauberworte fuer Tiere',
    chapter: 'Nordhof',
    kind: 'vocab',
    x: 18,
    y: 76,
    sigil: 'paw',
    words: [1, 2],
    reward: 'Bronzefeder',
    guide: 'Sprich die Tiernamen sauber aus, dann oeffnet sich das Schultor.',
  },
  {
    id: 2,
    title: 'Haus der Dinge',
    subtitle: 'Worte aus Zimmern und Fluren',
    chapter: 'Westfluegel',
    kind: 'vocab',
    x: 42,
    y: 62,
    sigil: 'home',
    words: [3],
    reward: 'Silbertinte',
    guide: 'Jedes Ding hat hier zwei Namen: einen deutschen und einen englischen.',
  },
  {
    id: 3,
    title: 'Halle der wilden Verben',
    subtitle: 'go, went, gone und Freunde',
    chapter: 'Verbenturm',
    kind: 'verb',
    x: 70,
    y: 72,
    sigil: 'spark',
    words: [4, 5, 6],
    reward: 'Sternenstempel',
    guide: 'Unregelmaessige Verben sind eigensinnig. Wir zaehmen sie mit drei Formen.',
  },
  {
    id: 4,
    title: 'Brunnen der Sinne',
    subtitle: 'sehen, trinken und merken',
    chapter: 'Innenhof',
    kind: 'verb',
    x: 62,
    y: 38,
    sigil: 'water',
    words: [7, 8],
    reward: 'Mondkristall',
    guide: 'Hier pruefen wir, ob du die Formen auch erkennst, wenn sie auftauchen.',
  },
  {
    id: 5,
    title: 'Bibliothek der Nacht',
    subtitle: 'ruhige Worte, starke Formen',
    chapter: 'Ostturm',
    kind: 'mixed',
    x: 30,
    y: 24,
    sigil: 'book',
    words: [9, 10],
    reward: 'Goldenes Lesezeichen',
    guide: 'Der letzte Raum dieses Kapitels sammelt alles, was du bisher gelernt hast.',
  },
];

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
