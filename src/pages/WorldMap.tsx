import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Castle, Check, CloudSun, Flame, FlaskConical, GraduationCap, Home, LibraryBig, LockKeyhole, PawPrint, Sparkles, Sprout, Star, Telescope, Trees, Trophy, Waves } from 'lucide-react';
import { useAuth } from '../App';
import WordwickLogo from '../components/WordwickLogo';
import { AcademyQuest, academyQuests as fallbackQuests, getQuestStory } from '../data/academy';

interface ProgressRow {
  wordId: number;
  mastered: number;
}

const sigils = {
  hall: Castle,
  library: LibraryBig,
  brew: FlaskConical,
  sky: CloudSun,
  tower: Telescope,
  garden: Sprout,
  woods: Trees,
  cave: Flame,
  moonwell: Waves,
  mastery: Trophy,
  paw: PawPrint,
  home: Home,
  spark: FlaskConical,
  water: Waves,
  graduation: GraduationCap,
};

const futureSigils = {
  hall: Castle,
  library: LibraryBig,
  brew: FlaskConical,
  sky: CloudSun,
  tower: Telescope,
  garden: Sprout,
  woods: Trees,
  cave: Flame,
  moonwell: Waves,
  mastery: Trophy,
  spark: Sparkles,
  trees: Trees,
  water: Waves,
  graduation: GraduationCap,
};

const prologuePages = [
  {
    eyebrow: 'Prolog',
    title: 'Willkommen in Wordwick Academy',
    body: 'Wordwick Academy ist keine gewöhnliche Schule. Hier werden englische Wörter nicht nur gelernt, sie leuchten, fliegen, verstecken sich in Büchern und öffnen geheime Wege auf der alten Akademiekarte. Jedes Wort, das du richtig erkennst, kann zu einem kleinen blauen Wortfunken werden.',
    extra: 'Eigentlich passen die Lehrerinnen und Lehrer gut auf diese Funken auf. Aber heute Morgen ist etwas Seltsames passiert: Die Karte ist still geworden, viele Pfade sind dunkel, und in den Fluren flüstern nur noch halbe Wörter.',
  },
  {
    eyebrow: 'Die Nacht des Sturms',
    title: 'Die Wortfunken sind verschwunden',
    body: 'In der Nacht zog ein kräftiger Wind über die Türme der Akademie. Er rüttelte an Fenstern, blätterte alte Wörterbücher auf und wirbelte die englischen Wortfunken aus ihren sicheren Plätzen. Seitdem findet niemand mehr zuverlässig den Weg zu den Übungsräumen.',
    extra: 'Die Haupthalle, die Mondbibliothek und sogar der Sternenturm warten darauf, wieder geweckt zu werden. Aber dafür braucht die Akademie jemanden, der mutig genug ist, die Wörter einzusammeln.',
  },
  {
    eyebrow: 'Pip erscheint',
    title: 'Ein Papierdrache braucht Hilfe',
    body: 'Aus einem alten Wörterbuch flattert Pip hervor, ein kleiner Papierdrache mit Tintensternen auf den Flügeln. Er kennt die Karte besser als jeder andere, aber ohne die Wortfunken kann selbst er die versteckten Pfade nicht lesen.',
    extra: 'Pip ist neugierig, ein bisschen ungeduldig und ziemlich sicher, dass du genau die richtige Person für diese Aufgabe bist. Er begleitet dich durch jedes Level, zeigt dir Spuren und bleibt auch dann bei dir, wenn ein Wort mal nicht sofort klappt.',
  },
  {
    eyebrow: 'Dein Auftrag',
    title: 'Bring die Pfade zurück',
    body: 'In jeder Mission wartet ein kleiner Teil der Akademie auf dich. Du fängst Wortfunken, übst englische Wörter und sammelst Belohnungen, die Pips Karte wieder heller machen. Wenn genug Spuren zurückkehren, öffnet sich der Weg zum nächsten wichtigen Ort.',
    extra: 'Dein erstes Ziel ist Wordwick Hall. Dort liegen die ersten Tierwörter im Dunkeln. Pip hat die Spur gefunden, aber er braucht dich, um sie wieder zum Leuchten zu bringen.',
  },
];

function ribbonClass(x: number, y: number) {
  if (y >= 70) return 'map-ribbon map-ribbon-above hidden 2xl:block';
  if (x <= 24) return 'map-ribbon map-ribbon-right hidden 2xl:block';
  if (x >= 76) return 'map-ribbon map-ribbon-left hidden 2xl:block';
  return 'map-ribbon hidden 2xl:block';
}

function activeRibbonClass(x: number, y: number) {
  if (y >= 70) return 'map-ribbon map-ribbon-active map-ribbon-above';
  if (x <= 24) return 'map-ribbon map-ribbon-active map-ribbon-right';
  if (x >= 76) return 'map-ribbon map-ribbon-active map-ribbon-left';
  return 'map-ribbon map-ribbon-active';
}

export default function WorldMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Record<number, ProgressRow>>({});
  const [quests, setQuests] = useState<AcademyQuest[]>(fallbackQuests);
  const [selectedQuest, setSelectedQuest] = useState<AcademyQuest>(fallbackQuests[0]);
  const [prologueStep, setPrologueStep] = useState(0);
  const [showPrologue, setShowPrologue] = useState(false);

  useEffect(() => {
    if (user) {
      setShowPrologue(localStorage.getItem(`wordwick-prologue-seen-${user.id}`) !== 'yes');
    }

    fetch('/api/quests', { credentials: 'include' })
      .then(response => response.ok ? response.json() : fallbackQuests)
      .then((data: AcademyQuest[]) => {
        const nextQuests = data.length > 0 ? data : fallbackQuests;
        setQuests(nextQuests);
        setSelectedQuest(current => nextQuests.find(quest => quest.id === current.id) ?? nextQuests[0]);
      });

    fetch('/api/progress', { credentials: 'include' })
      .then(response => response.json())
      .then((data: ProgressRow[]) => {
        const map: Record<number, ProgressRow> = {};
        for (const row of data) map[row.wordId] = row;
        setProgress(map);
      });
  }, [user]);

  const questOrder = (quest: AcademyQuest) => quest.sortOrder ?? quest.id;
  const orderedQuests = [...quests].sort((a, b) => questOrder(a) - questOrder(b));
  const stepByQuestId = new Map(orderedQuests.map((quest, index) => [quest.id, index + 1]));
  const questMasteredCount = (quest: AcademyQuest) => quest.words.filter(wordId => progress[wordId]?.mastered).length;

  const questStatus = (quest: AcademyQuest) => {
    if (quest.words.length === 0) return 'locked';
    const mastered = questMasteredCount(quest);
    if (mastered === quest.words.length) return 'completed';
    if (quest.id === 1) return 'unlocked';
    const previousIndex = orderedQuests.findIndex(item => item.id === quest.id);
    const previous = previousIndex > 0
      ? [...orderedQuests.slice(0, previousIndex)].reverse().find(item => item.words.length > 0)
      : null;
    if (!previous) return 'unlocked';
    return questMasteredCount(previous) === previous.words.length ? 'unlocked' : 'locked';
  };

  const status = questStatus(selectedQuest);
  const mastered = questMasteredCount(selectedQuest);
  const selectedPercent = Math.round((mastered / selectedQuest.words.length) * 100);
  const selectedStep = stepByQuestId.get(selectedQuest.id) ?? selectedQuest.id;
  const selectedStory = getQuestStory(selectedQuest.id);
  const chapterQuests = orderedQuests.filter(quest => quest.words.length > 0);
  const completedChapterQuests = chapterQuests.filter(quest => questStatus(quest) === 'completed').length;
  const chapterPercent = chapterQuests.length > 0 ? Math.round((completedChapterQuests / chapterQuests.length) * 100) : 0;
  const currentPrologue = prologuePages[prologueStep];
  const finishPrologue = () => {
    if (user) localStorage.setItem(`wordwick-prologue-seen-${user.id}`, 'yes');
    setShowPrologue(false);
  };

  if (showPrologue) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-6">
        <section className="parchment w-full overflow-hidden rounded-[32px] border border-amber-100/70">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="ink-panel relative flex min-h-[520px] flex-col items-center justify-center overflow-hidden p-7 text-center text-amber-50 sm:p-10">
              <div className="absolute left-8 right-8 top-8 h-px bg-amber-100/20" />
              <img
                src="/assets/pip-guide.webp"
                alt="Pip, der Papierdrache"
                className="h-72 w-72 object-contain drop-shadow-2xl sm:h-80 sm:w-80"
              />
              <div className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-amber-200/70">Pip wartet auf dich</div>
              <WordwickLogo className="mt-3" />
            </div>

            <div className="p-7 sm:p-10">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">{currentPrologue.eyebrow}</div>
              <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{currentPrologue.title}</h2>
              <p className="mt-5 text-base font-bold leading-8 text-stone-700">{currentPrologue.body}</p>
              <p className="mt-4 text-base font-bold leading-8 text-slate-900">{currentPrologue.extra}</p>

              <div className="mt-7">
                <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-[0.14em] text-blue-950/55">
                  <span>Vorgeschichte</span>
                  <span>{prologueStep + 1}/{prologuePages.length}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-950/10">
                  <div className="h-full rounded-full bg-blue-800" style={{ width: `${((prologueStep + 1) / prologuePages.length) * 100}%` }} />
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button onClick={finishPrologue} className="gold-button flex-1">Direkt zur Karte</button>
                {prologueStep + 1 < prologuePages.length ? (
                  <button onClick={() => setPrologueStep(step => step + 1)} className="magic-button flex-1">
                    Weiter
                  </button>
                ) : (
                  <button onClick={finishPrologue} className="magic-button flex-1">
                    Zur Karte
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1500px] gap-4 px-3 py-3 sm:px-5 sm:py-4 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_430px]">
      <section className="relative aspect-[16/9] min-h-[360px] w-full overflow-hidden rounded-[32px] border border-blue-100/20 bg-[#0f172a] shadow-2xl shadow-slate-950/30 sm:min-h-[460px] lg:aspect-[4/3] lg:min-h-0 2xl:aspect-[16/10]">
        <img
          src="/assets/wordwick-map-v1.jpg"
          alt="Illustrated parchment map of Wordwick Academy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/22 via-transparent to-slate-950/5" />

        <div className="absolute left-[5.5%] top-[5%] z-20 w-[24%] min-w-[170px] max-w-[310px]">
          <img
            src="/assets/wordwick-logo-edit.svg"
            alt="Wordwick Academy"
            className="wordwick-map-logo h-auto w-full"
          />
          <div className="mt-1 inline-flex rounded-full border border-amber-950/30 bg-amber-100/60 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-amber-950/80 shadow-sm backdrop-blur-sm">
            ...where words come alive.
          </div>
        </div>

        {quests.filter(quest => quest.words.length > 0).map(quest => {
          const questState = questStatus(quest);
          const Icon = sigils[quest.sigil as keyof typeof sigils] ?? Sparkles;
          const stepNumber = stepByQuestId.get(quest.id) ?? quest.id;
          const isSelected = selectedQuest.id === quest.id;
          return (
            <button
              key={quest.id}
              onClick={() => {
                if (questState !== 'locked') setSelectedQuest(quest);
              }}
              className={`quest-node z-30 ${questState}`}
              style={{ left: `${quest.x}%`, top: `${quest.y}%`, position: 'absolute', transform: 'translate(-50%, -50%)' }}
              aria-label={quest.title}
            >
              <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-amber-100 bg-amber-800 text-[11px] font-black text-amber-50 shadow-md">{stepNumber}</span>
              <Icon className="h-6 w-6" />
              {questState === 'completed' && <Check className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-blue-950 p-1 text-amber-100" />}
              {questState === 'locked' && <LockKeyhole className="absolute h-7 w-7 text-stone-200" />}
              <span className={isSelected ? activeRibbonClass(quest.x, quest.y) : ribbonClass(quest.x, quest.y)}>
                <span className="text-[9px] uppercase tracking-[0.14em] opacity-70">Schritt {stepNumber} · {quest.chapter}</span>
                <span className="block">{quest.title}</span>
              </span>
            </button>
          );
        })}

        {quests.filter(quest => quest.words.length === 0).map(stop => {
          const Icon = futureSigils[stop.sigil as keyof typeof futureSigils] ?? Sparkles;
          const stepNumber = stepByQuestId.get(stop.id) ?? stop.id;
          return (
          <div
            key={stop.id}
            className="quest-node locked z-30 opacity-80"
            style={{ left: `${stop.x}%`, top: `${stop.y}%`, position: 'absolute', transform: 'translate(-50%, -50%)' }}
            aria-hidden="true"
          >
            <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-stone-600 text-[11px] font-black text-stone-100 shadow-md">{stepNumber}</span>
            <Icon className="h-6 w-6" />
            <LockKeyhole className="absolute h-7 w-7 text-stone-200" />
            <span className={selectedQuest.id === stop.id ? activeRibbonClass(stop.x, stop.y) : ribbonClass(stop.x, stop.y)}>
              <span className="text-[9px] uppercase tracking-[0.14em] opacity-70">Schritt {stepNumber} · {stop.chapter}</span>
              <span className="block">{stop.title}</span>
            </span>
          </div>
        );
        })}
      </section>

      <aside className="grid content-start gap-4">
        <section className="ink-panel rounded-[28px] border border-amber-100/20 p-4 text-amber-50 xl:p-5">
          <div className="flex items-start gap-4">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-visible rounded-2xl bg-amber-100/10 xl:h-32 xl:w-32">
              <img
                src="/assets/pip-neutral.webp"
                alt="Pip, der Papierdrache"
                className="h-36 w-36 object-contain drop-shadow-2xl xl:h-40 xl:w-40"
              />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">Begleiter</div>
              <h2 className="text-xl font-black">Pip, der Papierdrache</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-amber-50/75">
                Willkommen, {user?.name}. Ich rieche Wortfunken! {selectedStory.mapTeaser}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-[0.14em] text-amber-200/70">
              <span>{selectedStory.arc}</span>
              <span>{completedChapterQuests}/{chapterQuests.length}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-amber-200" style={{ width: `${chapterPercent}%` }} />
            </div>
          </div>
        </section>

        <section className="parchment rounded-[28px] border border-amber-100/70 p-4 xl:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">Schritt {selectedStep} · {selectedQuest.chapter}</div>
              <h2 className="mt-1 text-xl font-black leading-tight text-slate-950 xl:text-2xl">{selectedQuest.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-5 text-stone-600 xl:leading-6">{selectedQuest.subtitle}</p>
            </div>
            <Star className="mt-1 h-7 w-7 text-amber-500" />
          </div>

          <div className="mt-4 rounded-2xl border border-blue-950/10 bg-white/55 p-3 xl:mt-5 xl:p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-950/55">{selectedStory.arc}</div>
            <p className="mt-2 text-sm font-bold leading-5 text-slate-800 xl:leading-6">{selectedQuest.guide}</p>
          </div>

          <div className="mt-4 xl:mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-blue-950/70">
              <span>Fortschritt</span>
              <span>{selectedPercent}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-950/10">
              <div className="h-full rounded-full bg-blue-800" style={{ width: `${selectedPercent}%` }} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 xl:mt-5">
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xl font-black text-slate-950">{selectedQuest.words.length}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">Worte</div>
            </div>
            <div className="rounded-2xl bg-white/60 p-3">
              <div className="text-xl font-black text-slate-950">{mastered}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">Gelernt</div>
            </div>
            <div className="col-span-2 rounded-2xl bg-white/60 p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">Belohnung</div>
              <div className="mt-1 break-words text-lg font-black leading-tight text-slate-950">{selectedQuest.reward}</div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/quest/${selectedQuest.id}`)}
            disabled={status === 'locked'}
            className="magic-button mt-5 w-full"
          >
            {status === 'completed' ? 'Nochmal üben' : status === 'locked' ? 'Noch verschlossen' : 'Quest starten'}
          </button>
        </section>
      </aside>
    </main>
  );
}
