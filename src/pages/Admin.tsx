import { useEffect, useState } from 'react';
import { BookOpen, Database, FileText, LineChart, LockKeyhole, Wand2 } from 'lucide-react';

interface AdminWord {
  id: number;
  german: string;
  english: string;
  type: string;
  category?: string;
  past?: string;
  participle?: string;
}

interface AdminQuest {
  id: number;
  title: string;
  chapter: string;
  kind: string;
  reward?: string;
  words: number[];
  wordItems: AdminWord[];
}

export default function Admin() {
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState('');
  const [userId, setUserId] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [content, setContent] = useState<{ quests: AdminQuest[]; words: AdminWord[] } | null>(null);
  const [contentError, setContentError] = useState('');

  const loadContent = async () => {
    const response = await fetch('/api/admin/content', { credentials: 'include' });
    if (!response.ok) {
      setContentError('Der Content-Bereich ist fuer Eltern/Admins vorgesehen.');
      return;
    }
    setContent(await response.json());
    setContentError('');
  };

  useEffect(() => {
    loadContent();
  }, []);

  const importWords = async () => {
    const res = await fetch('/api/admin/words/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    setResult(`${data.imported ?? 0} Woerter importiert.`);
    await loadContent();
  };

  const loadStats = async () => {
    const res = await fetch(`/api/admin/stats/${userId}`, { credentials: 'include' });
    if (res.ok) setStats(await res.json());
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-5">
      <div className="mb-5 flex items-center gap-3 text-amber-50">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-200 text-slate-950">
          <Wand2 className="h-6 w-6" />
        </div>
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">Akademieleitung</div>
          <h1 className="text-3xl font-black">Content & Fortschritt</h1>
        </div>
      </div>

      {contentError && (
        <section className="ink-panel mb-5 rounded-[28px] border border-amber-100/20 p-5 text-amber-50">
          <div className="flex items-center gap-3">
            <LockKeyhole className="h-6 w-6 text-amber-200" />
            <p className="font-bold">{contentError}</p>
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <section className="parchment rounded-[28px] border border-amber-100/70 p-5">
          <div className="mb-4 flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-950" />
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">Levelstruktur</div>
              <h2 className="text-2xl font-black text-slate-950">Kartenorte</h2>
            </div>
          </div>

          <div className="grid gap-3">
            {(content?.quests ?? []).map(quest => (
              <div key={quest.id} className="rounded-2xl border border-amber-900/10 bg-white/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-blue-950/60">
                      {quest.id}. {quest.chapter} · {quest.kind}
                    </div>
                    <h3 className="mt-1 text-lg font-black text-slate-950">{quest.title}</h3>
                  </div>
                  <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-900">
                    {quest.wordItems.length} Woerter
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {quest.wordItems.length > 0 ? quest.wordItems.map(word => (
                    <span key={word.id} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-950">
                      {word.german} / {word.english}
                    </span>
                  )) : (
                    <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-bold text-stone-600">Noch kein Inhalt</span>
                  )}
                </div>
                {quest.reward && <p className="mt-3 text-sm font-bold text-stone-600">Belohnung: {quest.reward}</p>}
              </div>
            ))}
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <section className="parchment rounded-[28px] border border-amber-100/70 p-5">
            <div className="mb-4 flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-950" />
              <h2 className="text-xl font-black text-slate-950">CSV-Import</h2>
            </div>
            <p className="mb-2 text-xs font-bold text-stone-500">Format: german,english,type,category,past,participle</p>
            <textarea
              value={csv}
              onChange={event => setCsv(event.target.value)}
              rows={7}
              className="w-full rounded-xl border border-amber-900/15 bg-white/70 px-3 py-2 font-mono text-sm outline-none ring-blue-800/25 focus:ring-4"
              placeholder={`german,english,type,category,past,participle
Hund,dog,vocab,tiere,,
gehen,go,irregular,verben,went,gone`}
            />
            <button onClick={importWords} className="magic-button mt-3 w-full">Importieren</button>
            {result && <p className="mt-2 text-sm font-black text-blue-800">{result}</p>}
          </section>

          <section className="parchment rounded-[28px] border border-amber-100/70 p-5">
            <div className="mb-4 flex items-center gap-3">
              <Database className="h-6 w-6 text-blue-950" />
              <h2 className="text-xl font-black text-slate-950">Wortbank</h2>
            </div>
            <div className="max-h-64 space-y-2 overflow-auto pr-1">
              {(content?.words ?? []).map(word => (
                <div key={word.id} className="rounded-xl bg-white/60 px-3 py-2 text-sm">
                  <span className="font-black text-slate-950">{word.german}</span>
                  <span className="text-stone-500"> / {word.english}</span>
                  {word.type === 'irregular' && <span className="text-stone-500"> · {word.past} · {word.participle}</span>}
                </div>
              ))}
            </div>
          </section>

          <section className="parchment rounded-[28px] border border-amber-100/70 p-5">
            <div className="mb-4 flex items-center gap-3">
              <LineChart className="h-6 w-6 text-blue-950" />
              <h2 className="text-xl font-black text-slate-950">Fortschritt</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={userId}
                onChange={event => setUserId(event.target.value)}
                placeholder="User-ID"
                className="min-w-0 flex-1 rounded-xl border border-amber-900/15 bg-white/70 px-3 py-2 outline-none ring-blue-800/25 focus:ring-4"
              />
              <button onClick={loadStats} className="magic-button px-4 py-2">Laden</button>
            </div>
            {stats && (
              <div className="mt-4 space-y-2 text-sm font-semibold text-stone-700">
                <p><strong>Name:</strong> {stats.user.name}</p>
                <p><strong>Gelernte Woerter:</strong> {stats.progressCount}</p>
                <p><strong>Beherrscht:</strong> {stats.masteredCount}</p>
                {stats.weakWords.length > 0 && <p><strong>Schwierige Woerter:</strong></p>}
                {stats.weakWords.map((word: any) => (
                  <p key={word.id}>{word.german} / {word.english} ({word.wrongCount}x falsch)</p>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
