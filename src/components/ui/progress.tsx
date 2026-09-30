export function ProgressRing({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  const size = 64;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const offset = length - (safe / 100) * length;
  return (
    <div className="relative size-16 shrink-0" role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100} aria-label={`${safe}% do módulo`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-16 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted-foreground/25" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={offset}
          className="text-primary"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">{safe}%</span>
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-primary" style={{ width: `${safe}%` }} />
    </div>
  );
}
