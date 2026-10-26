import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet } from '../lib/api.js';

const CATEGORIES = ['Semua', 'Phishing', 'Penipuan Digital', 'Scam Keuangan', 'Keamanan Siber', 'Phishing & Penipuan'];
const relativeTime = (value) => {
  if (!value) return 'Waktu publikasi tidak tersedia';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Waktu publikasi tidak tersedia';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Berita() {
  const [data, setData] = useState({ articles: [], updatedAt: null, error: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('Semua');
  const [search, setSearch] = useState('');

  const loadNews = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await apiGet(`/news${force ? '?refresh=1' : ''}`);
      setData(result);
    } catch (error) {
      setData((prev) => ({ ...prev, error: error.message || 'Berita gagal dimuat.' }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
    const timer = window.setInterval(() => loadNews(), 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [loadNews]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data.articles || []).filter((article) => {
      const matchesCategory = category === 'Semua' || article.category === category || (category === 'Phishing & Penipuan' && ['Phishing', 'Penipuan Digital'].includes(article.category));
      const matchesSearch = !q || `${article.title} ${article.description} ${article.source} ${article.category}`.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [data.articles, category, search]);

  return (
    <main className="page-shell mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
            THREAT INTELLIGENCE
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Berita & Ancaman Siber</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">Kenali modus penipuan, phishing, scam keuangan, dan insiden keamanan digital melalui berita dari sumber eksternal.</p>
        </div>
        <button onClick={() => loadNews(true)} disabled={refreshing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyber-border px-4 py-2 text-sm font-semibold transition hover:border-emerald-500 hover:bg-emerald-500/5 disabled:cursor-wait disabled:opacity-60" aria-label="Muat ulang berita">
          <span className={refreshing ? 'animate-spin' : ''} aria-hidden="true">↻</span>{refreshing ? 'Memperbarui…' : 'Perbarui berita'}
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-cyber-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-gray-500">Artikel tersedia</p><p className="mt-1 text-2xl font-bold">{data.articles?.length || 0}</p></div>
        <div className="rounded-2xl border border-cyber-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-gray-500">Pembaruan terakhir</p><p className="mt-1 text-sm font-semibold">{data.updatedAt ? new Date(data.updatedAt).toLocaleString('id-ID') : 'Belum tersedia'}</p></div>
        <div className="rounded-2xl border border-cyber-border bg-white p-4 dark:bg-gray-900"><p className="text-xs text-gray-500">Status layanan</p><p className="mt-1 flex items-center gap-2 text-sm font-semibold"><span className={`h-2 w-2 rounded-full ${data.articles?.length ? 'bg-emerald-500' : 'bg-amber-500'}`} />{data.articles?.length ? 'Feed tersedia' : 'Menunggu koneksi sumber'}</p></div>
      </div>

      {data.error && <div role="status" className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">{data.error}</div>}

      <section className="mt-7" aria-label="Cari dan filter berita">
        <label htmlFor="news-search" className="mb-2 block text-sm font-semibold">Cari berita</label>
        <input id="news-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Contoh: phishing, investasi ilegal, kebocoran data…" className="w-full rounded-xl border border-cyber-border bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:bg-gray-900" />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Kategori berita">
          {CATEGORIES.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition ${category === item ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-cyber-border hover:border-emerald-500'}`} aria-pressed={category === item}>{item}</button>)}
        </div>
      </section>

      <section className="mt-5" aria-label="Daftar berita terkini">
        {loading ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((n) => <div key={n} className="h-56 animate-pulse rounded-2xl border border-cyber-border bg-gray-100 dark:bg-gray-900" />)}</div> : filtered.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article, index) => <article key={article.id || article.link} className="group flex flex-col rounded-2xl border border-cyber-border bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg dark:bg-gray-900" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
            <div className="flex items-center justify-between gap-2"><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{article.category || 'Keamanan Digital'}</span><span className="text-right text-xs text-gray-500">{relativeTime(article.publishedAt)}</span></div>
            <h2 className="mt-4 text-lg font-bold leading-snug transition group-hover:text-emerald-700 dark:group-hover:text-emerald-300">{article.title}</h2>
            {article.description && <p className="mt-3 line-clamp-4 text-sm leading-6 text-gray-600 dark:text-gray-400">{article.description}</p>}
            <div className="mt-auto pt-5"><div className="mb-3 flex items-center gap-2 text-xs text-gray-500"><span aria-hidden="true">◉</span><span className="truncate">{article.source}</span></div><a href={article.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:underline dark:text-emerald-300">Baca sumber asli <span aria-hidden="true">↗</span></a></div>
          </article>)}
        </div> : <div className="rounded-2xl border border-dashed border-cyber-border px-5 py-12 text-center"><p className="text-lg font-semibold">{data.articles?.length ? 'Tidak ada berita yang cocok' : 'Berita belum dapat dimuat'}</p><p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">{data.articles?.length ? 'Coba kata kunci atau kategori lain.' : 'Pastikan backend berjalan dan memiliki akses internet, lalu coba perbarui berita.'}</p><button onClick={() => loadNews(true)} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Coba lagi</button></div>}
      </section>

      <aside className="mt-8 rounded-2xl border border-cyber-border bg-gray-50 p-4 text-xs leading-5 text-gray-600 dark:bg-gray-900/70 dark:text-gray-400"><strong className="text-gray-800 dark:text-gray-200">Catatan verifikasi:</strong> Berita dikumpulkan dari feed RSS Google News dan mengarah ke penerbit aslinya. Judul berita bukan bukti bahwa suatu tautan berbahaya. Periksa URL secara terpisah menggunakan fitur Analisis inSpectre dan verifikasi informasi melalui kanal resmi.</aside>
      <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 p-5 sm:flex-row sm:items-center"><div><h2 className="font-bold">Menemukan tautan yang mencurigakan?</h2><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Jangan langsung dibuka. Periksa indikator risikonya terlebih dahulu.</p></div><a href="#/analisis" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700">Periksa tautan →</a></div>
    </main>
  );
}
