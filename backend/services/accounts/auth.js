'use strict';
const crypto = require('node:crypto');
const { createUser, getUserByEmail, getSessionUser, createSession, deleteSession, deleteExpiredSessions } = require('../storage/db');
const COOKIE_NAME = 'inspectre_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_MIN = 10;

function makePasswordHash(password, salt = crypto.randomBytes(16)) {
  return `${salt.toString('hex')}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const [saltHex, hashHex] = stored.split(':');
  if (!/^[a-f0-9]{32}$/i.test(saltHex || '') || !/^[a-f0-9]{128}$/i.test(hashHex || '')) return false;
  return crypto.timingSafeEqual(Buffer.from(hashHex, 'hex'), crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64));
}
function fail(message, statusCode = 400) {
  const error = new Error(message); error.statusCode = statusCode; return error;
}
const normalizeEmail = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';
const publicUser = (u) => u && ({ id:u.id, email:u.email, displayName:u.displayName, role:u.role });
function issueSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  createSession(hash, userId, Date.now() + SESSION_TTL_MS);
  deleteExpiredSessions();
  return token;
}
function registerUser(input = {}) {
  const email = normalizeEmail(input.email);
  const password = typeof input.password === 'string' ? input.password : '';
  const displayName = typeof input.displayName === 'string' ? input.displayName.trim().slice(0,60) : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw fail('Masukkan alamat email yang valid.');
  if (password.length < PASSWORD_MIN || password.length > 128) throw fail(`Kata sandi harus berisi minimal ${PASSWORD_MIN} karakter (maksimal 128).`);
  if (displayName.length < 2) throw fail('Nama tampilan minimal 2 karakter.');
  if (getUserByEmail(email)) throw fail('Email sudah terdaftar. Silakan masuk.',409);
  try {
    const user = createUser({ email, displayName, passwordHash:makePasswordHash(password), role:'user' });
    return { user:publicUser(user), token:issueSession(user.id) };
  } catch (e) {
    if (String(e.code || '').includes('CONSTRAINT')) throw fail('Email sudah terdaftar. Silakan masuk.',409);
    throw e;
  }
}
function loginUser(input = {}) {
  const email = normalizeEmail(input.email);
  const password = typeof input.password === 'string' ? input.password : '';
  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) throw fail('Email atau kata sandi tidak cocok.',401);
  return { user:publicUser({id:user.id,email:user.email,displayName:user.display_name,role:user.role}), token:issueSession(user.id) };
}
function ensureDemoAccount() {
  const email = normalizeEmail(process.env.DEMO_ACCOUNT_EMAIL);
  const password = process.env.DEMO_ACCOUNT_PASSWORD;
  if (!email && !password) return;
  if (!email || typeof password !== 'string' || password.length < PASSWORD_MIN) {
    console.warn('[AUTH] Akun demo tidak dibuat: DEMO_ACCOUNT_EMAIL/PASSWORD belum valid.'); return;
  }
  if (getUserByEmail(email)) return;
  createUser({ email, displayName:'Akun Demo Juri', passwordHash:makePasswordHash(password), role:'jury' });
  console.log('[AUTH] Akun demo/juri berhasil dibuat.');
}
function readSessionToken(req) {
  const entry = (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE_NAME+'='));
  if (!entry) return null;
  try { return decodeURIComponent(entry.slice(COOKIE_NAME.length+1)); } catch { return null; }
}
function optionalAuth(req, res, next) {
  const token = readSessionToken(req);
  if (token) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const user = getSessionUser(hash);
    if (user) req.user = publicUser(user);
  }
  next();
}
function requireAuth(req,res,next) {
  return optionalAuth(req,res,()=>{
    if (!req.user) return res.status(401).json({error:'Silakan masuk untuk melihat riwayat pemeriksaan.'});
    next();
  });
}
function setSessionCookie(res,token) {
  res.cookie(COOKIE_NAME,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:SESSION_TTL_MS});
}
function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'});
}
function logoutToken(token) {
  if (token) deleteSession(crypto.createHash('sha256').update(token).digest('hex'));
}
module.exports = { registerUser,loginUser,ensureDemoAccount,optionalAuth,requireAuth,setSessionCookie,clearSessionCookie,readSessionToken,logoutToken };
