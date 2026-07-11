// Cloudflare Worker: serves the exported web app (dist/) and provides a small
// Deck Log proxy so the browser build can import decks (browsers can't set the
// User-Agent / Referer Deck Log requires, and are blocked by CORS).

const DECKLOG_BASE = 'https://decklog.bushiroad.com/system/app/api/view/';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/decklog') {
      const code = (url.searchParams.get('code') || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 12);
      if (!code) {
        return json({ error: 'Missing code' }, 400);
      }
      try {
        const upstream = await fetch(DECKLOG_BASE + encodeURIComponent(code), {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            Referer: `https://decklog.bushiroad.com/view/${code}`,
            'X-Requested-With': 'XMLHttpRequest',
          },
        });
        const body = await upstream.text();
        return new Response(body, {
          status: upstream.status,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=300',
          },
        });
      } catch {
        return json({ error: 'Upstream fetch failed' }, 502);
      }
    }

    // Everything else: static assets, with SPA fallback to index.html.
    const asset = await env.ASSETS.fetch(request);
    if (asset.status === 404 && request.method === 'GET') {
      return env.ASSETS.fetch(new URL('/index.html', url.origin));
    }
    return asset;
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
