import { Client } from '@notionhq/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const MONTHLY_METRICS_DB_ID = 'ee4fbeff-4950-4ef8-88fc-429ec123ffe8';
export const POST_CALENDAR_DB_ID = 'c574de42-35ae-4548-b364-ed6a523e1d55';

let cached: Client | null = null;
const dataSourceCache = new Map<string, string>();

export function getNotion(): Client {
  if (cached) return cached;
  const auth = process.env.NOTION_API_KEY;
  if (!auth) throw new Error('NOTION_API_KEY is not set');
  cached = new Client({ auth });
  return cached;
}

/**
 * Notion API 2025-09-03+ requires data_source_id for queries.
 * Resolve from database_id (first data source) and cache.
 */
export async function resolveDataSourceId(databaseId: string): Promise<string> {
  const hit = dataSourceCache.get(databaseId);
  if (hit) return hit;
  const db = (await getNotion().databases.retrieve({ database_id: databaseId })) as {
    data_sources?: Array<{ id: string }>;
  };
  const dsId = db.data_sources?.[0]?.id;
  if (!dsId) throw new Error(`No data source found for database ${databaseId}`);
  dataSourceCache.set(databaseId, dsId);
  return dsId;
}

export function currentMonthLabel(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export async function upsertMonthlyMetrics(
  monthLabel: string,
  properties: Record<string, unknown>,
): Promise<void> {
  const notion = getNotion();
  const dataSourceId = await resolveDataSourceId(MONTHLY_METRICS_DB_ID);

  const existing = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: 'Month',
      title: { equals: monthLabel },
    },
  });

  if (existing.results.length > 0) {
    await notion.pages.update({
      page_id: existing.results[0].id,
      properties: properties as any,
    });
    return;
  }

  await notion.pages.create({
    parent: { database_id: MONTHLY_METRICS_DB_ID },
    properties: {
      Month: { title: [{ text: { content: monthLabel } }] },
      ...(properties as any),
    },
  });
}

export function assertCronAuth(req: VercelRequest, res: VercelResponse): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = req.headers.authorization;
  if (header !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
