import Logo from './components/Logo.jsx';
import { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Nexus from './pages/Nexus.jsx';
import FeatureLanding from './pages/FeatureLanding.jsx';
import WorldMonitor from './pages/WorldMonitor.jsx';
import EnvironmentalIntelligence from './pages/EnvironmentalIntelligence.jsx';
import EnvironmentalWorkspace from './pages/EnvironmentalWorkspace.jsx';
import Analisis from './pages/Analisis.jsx';
import Edukasi from './pages/Edukasi.jsx';
import History from './pages/History.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Berita from './pages/Berita.jsx';
import AsistenAI from './pages/AsistenAI.jsx';
import Melapor from './pages/Melapor.jsx';
import BootScreen from './components/BootScreen.jsx';

const PAGES = {
  '#/': { Page: Nexus, title: 'inSpectre Nexus — Intelligence Platform' },
  '#/fitur/security': { Page: () => <FeatureLanding feature="security" />, title: 'Security Center — inSpectre Nexus' },
  '#/fitur/world-monitor': { Page: () => <FeatureLanding feature="world-monitor" />, title: 'World Monitor — inSpectre Nexus' },
  '#/fitur/analisis': { Page: () => <FeatureLanding feature="analisis" />, title: 'Analisis — inSpectre Nexus' },
  '#/fitur/edukasi': { Page: () => <FeatureLanding feature="edukasi" />, title: 'Edukasi — inSpectre Nexus' },
  '#/fitur/berita': { Page: () => <FeatureLanding feature="berita" />, title: 'Berita — inSpectre Nexus' },
  '#/fitur/asisten': { Page: () => <FeatureLanding feature="asisten" />, title: 'Asisten Keamanan — inSpectre Nexus' },
  '#/fitur/melapor': { Page: () => <FeatureLanding feature="melapor" />, title: 'Cara Melapor — inSpectre Nexus' },
  '#/security': { Page: Home, title: 'Security Center — inSpectre' },
  '#/world-monitor': { Page: WorldMonitor, title: 'World Monitor — inSpectre Nexus' },
  '#/environmental': { Page: EnvironmentalIntelligence, title: 'Environmental Intelligence — inSpectre Nexus' },
  '#/environment/hotspots': { Page: () => <EnvironmentalWorkspace feature="hotspots" />, title: 'Hotspot & Karhutla — inSpectre' },
  '#/environment/air-quality': { Page: () => <EnvironmentalWorkspace feature="air-quality" />, title: 'Kualitas Udara — inSpectre' },
  '#/environment/weather': { Page: () => <EnvironmentalWorkspace feature="weather" />, title: 'Cuaca — inSpectre' },
  '#/environment/warnings': { Page: () => <EnvironmentalWorkspace feature="warnings" />, title: 'Peringatan BMKG — inSpectre' },
  '#/environment/earthquakes': { Page: () => <EnvironmentalWorkspace feature="earthquakes" />, title: 'Gempa Bumi — inSpectre' },
  '#/analisis': { Page: Analisis, title: 'Analisis Keamanan — inSpectre' },
  '#/tools': { Page: Analisis, title: 'Analisis Keamanan — inSpectre' },
  '#/edukasi': { Page: Edukasi, title: 'Edukasi Phishing — inSpectre' },
  '#/berita': { Page: Berita, title: 'Threat Intelligence — inSpectre' },
  '#/asisten': { Page: AsistenAI, title: 'Asisten Keamanan — inSpectre' },
  '#/melapor': { Page: Melapor, title: 'Tata Cara Melapor — inSpectre' },
  '#/history': { Page: History, title: 'Riwayat Scan — inSpectre' },
  '#/dashboard': { Page: Dashboard, title: 'Dashboard Real-time — inSpectre' },
};

const currentRoute = () => (window.location.hash || '#/').split('?')[0];

export default function App() {
  const [route, setRoute] = useState(currentRoute);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setBooting(false), reduceMotion ? 1800 : 3300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const { Page, title } = PAGES[route] || PAGES['#/'];

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = title;
  }, [route, title]);

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text app-root">
      <a
        href="#main-content"
        className="skip-link"
      >Lewati ke konten utama</a>
      {booting && <BootScreen />}
      <Navbar />
      <div id="main-content" tabIndex={-1} key={route} className="page-transition">
        <Page />
      </div>
      <footer className="site-footer relative mt-10 overflow-hidden border-t border-white/10 bg-[#0b1220] px-5 py-10 text-center text-sm text-slate-300 sm:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7dd3fc]/60 to-transparent" />
        <div className="relative mx-auto max-w-4xl">
          <div className="flex justify-center"><Logo /></div>
          <p className="mt-4 font-semibold tracking-wide text-slate-100">Lebih waspada, lebih terlindungi.</p>
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-6 text-slate-400 sm:text-sm">
            inSpectre merupakan platform intelijen terpadu untuk membantu memahami ancaman digital,
            menganalisis potensi risiko, dan memantau informasi lingkungan yang relevan.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-6 text-slate-500">
            Hasil pemeriksaan adalah indikator awal berbasis heuristik, bukan jaminan keamanan
            atau pengganti verifikasi melalui kanal resmi.
          </p>
          <div className="mx-auto my-6 h-px max-w-xs bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          <div className="flex justify-center">
            <a href="https://www.instagram.com/avinnn_z?rpxt=aTBsazU4NWRtcGFu"
              target="_blank" rel="noopener noreferrer"
              aria-label="Instagram inSpectre"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-[#F5B96B]/50 hover:text-[#F5B96B]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.8" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            © {new Date().getFullYear()} Copyright by Muhammad Afiq Rovindo
          </p>
          <p className="mt-1 text-[11px] text-slate-600">inSpectre · Digital & Environmental Intelligence</p>
        </div>
      </footer>
    </div>
  );
}
