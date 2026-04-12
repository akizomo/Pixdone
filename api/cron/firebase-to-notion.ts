import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestoreAdmin } from '../../server/firebaseAdmin.js';
import { assertCronAuth, currentMonthLabel, upsertMonthlyMetrics } from './_lib/notion.js';

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertCronAuth(req, res)) return;

  try {
    const db = getFirestoreAdmin();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [usersSnap, newUsersSnap, missionSnap] = await Promise.all([
      db.collection('users').count().get(),
      db
        .collection('users')
        .where('createdAt', '>=', startOfMonth)
        .where('createdAt', '<', endOfMonth)
        .count()
        .get(),
      db.collection('users').where('starterMissionCompleted', '==', true).count().get(),
    ]);

    const totalUsers = usersSnap.data().count;
    const newUsers = newUsersSnap.data().count;
    const missionCompleted = missionSnap.data().count;
    const starterMissionRate =
      totalUsers > 0 ? Math.round((missionCompleted / totalUsers) * 100) : 0;

    await upsertMonthlyMetrics(currentMonthLabel(), {
      'Total Users': { number: totalUsers },
      'New Users': { number: newUsers },
      'Starter Mission %': { number: starterMissionRate },
    });

    return res.status(200).json({
      ok: true,
      totalUsers,
      newUsers,
      starterMissionRate,
    });
  } catch (e) {
    console.error('[cron/firebase-to-notion] error:', e);
    return res.status(500).json({ ok: false, error: (e as Error).message });
  }
}
