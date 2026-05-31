export type QuestKind = 'vocab' | 'verb' | 'mixed';

export interface AcademyQuest {
  id: number;
  title: string;
  subtitle: string;
  chapter: string;
  kind: QuestKind;
  gameType?: 'spark-catcher' | 'library-sorter' | 'verb-assembler' | 'text-input';
  sortOrder?: number;
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

export interface StoryScenePage {
  speaker: 'Pip' | 'Karte' | 'Portrait' | 'Erzähler';
  title: string;
  body: string;
  aside?: string;
}

export interface StoryScene {
  id: string;
  unlockAfterQuestId: number;
  title: string;
  subtitle: string;
  eyebrow: string;
  rewardLine: string;
  x: number;
  y: number;
  pages: StoryScenePage[];
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
    arc: 'Kapitel II: Der Himmelspfad',
    mapTeaser: 'Auf den Sky Practice Yards warten später schnelle Übungsflüge.',
    missionIntro: 'Pip zieht einen Kreis in die Luft. "Hier zählen wache Augen und schnelle Erinnerungen. Fang die Verben, bevor sie davonziehen."',
    correct: 'Ein Funke saust direkt in Pips Flügelmuster. Er lacht: "Gefangen!"',
    wrong: 'Der Funke schlägt einen Haken. Pip zeigt in die Richtung, in der er verschwunden ist.',
    completed: 'Der Mondkristall sinkt aus dem Himmel und bleibt warm in deiner Hand liegen.',
    rewardReveal: 'Der Mondkristall passt gut zu späteren Tempo-Übungen.',
  },
  5: {
    arc: 'Kapitel I: Die verlorenen Wortfunken',
    mapTeaser: 'Im Stargazer Tower wartet das Finale der ersten Sternspur.',
    missionIntro: 'Pip sitzt auf dem Fernrohr. "Der Turm prüft, ob die ersten Zauber wirklich sitzen. Danach erkennt die Akademie deinen Fortschritt."',
    correct: 'Ein Stern rückt an seinen Platz. Pip wird ganz still, weil das Muster am Himmel klarer wird.',
    wrong: 'Das Fernrohr beschlägt kurz. Pip flüstert: "Wir putzen den Gedanken und versuchen es noch einmal."',
    completed: 'Das goldene Lesezeichen landet in deinem Abenteuerbuch. Kapitel I ist erhellt.',
    rewardReveal: 'Das goldene Lesezeichen ist die Finalbelohnung der ersten Sternspur.',
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
    arc: 'Kapitel I: Die verlorenen Wortfunken',
    mapTeaser: 'Am Moonwell Lake springt die Spur vom Workshop über das Wasser und sammelt die nächsten Verbfunken.',
    missionIntro: 'Pip schaut in das Wasser. "Der See zeigt nicht, was leicht ist. Er zeigt, was stärker werden kann. Danach führt das Licht hoch zum Turm."',
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

export const storyScenes: StoryScene[] = [
  {
    id: 'ink-mist',
    unlockAfterQuestId: 2,
    title: 'Der Tintennebel lacht',
    subtitle: 'Eine Spur ist plötzlich sehr falsch beschriftet.',
    eyebrow: 'Zwischensequenz I',
    rewardLine: 'Pip findet heraus, dass die verschwundenen Wortfunken nicht einfach weggeweht wurden.',
    x: 24,
    y: 72,
    pages: [
      {
        speaker: 'Erzähler',
        title: 'Ein Schild zeigt Unsinn',
        body: 'Nach der Moonlit Library zittert die Akademiekarte. Über dem nächsten Flur erscheint ein neues Schild: "Please do not feed the doors." Darunter steht auf Deutsch: "Bitte die Türen nicht mit Suppe füttern."',
        aside: 'Pip starrt das Schild an und flüstert: "Ich wusste gar nicht, dass Türen Suppe mögen."',
      },
      {
        speaker: 'Pip',
        title: 'Pip wird misstrauisch',
        body: 'Pip tippt mit einer Papierkralle gegen die Tinte. Die Buchstaben kichern, laufen auseinander und setzen sich neu zusammen. Für einen Moment steht dort ein Name: Tintennebel.',
        aside: '"Aha", sagt Pip. "Das ist kein Wind. Das ist jemand mit sehr schlechtem Sinn für Grammatik."',
      },
      {
        speaker: 'Karte',
        title: 'Die Karte warnt',
        body: 'Blaue Linien kriechen über das Pergament. Die Karte zeigt keinen neuen Raum, sondern eine Frage: Warum verstecken sich Wörter, wenn man sie zu schnell und zu schwer macht?',
        aside: 'Pip klappt die Flügel zusammen. "Das klingt nach einer Prüfung. Oder nach Hausaufgaben mit dramatischer Beleuchtung."',
      },
    ],
  },
  {
    id: 'greenhouse-whisper',
    unlockAfterQuestId: 3,
    title: 'Der Garten flüstert zurück',
    subtitle: 'Ein fremdes Wort wächst mitten auf der nächsten Route.',
    eyebrow: 'Zwischensequenz II',
    rewardLine: 'Die Akademie zeigt, dass neue Wörter nicht nur gesammelt, sondern gepflegt werden müssen.',
    x: 73,
    y: 78,
    pages: [
      {
        speaker: 'Portrait',
        title: 'Ein beleidigtes Portrait',
        body: 'Im Glashaus hängt ein kleines Portrait einer früheren Wortgärtnerin. Sie schnaubt: "Endlich kommt jemand. Seit Tagen nennt mich dieser Nebel Mrs. Cucumber."',
        aside: 'Pip nickt höflich. "Guten Tag, Mrs... äh... nicht Cucumber."',
      },
      {
        speaker: 'Erzähler',
        title: 'Ein wildes Wort sprießt',
        body: 'Zwischen den Kristallsamen wächst ein fremdes Wort. Es leuchtet, dreht sich und versucht, sich selbst zu übersetzen. Erst steht dort "flower", dann "floor", dann "flour".',
        aside: 'Pip setzt sich daneben. "Drei Wörter, ein Buchstabe Unterschied. Das ist entweder Magie oder ein sehr gemeiner Witz."',
      },
      {
        speaker: 'Pip',
        title: 'Die erste Regel',
        body: 'Pip versteht: Manche Wortfunken sind nicht böse. Sie sind durcheinander. Wenn neue Wörter in die Akademie kommen, brauchen sie einen guten Platz, Wiederholung und jemanden, der nicht gleich seufzt.',
        aside: '"Also dich", sagt Pip. "Ich seufze nämlich schon bei Treppen."',
      },
    ],
  },
  {
    id: 'moonwell-truth',
    unlockAfterQuestId: 7,
    title: 'Die Wahrheit im Moonwell',
    subtitle: 'Der See zeigt, warum der Tintennebel entstanden ist.',
    eyebrow: 'Zwischensequenz III',
    rewardLine: 'Vor dem Finale wird klar: Der Gegner ist eher ein Unfall als ein Bösewicht.',
    x: 68,
    y: 24,
    pages: [
      {
        speaker: 'Erzähler',
        title: 'Der See antwortet nicht sofort',
        body: 'Am Moonwell Lake wirft Pip einen Wortfunken ins Wasser. Nichts passiert. Dann blubbert der See: "Loading..." Pip schaut dich an. "Selbst magische Seen brauchen manchmal einen Moment."',
      },
      {
        speaker: 'Karte',
        title: 'Ein altes Missgeschick',
        body: 'Im Wasser erscheint die Erinnerung an eine frühere Prüfung. Jemand wollte alle schweren Wörter der Akademie auf einmal lernen. Die Wörter gerieten in Panik, versteckten sich und ließen den Tintennebel zurück.',
        aside: 'Pip wird leise. "Dann ist der Nebel nicht einfach böse. Er ist ein Haufen überforderter Tinte."',
      },
      {
        speaker: 'Pip',
        title: 'Vor dem Turm',
        body: 'Pip richtet seine Papierflügel. "Im Stargazer Tower müssen wir nicht kämpfen. Wir müssen Ordnung schaffen. Und vielleicht dem Nebel erklären, dass niemand alle unregelmäßigen Verben an einem Dienstag schaffen muss."',
        aside: 'Er denkt kurz nach. "Mittwoch wäre auch sportlich."',
      },
    ],
  },
  {
    id: 'chapter-one-finale',
    unlockAfterQuestId: 5,
    title: 'Das erste Sternbild',
    subtitle: 'Die Akademie erkennt den ersten großen Fortschritt.',
    eyebrow: 'Finalszene',
    rewardLine: 'Kapitel I ist abgeschlossen und ein neuer Bereich der Akademie beginnt zu flimmern.',
    x: 52,
    y: 13,
    pages: [
      {
        speaker: 'Erzähler',
        title: 'Der Sternenturm öffnet sich',
        body: 'Als die letzte Antwort im Stargazer Tower leuchtet, ordnen sich die Wortfunken am Himmel. Sie bilden kein normales Sternbild, sondern einen kleinen Papierdrachen mit viel zu stolzem Blick.',
        aside: 'Pip räuspert sich. "Reine Zufälligkeit. Sehr geschmackvolle Zufälligkeit."',
      },
      {
        speaker: 'Karte',
        title: 'Ein neuer Rand erscheint',
        body: 'Die Karte knistert. Hinter dem Glashaus und dem Flüsterwald erscheinen neue blasse Linien. Die Akademie ist größer, als sie bisher zugeben wollte.',
      },
      {
        speaker: 'Pip',
        title: 'Pips Versprechen',
        body: 'Pip setzt sich auf den Rand der Karte. "Heute haben wir nicht nur Wörter gelernt. Wir haben ihnen gezeigt, dass sie hier sicher sind. Morgen finden wir heraus, was hinter dem nächsten Pfad wartet."',
        aside: '"Und jetzt", sagt er, "brauche ich dringend einen Keks. Aus Papier. Oder normal. Ich bin flexibel."',
      },
    ],
  },
];

export function getStoryScene(sceneId: string) {
  return storyScenes.find(scene => scene.id === sceneId);
}

export function getUnlockedStorySceneAfterQuest(questId: number) {
  return storyScenes.find(scene => scene.unlockAfterQuestId === questId);
}

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
    gameType: 'spark-catcher',
    sortOrder: 1,
    x: 64,
    y: 49,
    sigil: 'hall',
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
    gameType: 'library-sorter',
    sortOrder: 3,
    x: 29,
    y: 78,
    sigil: 'library',
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
    gameType: 'verb-assembler',
    sortOrder: 6,
    x: 39,
    y: 41,
    sigil: 'brew',
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
    gameType: 'text-input',
    sortOrder: 4,
    x: 18,
    y: 66,
    sigil: 'sky',
    words: [],
    reward: 'Mondkristall',
    guide: 'Auf dem Übungsplatz zählt Tempo: sehen, erkennen, richtig antworten.',
  },
  {
    id: 5,
    title: 'Stargazer Tower',
    subtitle: 'ruhige Worte, starke Formen',
    chapter: 'Sternenturm',
    kind: 'mixed',
    gameType: 'text-input',
    sortOrder: 10,
    x: 58,
    y: 20,
    sigil: 'tower',
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
    sortOrder: 5,
    x: 26,
    y: 51,
    sigil: 'garden',
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
    sortOrder: 9,
    x: 78,
    y: 28,
    sigil: 'woods',
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
    sortOrder: 8,
    x: 82,
    y: 52,
    sigil: 'cave',
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
    sortOrder: 7,
    x: 77,
    y: 72,
    sigil: 'moonwell',
    words: [7, 8],
    reward: 'Mondperle',
    guide: 'Am Mondsee werden schwierige Wörter später gezielt wiederholt.',
  },
  {
    id: 10,
    title: 'Mastery Grounds',
    subtitle: 'Finale des ersten Kapitels',
    chapter: 'Abschlussplatz',
    kind: 'mixed',
    sortOrder: 2,
    x: 55,
    y: 83,
    sigil: 'mastery',
    words: [],
    reward: 'Meisterabzeichen',
    guide: 'Hier kann später eine echte Belohnung freigeschaltet werden.',
  },
];

export function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
