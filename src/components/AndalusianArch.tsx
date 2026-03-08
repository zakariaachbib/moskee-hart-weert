export default function AndalusianArch({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
        <path d="M0 60 Q0 0 60 0 Q120 0 120 60" stroke="hsl(var(--gold))" strokeWidth="1.5" fill="none" />
        <path d="M10 60 Q10 10 60 10 Q110 10 110 60" stroke="hsl(var(--gold))" strokeWidth="0.8" fill="none" />
        <circle cx="60" cy="25" r="4" stroke="hsl(var(--gold))" strokeWidth="0.8" fill="none" />
        <line x1="60" y1="0" x2="60" y2="60" stroke="hsl(var(--gold))" strokeWidth="0.5" opacity="0.5" />
      </svg>
    </div>
  );
}
