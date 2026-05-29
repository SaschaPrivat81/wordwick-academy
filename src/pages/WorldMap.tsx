import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Check, Home, LockKeyhole, PawPrint, Sparkles, Star, Waves } from 'lucide-react';
import { useAuth } from '../App';
import { AcademyQuest, academyQuests } from '../data/academy';

interface ProgressRow {
  wordId: number;
  mastered: number;
}

const sigils = {
  paw: PawPrint,
  home: Home,
  spark: Sparkles,
  water: Waves,
  book: BookOpen,
};

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
      <section className="relative min-h-[620px] overflow-hidden rounded-[32px] border border-blue-100/20 bg-[#0f172a] shadow-2xl shadow-slate-950/30">
        <div className="absolute left-5 top-5 z-20 rounded-2xl border border-amber-100/25 bg-slate-950/75 px-4 py-3 text-amber-50 backdrop-blur">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">Schulkarte</div>
          <h1 className="text-2xl font-black">Wordwick Academy</h1>
        </div>

        <svg viewBox="0 0 1000 720" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="mapGround" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#0f172a" />
              <stop offset="0.42" stopColor="#1e3a8a" />
              <stop offset="1" stopColor="#d8c58a" />
            </linearGradient>
            <radialGradient id="lakeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#93c5fd" stopOpacity="0.85" />
              <stop offset="1" stopColor="#1e3a8a" stopOpacity="0.2" />
            </radialGradient>
            <filter id="softShadow">
              <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#020617" floodOpacity="0.34" />
            </filter>
          </defs>
          <rect width="1000" height="720" fill="url(#mapGround)" />
          <circle cx="802" cy="96" r="62" fill="#dbeafe" opacity="0.72" />
          <g fill="#f8e7b0" opacity="0.9">
            <circle cx="96" cy="92" r="3" />
            <circle cx="182" cy="158" r="2" />
            <circle cx="318" cy="98" r="2.5" />
            <circle cx="706" cy="168" r="2.5" />
            <circle cx="892" cy="240" r="2" />
            <path d="M548 78 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5z" />
            <path d="M252 276 l4 8 8 4 -8 4 -4 8 -4 -8 -8 -4 8 -4z" />
          </g>
          <path d="M-20 560 C126 498 190 606 330 538 C488 462 572 552 760 468 C866 420 948 428 1020 386 L1020 740 L-20 740 Z" fill="#111827" opacity="0.76" />
          <path d="M0 156 C146 208 240 132 350 182 C512 256 630 140 776 198 C880 240 924 214 1008 178 L1008 -20 L0 -20 Z" fill="#020617" opacity="0.54" />
          <ellipse cx="690" cy="506" rx="180" ry="74" fill="url(#lakeGlow)" opacity="0.7" />
          <path d="M166 562 C220 450 362 420 412 342 C472 250 604 284 674 204" fill="none" stroke="#dbeafe" strokeWidth="30" strokeLinecap="round" strokeDasharray="5 34" opacity="0.84" />
          <path d="M166 562 C220 450 362 420 412 342 C472 250 604 284 674 204" fill="none" stroke="#f7d273" strokeWidth="5" strokeLinecap="round" opacity="0.42" />
          <g filter="url(#softShadow)">
            <path d="M430 226 L486 80 L542 226 Z" fill="#1e3a8a" />
            <path d="M459 82 L486 22 L513 82 Z" fill="#e8bd59" />
            <rect x="378" y="224" width="216" height="128" rx="14" fill="#1d4ed8" opacity="0.78" />
            <path d="M402 226 L438 132 L474 226 Z" fill="#172554" />
            <path d="M504 226 L540 132 L576 226 Z" fill="#172554" />
            <rect x="462" y="286" width="48" height="66" rx="24" fill="#020617" />
            <path d="M344 356 C406 332 504 332 632 356 L650 410 C520 388 412 388 326 410 Z" fill="#172554" />
            <g fill="#f8e7b0" opacity="0.82">
              <rect x="470" y="142" width="32" height="48" rx="16" />
              <rect x="416" y="244" width="28" height="34" rx="14" />
              <rect x="528" y="244" width="28" height="34" rx="14" />
              <rect x="366" y="370" width="30" height="38" rx="15" />
              <rect x="604" y="370" width="30" height="38" rx="15" />
            </g>
          </g>
          <g opacity="0.58" fill="#0f172a">
            <path d="M78 152 l36 -84 38 84z" />
            <path d="M124 168 l32 -74 34 74z" />
            <path d="M828 170 l48 -108 50 108z" />
            <path d="M842 618 l56 -126 58 126z" />
          </g>
        </svg>

        <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {academyQuests.slice(0, -1).map((quest, index) => {
            const next = academyQuests[index + 1];
            return <line key={quest.id} x1={quest.x} y1={quest.y} x2={next.x} y2={next.y} stroke="#f8e7b0" strokeWidth="0.35" strokeDasharray="1.2 1.2" opacity="0.72" />;
          })}
        </svg>

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
              <Icon className="h-7 w-7" />
              {questState === 'completed' && <Check className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-blue-950 p-1 text-amber-100" />}
              {questState === 'locked' && <LockKeyhole className="absolute h-7 w-7 text-stone-200" />}
            </button>
          );
        })}
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
