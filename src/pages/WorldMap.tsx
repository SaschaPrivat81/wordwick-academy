import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Check, FlaskConical, GraduationCap, Home, LockKeyhole, PawPrint, Sparkles, Star, Trees, Waves } from 'lucide-react';
import { useAuth } from '../App';
import { AcademyQuest, academyQuests } from '../data/academy';

interface ProgressRow {
  wordId: number;
  mastered: number;
}

const sigils = {
  paw: PawPrint,
  home: Home,
  spark: FlaskConical,
  water: Waves,
  book: BookOpen,
};

const futureStops = [
  { id: 6, title: 'Glasshouse Garden', x: 26, y: 51, Icon: Sparkles },
  { id: 7, title: 'Whispering Woods', x: 78, y: 28, Icon: Trees },
  { id: 8, title: 'Wyrm Cave', x: 82, y: 52, Icon: Sparkles },
  { id: 9, title: 'Moonwell Lake', x: 77, y: 72, Icon: Waves },
  { id: 10, title: 'Mastery Grounds', x: 55, y: 83, Icon: GraduationCap },
];

export default function WorldMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Record<number, ProgressRow>>({});
  const [selectedQuest, setSelectedQuest] = useState<AcademyQuest>(academyQuests[0]);

  useEffect(() => {
    fetch('/api/progress', { credentials: 'include' })
      .then(response => response.json())
      .then((data: ProgressRow[]) => {
        const map: Record<number, ProgressRow> = {};
        for (const row of data) map[row.wordId] = row;
        setProgress(map);
      });
  }, []);

  const questMasteredCount = (quest: AcademyQuest) => quest.words.filter(wordId => progress[wordId]?.mastered).length;

  const questStatus = (quest: AcademyQuest) => {
    const mastered = questMasteredCount(quest);
    if (mastered === quest.words.length) return 'completed';
    if (quest.id === 1) return 'unlocked';
    const previous = academyQuests[quest.id - 2];
    if (!previous) return 'unlocked';
    return questMasteredCount(previous) === previous.words.length ? 'unlocked' : 'locked';
  };

  const status = questStatus(selectedQuest);
  const mastered = questMasteredCount(selectedQuest);
  const selectedPercent = Math.round((mastered / selectedQuest.words.length) * 100);

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[1fr_360px]">
      <section className="relative aspect-[16/9] min-h-[420px] overflow-hidden rounded-[32px] border border-blue-100/20 bg-[#0f172a] shadow-2xl shadow-slate-950/30">
        <img
          src="/assets/wordwick-map-v1.jpg"
          alt="Illustrated parchment map of Wordwick Academy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/22 via-transparent to-slate-950/5" />

        <div className="absolute left-[7%] top-[6%] z-20 max-w-[260px] text-amber-950">
          <div className="font-serif text-4xl font-black leading-none tracking-normal sm:text-5xl">Wordwick</div>
          <div className="font-serif text-3xl font-black leading-none tracking-normal sm:text-4xl">Academy</div>
          <div className="mt-2 inline-flex rounded-full border border-amber-950/30 bg-amber-100/55 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-950/80 backdrop-blur-sm">
            Learn magic words
          </div>
        </div>

        {academyQuests.map(quest => {
          const questState = questStatus(quest);
          const Icon = sigils[quest.sigil as keyof typeof sigils];
          return (
            <button
              key={quest.id}
              onClick={() => {
                if (questState !== 'locked') setSelectedQuest(quest);
              }}
              className={`quest-node ${questState}`}
              style={{ left: `${quest.x}%`, top: `${quest.y}%`, position: 'absolute', transform: 'translate(-50%, -50%)' }}
              aria-label={quest.title}
            >
              <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-amber-100 bg-amber-800 text-[11px] font-black text-amber-50 shadow-md">{quest.id}</span>
              <Icon className="h-6 w-6" />
              {questState === 'completed' && <Check className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-blue-950 p-1 text-amber-100" />}
              {questState === 'locked' && <LockKeyhole className="absolute h-7 w-7 text-stone-200" />}
              <span className="map-ribbon hidden sm:block">{quest.title}</span>
            </button>
          );
        })}

        {futureStops.map(stop => (
          <div
            key={stop.id}
            className="quest-node locked opacity-80"
            style={{ left: `${stop.x}%`, top: `${stop.y}%`, position: 'absolute', transform: 'translate(-50%, -50%)' }}
            aria-hidden="true"
          >
            <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-stone-600 text-[11px] font-black text-stone-100 shadow-md">{stop.id}</span>
            <stop.Icon className="h-6 w-6" />
            <LockKeyhole className="absolute h-7 w-7 text-stone-200" />
            <span className="map-ribbon hidden sm:block">{stop.title}</span>
          </div>
        ))}
      </section>

      <aside className="grid content-start gap-4">
        <section className="ink-panel rounded-[28px] border border-amber-100/20 p-5 text-amber-50">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-200 text-slate-950 shadow-lg">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">Mentor</div>
              <h2 className="text-xl font-black">Professor Quill</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-amber-50/75">
                Willkommen, {user?.name}. {selectedQuest.guide}
              </p>
            </div>
          </div>
        </section>

        <section className="parchment rounded-[28px] border border-amber-100/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">{selectedQuest.chapter}</div>
              <h2 className="mt-1 text-2xl font-black text-slate-950">{selectedQuest.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-stone-600">{selectedQuest.subtitle}</p>
            </div>
            <Star className="mt-1 h-7 w-7 text-amber-500" />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-blue-950/70">
              <span>Fortschritt</span>
              <span>{selectedPercent}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-950/10">
              <div className="h-full rounded-full bg-blue-800" style={{ width: `${selectedPercent}%` }} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xl font-black text-slate-950">{selectedQuest.words.length}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">Worte</div>
            </div>
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xl font-black text-slate-950">{mastered}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">Gelernt</div>
            </div>
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xl font-black text-slate-950">{selectedQuest.reward}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">Preis</div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/quest/${selectedQuest.id}`)}
            disabled={status === 'locked'}
            className="magic-button mt-5 w-full"
          >
            {status === 'completed' ? 'Nochmal ueben' : status === 'locked' ? 'Noch verschlossen' : 'Quest starten'}
          </button>
        </section>
      </aside>
    </main>
  );
}
