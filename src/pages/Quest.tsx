import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Sparkles, Trophy, Wand2, XCircle } from 'lucide-react';
import { academyQuests, normalizeAnswer } from '../data/academy';

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

export default function Quest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const questId = Number(id);
  const quest = academyQuests.find(item => item.id === questId);

  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ResultState | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch('/api/words', { credentials: 'include' })
      .then(response => response.json())
      .then((allWords: Word[]) => {
        const selectedIds = new Set(quest?.words ?? []);
        setWords(allWords.filter(word => selectedIds.has(word.id)));
      });
  }, [quest?.words]);

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
  const percent = challenges.length > 0 ? Math.round((currentIndex / challenges.length) * 100) : 0;

  const report = async (wordId: number, isCorrect: boolean) => {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ wordId, correct: isCorrect }),
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!current || result) return;

    const normalized = normalizeAnswer(answer);
    const acceptable = current.acceptable.map(normalizeAnswer).filter(Boolean);
    const isCorrect = acceptable.includes(normalized);
    setResult({ correct: isCorrect, expected: current.expected });

    if (isCorrect) {
      setCorrectCount(value => value + 1);
      setCoinsEarned(value => value + 1);
    }

    await report(current.wordId, isCorrect);
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

  if (challenges.length === 0) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-amber-200 border-t-transparent p-5" />
      </main>
    );
  }

  if (finished) {
    const finalPercent = Math.round((correctCount / challenges.length) * 100);
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-6">
        <section className="parchment w-full overflow-hidden rounded-[32px] border border-amber-100/70">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="ink-panel flex min-h-[320px] flex-col items-center justify-center p-8 text-center text-amber-50">
              <Trophy className="h-20 w-20 text-amber-200" />
              <div className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-amber-200/70">Quest abgeschlossen</div>
              <h1 className="mt-2 text-4xl font-black">{quest.title}</h1>
            </div>
            <div className="p-7 sm:p-9">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">Auswertung</div>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                {finalPercent >= 80 ? 'Starker Zauber!' : finalPercent >= 50 ? 'Gute Runde!' : 'Nochmal in den Uebungssaal.'}
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/60 p-4">
                  <div className="text-3xl font-black text-slate-950">{correctCount}</div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-stone-500">Richtig</div>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <div className="text-3xl font-black text-slate-950">{challenges.length}</div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-stone-500">Aufgaben</div>
                </div>
                <div className="rounded-2xl bg-white/60 p-4">
                  <div className="text-3xl font-black text-slate-950">{coinsEarned}</div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-stone-500">Funken</div>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-amber-900/10 bg-amber-100/70 p-4 text-sm font-bold leading-6 text-slate-950">
                Freigeschaltet: {quest.reward}. Spaeter kann daraus eine echte Eltern-Belohnung werden.
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
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-200 text-slate-950">
          <Wand2 className="h-10 w-10" />
        </div>
        <div className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">{quest.chapter}</div>
        <h1 className="mt-2 text-3xl font-black leading-tight">{quest.title}</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-amber-50/75">{quest.subtitle}</p>
        <div className="mt-7">
          <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-[0.16em] text-amber-200/70">
            <span>Runde</span>
            <span>{currentIndex + 1}/{challenges.length}</span>
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
              {current.eyebrow}
            </div>
            <div className="flex items-center gap-1 text-amber-600">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-black">{correctCount}</span>
            </div>
          </div>

          <div className="mt-10 rounded-[28px] border border-amber-900/10 bg-white/60 p-6 text-center shadow-inner">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-blue-950/60">Aufgabe</div>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
              {current.prompt}
            </h2>
            <p className="mt-5 text-sm font-bold text-stone-500">{current.helper}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-7">
          <input
            value={answer}
            onChange={event => setAnswer(event.target.value)}
            disabled={Boolean(result)}
            autoFocus
            className="w-full rounded-2xl border border-amber-900/15 bg-white/80 px-5 py-5 text-center text-2xl font-black text-slate-950 outline-none ring-blue-800/25 transition placeholder:text-stone-300 focus:ring-4 disabled:opacity-70"
            placeholder="Antwort eintippen"
          />

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
            {!result ? (
              <button type="submit" disabled={!answer.trim()} className="magic-button w-full">
                Antwort pruefen
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
