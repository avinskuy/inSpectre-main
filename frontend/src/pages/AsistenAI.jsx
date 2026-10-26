import { useMemo, useState } from 'react';

const KNOWLEDGE = [
  { title: 'Tautan meminta OTP atau kata sandi', keys: ['otp', 'kata sandi', 'password', 'login', 'verifikasi', 'akun diblokir'], answer: 'Jangan masukkan OTP, PIN, atau kata sandi melalui tautan dari pesan. Buka aplikasi atau situs resmi dengan mengetik alamatnya sendiri. Bank dan layanan tepercaya tidak seharusnya meminta OTP melalui percakapan.' },
  { title: 'Pesan hadiah atau paket', keys: ['hadiah', 'menang', 'paket', 'bea cukai', 'kurir', 'pajak'], answer: 'Waspadai pesan yang meminta biaya kecil, data kartu, atau login untuk mencairkan hadiah atau melacak paket. Periksa status hanya melalui aplikasi atau situs resmi penyedia layanan.' },
  { title: 'Aplikasi APK dari luar toko resmi', keys: ['apk', 'aplikasi', 'install', 'instal', 'android'], answer: 'Jangan instal APK dari chat atau situs yang tidak dikenal. Periksa nama pengembang, sumber unduhan, izin aplikasi, dan tanda tangan bila tersedia. Pemindaian statis inSpectre hanya indikator awal dan tidak menjamin aplikasi bebas malware.' },
  { title: 'QR code yang tidak dikenal', keys: ['qr', 'kode qr', 'barcode'], answer: 'Jangan langsung membuka URL dari QR. Dekode dulu, periksa nama domain dengan teliti, dan hindari memasukkan kredensial atau data pembayaran pada halaman yang tidak terverifikasi.' },
  { title: 'Melaporkan penipuan', keys: ['lapor', 'melapor', 'laporan', 'rekening', 'polisi', 'ojk'], answer: 'Simpan bukti seperti tangkapan layar, URL, nomor telepon, waktu kejadian, dan bukti transaksi. Jangan sebarkan data pribadi korban. Buka menu “Tata Cara Melapor” di inSpectre untuk memilih kanal resmi sesuai jenis kasus.' },
];

function makeAnswer(input) {
  const text = input.toLowerCase();
  const match = KNOWLEDGE.find((item) => item.keys.some((key) => text.includes(key)));
  if (match) return { title: match.title, body: match.answer };
  return { title: 'Langkah aman secara umum', body: 'Jangan terburu-buru mengklik tautan, menginstal file, atau mengirim uang. Verifikasi melalui kanal resmi yang kamu buka sendiri, jangan bagikan OTP/PIN/kata sandi, dan gunakan menu Analisis inSpectre untuk memeriksa URL, nomor telepon, file APK/ZIP, atau QR code. Jika sudah terlanjur bertransaksi, segera hubungi bank atau penyedia pembayaran dan laporkan ke kanal resmi.' };
}

export default function AsistenAI() {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const suggestions = ['Saya menerima link yang meminta OTP', 'Apakah aman menginstal APK dari WhatsApp?', 'Bagaimana melaporkan penipuan transfer?'];
  const responseCount = useMemo(() => history.filter((item) => item.role === 'assistant').length, [history]);
  const send = async (value = question) => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setQuestion('');
    setError('');
    setHistory((items) => [...items, { role: 'user', text: trimmed }]);
    setLoading(true);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Asisten AI gagal menjawab. Coba lagi.');
      }
      if (typeof data.answer !== 'string' || !data.answer.trim()) {
        throw new Error('Jawaban AI kosong. Coba pertanyaan lain.');
      }
      setHistory((items) => [...items, {
        role: 'assistant',
        title: 'inSpectre Agent',
        body: data.answer
      }]);
    } catch (err) {
      setError(err.message || 'Tidak dapat menghubungi Asisten AI.');
    } finally {
      setLoading(false);
    }
  };
  return <main className="page-shell mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
    <section className="hero-panel mb-7" aria-labelledby="assistant-title"><div className="hero-grid" aria-hidden="true"/><div className="hero-copy"><div className="eyebrow"><span className="status-dot"/> PENDAMPING KEAMANAN DIGITAL</div><h1 id="assistant-title">Tanya dulu. <span>Jangan sampai tertipu.</span></h1><p>Asisten panduan untuk mengenali modus penipuan, memahami hasil pemindaian, dan menentukan langkah aman berikutnya.</p><div className="hero-trust"><span>✓</span> Panduan praktis <span className="trust-divider">·</span><span>✓</span> Tidak meminta data rahasia</div></div><div className="hero-visual" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="shield-illustration"><div className="shield-glow"/><svg viewBox="0 0 120 140"><path d="M60 7 103 24v36c0 31-17 54-43 70C34 114 17 91 17 60V24L60 7Z" fill="currentColor" opacity=".13"/><path d="M60 14 96 28v32c0 27-14 46-36 60C38 106 24 87 24 60V28L60 14Z" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="M60 42v25m0 12v1" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/></svg></div><div className="visual-caption">ASK <span>·</span> VERIFY <span>·</span> PROTECT</div></div></section>
    {showDisclaimer && <aside className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><p><strong>Transparansi:</strong> inSpectre Agent membantu inspeksi dan panduan keamanan digital. Jangan masukkan OTP, PIN, kata sandi, atau data pribadi.</p><button type="button" className="font-bold" aria-label="Tutup informasi" onClick={() => setShowDisclaimer(false)}>×</button></aside>}
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="rounded-2xl border border-cyber-border bg-cyber-panel p-4 sm:p-6"><div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Asisten inSpectre</h2><p className="mt-1 text-xs text-cyber-muted">{responseCount} jawaban · panduan keamanan digital</p></div><span className="rounded-full border border-cyber-border px-2.5 py-1 text-xs">● Siap membantu</span></div>
      <div className="min-h-56 space-y-3" aria-live="polite">{history.length === 0 ? <div className="rounded-xl border border-dashed border-cyber-border p-5 text-sm text-cyber-muted"><p className="font-semibold text-cyber-text">Halo! Apa yang membuatmu khawatir?</p><p className="mt-2">Ceritakan situasinya tanpa menyertakan data pribadi. Aku akan memberi langkah awal yang aman.</p></div> : history.map((item, index) => item.role === 'user' ? <div key={index} className="ml-8 rounded-2xl rounded-br-sm bg-cyber-accent/10 p-3 text-sm"><p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-cyber-accent">Kamu</p>{item.text}</div> : <div key={index} className="mr-4 rounded-2xl rounded-bl-sm border border-cyber-border p-4 text-sm"><p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-cyber-accent">Panduan · {item.title}</p><p className="leading-6 text-cyber-muted">{item.body}</p><a href="#/melapor" className="mt-3 inline-flex font-semibold text-cyber-accent hover:underline">Buka tata cara melapor →</a></div>)}</div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-red-500/30 p-3 text-sm text-red-500">{error}</p>}
      {loading && <p role="status" className="mt-3 text-sm text-cyber-muted">inSpectre Agent sedang menyiapkan jawaban…</p>}
      <form className="mt-5 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); send(); }}><label htmlFor="assistant-question" className="sr-only">Tulis pertanyaan</label><input id="assistant-question" disabled={loading} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Contoh: Saya mendapat link mencurigakan…" className="min-h-12 min-w-0 flex-1 rounded-xl border border-cyber-border bg-cyber-bg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyber-accent"/><button className="min-h-12 rounded-xl bg-cyber-accent px-5 py-3 text-sm font-bold text-white transition hover:brightness-110" type="submit" disabled={loading}>{loading ? "Memproses…" : "Tanya"}</button></form>
      <div className="mt-4 flex flex-wrap gap-2">{suggestions.map((item) => <button key={item} type="button" onClick={() => send(item)} className="rounded-full border border-cyber-border px-3 py-2 text-left text-xs transition hover:border-cyber-accent hover:bg-cyber-accent/5">{item}</button>)}</div></div>
      <aside className="space-y-4"><div className="rounded-2xl border border-cyber-border bg-cyber-panel p-5"><h3 className="font-bold">Bisa membantu dengan</h3><ul className="mt-3 space-y-3 text-sm text-cyber-muted"><li>• Mengenali ciri phishing dan social engineering</li><li>• Langkah aman untuk APK dan QR</li><li>• Memahami tindakan setelah terkena scam</li><li>• Menentukan kanal pelaporan yang tepat</li></ul></div><div className="rounded-2xl border border-cyber-border p-5"><h3 className="font-bold">Butuh pemeriksaan teknis?</h3><p className="mt-2 text-sm leading-6 text-cyber-muted">Jalankan pemeriksaan URL, nomor, APK/ZIP, atau QR melalui halaman Analisis.</p><a href="#/analisis" className="mt-3 inline-flex font-semibold text-cyber-accent hover:underline">Buka Analisis →</a></div></aside>
    </section>
  </main>;
}
