import { useState } from 'react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';

const CIRI_PHISHING = [
  {
    icon: '🌐',
    title: 'Domain mirip tapi salah eja',
    desc: 'Phisher suka pakai domain seperti "bankmand1ri.com" atau "paypa1.com" (angka menggantikan huruf). Periksa ejaan domain dengan teliti di address bar.',
  },
  {
    icon: '🔒',
    title: 'Tidak ada HTTPS',
    desc: 'Situs tanpa gembok 🔒 / https:// di address bar tidak mengenkripsi data kamu. Waspadai juga: phisher modern bisa pakai HTTPS — jadi HTTPS saja belum cukup jaminan.',
  },
  {
    icon: '⏰',
    title: 'Tekanan mendesak (urgency)',
    desc: 'Pesan seperti "Akun Anda akan diblokir dalam 24 jam!" sengaja dibuat panik supaya kamu klik tanpa berpikir. Situs resmi tidak perlu mendesak seperti itu.',
  },
  {
    icon: '📎',
    title: 'Link atau lampiran mencurigakan',
    desc: 'Arahkan kursor (hover) ke link sebelum klik — lihat URL aslinya. Jangan buka lampiran dari pengirim yang tidak dikenal.',
  },
  {
    icon: '💰',
    title: 'Meminta data sensitif',
    desc: 'Bank, kampus, dan layanan resmi TIDAK pernah meminta password, PIN, atau OTP via email/SMS/link. Apapun bentuknya, itu red flag besar.',
  },
  {
    icon: '✍️',
    title: 'Bahasa berantakan',
    desc: 'Typo banyak, tata bahasa aneh, atau sapaan generik seperti "Pelanggan Yth." tanpa namamu — tanda pesan massal dari penipu.',
  },
];

const QUIZ = [
  { q: 'Kamu menerima link hadiah yang meminta kode OTP. Apa tindakan paling aman?', options: ['Masukkan OTP agar hadiah diproses', 'Jangan masukkan OTP dan verifikasi lewat kanal resmi', 'Teruskan ke teman untuk memastikan'], correct: 1, explain: 'OTP bersifat rahasia. Jangan berikan kepada siapa pun atau masukkan pada tautan yang tidak kamu verifikasi.' },
  { q: 'Apakah HTTPS otomatis berarti sebuah situs tepercaya?', options: ['Ya, HTTPS selalu berarti resmi', 'Tidak, situs palsu juga bisa memakai HTTPS', 'Hanya jika tampilannya profesional'], correct: 1, explain: 'HTTPS mengenkripsi koneksi, tetapi tidak membuktikan siapa pemilik situs.' },
  { q: 'Apa yang sebaiknya dilakukan saat menerima link dari pengirim tak dikenal?', options: ['Buka dulu lalu lihat isinya', 'Cek domain dan akses layanan lewat aplikasi/alamat resmi', 'Unduh semua lampiran untuk diperiksa'], correct: 1, explain: 'Jangan membuka tautan yang belum diverifikasi. Periksa domain dan gunakan kanal resmi secara mandiri.' },
];
const CHECKLIST = [
  'Saya memeriksa ejaan domain sebelum memasukkan data',
  'Saya tidak pernah membagikan PIN, kata sandi, atau OTP',
  'Saya memverifikasi pesan mendesak melalui kanal resmi',
  'Saya tidak menganggap HTTPS sebagai jaminan situs aman',
  'Saya berhenti dan bertanya ketika ada sesuatu yang terasa janggal',
];

export default function Edukasi() {
  const [checked, setChecked] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showScore, setShowScore] = useState(false);
  const score = QUIZ.filter((item, i) => answers[i] === item.correct).length;
  return (
    <main className="page-shell edu-shell">
      <h1 className="text-3xl font-bold">Edukasi Phishing</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Kenali taktik penipuan sebelum jadi korban. Berikut ciri-ciri paling
        umum yang perlu kamu waspadai.
      </p>

      {/* Ciri-ciri phishing */}
      <section className="mt-8" aria-labelledby="ciri-title">
        <h2 id="ciri-title" className="text-xl font-semibold mb-4">
          6 Ciri Umum Situs & Pesan Phishing
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CIRI_PHISHING.map((c) => (
            <Card key={c.title}>
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="text-2xl">{c.icon}</span>
                <div>
                  <h3 className="font-semibold">{c.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {c.desc}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Contoh kasus */}
      <section className="mt-10" aria-labelledby="contoh-title">
        <h2 id="contoh-title" className="text-xl font-semibold mb-4">
          Contoh Kasus Nyata
        </h2>
        <Card title="📦 Kasus: Penipuan paket tertahan">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Korban menerima SMS: <em>"Paket Anda tertahan di gudang. Bayar
            biaya bea Rp 25.000 di [link pendek]".</em> Link tersebut membuka
            situs tiruan yang meminta data kartu. Domain aslinya
            sebenarnya bukan milik jasa kurir mana pun — ciri khas: domain
            pendek acak, permintaan pembayaran kecil mendesak, dan halaman
            meminta data kartu lengkap untuk nominal sepele.
          </p>
        </Card>
      </section>

      {/* Checklist */}
      <section className="mt-10" aria-labelledby="checklist-title">
        <h2 id="checklist-title" className="text-xl font-semibold mb-4">
          ✅ Checklist Sebelum Klik
        </h2>
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm text-gray-600 dark:text-gray-400">Tandai kebiasaan yang sudah kamu lakukan.</p><span className="whitespace-nowrap text-xs font-bold text-cyber-accent">{checked.length}/{CHECKLIST.length}</span></div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${checked.length / CHECKLIST.length * 100}%` }} /></div>
          <ul className="space-y-3">
            {CHECKLIST.map((item, i) => (
              <li key={item}><label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 text-sm transition hover:bg-gray-100 dark:hover:bg-gray-800"><input type="checkbox" checked={checked.includes(i)} onChange={(e) => setChecked((prev) => e.target.checked ? [...prev, i] : prev.filter((n) => n !== i))} className="mt-0.5 h-4 w-4 accent-emerald-600" /><span>{item}</span></label></li>
            ))}
          </ul>
          {checked.length === CHECKLIST.length && <p role="status" className="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">Bagus! Kamu sudah meninjau semua kebiasaan keamanan dasar.</p>}
        </Card>
      </section>

      <section className="mt-10" aria-labelledby="quiz-title">
        <h2 id="quiz-title" className="mb-2 text-xl font-semibold">Uji pemahaman singkat</h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Tiga pertanyaan untuk membantu mengingat prinsip dasar keamanan digital.</p>
        <Card>
          <div className="space-y-6">{QUIZ.map((item, i) => <fieldset key={item.q} className="border-b border-cyber-border pb-5 last:border-0 last:pb-0"><legend className="font-semibold">{i + 1}. {item.q}</legend><div className="mt-3 space-y-2">{item.options.map((option, j) => <label key={option} className="flex cursor-pointer items-start gap-3 rounded-lg border border-cyber-border p-3 text-sm transition hover:border-cyber-accent"><input type="radio" name={`quiz-${i}`} value={j} checked={answers[i] === j} onChange={() => { setAnswers((prev) => ({ ...prev, [i]: j })); setShowScore(false); }} className="mt-0.5 accent-emerald-600" /><span>{option}</span></label>)}</div>{showScore && <p className={`mt-3 text-xs leading-relaxed ${answers[i] === item.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-300'}`}><b>{answers[i] === item.correct ? 'Tepat.' : 'Ingat kembali.'}</b> {item.explain}</p>}</fieldset>)}</div>
          <div className="mt-5 flex flex-wrap items-center gap-3"><Button onClick={() => setShowScore(true)} disabled={Object.keys(answers).length !== QUIZ.length}>Periksa jawaban</Button><Button variant="outline" onClick={() => { setAnswers({}); setShowScore(false); }}>Ulangi kuis</Button>{showScore && <span role="status" className="text-sm font-bold">Skor kamu: {score}/{QUIZ.length}</span>}</div>
        </Card>
      </section>

      {/* CTA ke Analisis */}
      <section className="mt-10 text-center" aria-labelledby="cta-title">
        <h2 id="cta-title" className="text-xl font-semibold">
          Sudah menemukan situs mencurigakan?
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Periksa dulu di inSpectre sebelum membukanya.
        </p>
        <Button
          size="lg"
          className="mt-4"
          onClick={() => (window.location.hash = '#/analisis')}
        >
          Cek Situs Sekarang
        </Button>
      </section>
    </main>
  );
}
