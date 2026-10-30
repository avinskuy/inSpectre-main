import Logo from './Logo.jsx';

export default function BootScreen() {
  return (
    <div className="boot-screen" role="status" aria-label="Memuat inSpectre">
      <div className="boot-grid" aria-hidden="true" />
      <div className="boot-content">
        <div className="boot-brand">
          <Logo />
        </div>
        <p className="boot-kicker">DIGITAL THREAT INTELLIGENCE</p>
        <p className="boot-subtitle">
          Witness the theater of the world awake; there are no chains left to bind your stride.
        </p>
        <div className="boot-progress"><span /></div>
        <div className="boot-status">
          <span className="boot-pulse" /> INITIALIZING SECURE SESSION
        </div>
      </div>
    </div>
  );
}
