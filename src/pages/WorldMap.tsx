import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Castle, Check, CloudSun, Flame, FlaskConical, GraduationCap, Home, LibraryBig, LockKeyhole, PawPrint, ScrollText, Sparkles, Sprout, Star, Telescope, Trees, Trophy, Waves } from 'lucide-react';
import { useAuth } from '../App';
import StoryAudioPlayer from '../components/StoryAudioPlayer';
import WordwickLogo from '../components/WordwickLogo';
import { AcademyQuest, academyQuests as fallbackQuests, getQuestStory, prologuePages, storyScenes } from '../data/academy';
import { useStoryAudio } from '../hooks/useStoryAudio';

interface ProgressRow {
  wordId: number;
  mastered: number;
}

interface QuestResultRow {
  questId: number;
  attempts: number;
  bestPercent: number;
  completed: number;
}

const PROLOGUE_VERSION = 'v2';
const SPLASH_VERSION = 'v1';
const PROLOGUE_NODE = {
  x: 51,
  y: 45,
};

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

function ribbonClass(x: number, y: number) {
  if (y >= 70) return 'map-ribbon map-ribbon-above hidden group-hover:block group-focus-visible:block';
  if (x <= 24) return 'map-ribbon map-ribbon-right hidden group-hover:block group-focus-visible:block';
  if (x >= 76) return 'map-ribbon map-ribbon-left hidden group-hover:block group-focus-visible:block';
  return 'map-ribbon hidden group-hover:block group-focus-visible:block';
}

function activeRibbonClass(x: number, y: number) {
  if (y >= 70) return 'map-ribbon map-ribbon-active map-ribbon-above';
  if (x <= 24) return 'map-ribbon map-ribbon-active map-ribbon-right';
  if (x >= 76) return 'map-ribbon map-ribbon-active map-ribbon-left';
  return 'map-ribbon map-ribbon-active';
}

function questContentReady(quest: AcademyQuest) {
  return quest.contentStatus?.ready ?? quest.words.length > 0;
}

const gameTypeLabels: Record<string, string> = {
  'spark-catcher': 'Wortfunken fangen',
  'library-sorter': 'Bücherregal sortieren',
  'image-choice': 'Bildkarte erkennen',
  'audio-choice': 'Hörzauber',
  'word-builder': 'Wort-Bausteine',
  'spell-order': 'Zauberspruch ordnen',
  'verb-assembler': 'Verbsteine ordnen',
  'text-input': 'Texteingabe',
};

const detailValueClass = 'mt-1 line-clamp-3 min-h-[2.35rem] max-w-full break-words text-center text-sm font-black leading-tight text-slate-950 [hyphens:auto] [overflow-wrap:anywhere] xl:text-[15px]';

export default function WorldMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Record<number, ProgressRow>>({});
  const [questResults, setQuestResults] = useState<Record<number, QuestResultRow>>({});
  const [quests, setQuests] = useState<AcademyQuest[]>(fallbackQuests);
  const [selectedQuest, setSelectedQuest] = useState<AcademyQuest>(fallbackQuests[0]);
  const [prologueStep, setPrologueStep] = useState(0);
  const [introChecked, setIntroChecked] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [showPrologue, setShowPrologue] = useState(false);
  const [seenStoryScenes, setSeenStoryScenes] = useState<Record<string, boolean>>({});
  const storyAudio = useStoryAudio();

  useEffect(() => {
    let cancelled = false;
    setIntroChecked(user?.role !== 'child');

    if (user) {
      setShowPrologue(localStorage.getItem(`wordwick-prologue-seen-${PROLOGUE_VERSION}-${user.id}`) !== 'yes');
      setSeenStoryScenes(Object.fromEntries(
        storyScenes.map(scene => [scene.id, localStorage.getItem(`wordwick-story-seen-${scene.id}-${user.id}`) === 'yes']),
      ));
    }

    fetch('/api/quests', { credentials: 'include' })
      .then(response => response.ok ? response.json() : fallbackQuests)
      .then((data: AcademyQuest[]) => {
        const nextQuests = data.length > 0 ? data : fallbackQuests;
        setQuests(nextQuests);
        setSelectedQuest(current => nextQuests.find(quest => quest.id === current.id) ?? nextQuests[0]);
      });

    const progressRequest = fetch('/api/progress', { credentials: 'include' })
      .then(response => response.json())
      .then((data: ProgressRow[]) => {
        if (cancelled) return [];
        const map: Record<number, ProgressRow> = {};
        for (const row of data) map[row.wordId] = row;
        setProgress(map);
        return data;
      });

    const questResultsRequest = fetch('/api/quest-results', { credentials: 'include' })
      .then(response => response.ok ? response.json() : [])
      .then((data: QuestResultRow[]) => {
        if (cancelled) return [];
        const map: Record<number, QuestResultRow> = {};
        for (const row of data) map[row.questId] = row;
        setQuestResults(map);
        return data;
      });

    Promise.all([progressRequest, questResultsRequest])
      .then(([progressRows, resultRows]) => {
        if (cancelled || !user || user.role !== 'child') return;
        const hasJourneyProgress = progressRows.length > 0 || resultRows.length > 0;
        const splashSeen = localStorage.getItem(`wordwick-splash-seen-${SPLASH_VERSION}-${user.id}`) === 'yes';
        setShowSplash(!splashSeen && !hasJourneyProgress);
      })
      .finally(() => {
        if (!cancelled) setIntroChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const questOrder = (quest: AcademyQuest) => quest.sortOrder ?? quest.id;
  const orderedQuests = [...quests].sort((a, b) => questOrder(a) - questOrder(b));
  const stepByQuestId = new Map(orderedQuests.map((quest, index) => [quest.id, index + 1]));
  const questMasteredCount = (quest: AcademyQuest) => quest.words.filter(wordId => progress[wordId]?.mastered).length;

  const questStatus = (quest: AcademyQuest) => {
    if (!questContentReady(quest)) return 'locked';
    if (questResults[quest.id]?.completed) return 'completed';
    if (quest.id === 1) return 'unlocked';
    const previousIndex = orderedQuests.findIndex(item => item.id === quest.id);
    const previous = previousIndex > 0
      ? [...orderedQuests.slice(0, previousIndex)].reverse().find(questContentReady)
      : null;
    if (!previous) return 'unlocked';
    return questResults[previous.id]?.completed ? 'unlocked' : 'locked';
  };

  const status = questStatus(selectedQuest);
  const mastered = questMasteredCount(selectedQuest);
  const selectedPercent = selectedQuest.words.length > 0 ? Math.round((mastered / selectedQuest.words.length) * 100) : 0;
  const selectedStep = stepByQuestId.get(selectedQuest.id) ?? selectedQuest.id;
  const selectedStory = getQuestStory(selectedQuest.id);
  const selectedTaskCount = selectedQuest.taskLimit ?? selectedQuest.words.length;
  const selectedMagic = gameTypeLabels[selectedQuest.gameType ?? 'text-input'] ?? 'Texteingabe';
  const unlockedStoryScenes = storyScenes.filter(scene => questResults[scene.unlockAfterQuestId]?.completed);
  const nextUnseenStoryScene = unlockedStoryScenes.find(scene => !seenStoryScenes[scene.id]);
  const chapterQuests = orderedQuests.filter(questContentReady);
  const completedChapterQuests = chapterQuests.filter(quest => questStatus(quest) === 'completed').length;
  const chapterPercent = chapterQuests.length > 0 ? Math.round((completedChapterQuests / chapterQuests.length) * 100) : 0;
  const currentPrologue = prologuePages[prologueStep];
  const currentPrologueAudio = storyAudio[`prologue-${prologueStep + 1}`];
  const openPrologue = () => {
    setPrologueStep(0);
    setShowPrologue(true);
  };
  const finishPrologue = () => {
    if (user) localStorage.setItem(`wordwick-prologue-seen-${PROLOGUE_VERSION}-${user.id}`, 'yes');
    setShowPrologue(false);
  };
  const finishSplash = () => {
    if (user) localStorage.setItem(`wordwick-splash-seen-${SPLASH_VERSION}-${user.id}`, 'yes');
    setShowSplash(false);
  };

  if (user?.role === 'child' && !introChecked) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-7.75rem)] items-center justify-center px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-transparent" />
      </main>
    );
  }

  if (showSplash) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-7.75rem)] max-w-6xl items-center justify-center px-4 py-6">
        <section className="relative w-full overflow-hidden rounded-[32px] border border-amber-100/25 bg-blue-950 px-6 py-12 text-center text-amber-50 shadow-2xl shadow-slate-950/35 sm:px-10 lg:py-16">
          <img
            src="/assets/wordwick-login-v1.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/78 via-blue-950/58 to-blue-950/88" />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center">
            <div className="rounded-[28px] border border-amber-100/20 bg-white/10 px-6 py-5 shadow-2xl shadow-slate-950/25 backdrop-blur-sm sm:px-10">
              <WordwickLogo className="wordwick-splash-logo" />
            </div>
            <div className="mt-5 rounded-full border border-amber-100/25 bg-blue-950/60 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-amber-100 shadow-lg shadow-slate-950/20">
              ...where words come alive.
            </div>
            <p className="mt-7 max-w-2xl text-lg font-black leading-8 text-amber-50 sm:text-xl">
              Die Akademiekarte erwacht. Pip hat ein Rascheln im Obergeschoss gehört und wartet schon auf den ersten Wortfunken.
            </p>
            <button onClick={finishSplash} className="magic-button mt-8 px-8">
              <Sparkles className="h-4 w-4" />
              Reise beginnen
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (showPrologue) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-6">
        <section className="parchment w-full overflow-hidden rounded-[32px] border border-amber-100/70">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="ink-panel relative flex min-h-[520px] flex-col items-center justify-center overflow-hidden p-7 text-center text-amber-50 sm:p-10">
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
              <StoryAudioPlayer audioPath={currentPrologueAudio?.audioPath} />

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
    <main className="mx-auto flex min-h-[calc(100vh-7.75rem)] max-w-[1500px] flex-col gap-3 px-3 py-2 sm:px-4 lg:h-[calc(100vh-7.75rem)] lg:min-h-0 lg:overflow-hidden">
      <section className="relative min-h-[360px] w-full flex-1 overflow-hidden rounded-[28px] border border-blue-100/20 bg-[#0f172a] shadow-2xl shadow-slate-950/30 sm:min-h-[440px] lg:min-h-0">
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

        <button
          onClick={openPrologue}
          className="story-scroll-marker seen z-30 -rotate-6"
          style={{ left: `${PROLOGUE_NODE.x}%`, top: `${PROLOGUE_NODE.y}%`, position: 'absolute', transform: 'translate(-50%, -50%) rotate(-8deg)' }}
          aria-label="Prolog noch einmal ansehen"
        >
          <ScrollText className="relative z-10 h-4 w-4" />
          <span className="map-ribbon map-ribbon-prologue">
            <span className="text-[9px] uppercase tracking-[0.14em] opacity-70">Obergeschoss</span>
            <span className="block">Prolog</span>
          </span>
        </button>

        {quests.map(quest => {
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
              className={`quest-node group z-30 ${questState}`}
              style={{ left: `${quest.x}%`, top: `${quest.y}%`, position: 'absolute', transform: 'translate(-50%, -50%)' }}
              aria-label={quest.title}
            >
              <span className="quest-step-badge">{stepNumber}</span>
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

        {storyScenes.map(scene => {
          const unlocked = Boolean(questResults[scene.unlockAfterQuestId]?.completed);
          const seen = Boolean(seenStoryScenes[scene.id]);
          return (
            <button
              key={scene.id}
              onClick={() => {
                if (unlocked) navigate(`/story/${scene.id}`);
              }}
              className={`story-scroll-marker group z-30 ${unlocked ? seen ? 'seen' : 'available' : 'locked'} ${seen ? 'rotate-3' : '-rotate-6'}`}
              style={{ left: `${scene.x}%`, top: `${scene.y}%`, position: 'absolute', transform: `translate(-50%, -50%) rotate(${seen ? 6 : -8}deg)` }}
              aria-label={scene.title}
            >
              <ScrollText className="relative z-10 h-4 w-4" />
              {!seen && unlocked && <Sparkles className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-blue-950 p-1 text-amber-100" />}
              {!unlocked && <LockKeyhole className="absolute z-10 h-4 w-4 text-stone-600" />}
              <span className={unlocked && !seen ? activeRibbonClass(scene.x, scene.y) : ribbonClass(scene.x, scene.y)}>
                <span className="text-[9px] uppercase tracking-[0.14em] opacity-70">{scene.eyebrow}</span>
                <span className="block">{scene.title}</span>
              </span>
            </button>
          );
        })}
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(13rem,0.55fr)]">
        <div className="ink-panel rounded-[24px] border border-amber-100/20 p-3 text-amber-50">
          <div className="flex items-center gap-3">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-visible rounded-2xl bg-amber-100/10">
              <img
                src="/assets/pip-neutral.webp"
                alt="Pip, der Papierdrache"
                className="h-28 w-28 object-contain drop-shadow-2xl"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-200/70">Begleiter</div>
              <h2 className="truncate text-lg font-black">Pip, der Papierdrache</h2>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-amber-50/75">
                Willkommen, {user?.name}. Ich rieche Wortfunken! {selectedStory.mapTeaser}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-[0.14em] text-amber-200/70">
              <span>{selectedStory.arc}</span>
              <span>{completedChapterQuests}/{chapterQuests.length}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-amber-200" style={{ width: `${chapterPercent}%` }} />
            </div>
          </div>
          {nextUnseenStoryScene && (
            <button
              onClick={() => navigate(`/story/${nextUnseenStoryScene.id}`)}
              className="mt-4 flex w-full items-start gap-3 rounded-2xl border border-amber-100/20 bg-white/10 p-3 text-left transition hover:bg-white/15 active:scale-[0.99]"
            >
              <ScrollText className="mt-1 h-5 w-5 shrink-0 text-amber-200" />
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-amber-200/70">{nextUnseenStoryScene.eyebrow}</span>
                <span className="mt-1 block text-sm font-black text-amber-50">{nextUnseenStoryScene.title}</span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-amber-50/70">{nextUnseenStoryScene.subtitle}</span>
              </span>
            </button>
          )}
        </div>

        <div className="parchment rounded-[24px] border border-amber-100/70 p-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-blue-950/60">Schritt {selectedStep} · {selectedQuest.chapter}</div>
              <h2 className="mt-1 truncate text-xl font-black leading-tight text-slate-950 xl:text-2xl">{selectedQuest.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-stone-600">{selectedQuest.subtitle}</p>
              {questResults[selectedQuest.id] && (
                <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-blue-950/55">
                  Bestwert: {questResults[selectedQuest.id].bestPercent}%
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-blue-950/10 bg-white/55 p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-950/55">{selectedStory.arc}</div>
              <p className="mt-1 line-clamp-3 text-sm font-bold leading-5 text-slate-800">
                {status === 'locked' && !questContentReady(selectedQuest)
                  ? 'Dieser Ort wartet noch auf passende Wortfunken. Sobald er im Elternbereich befüllt ist, kann Pip die Spur öffnen.'
                  : selectedQuest.guide}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-blue-950/70">
                <span>Fortschritt</span>
                <span>{selectedPercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-950/10">
                <div className="h-full rounded-full bg-blue-800" style={{ width: `${selectedPercent}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="min-w-0 rounded-2xl bg-white/60 p-2 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">Aufgaben</div>
                <div className={detailValueClass} title={`${selectedTaskCount}`}>
                  {selectedTaskCount}
                </div>
              </div>
              <div className="min-w-0 rounded-2xl bg-white/60 p-2 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">Belohnung</div>
                <div className={detailValueClass} lang="de" title={selectedQuest.reward}>
                  {selectedQuest.reward}
                </div>
              </div>
              <div className="min-w-0 rounded-2xl bg-white/60 p-2 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">Magie</div>
                <div className={detailValueClass} lang="de" title={selectedMagic}>
                  {selectedMagic}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="parchment flex flex-col justify-between rounded-[24px] border border-amber-100/70 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-950/55">Aktuelle Quest</div>
              <div className="mt-1 text-lg font-black leading-tight text-slate-950">{status === 'completed' ? 'Schon geschafft' : status === 'locked' ? 'Noch verschlossen' : 'Bereit'}</div>
            </div>
            <Star className="h-7 w-7 shrink-0 text-amber-500" />
          </div>
          <button
            onClick={() => navigate(`/quest/${selectedQuest.id}`)}
            disabled={status === 'locked'}
            className="magic-button mt-3 w-full justify-center"
          >
            {status === 'completed' ? 'Nochmal üben' : status === 'locked' ? 'Noch verschlossen' : 'Quest starten'}
          </button>
        </div>
      </section>
    </main>
  );
}
