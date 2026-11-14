export default function FloatingAssistant({ currentRoute = '#/' }) {
  if (currentRoute === '#/asisten') return null;

  return (
    <a
      href="#/asisten"
      aria-label="Buka Asisten Keamanan"
      title="Asisten Keamanan"
      className="group fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#7dd3fc]/35 bg-[#12243a] text-[#7dd3fc] shadow-[0_10px_30px_rgba(0,0,0,0.38)] transition duration-200 hover:-translate-y-1 hover:border-[#7dd3fc]/70 hover:bg-[#193653] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7dd3fc]"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
        <path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
      </svg>
      <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2 text-xs font-semibold text-slate-100 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        Asisten Keamanan
      </span>
    </a>
  );
}
