import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  assertCronAuth,
  getNotion,
  POST_CALENDAR_DB_ID,
  resolveDataSourceId,
} from './_lib/notion.js';

export const config = { maxDuration: 60 };

function extractTweetId(url: string): string | null {
  const m = url.match(/status\/(\d+)/);
  return m ? m[1] : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertCronAuth(req, res)) return;

  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    console.warn('[cron/x-to-notion] X_BEARER_TOKEN not set, skipping');
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
          { property: 'Platform', multi_select: { contains: 'X' } },
        ],
      },
    });

    let updated = 0;
    let skipped = 0;

    for (const page of pages.results) {
      const props = (page as any).properties;
      const tweetUrl: string | undefined = props['X Post URL']?.url;
      if (!tweetUrl) {
        skipped += 1;
        continue;
      }
      const tweetId = extractTweetId(tweetUrl);
      if (!tweetId) {
        skipped += 1;
        continue;
      }

      try {
        const apiRes = await fetch(
          `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!apiRes.ok) {
          console.error(`[cron/x-to-notion] tweet ${tweetId}: ${apiRes.status}`);
          skipped += 1;
          continue;
        }
        const data = (await apiRes.json()) as {
          data?: { public_metrics?: { impression_count?: number; like_count?: number } };
        };
        const metrics = data.data?.public_metrics;
        if (!metrics) {
          skipped += 1;
          continue;
        }

        await notion.pages.update({
          page_id: page.id,
          properties: {
            Impressions: { number: metrics.impression_count ?? 0 },
            Likes: { number: metrics.like_count ?? 0 },
          },
        });
        updated += 1;
      } catch (err) {
        console.error(`[cron/x-to-notion] tweet ${tweetId}:`, err);
        skipped += 1;
      }
    }

    return res.status(200).json({ ok: true, updated, skipped });
  } catch (e) {
    console.error('[cron/x-to-notion] error:', e);
    return res.status(500).json({ ok: false, error: (e as Error).message });
  }
}
