import './FeatureLanding.css';

const FEATURES = {
security: {
index: '01', category: 'DIGITAL SECURITY', title: 'Know what you are dealing with.',
subtitle: 'Security Center', description: 'Periksa indikator risiko digital sebelum mengambil tindakan. Gunakan hasil sebagai sinyal awal, bukan sebagai jaminan keamanan.',
capabilities: ['Pemeriksaan URL dan indikator phishing', 'Analisis nomor dan reputasi', 'Ringkasan hasil untuk membantu verifikasi'],
limits: 'Analisis berbasis indikator dan heuristik dapat keliru. Verifikasi temuan penting melalui kanal resmi.',
href: '#/security', action: 'Buka Security Center', accent: 'coral',
},
'world-monitor': {
index: '02', category: 'ENVIRONMENTAL INTELLIGENCE', title: 'Read the signals around you.',
subtitle: 'World Monitor', description: 'Jelajahi data lingkungan dan kejadian yang dihimpun dari sumber terhubung untuk membantu memahami situasi.',
capabilities: ['Hotspot termal dari NASA FIRMS', 'Kualitas udara dari OpenAQ', 'Gempa, cuaca, dan peringatan BMKG'],
limits: 'Ketersediaan, cakupan, dan waktu observasi berbeda menurut sumber. Status feed bukan jaminan kondisi terkini di lokasi Anda.',
href: '#/world-monitor', action: 'Buka World Monitor', accent: 'blue',
},
analisis: {
index: '03', category: 'INVESTIGATION TOOLS', title: 'Inspect before you trust.',
subtitle: 'Analisis', description: 'Gunakan alat pemeriksaan untuk menilai tautan, nomor, file, dan QR dalam satu ruang kerja.',
capabilities: ['Pemeriksaan tautan dan nomor', 'Pemindaian file arsip yang didukung', 'Pemeriksaan QR melalui alur analisis'],
limits: 'Hasil pemindaian adalah pemeriksaan awal, bukan bukti mutlak bahwa konten aman atau berbahaya.',
href: '#/analisis', action: 'Masuk ke Analisis', accent: 'coral',
},
edukasi: {
index: '04', category: 'SECURITY AWARENESS', title: 'Build better digital instincts.',
subtitle: 'Edukasi', description: 'Pelajari pola phishing dan kebiasaan verifikasi yang membantu mengurangi risiko saat beraktivitas online.',
capabilities: ['Materi pengenalan phishing', 'Checklist kebiasaan aman', 'Latihan dan kuis edukasi'],
limits: 'Materi bersifat edukatif. Situasi nyata dapat berbeda dan perlu dinilai berdasarkan konteks.',
href: '#/edukasi', action: 'Mulai belajar', accent: 'gold',
},
berita: {
index: '05', category: 'THREAT INTELLIGENCE', title: 'Follow the story behind the signal.',
subtitle: 'Berita', description: 'Ikuti berita terkait keamanan dan ancaman digital dari feed yang tersedia di platform.',
capabilities: ['Feed berita dari sumber terhubung', 'Pencarian dan penyaringan artikel', 'Konteks untuk membaca perkembangan'],
limits: 'Berita dapat berubah atau dikoreksi. Periksa sumber asli dan tanggal publikasi sebelum menyimpulkan.',
href: '#/berita', action: 'Jelajahi berita', accent: 'blue',
},
asisten: {
index: '06', category: 'SECURITY GUIDANCE', title: 'Turn questions into next steps.',
subtitle: 'Asisten Keamanan', description: 'Dapatkan panduan awal untuk memahami istilah dan langkah keamanan digital yang bisa dilakukan.',
capabilities: ['Panduan keamanan dasar', 'Penjelasan indikator umum', 'Saran langkah verifikasi berikutnya'],
limits: 'Jawaban merupakan panduan awal dan tidak menggantikan pemeriksaan teknis atau konfirmasi dari pihak resmi.',
href: '#/asisten', action: 'Buka Asisten', accent: 'gold',
},
melapor: {
index: '07', category: 'RESPONSE & REPORTING', title: 'Know where to report a concern.',
subtitle: 'Cara Melapor', description: 'Temukan panduan dan kanal resmi untuk menindaklanjuti dugaan penipuan atau insiden digital.',
capabilities: ['Panduan menyiapkan informasi insiden', 'Rujukan kanal pelaporan resmi', 'Langkah awal menjaga bukti'],
limits: 'Kanal, prosedur, dan persyaratan dapat berubah. Pastikan detail melalui situs atau kontak resmi yang dirujuk.',
href: '#/melapor', action: 'Lihat panduan pelaporan', accent: 'coral',
},
};

export default function FeatureLanding({ feature = 'security' }) {
const item = FEATURES[feature] || FEATURES.security;

return (
<main className={`feature-landing feature-${item.accent}`}>
<div className="feature-landing-inner">
<a className="feature-back" href="#/">← Kembali ke Nexus</a>
<header className="feature-hero">
<p className="feature-eyebrow"><span /> {item.category} / INSPECTRE</p>
<p className="feature-index">FIELD GUIDE · {item.index}</p>
<h1>{item.title}</h1>
<p className="feature-subtitle">{item.subtitle}</p>
<p className="feature-description">{item.description}</p>
<a className="feature-primary" href={item.href}>{item.action} <span aria-hidden="true">↗</span></a>
<p className="feature-hero-note">A workspace in inSpectre Nexus</p>
</header>

    <section className="feature-capabilities" aria-labelledby="feature-capabilities-title">
      <div className="feature-section-heading">
        <p className="feature-section-label">WHAT YOU CAN DO</p>
        <h2 id="feature-capabilities-title">Dirancang untuk tindakan yang jelas.</h2>
      </div>
      <div className="feature-capability-list">
        {item.capabilities.map((capability, index) => (
          <article className="feature-capability" key={capability}>
            <span className="feature-capability-index">0{index + 1}</span>
            <h3>{capability}</h3>
            <span className="feature-capability-arrow" aria-hidden="true">↗</span>
          </article>
        ))}
      </div>
    </section>

    <aside className="feature-integrity" aria-labelledby="feature-integrity-title">
      <span className="feature-integrity-mark" aria-hidden="true">i</span>
      <div>
        <p className="feature-section-label">USE WITH CONTEXT</p>
        <h2 id="feature-integrity-title">Pahami batasannya.</h2>
        <p>{item.limits}</p>
      </div>
    </aside>

    <footer className="feature-next">
      <div>
        <p className="feature-section-label">READY WHEN YOU ARE</p>
        <h2>Lanjutkan ke ruang kerja.</h2>
      </div>
      <a className="feature-primary" href={item.href}>{item.action} <span aria-hidden="true">↗</span></a>
    </footer>
  </div>
</main>

);
}
