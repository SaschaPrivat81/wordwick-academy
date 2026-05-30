import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, PlayCircle, Sparkles, XCircle } from 'lucide-react';
import { AcademyQuest, academyQuests as fallbackQuests, getQuestStory, normalizeAnswer } from '../data/academy';

interface Word {
  id: number;
  german: string;
  english: string;
  type: string;
  past?: string;
  participle?: string;
}

interface Challenge {
  wordId: number;
  eyebrow: string;
  prompt: string;
  helper: string;
  expected: string;
  acceptable: string[];
}

interface ResultState {
  correct: boolean;
  expected: string;
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
    return words.flatMap(word => {
      if (word.type === 'irregular' && (quest.kind === 'verb' || quest.kind === 'mixed')) {
        return [
          {
            wordId: word.id,
            eyebrow: 'Grundform',
            prompt: `Wie heisst "${word.german}" auf Englisch?`,
            helper: 'Schreibe die Grundform.',
            expected: word.english,
            acceptable: [word.english],
          },
          {
            wordId: word.id,
            eyebrow: 'Past Simple',
            prompt: `${word.english} - ? - ${word.participle ?? ''}`,
            helper: 'Welche zweite Form fehlt?',
            expected: word.past ?? '',
            acceptable: [word.past ?? ''],
          },
          {
            wordId: word.id,
            eyebrow: 'Past Participle',
            prompt: `${word.english} - ${word.past ?? ''} - ?`,
            helper: 'Welche dritte Form fehlt?',
            expected: word.participle ?? '',
            acceptable: [word.participle ?? ''],
          },
        ];
      }

      return [
        {
          wordId: word.id,
          eyebrow: 'Vokabel',
          prompt: `Wie heisst "${word.german}" auf Englisch?`,
          helper: 'Schreibe das englische Wort.',
          expected: word.english,
          acceptable: [word.english],
        },
      ];
    });
  }, [quest, words]);

  const current = challenges[currentIndex];
  const isLibrarySorter = quest?.id === 2;
  const isVerbAssembler = quest?.id === 3;
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
  const totalTasks = isVerbAssembler ? verbWords.length : isLibrarySorter ? libraryWords.length : challenges.length;
  const percent = isVerbAssembler
    ? (totalTasks > 0 ? Math.round((verbIndex / totalTasks) * 100) : 0)
    : isLibrarySorter
    ? (totalTasks > 0 ? Math.round((matchedWordIds.length / totalTasks) * 100) : 0)
    : (challenges.length > 0 ? Math.round((currentIndex / challenges.length) * 100) : 0);
  const pipMissionImage = result ? (result.correct ? '/assets/pip-cheer.webp' : '/assets/pip-think.webp') : '/assets/pip-guide.webp';
  const isSparkCatcher = quest?.id === 1 && current?.eyebrow === 'Vokabel';
  const choiceOptions = useMemo(() => {
    if (!current || !isSparkCatcher) return [];
    const candidateWords = allWords.length > 0 ? allWords : words;
    return buildChoiceOptions(
      current.expected,
      candidateWords.map(word => word.english),
      current.wordId + currentIndex + questId,
    );
  }, [allWords, current, currentIndex, isSparkCatcher, questId, words]);

  const report = async (wordId: number, isCorrect: boolean) => {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ wordId, correct: isCorrect }),
    });
  };

  const checkAnswer = async (value: string) => {
    if (!current || result) return;

    const normalized = normalizeAnswer(value);
    const acceptable = current.acceptable.map(normalizeAnswer).filter(Boolean);
    const isCorrect = acceptable.includes(normalized);
    setResult({ correct: isCorrect, expected: current.expected });

    if (isCorrect) {
      setCorrectCount(value => value + 1);
      setCoinsEarned(value => value + 1);
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

    if (isCorrect) {
      const nextMatched = [...matchedWordIds, word.id];
      setMatchedWordIds(nextMatched);
      setSelectedGermanId(null);
      setCorrectCount(value => value + 1);
      setCoinsEarned(value => value + 1);
      await report(word.id, true);

      if (nextMatched.length >= libraryWords.length) {
        window.setTimeout(() => setFinished(true), 700);
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
      setFinished(true);
    } else {
      setVerbIndex(value => value + 1);
    }
  };

  const next = () => {
    setAnswer('');
    setResult(null);
    if (currentIndex + 1 >= challenges.length) {
      setFinished(true);
    } else {
      setCurrentIndex(value => value + 1);
    }
  };

  if (!quest) return <div className="p-8 text-center text-amber-50">Quest nicht gefunden</div>;

  const story = getQuestStory(quest.id);
  const pipLine = result ? (result.correct ? story.correct : story.wrong) : story.missionIntro;

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
              <div className="absolute inset-x-8 top-8 h-px bg-amber-100/20" />
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
                {finalPercent >= 80 ? 'Starker Zauber!' : finalPercent >= 50 ? 'Gute Runde!' : 'Nochmal in den Übungssaal.'}
              </h2>
              <p className="mt-3 text-sm font-bold leading-6 text-stone-600">{story.completed}</p>
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
              <div className="mt-6 rounded-2xl border border-amber-900/10 bg-amber-100/70 p-4 text-sm font-bold leading-6 text-slate-950">
                Freigeschaltet: {quest.reward}. {story.rewardReveal}
              </div>
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
            <span>{isVerbAssembler ? `${verbIndex + 1}/${totalTasks}` : isLibrarySorter ? `${matchedWordIds.length}/${totalTasks}` : `${currentIndex + 1}/${challenges.length}`}</span>
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
              {isSparkCatcher ? 'Wortfunken fangen' : isLibrarySorter ? 'Moonlit Library' : isVerbAssembler ? 'Wordbrew Workshop' : 'Aufgabe'}
            </div>
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
          ) : isSparkCatcher ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {choiceOptions.map((option, optionIndex) => {
                const isSelected = normalizeAnswer(answer) === normalizeAnswer(option);
                const isExpected = result && normalizeAnswer(option) === normalizeAnswer(result.expected);
                const isWrongPick = result && isSelected && !result.correct;
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
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-950/45">Funke {optionIndex + 1}</span>
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
            ) : !result ? (
              <button type="submit" disabled={isSparkCatcher || !answer.trim()} className={isSparkCatcher ? 'hidden' : 'magic-button w-full'}>
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
