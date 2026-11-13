export async function onRequest(context) {
  const { request, env } = context;
  const origin = String(env.API_ORIGIN || '').replace(/\/+$/, '');
  if (!origin) {
    return Response.json({ error: 'API_ORIGIN belum dikonfigurasi pada Cloudflare Pages.' }, { status: 503 });
  }
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, origin);
  return fetch(new Request(target.toString(), request));
}
