import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, PlayCircle, RotateCcw, Sparkles, Volume2, XCircle } from 'lucide-react';
import { AcademyQuest, academyQuests as fallbackQuests, getQuestStory, getUnlockedStorySceneAfterQuest, normalizeAnswer } from '../data/academy';

interface Word {
  id: number;
  german: string;
  english: string;
  type: string;
  past?: string;
  participle?: string;
  imagePath?: string;
  imageAlt?: string;
  audioPath?: string;
  audioText?: string;
  audioVoice?: string;
  audioSource?: string;
}

interface Challenge {
  id: string;
  wordId: number;
  eyebrow: string;
  prompt: string;
  helper: string;
  expected: string;
  acceptable: string[];
  imagePath?: string;
  imageAlt?: string;
  audioPath?: string;
  audioText?: string;
  audioVoice?: string;
  audioSource?: string;
  answerPool: 'english' | 'german' | 'verb';
  mode: 'choice' | 'text' | 'builder' | 'phrase';
  retry?: boolean;
}

interface ResultState {
  correct: boolean;
  expected: string;
}

interface AnswerLogItem {
  challengeId: string;
  wordId: number;
  prompt: string;
  expected: string;
  correct: boolean;
  retry: boolean;
}

const MIN_STANDARD_TASKS = 6;
const QUEST_TASK_LIMITS: Record<number, number> = {
  1: 12,
  2: 4,
  3: 10,
  4: 10,
  5: 14,
  6: 10,
  7: 10,
  8: 10,
  9: 12,
  10: 10,
};

function rotateItems<T>(items: T[], seed: number) {
  if (items.length === 0) return items;
  const offset = seed % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function dailyQuestSeed(questId: number) {
  const today = new Date().toISOString().slice(0, 10).replace(/\D/g, '');
  return Number(today) + questId * 17;
}

function questTaskLimit(quest: AcademyQuest) {
  if (Number.isInteger(quest.taskLimit) && Number(quest.taskLimit) > 0) {
    return Math.min(30, Number(quest.taskLimit));
  }
  return QUEST_TASK_LIMITS[quest.id] ?? (quest.kind === 'mixed' ? 12 : 10);
}

function buildChoiceOptions(expected: string, candidates: string[], seed: number) {
  const normalizedExpected = normalizeAnswer(expected);
  const pool = Array.from(new Set(candidates))
    .filter(candidate => normalizeAnswer(candidate) !== normalizedExpected)
    .filter(Boolean);

  const picked: string[] = [];
  if (pool.length > 0) {
    let index = seed % pool.length;
    while (picked.length < 3 && picked.length < pool.length) {
      const candidate = pool[index % pool.length];
      if (!picked.includes(candidate)) picked.push(candidate);
      index += 2;
    }
  }

  const options = [expected, ...picked];
  const rotation = seed % options.length;
  return [...options.slice(rotation), ...options.slice(0, rotation)];
}

function buildLetterTiles(expected: string, seed: number) {
  const letters = expected.toLowerCase().split('');
  const tiles = letters.map((letter, index) => ({ letter, originalIndex: index }));
  let nextSeed = seed || 1;
  for (let index = tiles.length - 1; index > 0; index--) {
    nextSeed = (nextSeed * 9301 + 49297) % 233280;
    const swapIndex = nextSeed % (index + 1);
    [tiles[index], tiles[swapIndex]] = [tiles[swapIndex], tiles[index]];
  }
  if (tiles.map(tile => tile.letter).join('') === expected.toLowerCase() && tiles.length > 1) {
    const first = tiles.shift();
    if (first) tiles.push(first);
  }
  return tiles;
}

function buildPhraseTiles(expected: string, seed: number) {
  const words = expected.trim().split(/\s+/);
  const tiles = words.map((word, index) => ({ word, originalIndex: index }));
  let nextSeed = seed || 1;
  for (let index = tiles.length - 1; index > 0; index--) {
    nextSeed = (nextSeed * 9301 + 49297) % 233280;
    const swapIndex = nextSeed % (index + 1);
    [tiles[index], tiles[swapIndex]] = [tiles[swapIndex], tiles[index]];
  }
  if (tiles.map(tile => tile.word).join(' ') === expected.trim() && tiles.length > 1) {
    const first = tiles.shift();
    if (first) tiles.push(first);
  }
  return tiles;
}

function buildRetryChallenge(challenge: Challenge, retryNumber: number): Challenge {
  return {
    ...challenge,
    id: `${challenge.id}-retry-${retryNumber}`,
    eyebrow: 'Wiederholung',
    helper: 'Dieses Wort war eben schwierig. Pip legt es noch einmal auf die Karte.',
    mode: challenge.audioPath || challenge.mode === 'builder' || challenge.mode === 'phrase' ? challenge.mode : 'text',
    retry: true,
  };
}

function buildChallenges(words: Word[], quest: AcademyQuest): Challenge[] {
  const rotatedWords = rotateItems(words, dailyQuestSeed(quest.id));
  const isImageChoice = quest.gameType === 'image-choice';
  const isAudioChoice = quest.gameType === 'audio-choice';
  const isWordBuilder = quest.gameType === 'word-builder';
  const isSpellOrder = quest.gameType === 'spell-order';
  const verbChallenges: Challenge[] = [];
  const deEnChallenges: Challenge[] = [];
  const enDeChallenges: Challenge[] = [];
  const writeChallenges: Challenge[] = [];

  for (const word of rotatedWords) {
    if (isSpellOrder) {
      const phraseParts = word.english.trim().split(/\s+/);
      if (word.type !== 'vocab' || phraseParts.length < 2) continue;
      deEnChallenges.push({
        id: `${word.id}-spell-order`,
        wordId: word.id,
        eyebrow: 'Zauberspruch',
        prompt: `Ordne den Zauberspruch für "${word.german}".`,
        helper: 'Tippe die Wort-Kacheln in der richtigen Reihenfolge an.',
        expected: phraseParts.join(' '),
        acceptable: [word.english],
        imagePath: word.imagePath,
        imageAlt: word.imageAlt || `${word.german} / ${word.english}`,
        answerPool: 'english',
        mode: 'phrase',
      });
      continue;
    }

    if (isWordBuilder) {
      if (word.type !== 'vocab' || !/^[a-zA-Z]+$/.test(word.english)) continue;
      deEnChallenges.push({
        id: `${word.id}-word-builder`,
        wordId: word.id,
        eyebrow: 'Wort-Bausteine',
        prompt: `Baue das englische Wort für "${word.german}".`,
        helper: 'Tippe die Buchstaben-Kacheln in der richtigen Reihenfolge an.',
        expected: word.english.toLowerCase(),
        acceptable: [word.english],
        imagePath: word.imagePath,
        imageAlt: word.imageAlt || `${word.german} / ${word.english}`,
        answerPool: 'english',
        mode: 'builder',
      });
      continue;
    }

    if (isImageChoice) {
      if (word.type !== 'vocab' || !word.imagePath) continue;
      deEnChallenges.push({
        id: `${word.id}-image-choice`,
        wordId: word.id,
        eyebrow: 'Bildkarte',
        prompt: 'Welcher englische Wortfunke passt zu diesem Bild?',
        helper: 'Schau dir die Bildkarte genau an und wähle das passende englische Wort.',
        expected: word.english,
        acceptable: [word.english],
        imagePath: word.imagePath,
        imageAlt: word.imageAlt || `${word.german} / ${word.english}`,
        answerPool: 'english',
        mode: 'choice',
      });
      continue;
    }

    if (isAudioChoice) {
      if (word.type !== 'vocab' || !word.audioPath) continue;
      deEnChallenges.push({
        id: `${word.id}-audio-choice`,
        wordId: word.id,
        eyebrow: 'Hörzauber',
        prompt: 'Was bedeutet der gesprochene Wortfunke?',
        helper: 'Hör genau hin und wähle die passende deutsche Bedeutung.',
        expected: word.german,
        acceptable: [word.german],
        imagePath: word.imagePath,
        imageAlt: word.imageAlt || `${word.german} / ${word.english}`,
        audioPath: word.audioPath,
        audioText: word.audioText || word.english,
        audioVoice: word.audioVoice,
        audioSource: word.audioSource,
        answerPool: 'german',
        mode: 'choice',
      });
      continue;
    }

    if (word.type === 'irregular' && (quest.kind === 'verb' || quest.kind === 'mixed')) {
      verbChallenges.push(...[
        {
          id: `${word.id}-base`,
          wordId: word.id,
          eyebrow: 'Grundform',
          prompt: `Wie heisst "${word.german}" auf Englisch?`,
          helper: 'Schreibe die Grundform.',
          expected: word.english,
          acceptable: [word.english],
          answerPool: 'english',
          mode: 'choice',
        },
        {
          id: `${word.id}-past`,
          wordId: word.id,
          eyebrow: 'Past Simple',
          prompt: `${word.english} - ? - ${word.participle ?? ''}`,
          helper: 'Welche zweite Form fehlt?',
          expected: word.past ?? '',
          acceptable: [word.past ?? ''],
          answerPool: 'verb',
          mode: 'text',
        },
        {
          id: `${word.id}-participle`,
          wordId: word.id,
          eyebrow: 'Past Participle',
          prompt: `${word.english} - ${word.past ?? ''} - ?`,
          helper: 'Welche dritte Form fehlt?',
          expected: word.participle ?? '',
          acceptable: [word.participle ?? ''],
          answerPool: 'verb',
          mode: 'text',
        },
      ].filter(challenge => challenge.expected));

      continue;
    }

    deEnChallenges.push({
      id: `${word.id}-de-en`,
      wordId: word.id,
      eyebrow: 'Wortfunke',
      prompt: `Wie heisst "${word.german}" auf Englisch?`,
      helper: 'Fang den richtigen englischen Wortfunken.',
      expected: word.english,
      acceptable: [word.english],
      answerPool: 'english',
      mode: 'choice',
    });

    enDeChallenges.push({
      id: `${word.id}-en-de`,
      wordId: word.id,
      eyebrow: 'Rückzauber',
      prompt: `Was bedeutet "${word.english}" auf Deutsch?`,
      helper: 'Schreibe die deutsche Bedeutung.',
      expected: word.german,
      acceptable: [word.german],
      answerPool: 'german',
      mode: 'text',
    });

    writeChallenges.push({
      id: `${word.id}-write`,
      wordId: word.id,
      eyebrow: 'Schreibzauber',
      prompt: `Schreibe "${word.german}" auf Englisch.`,
      helper: 'Diesmal muss der Wortfunke genau geschrieben werden.',
      expected: word.english,
      acceptable: [word.english],
      answerPool: 'english',
      mode: 'text',
    });
  }

  const baseChallenges = [...deEnChallenges, ...enDeChallenges, ...writeChallenges, ...verbChallenges];

  if (baseChallenges.length === 0) return [];

  const expanded = [...baseChallenges];
  let index = 0;
  while (expanded.length < MIN_STANDARD_TASKS) {
    const source = baseChallenges[index % baseChallenges.length];
    expanded.push({
      ...source,
      id: `${source.id}-round-${Math.floor(index / baseChallenges.length) + 2}`,
      eyebrow: source.mode === 'choice' ? 'Wortfunke' : 'Festigung',
      mode: expanded.length % 2 === 0 ? source.mode : 'text',
    });
    index++;
  }

  return expanded.slice(0, questTaskLimit(quest));
}

export default function Quest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const questId = Number(id);

  const [quest, setQuest] = useState<AcademyQuest | null>(fallbackQuests.find(item => item.id === questId) ?? null);
  const [words, setWords] = useState<Word[]>([]);
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ResultState | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [finished, setFinished] = useState(false);
  const [missionStarted, setMissionStarted] = useState(false);
  const [selectedGermanId, setSelectedGermanId] = useState<number | null>(null);
  const [matchedWordIds, setMatchedWordIds] = useState<number[]>([]);
  const [verbIndex, setVerbIndex] = useState(0);
  const [verbSlots, setVerbSlots] = useState<string[]>([]);
  const [selectedLetterIndexes, setSelectedLetterIndexes] = useState<number[]>([]);
  const [completionSaved, setCompletionSaved] = useState(false);
  const [retryChallenges, setRetryChallenges] = useState<Challenge[]>([]);
  const [answerLog, setAnswerLog] = useState<AnswerLogItem[]>([]);

  useEffect(() => {
    setQuest(fallbackQuests.find(item => item.id === questId) ?? null);
    setWords([]);
    setAllWords([]);
    setCurrentIndex(0);
    setAnswer('');
    setResult(null);
    setCorrectCount(0);
    setCoinsEarned(0);
    setFinished(false);
    setMissionStarted(false);
    setSelectedGermanId(null);
    setMatchedWordIds([]);
    setVerbIndex(0);
    setVerbSlots([]);
    setSelectedLetterIndexes([]);
    setCompletionSaved(false);
    setRetryChallenges([]);
    setAnswerLog([]);

    Promise.all([
      fetch(`/api/quests/${questId}`, { credentials: 'include' }).then(response => response.ok ? response.json() : null),
      fetch(`/api/quests/${questId}/words`, { credentials: 'include' }).then(response => response.ok ? response.json() : []),
      fetch('/api/words', { credentials: 'include' }).then(response => response.ok ? response.json() : []),
    ]).then(([nextQuest, nextWords, nextAllWords]: [AcademyQuest | null, Word[], Word[]]) => {
      setQuest(nextQuest ?? fallbackQuests.find(item => item.id === questId) ?? null);
      setWords(nextWords);
      setAllWords(nextAllWords);
    });
  }, [questId]);

  const challenges = useMemo<Challenge[]>(() => {
    if (!quest) return [];
    return buildChallenges(words, quest);
  }, [quest, words]);

  const activeChallenges = useMemo(() => [...challenges, ...retryChallenges], [challenges, retryChallenges]);
  const current = activeChallenges[currentIndex];
  const activeGameType = quest?.gameType ?? (quest?.id === 1 ? 'spark-catcher' : quest?.id === 2 ? 'library-sorter' : 'text-input');
  const isLibrarySorter = activeGameType === 'library-sorter';
  const isVerbAssembler = activeGameType === 'verb-assembler';
  const isImageChoice = activeGameType === 'image-choice' && current?.mode === 'choice';
  const isAudioChoice = activeGameType === 'audio-choice' && current?.mode === 'choice';
  const isWordBuilder = activeGameType === 'word-builder' && current?.mode === 'builder';
  const isSpellOrder = activeGameType === 'spell-order' && current?.mode === 'phrase';
  const verbWords = useMemo(
    () => words.filter(word => word.type === 'irregular' && word.past && word.participle),
    [words],
  );
  const currentVerb = verbWords[verbIndex];
  const verbForms = currentVerb ? [currentVerb.english, currentVerb.past ?? '', currentVerb.participle ?? ''] : [];
  const verbStoneOptions = useMemo(
    () => [...verbForms].sort((a, b) => ((a.charCodeAt(0) + a.length * 3) % 11) - ((b.charCodeAt(0) + b.length * 3) % 11)),
    [verbForms],
  );
  const libraryWords = useMemo(() => {
    if (!isLibrarySorter) return [];
    const combined = [...words, ...allWords.filter(word => word.type === 'vocab')];
    const unique = new Map<number, Word>();
    for (const word of combined) unique.set(word.id, word);
    return Array.from(unique.values()).slice(0, 4);
  }, [allWords, isLibrarySorter, words]);
  const libraryEnglishCards = useMemo(
    () => [...libraryWords].sort((a, b) => ((a.id * 7) % 11) - ((b.id * 7) % 11)),
    [libraryWords],
  );
  const totalTasks = isVerbAssembler ? verbWords.length : isLibrarySorter ? libraryWords.length : activeChallenges.length;
  const percent = isVerbAssembler
    ? (totalTasks > 0 ? Math.round((verbIndex / totalTasks) * 100) : 0)
    : isLibrarySorter
    ? (totalTasks > 0 ? Math.round((matchedWordIds.length / totalTasks) * 100) : 0)
    : (activeChallenges.length > 0 ? Math.round((currentIndex / activeChallenges.length) * 100) : 0);
  const pipMissionImage = result ? (result.correct ? '/assets/pip-cheer.webp' : '/assets/pip-think.webp') : '/assets/pip-guide.webp';
  const isSparkCatcher = activeGameType === 'spark-catcher' && current?.mode === 'choice';
  const choiceOptions = useMemo(() => {
    if (!current || (!isSparkCatcher && !isImageChoice && !isAudioChoice)) return [];
    const candidateWords = allWords.length > 0 ? allWords : words;
    const candidates = current.answerPool === 'german'
      ? candidateWords.map(word => word.german)
      : current.answerPool === 'verb'
      ? candidateWords.flatMap(word => [word.english, word.past, word.participle]).filter(Boolean) as string[]
      : candidateWords.map(word => word.english);
    return buildChoiceOptions(
      current.expected,
      candidates,
      current.wordId + currentIndex + questId,
    );
  }, [allWords, current, currentIndex, isAudioChoice, isImageChoice, isSparkCatcher, questId, words]);
  const choiceOptionWords = useMemo(() => {
    const candidateWords = allWords.length > 0 ? allWords : words;
    return {
      byEnglish: new Map(candidateWords.map(word => [normalizeAnswer(word.english), word])),
      byGerman: new Map(candidateWords.map(word => [normalizeAnswer(word.german), word])),
    };
  }, [allWords, words]);
  const letterTiles = useMemo(
    () => current && isWordBuilder ? buildLetterTiles(current.expected, current.wordId + currentIndex + questId * 3) : [],
    [current, currentIndex, isWordBuilder, questId],
  );
  const phraseTiles = useMemo(
    () => current && isSpellOrder ? buildPhraseTiles(current.expected, current.wordId + currentIndex + questId * 5) : [],
    [current, currentIndex, isSpellOrder, questId],
  );
  const builderAnswer = selectedLetterIndexes.map(index => letterTiles[index]?.letter ?? '').join('');
  const phraseAnswer = selectedLetterIndexes.map(index => phraseTiles[index]?.word ?? '').join(' ');
  const weakWordIds = useMemo(() => Array.from(new Set(answerLog.filter(item => !item.correct).map(item => item.wordId))), [answerLog]);
  const retrySolvedCount = answerLog.filter(item => item.retry && item.correct).length;
  const weakWords = useMemo(
    () => weakWordIds.map(wordId => words.find(word => word.id === wordId)).filter(Boolean) as Word[],
    [weakWordIds, words],
  );

  const report = async (wordId: number, isCorrect: boolean) => {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ wordId, correct: isCorrect }),
    });
  };

  const completeQuest = async (finalCorrectCount = correctCount) => {
    setFinished(true);
    if (completionSaved || !quest || totalTasks <= 0) return;
    setCompletionSaved(true);
    await fetch('/api/quest-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        questId: quest.id,
        correct: finalCorrectCount,
        total: totalTasks,
      }),
    });
  };

  const checkAnswer = async (value: string) => {
    if (!current || result) return;

    const normalized = normalizeAnswer(value);
    const acceptable = current.acceptable.map(normalizeAnswer).filter(Boolean);
    const isCorrect = acceptable.includes(normalized);
    setResult({ correct: isCorrect, expected: current.expected });
    setAnswerLog(log => [...log, {
      challengeId: current.id,
      wordId: current.wordId,
      prompt: current.prompt,
      expected: current.expected,
      correct: isCorrect,
      retry: Boolean(current.retry),
    }]);

    if (isCorrect) {
      setCorrectCount(value => value + 1);
      setCoinsEarned(value => value + 1);
    } else if (!current.retry) {
      setRetryChallenges(existing => [...existing, buildRetryChallenge(current, existing.length + 1)]);
    }

    await report(current.wordId, isCorrect);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await checkAnswer(answer);
  };

  const chooseAnswer = async (value: string) => {
    if (result) return;
    setAnswer(value);
    await checkAnswer(value);
  };

  const chooseLetterTile = async (tileIndex: number) => {
    if (!current || result || selectedLetterIndexes.includes(tileIndex)) return;
    const nextIndexes = [...selectedLetterIndexes, tileIndex];
    const nextAnswer = nextIndexes.map(index => letterTiles[index]?.letter ?? '').join('');
    setSelectedLetterIndexes(nextIndexes);
    setAnswer(nextAnswer);
    if (nextIndexes.length >= letterTiles.length) {
      await checkAnswer(nextAnswer);
    }
  };

  const choosePhraseTile = async (tileIndex: number) => {
    if (!current || result || selectedLetterIndexes.includes(tileIndex)) return;
    const nextIndexes = [...selectedLetterIndexes, tileIndex];
    const nextAnswer = nextIndexes.map(index => phraseTiles[index]?.word ?? '').join(' ');
    setSelectedLetterIndexes(nextIndexes);
    setAnswer(nextAnswer);
    if (nextIndexes.length >= phraseTiles.length) {
      await checkAnswer(nextAnswer);
    }
  };

  const undoLetterTile = () => {
    if (result) return;
    const nextIndexes = selectedLetterIndexes.slice(0, -1);
    setSelectedLetterIndexes(nextIndexes);
    setAnswer(isSpellOrder
      ? nextIndexes.map(index => phraseTiles[index]?.word ?? '').join(' ')
      : nextIndexes.map(index => letterTiles[index]?.letter ?? '').join(''));
  };

  const clearLetterTiles = () => {
    if (result) return;
    setSelectedLetterIndexes([]);
    setAnswer('');
  };

  const chooseLibraryGerman = (wordId: number) => {
    if (matchedWordIds.includes(wordId)) return;
    setSelectedGermanId(wordId);
    setResult(null);
  };

  const chooseLibraryEnglish = async (word: Word) => {
    if (!selectedGermanId || result || matchedWordIds.includes(word.id)) return;

    const selectedWord = libraryWords.find(item => item.id === selectedGermanId);
    if (!selectedWord) return;

    const isCorrect = selectedWord.id === word.id;
    setResult({ correct: isCorrect, expected: selectedWord.english });
    setAnswerLog(log => [...log, {
      challengeId: `library-${selectedWord.id}-${log.length}`,
      wordId: selectedWord.id,
      prompt: selectedWord.german,
      expected: selectedWord.english,
      correct: isCorrect,
      retry: false,
    }]);

    if (isCorrect) {
      const nextMatched = [...matchedWordIds, word.id];
      setMatchedWordIds(nextMatched);
      setSelectedGermanId(null);
      setCorrectCount(value => value + 1);
      setCoinsEarned(value => value + 1);
      await report(word.id, true);

      if (nextMatched.length >= libraryWords.length) {
        window.setTimeout(() => completeQuest(nextMatched.length), 700);
      } else {
        window.setTimeout(() => setResult(null), 650);
      }
      return;
    }

    await report(selectedWord.id, false);
    window.setTimeout(() => {
      setResult(null);
      setSelectedGermanId(null);
    }, 900);
  };

  const chooseVerbStone = async (form: string) => {
    if (!currentVerb || result || verbSlots.length >= 3) return;
    const availableCount = verbForms.filter(item => item === form).length;
    const usedCount = verbSlots.filter(item => item === form).length;
    if (usedCount >= availableCount) return;

    const nextSlots = [...verbSlots, form];
    setVerbSlots(nextSlots);

    if (nextSlots.length < 3) return;

    const isCorrect = nextSlots.every((slot, index) => normalizeAnswer(slot) === normalizeAnswer(verbForms[index]));
    setResult({ correct: isCorrect, expected: verbForms.join(' - ') });
    setAnswerLog(log => [...log, {
      challengeId: `verb-${currentVerb.id}-${log.length}`,
      wordId: currentVerb.id,
      prompt: currentVerb.german,
      expected: verbForms.join(' - '),
      correct: isCorrect,
      retry: false,
    }]);

    if (isCorrect) {
      setCorrectCount(value => value + 1);
      setCoinsEarned(value => value + 1);
      await report(currentVerb.id, true);
    } else {
      await report(currentVerb.id, false);
    }
  };

  const clearVerbSlots = () => {
    setVerbSlots([]);
    setResult(null);
  };

  const nextVerb = () => {
    setVerbSlots([]);
    setResult(null);
    if (verbIndex + 1 >= verbWords.length) {
      completeQuest(correctCount);
    } else {
      setVerbIndex(value => value + 1);
    }
  };

  const next = () => {
    setAnswer('');
    setResult(null);
    setSelectedLetterIndexes([]);
    if (currentIndex + 1 >= activeChallenges.length) {
      completeQuest(correctCount);
    } else {
      setCurrentIndex(value => value + 1);
    }
  };

  if (!quest) return <div className="p-8 text-center text-amber-50">Quest nicht gefunden</div>;

  const story = getQuestStory(quest.id);
  const pipLine = result ? (result.correct ? story.correct : story.wrong) : story.missionIntro;
  const contentBlocked = quest.contentStatus && !quest.contentStatus.ready;

  if (contentBlocked) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-6">
        <section className="parchment w-full overflow-hidden rounded-[32px] border border-amber-100/70">
          <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="ink-panel flex min-h-[320px] flex-col items-center justify-center p-8 text-center text-amber-50">
              <img
                src="/assets/pip-think.webp"
                alt="Pip schaut auf die Karte"
                className="h-56 w-56 object-contain drop-shadow-2xl"
              />
              <div className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-amber-200/70">Noch verschlossen</div>
              <h1 className="mt-2 text-4xl font-black">{quest.title}</h1>
            </div>
            <div className="p-7 sm:p-9">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">{story.arc}</div>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Hier fehlen noch Wortfunken.</h2>
              <p className="mt-3 text-sm font-bold leading-6 text-stone-600">
                Pip kann diesen Ort erst öffnen, wenn im Elternbereich genug passende Inhalte hinterlegt sind.
              </p>
              <div className="mt-5 rounded-2xl border border-amber-900/10 bg-amber-100/70 p-4 text-sm font-bold leading-6 text-amber-950">
                {quest.contentStatus?.issues.map(issue => <div key={issue}>{issue}</div>)}
              </div>
              <button onClick={() => navigate('/')} className="magic-button mt-6 w-full">
                <ArrowLeft className="h-4 w-4" />
                Zur Karte
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (challenges.length === 0 || (isLibrarySorter && libraryWords.length === 0) || (isVerbAssembler && verbWords.length === 0)) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-amber-200 border-t-transparent p-5" />
      </main>
    );
  }

  if (!missionStarted) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center px-4 py-6">
        <section className="parchment w-full overflow-hidden rounded-[32px] border border-amber-100/70">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="ink-panel relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden p-8 text-center text-amber-50">
              <img
                src="/assets/pip-guide.webp"
                alt="Pip zeigt den nächsten Auftrag"
                className="h-64 w-64 object-contain drop-shadow-2xl sm:h-72 sm:w-72"
              />
              <div className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-amber-200/70">Pips Auftrag</div>
              <h1 className="mt-2 text-4xl font-black leading-tight">{quest.title}</h1>
            </div>

            <div className="p-7 sm:p-9">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">{story.arc}</div>
              <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950">Die Spur beginnt hier.</h2>
              <p className="mt-4 text-base font-bold leading-7 text-stone-700">{story.mapTeaser}</p>
              <p className="mt-3 text-base font-bold leading-7 text-slate-900">{story.missionIntro}</p>
              <p className="mt-3 text-sm font-bold leading-6 text-stone-600">
                Wenn du diese Mission schaffst, merkt sich die Akademiekarte den Ort wieder ein Stück besser. Pip sammelt jeden richtigen Wortfunken, legt ihn auf die Karte und sucht damit nach dem nächsten hellen Pfad.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/60 p-4">
                  <div className="text-2xl font-black text-slate-950">{totalTasks}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">Aufgaben</div>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <div className="text-2xl font-black text-slate-950">{quest.reward}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">Belohnung</div>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <div className="text-2xl font-black text-slate-950">{quest.kind === 'verb' ? 'Verb' : quest.kind === 'mixed' ? 'Mix' : 'Wort'}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">Magie</div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-950/10 bg-blue-100/70 p-4 text-sm font-bold leading-6 text-blue-950">
                Ziel: Sammle Wortfunken, damit Pip den nächsten Pfad auf der Karte wiederfinden kann.
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => navigate('/')} className="gold-button flex-1">
                  <ArrowLeft className="h-4 w-4" />
                  Zur Karte
                </button>
                <button onClick={() => setMissionStarted(true)} className="magic-button flex-1">
                  <PlayCircle className="h-5 w-5" />
                  Mission starten
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (finished) {
    const finalPercent = Math.round((correctCount / totalTasks) * 100);
    const questCompleted = finalPercent >= 80;
    const unlockedStoryScene = questCompleted ? getUnlockedStorySceneAfterQuest(quest.id) : undefined;
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-6">
        <section className="parchment w-full overflow-hidden rounded-[32px] border border-amber-100/70">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="ink-panel flex min-h-[320px] flex-col items-center justify-center p-8 text-center text-amber-50">
              <img
                src="/assets/pip-cheer.webp"
                alt="Pip jubelt"
                className="h-56 w-56 object-contain drop-shadow-2xl"
              />
              <div className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-amber-200/70">Quest abgeschlossen</div>
              <h1 className="mt-2 text-4xl font-black">{quest.title}</h1>
            </div>
            <div className="p-7 sm:p-9">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">{story.arc}</div>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                {questCompleted ? 'Starker Zauber!' : finalPercent >= 50 ? 'Gute Runde!' : 'Nochmal in den Übungssaal.'}
              </h2>
              <p className="mt-3 text-sm font-bold leading-6 text-stone-600">
                {questCompleted ? story.completed : 'Pip hat die Wortfunken gezählt. Ab 80 Prozent öffnet sich der nächste Pfad auf der Karte.'}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/60 p-4">
                  <div className="text-3xl font-black text-slate-950">{correctCount}</div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-stone-500">Richtig</div>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <div className="text-3xl font-black text-slate-950">{totalTasks}</div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-stone-500">Aufgaben</div>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <div className="text-3xl font-black text-slate-950">{coinsEarned}</div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-stone-500">Funken</div>
                </div>
              </div>
              <div className={`mt-6 rounded-2xl border p-4 text-sm font-bold leading-6 ${questCompleted ? 'border-amber-900/10 bg-amber-100/70 text-slate-950' : 'border-blue-950/10 bg-blue-100/70 text-blue-950'}`}>
                {questCompleted ? `Freigeschaltet: ${quest.reward}. ${story.rewardReveal}` : `Noch nicht freigeschaltet: ${quest.reward}. Versuch es gleich nochmal.`}
              </div>
              {unlockedStoryScene && (
                <button
                  onClick={() => navigate(`/story/${unlockedStoryScene.id}`)}
                  className="mt-4 flex w-full items-start gap-3 rounded-2xl border border-blue-950/10 bg-blue-950 p-4 text-left text-amber-50 shadow-lg shadow-slate-950/15 transition hover:bg-blue-900 active:scale-[0.99]"
                >
                  <BookOpen className="mt-1 h-5 w-5 shrink-0 text-amber-200" />
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-amber-200/75">{unlockedStoryScene.eyebrow}</span>
                    <span className="mt-1 block text-base font-black">{unlockedStoryScene.title}</span>
                    <span className="mt-1 block text-sm font-semibold leading-6 text-amber-50/75">{unlockedStoryScene.subtitle}</span>
                  </span>
                </button>
              )}
              {(weakWords.length > 0 || retrySolvedCount > 0) && (
                <div className="mt-4 rounded-2xl border border-blue-950/10 bg-white/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-blue-950">
                    <RotateCcw className="h-4 w-4" />
                    Pips Wiederholungsnotiz
                  </div>
                  {retrySolvedCount > 0 && (
                    <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
                      {retrySolvedCount} schwierige Wortfunken wurden in der Wiederholung wieder heller.
                    </p>
                  )}
                  {weakWords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {weakWords.map(word => (
                        <span key={word.id} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-950">
                          {word.german} / {word.english}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => navigate('/')} className="magic-button flex-1">Zur Karte</button>
                <button onClick={() => window.location.reload()} className="gold-button flex-1">Nochmal spielen</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl gap-5 px-4 py-5 lg:grid-cols-[330px_1fr]">
      <aside className="ink-panel rounded-[28px] border border-amber-100/20 p-5 text-amber-50">
        <button onClick={() => navigate('/')} className="mb-5 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-black text-amber-100/80 transition hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" />
          Karte
        </button>
        <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-white/10">
          <img
            src={pipMissionImage}
            alt="Pip"
            className="h-40 w-40 object-contain drop-shadow-2xl"
          />
        </div>
        <div className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">Pips Mission · {quest.chapter}</div>
        <h1 className="mt-2 text-3xl font-black leading-tight">{quest.title}</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-amber-50/75">
          {pipLine}
        </p>
        <div className="mt-4 rounded-2xl border border-amber-100/15 bg-white/10 p-3 text-xs font-bold leading-5 text-amber-50/70">
          {quest.subtitle}
        </div>
        <div className="mt-7">
          <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-[0.16em] text-amber-200/70">
            <span>Runde</span>
            <span>{isVerbAssembler ? `${verbIndex + 1}/${totalTasks}` : isLibrarySorter ? `${matchedWordIds.length}/${totalTasks}` : `${currentIndex + 1}/${activeChallenges.length}`}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/12">
            <div className="h-full rounded-full bg-amber-200" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </aside>

      <section className="parchment flex min-h-[520px] flex-col justify-between rounded-[32px] border border-amber-100/70 p-6 sm:p-8">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="rounded-full bg-blue-950 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-100">
              {isVerbAssembler ? 'Verbsteine ordnen' : isLibrarySorter ? 'Bücherregal sortieren' : current.eyebrow}
            </div>
            <div className="flex items-center gap-1 text-amber-600">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-black">{correctCount}</span>
            </div>
          </div>

          <div className="mt-10 rounded-[28px] border border-amber-900/10 bg-white/60 p-6 text-center shadow-inner">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-blue-950/60">
              {isSpellOrder ? 'Zauberspruch ordnen' : isWordBuilder ? 'Wort-Bausteine' : isAudioChoice ? 'Hörzauber' : isImageChoice ? 'Bildkarte erkennen' : isSparkCatcher ? 'Wortfunken fangen' : isLibrarySorter ? 'Moonlit Library' : isVerbAssembler ? 'Wordbrew Workshop' : 'Aufgabe'}
            </div>
            {(isImageChoice || isWordBuilder || isSpellOrder) && current.imagePath && (
              <div className={`mx-auto mt-5 aspect-square w-full overflow-hidden rounded-[28px] border border-blue-950/10 bg-blue-50 shadow-lg shadow-slate-950/10 ${isWordBuilder ? 'max-w-[11rem]' : 'max-w-[18rem]'}`}>
                <img
                  src={current.imagePath}
                  alt={current.imageAlt || current.prompt}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            {isAudioChoice && current.audioPath && (
              <div className="mx-auto mt-5 grid max-w-xl gap-4 rounded-[28px] border border-blue-950/10 bg-blue-950 px-5 py-5 text-amber-50 shadow-lg shadow-blue-950/20">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-100/20 bg-white/10">
                  <Volume2 className="h-10 w-10" />
                </div>
                <audio controls src={current.audioPath} className="w-full">
                  <a href={current.audioPath}>Audio öffnen</a>
                </audio>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-100/70">
                  Hör genau hin
                </div>
              </div>
            )}
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
              {isLibrarySorter ? 'Welche Buchseiten gehören zusammen?' : isVerbAssembler ? `Ordne die Formen von "${currentVerb?.german}"` : current.prompt}
            </h2>
            <p className="mt-5 text-sm font-bold text-stone-500">
              {isLibrarySorter ? 'Wähle erst ein deutsches Wort und dann den passenden englischen Buchrücken.' : isVerbAssembler ? 'Lege Grundform, Past Simple und Past Participle in die drei Kesselplätze.' : current.helper}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-7">
          {isVerbAssembler ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {['Grundform', 'Past Simple', 'Past Participle'].map((label, index) => (
                  <div key={label} className={`verb-slot ${verbSlots[index] ? 'verb-slot-filled' : ''}`}>
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-950/55">{label}</span>
                    <span className="mt-2 text-2xl font-black text-slate-950">{verbSlots[index] ?? '?'}</span>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {verbStoneOptions.map((form, optionIndex) => {
                  const occurrenceIndex = verbStoneOptions.slice(0, optionIndex + 1).filter(item => item === form).length;
                  const usedCount = verbSlots.filter(item => item === form).length;
                  const used = usedCount >= occurrenceIndex;
                  return (
                    <button
                      key={`${form}-${optionIndex}`}
                      type="button"
                      onClick={() => chooseVerbStone(form)}
                      disabled={used || Boolean(result)}
                      className={`verb-stone ${used ? 'verb-stone-used' : ''}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200/80">Stone</span>
                      <span className="mt-1 text-2xl font-black text-amber-50">{form}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : isLibrarySorter ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[28px] border border-amber-900/10 bg-white/55 p-4">
                <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-blue-950/55">Deutsche Buchseiten</div>
                <div className="grid gap-3">
                  {libraryWords.map(word => {
                    const isMatched = matchedWordIds.includes(word.id);
                    const isSelected = selectedGermanId === word.id;
                    return (
                      <button
                        key={word.id}
                        type="button"
                        onClick={() => chooseLibraryGerman(word.id)}
                        disabled={isMatched}
                        className={`library-card ${isSelected ? 'library-card-selected' : ''} ${isMatched ? 'library-card-matched' : ''}`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-950/45">Seite</span>
                        <span className="text-xl font-black text-slate-950">{word.german}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-blue-950/10 bg-blue-950/5 p-4">
                <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-blue-950/55">Englische Buchrücken</div>
                <div className="grid gap-3">
                  {libraryEnglishCards.map(word => {
                    const isMatched = matchedWordIds.includes(word.id);
                    return (
                      <button
                        key={word.id}
                        type="button"
                        onClick={() => chooseLibraryEnglish(word)}
                        disabled={isMatched || !selectedGermanId || Boolean(result)}
                        className={`library-card library-card-spine ${isMatched ? 'library-card-matched' : ''}`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/80">Book</span>
                        <span className="text-xl font-black text-amber-50">{word.english}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : isWordBuilder ? (
            <div className="space-y-5">
              <div className="grid grid-flow-col auto-cols-fr gap-2">
                {current.expected.split('').map((_, index) => (
                  <div key={`${current.id}-slot-${index}`} className={`flex min-h-20 items-center justify-center rounded-2xl border text-3xl font-black uppercase shadow-inner ${builderAnswer[index] ? 'border-amber-500 bg-amber-100/80 text-slate-950' : 'border-blue-950/10 bg-white/60 text-blue-950/25'}`}>
                    {builderAnswer[index] ?? '?'}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {letterTiles.map((tile, tileIndex) => {
                  const used = selectedLetterIndexes.includes(tileIndex);
                  return (
                    <button
                      key={`${tile.letter}-${tile.originalIndex}-${tileIndex}`}
                      type="button"
                      onClick={() => chooseLetterTile(tileIndex)}
                      disabled={used || Boolean(result)}
                      className={`min-h-16 rounded-2xl border px-3 py-3 text-3xl font-black uppercase shadow-lg outline-none ring-blue-800/25 transition focus:ring-4 active:scale-[0.98] ${used ? 'border-blue-950/10 bg-white/40 text-blue-950/25 shadow-none' : 'border-amber-100/20 bg-blue-950 text-amber-50 shadow-blue-950/20 hover:bg-blue-900'}`}
                    >
                      {tile.letter}
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={undoLetterTile}
                  disabled={selectedLetterIndexes.length === 0 || Boolean(result)}
                  className="inline-flex items-center justify-center rounded-xl bg-white/70 px-4 py-3 text-sm font-black text-blue-950 transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Letzten Baustein zurück
                </button>
                <button
                  type="button"
                  onClick={clearLetterTiles}
                  disabled={selectedLetterIndexes.length === 0 || Boolean(result)}
                  className="inline-flex items-center justify-center rounded-xl bg-white/70 px-4 py-3 text-sm font-black text-blue-950 transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Neu legen
                </button>
              </div>
            </div>
          ) : isSpellOrder ? (
            <div className="space-y-5">
              <div className="flex min-h-24 flex-wrap items-center justify-center gap-2 rounded-[28px] border border-blue-950/10 bg-white/60 p-4 shadow-inner">
                {current.expected.split(/\s+/).map((_, index) => (
                  <div
                    key={`${current.id}-phrase-slot-${index}`}
                    className={`flex min-h-14 min-w-[5.5rem] items-center justify-center rounded-2xl border px-4 py-2 text-xl font-black shadow-inner ${phraseAnswer.split(/\s+/).filter(Boolean)[index] ? 'border-amber-500 bg-amber-100/80 text-slate-950' : 'border-blue-950/10 bg-white/60 text-blue-950/25'}`}
                  >
                    {phraseAnswer.split(/\s+/).filter(Boolean)[index] ?? '?'}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {phraseTiles.map((tile, tileIndex) => {
                  const used = selectedLetterIndexes.includes(tileIndex);
                  return (
                    <button
                      key={`${tile.word}-${tile.originalIndex}-${tileIndex}`}
                      type="button"
                      onClick={() => choosePhraseTile(tileIndex)}
                      disabled={used || Boolean(result)}
                      className={`min-h-16 rounded-2xl border px-5 py-3 text-xl font-black shadow-lg outline-none ring-blue-800/25 transition focus:ring-4 active:scale-[0.98] ${used ? 'border-blue-950/10 bg-white/40 text-blue-950/25 shadow-none' : 'border-amber-100/20 bg-blue-950 text-amber-50 shadow-blue-950/20 hover:bg-blue-900'}`}
                    >
                      {tile.word}
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={undoLetterTile}
                  disabled={selectedLetterIndexes.length === 0 || Boolean(result)}
                  className="inline-flex items-center justify-center rounded-xl bg-white/70 px-4 py-3 text-sm font-black text-blue-950 transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Letzten Baustein zurück
                </button>
                <button
                  type="button"
                  onClick={clearLetterTiles}
                  disabled={selectedLetterIndexes.length === 0 || Boolean(result)}
                  className="inline-flex items-center justify-center rounded-xl bg-white/70 px-4 py-3 text-sm font-black text-blue-950 transition hover:bg-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Neu legen
                </button>
              </div>
            </div>
          ) : isSparkCatcher || isImageChoice || isAudioChoice ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {choiceOptions.map((option, optionIndex) => {
                const isSelected = normalizeAnswer(answer) === normalizeAnswer(option);
                const isExpected = result && normalizeAnswer(option) === normalizeAnswer(result.expected);
                const isWrongPick = result && isSelected && !result.correct;
                const optionWord = isAudioChoice
                  ? choiceOptionWords.byGerman.get(normalizeAnswer(option))
                  : choiceOptionWords.byEnglish.get(normalizeAnswer(option));
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => chooseAnswer(option)}
                    disabled={Boolean(result)}
                    className={`answer-card ${result?.correct && isSelected ? 'answer-card-correct' : ''} ${isWrongPick ? 'answer-card-wrong' : ''} ${isExpected && !result.correct ? 'answer-card-reveal' : ''}`}
                  >
                    <span className="absolute right-3 top-3 text-amber-400/75">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    {isAudioChoice && optionWord?.imagePath && (
                      <span className="mx-auto mb-3 block aspect-square w-full max-w-28 overflow-hidden rounded-2xl border border-blue-950/10 bg-blue-50">
                        <img
                          src={optionWord.imagePath}
                          alt={optionWord.imageAlt || `${optionWord.german} / ${optionWord.english}`}
                          className="h-full w-full object-cover"
                        />
                      </span>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-950/45">{isAudioChoice ? 'Hörkarte' : isImageChoice ? 'Antwort' : 'Funke'} {optionIndex + 1}</span>
                    <span className="mt-2 block text-2xl font-black text-slate-950">{option}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              value={answer}
              onChange={event => setAnswer(event.target.value)}
              disabled={Boolean(result)}
              autoFocus
              className="w-full rounded-2xl border border-amber-900/15 bg-white/80 px-5 py-5 text-center text-2xl font-black text-slate-950 outline-none ring-blue-800/25 transition placeholder:text-stone-300 focus:ring-4 disabled:opacity-70"
              placeholder="Antwort eintippen"
            />
          )}

          {result && (
            <div className={`mt-4 flex items-start gap-3 rounded-2xl p-4 text-sm font-bold ${result.correct ? 'bg-blue-100 text-blue-950' : 'bg-red-100 text-red-800'}`}>
              {result.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0" />}
              <div>
                <div>{result.correct ? 'Richtig.' : 'Fast. Die gesuchte Antwort war:'}</div>
                {!result.correct && <div className="mt-1 text-lg font-black">{result.expected}</div>}
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-3">
            {isVerbAssembler ? (
              result ? (
                result.correct ? (
                  <button type="button" onClick={nextVerb} className="gold-button w-full">
                    Nächstes Verb
                  </button>
                ) : (
                  <button type="button" onClick={clearVerbSlots} className="gold-button w-full">
                    Steine neu legen
                  </button>
                )
              ) : (
                <div className="w-full rounded-2xl bg-white/45 px-4 py-3 text-center text-sm font-black text-blue-950/70">
                  {verbSlots.length < 3 ? 'Wähle die Verbsteine in der richtigen Reihenfolge.' : 'Pip prüft den Kessel.'}
                </div>
              )
            ) : isLibrarySorter ? (
              <div className="w-full rounded-2xl bg-white/45 px-4 py-3 text-center text-sm font-black text-blue-950/70">
                {matchedWordIds.length >= totalTasks ? 'Alle Bücher sortiert.' : selectedGermanId ? 'Wähle jetzt den passenden englischen Buchrücken.' : 'Wähle eine deutsche Buchseite.'}
              </div>
            ) : isWordBuilder ? (
              result ? (
                <button type="button" onClick={next} className="gold-button w-full">
                  Weiter
                </button>
              ) : (
                <div className="w-full rounded-2xl bg-white/45 px-4 py-3 text-center text-sm font-black text-blue-950/70">
                  {selectedLetterIndexes.length < letterTiles.length ? 'Lege die Buchstaben in die richtige Reihenfolge.' : 'Pip prüft die Bausteine.'}
                </div>
              )
            ) : isSpellOrder ? (
              result ? (
                <button type="button" onClick={next} className="gold-button w-full">
                  Weiter
                </button>
              ) : (
                <div className="w-full rounded-2xl bg-white/45 px-4 py-3 text-center text-sm font-black text-blue-950/70">
                  {selectedLetterIndexes.length < phraseTiles.length ? 'Lege den Zauberspruch in die richtige Reihenfolge.' : 'Pip prüft den Zauberspruch.'}
                </div>
              )
            ) : !result ? (
              <button type="submit" disabled={isSparkCatcher || isImageChoice || isAudioChoice || isWordBuilder || isSpellOrder || !answer.trim()} className={isSparkCatcher || isImageChoice || isAudioChoice || isWordBuilder || isSpellOrder ? 'hidden' : 'magic-button w-full'}>
                Antwort prüfen
              </button>
            ) : (
              <button type="button" onClick={next} className="gold-button w-full">
                Weiter
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
