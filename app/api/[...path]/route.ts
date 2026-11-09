import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handler(request: NextRequest, ctx: {params: Promise<{path: string[]}>}) {
  const {path} = await ctx.params;
  const backend = (process.env.API_INTERNAL_ORIGIN || 'http://127.0.0.1:8000').replace(/\/$/, '');
  const url = new URL(`${backend}/api/${path.map(encodeURIComponent).join('/')}`);
  url.search = request.nextUrl.search;
  const headers = new Headers();
  for (const name of ['accept','content-type','cookie','x-requested-with']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // We accept browser requests only from this frontend origin. The API receives a
  // private-network request and checks the required application-specific header.
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin)
    return new Response('Origin not allowed', {status: 403});
  // Do not forward the browser Origin header to the internal API.
  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
      redirect: 'manual',
      cache: 'no-store',
    });
    const responseHeaders = new Headers();
    for (const name of ['content-type','set-cookie','cache-control','location']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set('cache-control','no-store');
    return new Response(upstream.body, {status: upstream.status, headers: responseHeaders});
  } catch {
    return Response.json({detail:'The application API is temporarily unavailable.'},{status:502});
  }
}
export {handler as GET,handler as POST,handler as PUT,handler as PATCH,handler as DELETE};
