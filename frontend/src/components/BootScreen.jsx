export default function BootScreen() {
  return (
    <div className="boot-screen" role="status" aria-label="Memuat inSpectre">
      <div className="boot-grid" aria-hidden="true" />
      <div className="boot-content">
        <div className="boot-emblem"><span className="boot-orbit" /><svg viewBox="0 0 64 72" aria-hidden="true"><path d="M32 4 56 13v19c0 17-10 28-24 36C18 60 8 49 8 32V13L32 4Z" fill="none" stroke="currentColor" strokeWidth="2.6"/><path d="m21 35 7 7 15-17" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        <p className="boot-kicker">DIGITAL THREAT INTELLIGENCE</p>
        <h1>inSpectre<span>.</span></h1>
        <p className="boot-subtitle">Menyiapkan perlindungan digital</p>
        <div className="boot-progress"><span /></div>
        <div className="boot-status"><span className="boot-pulse" /> INITIALIZING SECURE SESSION</div>
      </div>
    </div>
  );
}
