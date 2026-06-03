import { useEffect, useRef, useState } from 'react';
import { PauseCircle, PlayCircle } from 'lucide-react';

interface StoryAudioPlayerProps {
  audioPath?: string;
  label?: string;
}

export default function StoryAudioPlayer({ audioPath, label = 'Erzählerstimme' }: StoryAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setPlaying(false);
  }, [audioPath]);

  if (!audioPath) {
    return null;
  }

  const toggleAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-blue-950/10 bg-blue-50/75 px-4 py-3">
      <button
        type="button"
        onClick={toggleAudio}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-950 px-4 py-2 text-sm font-black text-amber-50 transition hover:bg-blue-800 active:scale-[0.98]"
      >
        {playing ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
        {playing ? 'Pause' : 'Anhören'}
      </button>
      <div className="text-sm font-black text-blue-950">
        {label}
      </div>
      <audio
        ref={audioRef}
        src={audioPath}
        preload="metadata"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
    </div>
  );
}
