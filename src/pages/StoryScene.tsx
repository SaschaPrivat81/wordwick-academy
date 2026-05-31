import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../App';
import { getStoryScene } from '../data/academy';

const speakerStyles = {
  Pip: 'bg-blue-950 text-amber-50',
  Karte: 'bg-amber-100 text-amber-950',
  Portrait: 'bg-blue-100 text-blue-950',
  Erzähler: 'bg-white/70 text-slate-950',
};

export default function StoryScene() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const scene = useMemo(() => (id ? getStoryScene(id) : undefined), [id]);
  const [pageIndex, setPageIndex] = useState(0);

  if (!scene) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-6">
        <section className="parchment w-full rounded-[32px] border border-amber-100/70 p-8 text-center">
          <h1 className="text-3xl font-black text-slate-950">Diese Szene ist noch nicht auf der Karte.</h1>
          <button onClick={() => navigate('/')} className="magic-button mt-6">
            <ArrowLeft className="h-4 w-4" />
            Zur Karte
          </button>
        </section>
      </main>
    );
  }

  const page = scene.pages[pageIndex];
  const progress = ((pageIndex + 1) / scene.pages.length) * 100;

  const finishScene = () => {
    if (user) localStorage.setItem(`wordwick-story-seen-${scene.id}-${user.id}`, 'yes');
    navigate('/');
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-6">
      <section className="parchment w-full overflow-hidden rounded-[32px] border border-amber-100/70">
        <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="ink-panel relative flex min-h-[500px] flex-col items-center justify-center overflow-hidden p-8 text-center text-amber-50">
            <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-amber-100/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-100/80">
              <Sparkles className="h-3.5 w-3.5" />
              {scene.eyebrow}
            </div>
            <img
              src={page.speaker === 'Pip' ? '/assets/pip-cheer.webp' : '/assets/pip-guide.webp'}
              alt="Pip begleitet die Zwischensequenz"
              className="h-72 w-72 object-contain drop-shadow-2xl sm:h-80 sm:w-80"
            />
            <div className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-amber-200/70">{scene.subtitle}</div>
            <h1 className="mt-2 max-w-lg text-4xl font-black leading-tight">{scene.title}</h1>
          </div>

          <div className="p-7 sm:p-10">
            <button onClick={() => navigate('/')} className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-black text-blue-950/65 transition hover:bg-blue-950/5">
              <ArrowLeft className="h-4 w-4" />
              Karte
            </button>

            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${speakerStyles[page.speaker]}`}>
                <MessageCircle className="h-4 w-4" />
                {page.speaker}
              </span>
              <span className="text-xs font-black uppercase tracking-[0.14em] text-blue-950/50">
                Szene {pageIndex + 1}/{scene.pages.length}
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{page.title}</h2>
            <p className="mt-5 text-base font-bold leading-8 text-stone-700">{page.body}</p>
            {page.aside && (
              <div className="mt-5 rounded-2xl border border-blue-950/10 bg-blue-100/70 p-4 text-sm font-bold leading-6 text-blue-950">
                {page.aside}
              </div>
            )}

            <div className="mt-7">
              <div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-[0.14em] text-blue-950/55">
                <span>Zwischensequenz</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-950/10">
                <div className="h-full rounded-full bg-blue-800" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {pageIndex > 0 && (
                <button onClick={() => setPageIndex(index => index - 1)} className="gold-button flex-1">
                  Zurück
                </button>
              )}
              {pageIndex + 1 < scene.pages.length ? (
                <button onClick={() => setPageIndex(index => index + 1)} className="magic-button flex-1">
                  Weiter
                </button>
              ) : (
                <button onClick={finishScene} className="magic-button flex-1">
                  <BookOpen className="h-4 w-4" />
                  Szene abschließen
                </button>
              )}
            </div>

            <div className="mt-5 rounded-2xl bg-white/60 p-4 text-sm font-bold leading-6 text-stone-600">
              {scene.rewardLine}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
