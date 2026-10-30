export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" fill="none" aria-hidden="true">
        <path d="M29.5 9.5H17.2C12.9 9.5 10 12 10 15.5s2.9 5.5 7.2 5.5h5.6c4.3 0 7.2 2 7.2 5.5S27.1 32 22.8 32H10.5"
          stroke="#F5B96B" strokeWidth="3.2" strokeLinecap="square"/>
        <path d="M29.5 9.5 34 5M10.5 32 6 36" stroke="#7DD3FC" strokeWidth="2.4" strokeLinecap="round"/>
        <path d="M20 3.5v4M20 32.5v4" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" opacity=".8"/>
      </svg>
      <span className="text-xl font-bold tracking-tight text-slate-100">
        in<span className="text-[#F5B96B]">Spectre</span>
      </span>
    </div>
  );
}
