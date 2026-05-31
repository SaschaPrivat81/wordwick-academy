import { useEffect, useMemo, useState } from 'react';
import { Armchair, BookOpen, FlaskConical, Lamp, LockKeyhole, Map, Moon, Sparkles, Star, Telescope } from 'lucide-react';
import { useAuth } from '../App';

interface ProgressRow {
  wordId: number;
  correctCount: number;
  wrongCount: number;
  mastered: number;
}

interface QuestResultRow {
  questId: number;
  completed: number;
}

interface HomeItem {
  id: string;
  title: string;
  description: string;
  x: string;
  y: string;
  unlocked: boolean;
  Icon: typeof Sparkles;
  colorClass: string;
}

export default function PipHome() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [questResults, setQuestResults] = useState<QuestResultRow[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/progress', { credentials: 'include' }).then(response => response.ok ? response.json() : []),
      fetch('/api/quest-results', { credentials: 'include' }).then(response => response.ok ? response.json() : []),
    ]).then(([nextProgress, nextQuestResults]) => {
      setProgress(nextProgress);
      setQuestResults(nextQuestResults);
    });
  }, []);

  const completedQuestIds = useMemo(
    () => new Set(questResults.filter(result => result.completed).map(result => result.questId)),
    [questResults],
  );
  const masteredCount = progress.filter(row => row.mastered).length;
  const practicedCount = progress.length;

  const homeItems: HomeItem[] = [
    {
      id: 'cushion',
      title: 'Lesekissen',
      description: 'Pip hat einen Platz, an dem neue Wörter kurz landen dürfen.',
      x: '25%',
      y: '72%',
      unlocked: completedQuestIds.has(1),
      Icon: Armchair,
      colorClass: 'bg-amber-200 text-amber-950',
    },
    {
      id: 'lamp',
      title: 'Sternenlaterne',
      description: 'Sie bleibt heller, wenn regelmäßig geübt wird.',
      x: '71%',
      y: '24%',
      unlocked: (user?.streak ?? 0) >= 2,
      Icon: Lamp,
      colorClass: 'bg-blue-100 text-blue-950',
    },
    {
      id: 'books',
      title: 'Bücherstapel',
      description: 'Jedes gemeisterte Wort macht den Stapel ein bisschen wichtiger.',
      x: '78%',
      y: '74%',
      unlocked: masteredCount >= 5,
      Icon: BookOpen,
      colorClass: 'bg-emerald-100 text-emerald-950',
    },
    {
      id: 'cauldron',
      title: 'Mini-Kessel',
      description: 'Für Verben, die erst blubbern und dann Sinn ergeben.',
      x: '47%',
      y: '78%',
      unlocked: completedQuestIds.has(3),
      Icon: FlaskConical,
      colorClass: 'bg-indigo-100 text-indigo-950',
    },
    {
      id: 'map',
      title: 'Wandkarte',
      description: 'Pip markiert abgeschlossene Abenteuer mit winzigen Tintensiegeln.',
      x: '33%',
      y: '30%',
      unlocked: completedQuestIds.has(5),
      Icon: Map,
      colorClass: 'bg-orange-100 text-orange-950',
    },
    {
      id: 'moon',
      title: 'Mondfenster',
      description: 'Dahinter sieht man manchmal den nächsten Wortfunken vorbeiziehen.',
      x: '55%',
      y: '22%',
      unlocked: (user?.coins ?? 0) >= 20,
      Icon: Moon,
      colorClass: 'bg-sky-100 text-sky-950',
    },
  ];

  const unlockedCount = homeItems.filter(item => item.unlocked).length;

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1500px] gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="ink-panel rounded-[24px] border border-amber-100/20 p-4 text-amber-50 xl:rounded-[28px] xl:p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-200 text-slate-950 xl:h-24 xl:w-24 xl:rounded-[28px]">
          <Telescope className="h-9 w-9 xl:h-12 xl:w-12" />
        </div>
        <div className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">Obergeschoss</div>
        <h1 className="mt-2 text-2xl font-black xl:text-3xl">Pips Zuhause</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-amber-50/75 xl:mt-4">
          Jeder Fortschritt macht Pips kleinen Horst gemütlicher. Manche Dinge erscheinen durch Level, andere durch Übung und Wortfunken.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 xl:mt-6 xl:gap-3">
          <div className="rounded-2xl border border-amber-100/20 bg-white/10 p-4">
            <div className="text-3xl font-black text-amber-200">{unlockedCount}/{homeItems.length}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100/60">Deko</div>
          </div>
          <div className="rounded-2xl border border-amber-100/20 bg-white/10 p-4">
            <div className="text-3xl font-black text-amber-200">{practicedCount}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-amber-100/60">Wörter</div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-amber-100/25 bg-slate-950/40 p-4 shadow-2xl shadow-slate-950/25">
        <div className="relative aspect-[16/9] min-h-[420px] overflow-hidden rounded-[26px] border border-amber-100/20 bg-[#172033] shadow-2xl shadow-slate-950/30 sm:min-h-[500px] lg:min-h-0">
          <img
            src="/assets/pip-home-v1.jpg"
            alt="Gemütlicher magischer Horst von Pip"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-transparent to-slate-950/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/18 via-transparent to-transparent" />

          <div className="absolute left-[8%] top-[8%] rounded-2xl border border-amber-100/20 bg-slate-950/35 px-4 py-3 text-amber-50 backdrop-blur-sm">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-200/70">Pips Horst</div>
            <div className="mt-1 text-xl font-black">Freigeschaltete Fundstücke</div>
          </div>

          <img
            src="/assets/pip-neutral.webp"
            alt="Pip in seinem Zuhause"
            className="absolute left-[48%] top-[51%] h-[28%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-2xl"
          />

          {homeItems.map(item => {
            const Icon = item.Icon;
            return (
              <div
                key={item.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border p-2 shadow-xl backdrop-blur-sm transition xl:rounded-2xl xl:p-3 ${
                  item.unlocked
                    ? `border-amber-100/50 ${item.colorClass}`
                    : 'border-stone-300/25 bg-slate-950/55 text-stone-300'
                }`}
                style={{ left: item.x, top: item.y, width: 'clamp(6.75rem, 10vw, 12rem)' }}
              >
                <div className="flex items-start gap-2">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg xl:h-10 xl:w-10 xl:rounded-xl ${item.unlocked ? 'bg-blue-950 text-amber-100' : 'bg-stone-700 text-stone-300'}`}>
                    {item.unlocked ? <Icon className="h-4 w-4 xl:h-5 xl:w-5" /> : <LockKeyhole className="h-4 w-4 xl:h-5 xl:w-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black leading-tight xl:text-sm">{item.title}</div>
                    <div className={`mt-1 hidden text-[10px] font-black uppercase tracking-[0.1em] xl:block ${item.unlocked ? 'text-slate-900/60' : 'text-stone-300/65'}`}>
                      {item.unlocked ? 'Im Zimmer' : 'Noch versteckt'}
                    </div>
                  </div>
                </div>
                <p className={`mt-2 hidden text-xs font-bold leading-4 xl:block ${item.unlocked ? 'text-slate-900/70' : 'text-stone-300/70'}`}>
                  {item.description}
                </p>
              </div>
            );
          })}

          <div className="absolute bottom-3 right-3 rounded-xl border border-amber-100/20 bg-slate-950/55 p-3 text-amber-50 backdrop-blur-sm xl:bottom-4 xl:right-4 xl:rounded-2xl xl:p-4">
            <div className="flex items-center gap-2 text-amber-200">
              <Star className="h-4 w-4 xl:h-5 xl:w-5" />
              <span className="text-xl font-black xl:text-2xl">{masteredCount}</span>
            </div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100/65">gemeisterte Wörter</div>
          </div>
        </div>
      </section>
    </main>
  );
}
