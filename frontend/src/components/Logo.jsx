export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" fill="none" aria-hidden="true">
        <defs><linearGradient id="spectre-mark" x1="5" y1="4" x2="35" y2="36" gradientUnits="userSpaceOnUse"><stop stopColor="#22d3ee"/><stop offset="1" stopColor="#0d9488"/></linearGradient></defs>
        <path d="M20 3 34 8v10c0 9-5.8 15.3-14 19C11.8 33.3 6 27 6 18V8L20 3Z" stroke="url(#spectre-mark)" strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M12 20a8 8 0 0 1 16 0M20 12v3m0 5 5-5M12 25h16" stroke="url(#spectre-mark)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="20" cy="20" r="2" fill="#22d3ee"/>
      </svg>
      <span className="text-xl font-bold tracking-tight">in<span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Spectre</span></span>
    </div>
  );
}
