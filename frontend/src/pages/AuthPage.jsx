import { useState } from 'react';
import { useAuth } from '../lib/AuthContext.jsx';

export default function AuthPage({ returnTo = '#/history' }) {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'register') await register({ displayName, email, password });
      else await login({ email, password });
      window.location.hash = returnTo;
    } catch (err) { setError(err.message || 'Autentikasi gagal. Coba lagi.'); }
    finally { setBusy(false); }
  };

  return (
    <main className="page-shell flex min-h-[65vh] items-center justify-center py-12">
      <section className="surface-card w-full max-w-md p-6 sm:p-8">
        <p className="eyebrow">AKUN INSPECTRE</p>
        <h1 className="mt-2 text-3xl font-bold">{user ? 'Kamu sudah masuk' : mode === 'login' ? 'Selamat datang' : 'Buat akun'}</h1>
        <p className="mt-2 text-sm text-cyber-muted">{user ? 'Riwayat pemeriksaan akunmu sudah bisa dibuka.' : 'Masuk atau daftar untuk menyimpan dan melihat riwayat pemeriksaan pribadi.'}</p>
        {user ? <a href="#/history" className="mt-6 inline-flex rounded-xl bg-[#f5b96b] px-5 py-3 font-semibold text-slate-950">Buka riwayat →</a> : <>
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1">
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-[#f5b96b] text-slate-950' : 'text-slate-300'}`}>Masuk</button>
            <button type="button" onClick={() => { setMode('register'); setError(''); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === 'register' ? 'bg-[#f5b96b] text-slate-950' : 'text-slate-300'}`}>Daftar</button>
          </div>
          <form className="mt-5 space-y-4" onSubmit={submit}>
            {mode === 'register' && <label className="block text-sm font-medium">Nama tampilan<input required minLength={2} maxLength={60} autoComplete="name" value={displayName} onChange={e=>setDisplayName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-[#7dd3fc]" placeholder="Nama kamu" /></label>}
            <label className="block text-sm font-medium">Email<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-[#7dd3fc]" placeholder="nama@email.com" /></label>
            <label className="block text-sm font-medium">Kata sandi<input required type="password" minLength={mode === 'register' ? 10 : 1} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none focus:border-[#7dd3fc]" placeholder={mode === 'register' ? 'Minimal 10 karakter' : 'Kata sandi'} /></label>
            {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
            <button disabled={busy} type="submit" className="w-full rounded-xl bg-[#f5b96b] px-5 py-3 font-bold text-slate-950 transition hover:bg-[#ffd18f] disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Memproses…' : mode === 'login' ? 'Masuk ke akun' : 'Buat akun'}</button>
          </form>
          <p className="mt-5 text-xs leading-5 text-cyber-muted">Gunakan kata sandi unik minimal 10 karakter. Jangan gunakan kata sandi akun penting lainnya.</p>
        </>}
      </section>
    </main>
  );
}
