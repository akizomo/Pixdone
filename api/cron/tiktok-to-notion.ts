import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  assertCronAuth,
  getNotion,
  POST_CALENDAR_DB_ID,
  resolveDataSourceId,
} from './_lib/notion.js';

export const config = { maxDuration: 60 };

function extractVideoId(url: string): string | null {
  const m = url.match(/\/video\/(\d+)/);
  return m ? m[1] : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertCronAuth(req, res)) return;

  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) {
    console.warn('[cron/tiktok-to-notion] TIKTOK_ACCESS_TOKEN not set, skipping');
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    const notion = getNotion();
    const dataSourceId = await resolveDataSourceId(POST_CALENDAR_DB_ID);
    const pages = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        and: [
          { property: 'Status', select: { equals: 'Posted' } },
          { property: 'Platform', multi_select: { contains: 'TikTok' } },
        ],
      },
    });

    let updated = 0;
    let skipped = 0;

    for (const page of pages.results) {
      const props = (page as any).properties;
      const tiktokUrl: string | undefined = props['TikTok URL']?.url;
      if (!tiktokUrl) {
        skipped += 1;
        continue;
      }
      const videoId = extractVideoId(tiktokUrl);
      if (!videoId) {
        skipped += 1;
        continue;
      }

      try {
        const apiRes = await fetch(
          'https://open.tiktokapis.com/v2/video/query/?fields=view_count,like_count',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filters: { video_ids: [videoId] } }),
          },
        );
        if (!apiRes.ok) {
          console.error(`[cron/tiktok-to-notion] video ${videoId}: ${apiRes.status}`);
          skipped += 1;
          continue;
        }
        const data = (await apiRes.json()) as {
          data?: { videos?: Array<{ view_count?: number; like_count?: number }> };
        };
        const video = data.data?.videos?.[0];
        if (!video) {
          skipped += 1;
          continue;
        }

        await notion.pages.update({
          page_id: page.id,
          properties: {
            Impressions: { number: video.view_count ?? 0 },
            Likes: { number: video.like_count ?? 0 },
          },
        });
        updated += 1;
      } catch (err) {
        console.error(`[cron/tiktok-to-notion] video ${videoId}:`, err);
        skipped += 1;
      }
    }

    return res.status(200).json({ ok: true, updated, skipped });
  } catch (e) {
    console.error('[cron/tiktok-to-notion] error:', e);
    return res.status(500).json({ ok: false, error: (e as Error).message });
  }
}
