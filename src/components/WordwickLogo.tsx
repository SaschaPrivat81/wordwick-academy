import { Sparkles } from 'lucide-react';

interface WordwickLogoProps {
  className?: string;
  compact?: boolean;
  markOnly?: boolean;
  tone?: 'light' | 'dark' | 'map';
}

export default function WordwickLogo({ className = '', compact = false, markOnly = false, tone = 'light' }: WordwickLogoProps) {
  const isDark = tone === 'dark';
  const isMap = tone === 'map';
  const subtitleColor = isMap ? 'text-amber-950/80' : 'text-blue-950/70';
  const markClass = isDark
    ? 'border-blue-950/20 bg-blue-950 text-amber-100'
    : isMap
      ? 'border-amber-950/35 bg-amber-100/75 text-amber-950'
      : 'border-amber-200/45 bg-slate-950 text-amber-100';
  const logoPanelClass = isDark
    ? 'border-blue-950/10 bg-white/80'
    : isMap
      ? 'border-amber-950/25 bg-amber-100/60'
      : 'border-amber-100/30 bg-amber-50/90';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {markOnly ? (
        <div className={`relative flex shrink-0 items-center justify-center rounded-xl border shadow-inner ${compact ? 'h-10 w-10' : 'h-14 w-14'} ${markClass}`}>
          <span className={`${compact ? 'text-sm' : 'text-xl'} font-black leading-none`}>WA</span>
          <Sparkles className={`absolute -right-1 -top-1 rounded-full bg-blue-800 p-0.5 text-amber-100 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
        </div>
      ) : (
        <div className={`inline-flex flex-col items-start rounded-xl border shadow-sm backdrop-blur-sm ${compact ? 'px-2.5 py-1.5' : 'px-4 py-3'} ${logoPanelClass}`}>
          <img
            src="/assets/wordwick-logo-edit.svg"
            alt="Wordwick Academy"
            className={`h-auto drop-shadow-[0_2px_0_rgba(255,248,220,0.85)] ${compact ? 'w-36' : 'w-72 sm:w-80'}`}
          />
          <div className={`mt-1 font-black ${compact ? 'text-[8px]' : 'text-[11px]'} uppercase tracking-[0.16em] ${subtitleColor}`}>
            ...where words come alive.
          </div>
        </div>
      )}
    </div>
  );
}
