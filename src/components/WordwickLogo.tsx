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
  const titleColor = isDark ? 'text-slate-950' : isMap ? 'text-amber-950' : 'text-amber-50';
  const subtitleColor = isDark ? 'text-blue-950/70' : isMap ? 'text-amber-950/80' : 'text-amber-100/80';
  const markClass = isDark
    ? 'border-blue-950/20 bg-blue-950 text-amber-100'
    : isMap
      ? 'border-amber-950/35 bg-amber-100/75 text-amber-950'
      : 'border-amber-200/45 bg-slate-950 text-amber-100';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative flex shrink-0 items-center justify-center rounded-xl border shadow-inner ${compact ? 'h-10 w-10' : 'h-14 w-14'} ${markClass}`}>
        <span className={`${compact ? 'text-sm' : 'text-xl'} font-black leading-none`}>WA</span>
        <Sparkles className={`absolute -right-1 -top-1 rounded-full bg-blue-800 p-0.5 text-amber-100 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
      </div>
      {markOnly ? null : (
        <div className="leading-none">
          <div className={`wordwick-title-outline font-serif font-black tracking-normal ${compact ? 'text-xl' : 'text-4xl sm:text-5xl'} ${titleColor}`}>
            Wordwick
          </div>
          <div className={`wordwick-title-outline font-serif font-black tracking-normal ${compact ? 'text-base' : 'text-3xl sm:text-4xl'} ${titleColor}`}>
            Academy
          </div>
          <div className={`mt-1 font-black ${compact ? 'text-[9px]' : 'text-[11px]'} uppercase tracking-[0.16em] ${subtitleColor}`}>
            ...where words come alive.
          </div>
        </div>
      )}
    </div>
  );
}
