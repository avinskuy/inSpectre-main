import { useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import FindingCard from '../components/FindingCard.jsx';
import ExplainabilityPanel from '../components/ExplainabilityPanel.jsx';
import ScanStepper from '../components/ScanStepper.jsx';
import { scanUrl, checkNumber } from '../lib/api.js';
import Tools from './Tools.jsx';

const LEVEL_MAP = {
  AMAN: 'aman',
  BELUM_DIKETAHUI: 'belum-diketahui',
  WASPADA: 'curiga',
  CURIGA: 'curiga',
  PHISHING: 'berbahaya',
  BAHAYA: 'berbahaya',
};

const RISK_MAP = {
  TINGGI: 'tinggi',
  SEDANG: 'sedang',
  RENDAH: 'rendah',
};

const RULE_TITLE = {
  RISKY_TLD: 'Domain memakai TLD berisiko',
  BRAND_IMPERSONATION: 'Peniruan brand terdeteksi',
  PHISH_KEYWORD: 'Kata kunci phishing di URL',
  IP_HOST: 'Menggunakan alamat IP langsung',
  NO_HTTPS: 'Tidak memakai HTTPS',
  DEEP_SUBDOMAIN: 'Terlalu banyak subdomain',
  HOMOGLYPH: 'Karakter penyamaran di domain',
  URL_SHORTENER: 'Link dipendekkan',
  INVALID_URL: 'URL tidak valid',
};

const RULE_DETAIL = {
  RISKY_TLD: 'Akhiran domain ini masuk daftar TLD berisiko pada aturan inSpectre. TLD tersebut juga dapat digunakan untuk situs yang sah, jadi periksa bersama indikator lain.',
  BRAND_IMPERSONATION: 'Nama brand resmi muncul di domain yang tidak resmi — ciri khas situs penipuan.',
  PHISH_KEYWORD: 'Kata seperti "login", "verify", atau "otp" di URL sering dipakai memancing korban.',
  IP_HOST: 'Situs phishing sering memakai IP mentah karena murah dan cepat dibuat.',
  NO_HTTPS: 'Koneksi tanpa HTTPS tidak terenkripsi. Situs resmi yang meminta data hampir selalu memakai HTTPS.',
  DEEP_SUBDOMAIN: 'Subdomain berlebihan sering dipakai menyembunyikan domain asli yang berbahaya.',
  HOMOGLYPH: 'Huruf dari alfabet lain (mis. Cyrillic) bisa tampak identik dengan huruf latin pada domain palsu.',
  URL_SHORTENER: 'Link pendek menyembunyikan tujuan asli. Jangan buka sebelum tahu ke mana arahnya.',
  INVALID_URL: 'Alamat tidak bisa dibaca sebagai URL yang sah.',
};

function mapResult(data, kind = 'link') {
  const level = LEVEL_MAP[data.riskLevel] || 'curiga';
  
  const score = Math.max(0, Math.min(100, Number(data.threatScore) || 0));

  const findings = (data.findings || []).map((f) => ({
    rule: f.rule,
    severity: RISK_MAP[f.risk] || 'sedang',
    title: RULE_TITLE[f.rule] || f.rule,
    detail: f.whyItMatters || f.desc || RULE_DETAIL[f.rule] || 'Indikator terdeteksi; periksa bukti dan konteksnya.',
    points: f.points,
    evidence: f.evidence,
    recommendation: f.recommendation,
    category: f.category,
  }));

  if (findings.length === 0) {
    findings.push({
      severity: 'rendah',
      title: kind === 'number' ? 'Belum ada laporan komunitas' : 'Belum ditemukan indikator risiko yang dikenali',
      detail: kind === 'number' ? 'Belum ada laporan yang tercatat untuk nomor ini. Ini bukan bukti bahwa nomor tersebut aman.' : 'Pemeriksaan heuristik tidak menemukan pola yang dikenali. Ini bukan bukti bahwa situs aman; reputasi domain dan isi halaman belum tentu terverifikasi.',
    });
  }

  return { level, score, threatScore: Number(data.threatScore) || 0, findings, explanation: data.explanation || null, reputation: data.reputation || null };
}

const CTA = {
  aman: 'Belum ada indikator risiko yang dikenali oleh aturan aktif. Ini bukan jaminan aman atau verifikasi reputasi situs. Pastikan domain melalui kanal resmi sebelum login atau memasukkan data.',
  curiga: 'Jangan login atau isi data pribadi di situs ini sebelum memastikan keasliannya.',
  berbahaya: 'Sangat disarankan TIDAK membuka atau memasukkan data apa pun ke situs ini.',
};

export default function Analisis() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [checkedUrl, setCheckedUrl] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [scanType, setScanType] = useState('link');

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError(scanType === 'link' ? 'Masukkan URL situs terlebih dahulu.' : 'Masukkan nomor telepon yang ingin diperiksa.');
      setResult(null);
      return;
    }
    setError('');
    setCheckedUrl('');
    setLoading(true);
    setResult(null);

    try {
      if (scanType === 'number') {
        const data = await checkNumber(trimmed);
        const mapped = mapResult(data, 'number');
        setResult({ ...mapped, note: data.note, kind: 'number', externalReputation: data.externalReputation || null });
        setCheckedUrl(data.number || trimmed);
      } else {
        const data = await scanUrl(trimmed);
        setResult({ ...mapResult(data), kind: 'link' });
        setCheckedUrl(trimmed);
      }
    } catch (err) {
      setError(err.message || 'Gagal memeriksa situs. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell analysis-shell">
      <div className="mb-6 rounded-2xl border border-cyber-border bg-cyber-panel p-5 sm:p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-cyber-accent">Pemeriksaan keamanan</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Berhenti sejenak. Cek sebelum klik.</h1>
        <p className="mt-3 max-w-xl text-cyber-muted">
          {scanType === 'link' ? 'Tempelkan alamat tautan yang terasa janggal. inSpectre akan memeriksa pola URL yang umum ditemukan pada phishing.' : scanType === 'number' ? 'Masukkan nomor telepon Indonesia untuk melihat apakah sudah ada laporan komunitas terkait dugaan penipuan.' : 'Satu tempat untuk memeriksa tautan, nomor telepon, file APK/ZIP, dan QR code.'}
        </p>
        <p className="mt-3 text-sm text-cyber-muted">Tips privasi: jangan masukkan kata sandi, kode OTP, atau data pribadi ke kolom ini.</p>
      </div>

      <div className="scan-mode-switch" role="group" aria-label="Pilih jenis pemeriksaan"><button type="button" className={scanType === 'link' ? 'active' : ''} aria-pressed={scanType === 'link'} onClick={() => { setScanType('link'); setUrl(''); setResult(null); setError(''); }}>↗ Periksa tautan</button><button type="button" className={scanType === 'number' ? 'active' : ''} aria-pressed={scanType === 'number'} onClick={() => { setScanType('number'); setUrl(''); setResult(null); setError(''); }}>☎ Periksa nomor scam</button><button type="button" className={scanType === 'fileqr' ? 'active' : ''} aria-pressed={scanType === 'fileqr'} onClick={() => { setScanType('fileqr'); setUrl(''); setResult(null); setError(''); }}>▣ File &amp; QR</button></div>
      {scanType === 'fileqr' ? <div className="mt-6"><Tools embedded /></div> : <>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
        <div className="min-w-0 flex-1">
          <label htmlFor="url-input" className="mb-2 block text-sm font-semibold">
            {scanType === 'link' ? 'Alamat situs / tautan' : 'Nomor telepon Indonesia'}
          </label>
          <input
            id="url-input"
            type={scanType === 'link' ? 'url' : 'tel'}
            inputMode={scanType === 'link' ? 'url' : 'tel'}
            placeholder={scanType === 'link' ? 'contoh: https://contoh-situs.com' : 'contoh: 081234567890 atau +6281234567890'}
            value={url}
            onChange={(e) => { setUrl(e.target.value); if (error) setError(''); }}
            aria-invalid={!!error}
            aria-describedby={error ? 'url-error' : undefined}
            autoComplete={scanType === 'link' ? 'url' : 'tel'}
            spellCheck="false"
            className="min-h-12 w-full rounded-lg border border-cyber-border bg-cyber-panel px-4 py-3 text-base text-cyber-text focus:outline-none focus:ring-2 focus:ring-cyber-accent"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Memeriksa…' : 'Periksa'}
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <button type="button" className="font-semibold text-cyber-accent underline-offset-4 hover:underline" onClick={() => { setUrl(''); setResult(null); setCheckedUrl(''); setError(''); }}>Bersihkan kolom</button>
        <button type="button" className="font-semibold text-cyber-accent underline-offset-4 hover:underline" onClick={() => setShowExamples((v) => !v)} aria-expanded={showExamples}>Coba contoh URL uji {showExamples ? '−' : '+'}</button>
      </div>
      {showExamples && scanType === 'link' && <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {[{ label: 'Contoh domain resmi', url: 'https://www.google.com' }, { label: 'Contoh pola mencurigakan', url: 'http://bca-login-verifikasi.xyz/otp' }].map((sample) => <button key={sample.label} type="button" onClick={() => { setUrl(sample.url); setResult(null); setError(''); }} className="rounded-xl border border-cyber-border bg-cyber-panel p-3 text-left transition hover:border-cyber-accent"><span className="block text-xs font-semibold">{sample.label}</span><code className="mt-1 block break-all text-[11px] text-cyber-muted">{sample.url}</code></button>)}
        <p className="sm:col-span-2 text-xs text-cyber-muted">Contoh sintetis untuk demonstrasi aturan, bukan daftar reputasi real-time. Klik contoh hanya mengisi kolom; kamu tetap mengirim pemeriksaan sendiri.</p>
      </div>}

      {error && (
        <p id="url-error" role="alert" className="mt-2 text-sm text-cyber-danger">
          {error}
        </p>
      )}

      <div aria-live="polite" className="mt-6">
        {loading && (
          <Card>
            <ScanStepper />
          </Card>
        )}

        {result && !loading && (
          <Card title="Hasil Analisis">
            <p className="mb-4 break-all rounded-lg bg-cyber-panel px-3 py-2 text-sm" aria-label="Alamat yang diperiksa">{checkedUrl}</p>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <ScoreRing score={result.score} />
              <div>
                <RiskBadge level={result.level} />
                <div>
                <p className="text-xs text-cyber-muted">{result.kind === 'number' ? 'Skor keamanan indikatif (bukan probabilitas)' : 'Skor indikator risiko terdeteksi (0–100; bukan probabilitas)'}</p>
                <p className="mt-2 text-sm font-medium">{result.note || (result.explanation?.assessment === 'INPUT_TIDAK_VALID' ? 'Alamat tidak dapat dianalisis. Perbaiki format URL sebelum melanjutkan.' : CTA[result.level])}</p>
              </div>
              </div>
            </div>

            {result.kind === 'number' && <>
              <p className="mt-3 rounded-lg border border-cyber-border bg-cyber-panel p-3 text-sm">Laporan komunitas dan reputasi eksternal adalah sumber yang berbeda. Tidak adanya laporan atau sinyal risiko bukan bukti nomor ini aman.</p>
              <section className="mt-3 rounded-lg border border-cyber-border bg-cyber-panel p-4" aria-label="Reputasi eksternal">
                <h3 className="text-sm font-semibold">Reputasi eksternal</h3>
                <p className="mt-1 text-xs text-cyber-muted">Sumber: WhoTag.me / Getcontact</p>
                {!result.externalReputation || result.externalReputation.status === 'UNAVAILABLE' ? (
                  <p className="mt-2 text-sm">Data eksternal tidak tersedia saat ini. Status komunitas di atas tetap ditampilkan terpisah.</p>
                ) : result.externalReputation.status === 'NO_DATA' ? (
                  <p className="mt-2 text-sm">Provider tidak memberikan bukti reputasi yang dapat ditampilkan. Ini bukan bukti aman.</p>
                ) : (
                  <>
                    <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div><dt className="text-cyber-muted">Jumlah tag</dt><dd>{result.externalReputation.tagCount ?? 'Tidak tersedia'}</dd></div>
                      <div><dt className="text-cyber-muted">Jumlah komentar</dt><dd>{result.externalReputation.commentCount ?? 'Tidak tersedia'}</dd></div>
                      <div><dt className="text-cyber-muted">Badge provider</dt><dd>{result.externalReputation.badge ?? 'Tidak tersedia'}</dd></div>
                      <div><dt className="text-cyber-muted">Sinyal trust</dt><dd>{result.externalReputation.trustLevel ?? 'Tidak tersedia'}</dd></div>
                      <div><dt className="text-cyber-muted">Sinyal spam</dt><dd>{result.externalReputation.spamDegree ?? 'Tidak tersedia'}</dd></div>
                    </dl>
                    <p className="mt-3 text-xs text-cyber-muted">{result.externalReputation.caveat || 'Sinyal provider bukan bukti pasti penipuan atau keamanan.'}</p>
                  </>
                )}
              </section>
            </>}
            <h3 className="mt-4 text-sm font-semibold text-cyber-muted">Temuan:</h3>
            <div className="mt-2 space-y-2">
              {result.findings.map((f) => (
                <FindingCard
                  key={f.rule || f.title}
                  severity={f.severity}
                  title={f.title}
                  detail={f.detail}
                  points={f.points}
                  evidence={f.evidence}
                  recommendation={f.recommendation}
                  category={f.category}
                />
              ))}
            </div>
            {result.kind === 'link' && <ExplainabilityPanel explanation={result.explanation} threatScore={result.threatScore} findings={result.findings} reputation={result.reputation} />}
          </Card>
        )}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-cyber-muted">Catatan: hasil “aman” bukan jaminan situs atau nomor bebas penipuan. Deteksi tautan menggunakan heuristik. Pemeriksaan nomor menggabungkan laporan komunitas dan sinyal eksternal jika tersedia. Jika ragu, verifikasi lewat kanal resmi.</p>

      <Card title="💡 Tips" className="mt-8">
        <ul className="list-disc space-y-1 pl-5 text-sm text-cyber-muted">
          <li>Periksa ejaan domain: <code>bankmand1ri.com</code> ≠ <code>bankmandiri.com</code></li>
          <li>Waspadai domain yang memakai alamat IP langsung</li>
          <li>Subdomain berlebihan sering jadi tanda phishing</li>
        </ul>
      </Card>
      </>}
    </main>
  );
}
