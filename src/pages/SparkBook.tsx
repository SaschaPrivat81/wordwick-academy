import { useEffect, useMemo, useState } from 'react';
import { BookMarked, CheckCircle2, Flame, Search, Sparkles, Star, XCircle } from 'lucide-react';

interface Word {
  id: number;
  german: string;
  english: string;
  type: 'vocab' | 'irregular';
  category?: string;
  grade?: string;
  unit?: string;
  difficulty?: number;
  past?: string;
  participle?: string;
  notes?: string;
}

interface ProgressRow {
  wordId: number;
  correctCount: number;
  wrongCount: number;
  mastered: number;
}

type BookFilter = 'all' | 'mastered' | 'difficult' | 'verbs';

function wordStatus(word: Word, progress?: ProgressRow) {
  if (progress?.mastered) return { label: 'Gemeistert', className: 'border-amber-300 bg-amber-100 text-amber-950', Icon: Star };
  if (progress && progress.wrongCount > progress.correctCount) return { label: 'Flackert', className: 'border-red-200 bg-red-100 text-red-800', Icon: Flame };
  if (progress && progress.correctCount > 0) return { label: 'Leuchtet', className: 'border-blue-200 bg-blue-100 text-blue-950', Icon: Sparkles };
  return { label: 'Neu', className: 'border-stone-200 bg-white/70 text-stone-600', Icon: BookMarked };
}

export default function SparkBook() {
  const [words, setWords] = useState<Word[]>([]);
  const [progressRows, setProgressRows] = useState<ProgressRow[]>([]);
  const [filter, setFilter] = useState<BookFilter>('all');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/words', { credentials: 'include' }).then(response => response.ok ? response.json() : []),
      fetch('/api/progress', { credentials: 'include' }).then(response => response.ok ? response.json() : []),
    ]).then(([nextWords, nextProgress]) => {
      setWords(nextWords);
      setProgressRows(nextProgress);
    });
  }, []);

  const progressByWordId = useMemo(
    () => new Map(progressRows.map(row => [row.wordId, row])),
    [progressRows],
  );
  const categories = useMemo(
    () => Array.from(new Set(words.map(word => word.category || 'ohne Kategorie'))).sort(),
    [words],
  );
  const masteredCount = progressRows.filter(row => row.mastered).length;
  const difficultCount = progressRows.filter(row => row.wrongCount > row.correctCount).length;
  const practicedCount = progressRows.length;

  const visibleWords = words.filter(word => {
    const progress = progressByWordId.get(word.id);
    const searchText = `${word.german} ${word.english} ${word.category ?? ''} ${word.past ?? ''} ${word.participle ?? ''}`.toLowerCase();
    if (query && !searchText.includes(query.toLowerCase())) return false;
    if (category !== 'all' && (word.category || 'ohne Kategorie') !== category) return false;
    if (filter === 'mastered') return Boolean(progress?.mastered);
    if (filter === 'difficult') return Boolean(progress && progress.wrongCount > progress.correctCount);
    if (filter === 'verbs') return word.type === 'irregular';
    return true;
  });

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1500px] gap-5 px-4 py-5 xl:grid-cols-[330px_1fr]">
      <section className="ink-panel rounded-[28px] border border-amber-100/20 p-6 text-amber-50">
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-amber-200 text-slate-950">
          <BookMarked className="h-12 w-12" />
        </div>
        <div className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">Sammlung</div>
        <h1 className="mt-2 text-3xl font-black">Funkenbuch</h1>
        <p className="mt-4 text-sm font-semibold leading-6 text-amber-50/75">
          Hier sammelt Pip alle Wörter, die auf der Karte auftauchen. Schwierige Wörter flackern, gemeisterte Wörter bekommen einen goldenen Rand.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-amber-100/20 bg-white/10 p-4">
            <div className="text-3xl font-black text-amber-200">{masteredCount}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100/60">gemeistert</div>
          </div>
          <div className="rounded-2xl border border-amber-100/20 bg-white/10 p-4">
            <div className="text-3xl font-black text-amber-200">{practicedCount}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100/60">gesehen</div>
          </div>
          <div className="rounded-2xl border border-amber-100/20 bg-white/10 p-4">
            <div className="text-3xl font-black text-amber-200">{difficultCount}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100/60">flackern</div>
          </div>
          <div className="rounded-2xl border border-amber-100/20 bg-white/10 p-4">
            <div className="text-3xl font-black text-amber-200">{words.length}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100/60">gesamt</div>
          </div>
        </div>
      </section>

      <section className="parchment rounded-[28px] border border-amber-100/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">Magisches Register</div>
            <h2 className="text-2xl font-black text-slate-950">Wortfunken-Sammlung</h2>
          </div>
          <div className="relative min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-950/45" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              className="w-full rounded-xl border border-amber-900/15 bg-white/75 py-2 pl-9 pr-3 text-sm font-bold outline-none ring-blue-800/25 focus:ring-4"
              placeholder="Wort suchen"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ['all', 'Alle'],
            ['mastered', 'Gemeistert'],
            ['difficult', 'Flackern'],
            ['verbs', 'Verben'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value as BookFilter)}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                filter === value ? 'bg-blue-950 text-amber-50' : 'bg-white/65 text-blue-950 hover:bg-white'
              }`}
            >
              {label}
            </button>
          ))}
          <select
            value={category}
            onChange={event => setCategory(event.target.value)}
            className="rounded-xl border border-amber-900/15 bg-white/75 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-blue-950 outline-none ring-blue-800/25 focus:ring-4"
          >
            <option value="all">Alle Kategorien</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleWords.map(word => {
            const progress = progressByWordId.get(word.id);
            const status = wordStatus(word, progress);
            const Icon = status.Icon;
            return (
              <article key={word.id} className={`rounded-2xl border p-4 shadow-lg shadow-slate-950/10 ${status.className}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.14em] opacity-65">
                      {word.type === 'irregular' ? 'Unregelmäßiges Verb' : word.category || 'Vokabel'}
                    </div>
                    <h3 className="mt-1 text-xl font-black leading-tight text-slate-950">{word.german}</h3>
                    <p className="mt-1 text-lg font-black text-blue-950">{word.english}</p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-950 text-amber-100">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                {word.type === 'irregular' && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-black">
                    {[word.english, word.past || '?', word.participle || '?'].map((form, index) => (
                      <div key={`${word.id}-${index}-${form}`} className="rounded-xl bg-white/65 px-2 py-2 text-blue-950">
                        <div className="text-[9px] uppercase tracking-[0.12em] opacity-55">{index === 0 ? 'Base' : index === 1 ? 'Past' : 'Participle'}</div>
                        <div className="mt-1 truncate">{form}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-3 text-xs font-black">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/65 px-3 py-1 text-blue-950">
                    {progress?.mastered ? <CheckCircle2 className="h-3.5 w-3.5" /> : progress && progress.wrongCount > progress.correctCount ? <XCircle className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {status.label}
                  </span>
                  <span className="text-slate-950/60">
                    {progress ? `${progress.correctCount} richtig · ${progress.wrongCount} daneben` : 'noch nicht geübt'}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {visibleWords.length === 0 && (
          <div className="mt-5 rounded-2xl bg-white/65 p-5 text-center text-sm font-bold text-stone-600">
            In diesem Register liegen noch keine Wortfunken.
          </div>
        )}
      </section>
    </main>
  );
}
