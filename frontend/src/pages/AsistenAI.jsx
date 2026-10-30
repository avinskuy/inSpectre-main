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
  return (
    <main className="agent-chat page-shell mx-auto">
      <header className="agent-header">
        <div className="agent-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3 20 7v5c0 5-3.4 8-8 9-4.6-1-8-4-8-9V7l8-4Z" stroke="currentColor" strokeWidth="1.6"/>
            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="agent-heading">
          <h1 id="assistant-title">inSpectre Agent</h1>
          <p><span className="agent-online-dot" /> Pendamping keamanan digital</p>
        </div>
        <span className="agent-response-count">{responseCount} jawaban</span>
      </header>

      {showDisclaimer && (
        <aside className="agent-disclaimer">
          <span aria-hidden="true">ⓘ</span>
          <p><strong>Jaga data pribadi.</strong> Jangan kirim OTP, PIN, kata sandi, atau informasi rahasia dalam percakapan.</p>
          <button type="button" aria-label="Tutup informasi" onClick={() => setShowDisclaimer(false)}>×</button>
        </aside>
      )}

      <section className="agent-conversation" aria-label="Percakapan dengan inSpectre Agent">
        <div className="agent-messages" aria-live="polite">
          {history.length === 0 ? (
            <div className="agent-welcome">
              <div className="agent-welcome-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-5 4v-4.2a2.5 2.5 0 0 1-2-2.3v-8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M8 8h8M8 11.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="agent-welcome-eyebrow">INSPЕCTRE INTELLIGENCE</p>
              <h2>Ada yang ingin kamu pastikan?</h2>
              <p>Ceritakan situasinya. Gue bantu memahami risikonya dan menentukan langkah aman berikutnya.</p>
              <div className="agent-suggestions">
                {suggestions.map((item) => (
                  <button key={item} type="button" onClick={() => send(item)} disabled={loading}>
                    {item}<span aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            history.map((item, index) => item.role === 'user' ? (
              <div key={index} className="agent-message-row user">
                <div className="agent-message user">
                  <span className="agent-message-label">KAMU</span>
                  <p>{item.text}</p>
                </div>
              </div>
            ) : (
              <div key={index} className="agent-message-row assistant">
                <div className="agent-small-avatar" aria-hidden="true">i</div>
                <div className="agent-message assistant">
                  <span className="agent-message-label">INSPЕCTRE AGENT</span>
                  <p>{item.body}</p>
                  <a href="#/melapor">Tata cara melapor <span aria-hidden="true">↗</span></a>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="agent-message-row assistant" role="status">
              <div className="agent-small-avatar" aria-hidden="true">i</div>
              <div className="agent-typing">
                <span /><span /><span />
                <small>Agent sedang menyusun jawaban...</small>
              </div>
            </div>
          )}
        </div>

        {error && <p role="alert" className="agent-error">{error}</p>}

        <form className="agent-composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <label htmlFor="assistant-question" className="sr-only">Tulis pertanyaan</label>
          <textarea
            id="assistant-question"
            rows="1"
            disabled={loading}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Tanyakan sesuatu tentang keamanan digital..."
          />
          <button type="submit" disabled={loading || !question.trim()} aria-label="Kirim pesan">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12 19 5l-4 14-3-6-7-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="m12 13 7-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </form>
        <p className="agent-composer-note">inSpectre Agent dapat membantu pemeriksaan awal. Verifikasi informasi penting melalui sumber resmi.</p>
      </section>
    </main>
  );
}
