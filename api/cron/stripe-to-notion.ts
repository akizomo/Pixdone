import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { assertCronAuth, currentMonthLabel, upsertMonthlyMetrics } from './_lib/notion.js';

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertCronAuth(req, res)) return;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
    });

    let activeCount = 0;
    let mrr = 0;

    for await (const sub of stripe.subscriptions.list({ status: 'active', limit: 100 })) {
      activeCount += 1;
      for (const item of sub.items.data) {
        const price = item.price;
        const unit = (price.unit_amount ?? 0) / 100;
        const qty = item.quantity ?? 1;
        if (price.recurring?.interval === 'month') {
          mrr += unit * qty;
        } else if (price.recurring?.interval === 'year') {
          mrr += (unit * qty) / 12;
        }
      }
    }

    await upsertMonthlyMetrics(currentMonthLabel(), {
      'Plus Subscribers': { number: activeCount },
      MRR: { number: Math.round(mrr) },
    });

    return res.status(200).json({ ok: true, activeCount, mrr });
  } catch (e) {
    console.error('[cron/stripe-to-notion] error:', e);
    return res.status(500).json({ ok: false, error: (e as Error).message });
  }
}
