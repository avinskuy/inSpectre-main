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
import FloatingAssistant from './components/FloatingAssistant.jsx';

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
  // Alias kompatibilitas untuk tautan lama; File & QR sekarang berada di dalam Analisis.
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
    // Keep the splash visible long enough for the brand and loading message to be read.
    const timer = window.setTimeout(() => setBooting(false), reduceMotion ? 1800 : 3300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const { Page, title } = PAGES[route] || PAGES['#/'];

  // Pindah halaman: kembali ke atas + judul tab sesuai halaman
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
      <FloatingAssistant route={route} />
      <footer className="site-footer border-t border-cyber-border px-4 py-8 text-center text-sm text-cyber-muted">
        <p className="font-semibold">inSpectre — Lebih waspada, lebih terlindungi.</p>
        <p className="mx-auto mt-2 max-w-2xl">Hasil pemeriksaan adalah indikator awal berbasis heuristik, bukan jaminan keamanan atau pengganti verifikasi melalui kanal resmi.</p>
        <p className="mt-3">© {new Date().getFullYear()} inSpectre · Edukasi keamanan digital</p>
      </footer>
    </div>
  );
}
