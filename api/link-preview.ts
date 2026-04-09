import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 10,
};

function getMeta(htmlSlice: string, name: string): string | null {
  const prop = name.startsWith('og:')
    ? `property=["']${name.replace(/:/g, '\\:')}["']`
    : `name=["']${name}["']`;
  const re = new RegExp(`<meta[^>]+${prop}[^>]+content=["']([^"']+)["']`, 'i');
  const m = htmlSlice.match(re);
  if (m) return m[1];
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${prop}`, 'i');
  const m2 = htmlSlice.match(re2);
  return m2 ? m2[1] : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'Missing or invalid url' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PixDone-LinkPreview/1.0 (https://pixdone.vercel.app)' },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch URL' });
    }

    const html = await response.text();
    const headEnd = html.indexOf('</head>');
    const slice = headEnd > 0 ? html.slice(0, headEnd + 7) : html.slice(0, 60000);

    let title = getMeta(slice, 'og:title') || getMeta(slice, 'twitter:title') || null;
    let image = getMeta(slice, 'og:image') || getMeta(slice, 'twitter:image') || null;
    const description = getMeta(slice, 'og:description') || getMeta(slice, 'twitter:description') || null;

    if (!title) {
      const titleMatch = slice.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : null;
    }

    if (image && image.startsWith('//')) image = 'https:' + image;
    if (image && image.startsWith('/')) {
      try {
        const base = new URL(url);
        image = base.origin + image;
      } catch (_) {}
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).json({ title: title || url, description, image, url });
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout' });
    }
    console.error('Link preview error:', e);
    return res.status(502).json({ error: 'Failed to fetch URL' });
  }
}
