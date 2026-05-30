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

export interface QuestStory {
  arc: string;
  mapTeaser: string;
  missionIntro: string;
  correct: string;
  wrong: string;
  completed: string;
  rewardReveal: string;
}

export const questStories: Record<number, QuestStory> = {
  1: {
    arc: 'Kapitel I: Die verlorenen Wortfunken',
    mapTeaser: 'Über Wordwick Academy sind in der Nacht blaue Wortfunken verschwunden. Pip hat die erste Spur in der Haupthalle gefunden.',
    missionIntro: 'Pip flattert über die alten Steinfliesen. "Wenn wir die Tierwörter wecken, leuchtet der erste Pfad wieder."',
    correct: 'Ein Wortfunke springt zurück in die Karte. Pip tippt begeistert mit der Schwanzspitze auf den nächsten Stern.',
    wrong: 'Pip legt den Kopf schief. "Fast. Das Wort knistert schon, aber wir müssen es sauber aussprechen."',
    completed: 'Die Bronzefeder schwebt aus dem Wappen der Haupthalle. Der erste Pfad auf der Karte beginnt wieder zu glimmen.',
    rewardReveal: 'Die Bronzefeder zeigt Pip, wohin die Spur als Nächstes führt.',
  },
  2: {
    arc: 'Kapitel I: Die verlorenen Wortfunken',
    mapTeaser: 'In der Moonlit Library flüstern die Regale durcheinander, weil einige Wörter ihren Platz verloren haben.',
    missionIntro: 'Zwischen Mondlicht und Staubkringeln sucht Pip nach einem Buch, das nur aufgeht, wenn die richtigen Zimmerwörter fallen.',
    correct: 'Die Buchseiten rascheln zustimmend. Pip nickt, als hätte er genau dieses Wort gerochen.',
    wrong: 'Ein Regal rückt leise zurück. Pip stupst dich an: "Noch einmal. Die Bibliothek hört sehr genau hin."',
    completed: 'Silbertinte sammelt sich in einem kleinen Glas und schreibt von selbst den nächsten Hinweis auf die Karte.',
    rewardReveal: 'Mit der Silbertinte kann Pip unsichtbare Pfade auf dem Pergament sichtbar machen.',
  },
  3: {
    arc: 'Kapitel I: Die verlorenen Wortfunken',
    mapTeaser: 'Im Wordbrew Workshop brodeln unregelmäßige Verben in kleinen Kesseln und wechseln ständig ihre Form.',
    missionIntro: 'Pip landet am Kesselrand. "Diese Verben sind wilder als Papier im Wind. Wir brauchen alle drei Formen."',
    correct: 'Der Kessel blubbert blau statt grau. Pip grinst, weil die Form genau eingerastet ist.',
    wrong: 'Ein paar Funken spritzen daneben. Pip wischt sich Ruß von der Nase: "Nicht schlimm. Verben üben gerne Verstecken."',
    completed: 'Der Sternenstempel fällt aus einer Rauchwolke und markiert deine Karte mit einem hellen Siegel.',
    rewardReveal: 'Der Sternenstempel macht starke Verb-Zauber haltbarer.',
  },
  4: {
    arc: 'Kapitel I: Die verlorenen Wortfunken',
    mapTeaser: 'Auf den Sky Practice Yards fliegen Wortfunken in schnellen Bögen über den Übungsplatz.',
    missionIntro: 'Pip zieht einen Kreis in die Luft. "Hier zählen wache Augen und schnelle Erinnerungen. Fang die Verben, bevor sie davonziehen."',
    correct: 'Ein Funke saust direkt in Pips Flügelmuster. Er lacht: "Gefangen!"',
    wrong: 'Der Funke schlägt einen Haken. Pip zeigt in die Richtung, in der er verschwunden ist.',
    completed: 'Der Mondkristall sinkt aus dem Himmel und bleibt warm in deiner Hand liegen.',
    rewardReveal: 'Der Mondkristall speichert schwierige Wörter, damit du sie später gezielt wiederholen kannst.',
  },
  5: {
    arc: 'Kapitel I: Die verlorenen Wortfunken',
    mapTeaser: 'Im Stargazer Tower sieht Pip eine Sternspur, die nur erscheint, wenn Vokabeln und Verbformen zusammenpassen.',
    missionIntro: 'Pip sitzt auf dem Fernrohr. "Der Turm prüft, ob die ersten Zauber wirklich sitzen. Danach öffnet sich das nächste Kapitel."',
    correct: 'Ein Stern rückt an seinen Platz. Pip wird ganz still, weil das Muster am Himmel klarer wird.',
    wrong: 'Das Fernrohr beschlägt kurz. Pip flüstert: "Wir putzen den Gedanken und versuchen es noch einmal."',
    completed: 'Das goldene Lesezeichen landet in deinem Abenteuerbuch. Kapitel I ist fast vollständig erhellt.',
    rewardReveal: 'Das goldene Lesezeichen merkt sich deine stärksten Wörter für spätere Meisterprüfungen.',
  },
  6: {
    arc: 'Kapitel II: Der Garten der neuen Wörter',
    mapTeaser: 'Im Glashaus wachsen neue Vokabeln wie leuchtende Samen. Dieses Gebiet wartet auf eigenen Content.',
    missionIntro: 'Pip späht durch die Scheiben. "Wenn hier neue Wörter eingepflanzt werden, wächst daraus ein ganzes Übungsbeet."',
    correct: 'Ein Blatt entfaltet sich mit blauer Tinte.',
    wrong: 'Der Samen wackelt, bleibt aber geschlossen. Pip merkt sich die Stelle.',
    completed: 'Ein Kristallsamen ist bereit für neue Wortlisten.',
    rewardReveal: 'Kristallsamen können später Themen wie Farben, Pflanzen oder Schulsachen freischalten.',
  },
  7: {
    arc: 'Kapitel II: Der Garten der neuen Wörter',
    mapTeaser: 'Der Flüsterwald antwortet nur Kindern, die seine Wörter aufmerksam erkennen.',
    missionIntro: 'Pip lauscht zwischen den Bäumen. "Der Wald flüstert englisch. Wir müssen lernen, was er meint."',
    correct: 'Ein Blatt dreht sich silbern in der Luft.',
    wrong: 'Das Flüstern wird leiser. Pip hebt eine Kralle an den Mund.',
    completed: 'Das Silberblatt legt sich als Wegweiser auf die Karte.',
    rewardReveal: 'Das Silberblatt zeigt später versteckte Wiederholungswege.',
  },
  8: {
    arc: 'Kapitel III: Die Probe der Drachenhöhle',
    mapTeaser: 'In der Wyrm Cave bewacht ein alter Schatten besonders starke Verbformen.',
    missionIntro: 'Pip richtet sich mutig auf. "Keine Sorge. Große Prüfungen bestehen aus kleinen richtigen Antworten."',
    correct: 'Aus der Höhle klingt ein tiefes, zufriedenes Grollen.',
    wrong: 'Ein warmer Luftstoß pustet über den Boden. Pip bleibt neben dir stehen.',
    completed: 'Die Drachenmarke erscheint wie ein blaues Siegel im Fels.',
    rewardReveal: 'Die Drachenmarke kann später eine echte Finallevel-Belohnung ankündigen.',
  },
  9: {
    arc: 'Kapitel III: Die Probe der Drachenhöhle',
    mapTeaser: 'Am Moonwell Lake spiegeln sich genau die Wörter, die noch einmal geübt werden wollen.',
    missionIntro: 'Pip schaut in das Wasser. "Der See zeigt nicht, was leicht ist. Er zeigt, was stärker werden kann."',
    correct: 'Eine Welle trägt den Wortfunken zurück ans Ufer.',
    wrong: 'Das Spiegelbild verschwimmt. Pip wartet geduldig, bis es wieder klar wird.',
    completed: 'Die Mondperle rollt aus dem Wasser und nimmt einen schwierigen Zauber in sich auf.',
    rewardReveal: 'Die Mondperle wird später Wiederholungen besonders clever machen.',
  },
  10: {
    arc: 'Kapitel IV: Die Meisterprüfung',
    mapTeaser: 'Auf den Mastery Grounds wartet das erste große Finale der Wordwick Academy.',
    missionIntro: 'Pip landet auf deiner Schulter. "Das ist kein normales Level. Das ist der Moment, in dem die Karte dich anerkennt."',
    correct: 'Die Arena leuchtet einen Kreis heller.',
    wrong: 'Die Arena bleibt ruhig. Pip sagt: "Meister werden nicht durch Perfektion stark, sondern durch Wiederkommen."',
    completed: 'Das Meisterabzeichen öffnet das Tor zum nächsten Abenteuer der Akademie.',
    rewardReveal: 'Dieses Abzeichen eignet sich später perfekt für eine echte Belohnung.',
  },
};

export function getQuestStory(questId: number): QuestStory {
  return questStories[questId] ?? {
    arc: 'Wordwick Academy',
    mapTeaser: 'Pip hat hier eine neue Spur gefunden.',
    missionIntro: 'Pip schaut auf die Karte. "Dieses Level wartet auf seine eigene Geschichte."',
    correct: 'Ein Wortfunke leuchtet auf.',
    wrong: 'Pip bleibt ruhig bei dir und zeigt auf den nächsten Versuch.',
    completed: 'Die Quest ist geschafft.',
    rewardReveal: 'Eine neue Belohnung wartet darauf, gestaltet zu werden.',
  };
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
