export default function OrnamentalDivider({ light = false }: { light?: boolean }) {
  const color = light ? "hsl(var(--gold))" : "hsl(var(--primary))";
  return (
    <div className="flex items-center justify-center gap-3 my-6">
      <div className="h-px w-16 sm:w-24" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
        <polygon points="14,2 17,11 26,11 19,17 21,26 14,21 7,26 9,17 2,11 11,11" stroke={color} strokeWidth="1" fill="none" />
        <circle cx="14" cy="14" r="3" stroke={color} strokeWidth="0.8" fill="none" />
      </svg>
      <div className="h-px w-16 sm:w-24" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
    </div>
  );
}
