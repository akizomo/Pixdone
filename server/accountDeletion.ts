/**
 * Account deletion (App Store guideline 5.1.1(v) / Google Play account-deletion policy).
 *
 * Orchestrates removal of everything we hold for a user. Each step is idempotent so a
 * failed attempt can simply be retried; the Firebase Auth user is deleted LAST so the
 * user can still sign in and retry if an earlier step failed.
 *
 *   1. Stripe customer (also cancels active subscriptions immediately; stops charges first)
 *   2. Firestore: lists, tasks, themeStats, activityDays, users/{uid}/**
 *   3. Postgres: tasks, task_lists, effect_*, sessions, users
 *   4. Firebase Auth user
 *
 * App Store / Google Play subscriptions are NOT cancelled here — only the store can do
 * that — so the client tells those users to cancel in the store first.
 */

export interface AccountDeletionDeps {
  /** Deletes the Stripe customer (cancelling its subscriptions). Must tolerate "already gone". */
  deleteStripeCustomer(customerId: string): Promise<void>;
  deleteFirestoreData(uid: string): Promise<void>;
  deleteDatabaseData(uid: string): Promise<void>;
  deleteFirebaseAuthUser(uid: string): Promise<void>;
}

export interface AccountDeletionTarget {
  uid: string;
  stripeCustomerId: string | null;
}

export async function deleteAccount(target: AccountDeletionTarget, deps: AccountDeletionDeps): Promise<void> {
  if (!target.uid) throw new Error('uid is required');
  if (target.stripeCustomerId) await deps.deleteStripeCustomer(target.stripeCustomerId);
  await deps.deleteFirestoreData(target.uid);
  await deps.deleteDatabaseData(target.uid);
  await deps.deleteFirebaseAuthUser(target.uid);
}

/** Firestore collections whose documents carry a `uid` field (see firestore.rules). */
export const FIRESTORE_UID_COLLECTIONS = ['lists', 'tasks', 'themeStats', 'activityDays'] as const;

// ---------------------------------------------------------------------------
// Real implementations
// ---------------------------------------------------------------------------

import admin from 'firebase-admin';
import Stripe from 'stripe';
import { eq, sql } from 'drizzle-orm';
import { db } from './db.js';
import { ensureFirebaseAdmin, getFirestoreAdmin } from './firebaseAdmin.js';
import { tasks, taskLists, effectRequests, effectProgress, users } from '../shared/schema.js';

export function createAccountDeletionDeps(stripeSecretKey: string | undefined): AccountDeletionDeps {
  return {
    async deleteStripeCustomer(customerId) {
      if (!stripeSecretKey) throw new Error('Stripe is not configured');
      try {
        // Deleting a customer also cancels its active subscriptions immediately.
        await new Stripe(stripeSecretKey).customers.del(customerId);
      } catch (e: any) {
        if (e?.code === 'resource_missing') return; // already deleted — retry-safe
        throw e;
      }
    },

    async deleteFirestoreData(uid) {
      ensureFirebaseAdmin();
      const fs = getFirestoreAdmin();
      for (const col of FIRESTORE_UID_COLLECTIONS) {
        // Pages of 500 until none are left (a retry after a partial failure just continues).
        for (;;) {
          const snap = await fs.collection(col).where('uid', '==', uid).limit(500).get();
          if (snap.empty) break;
          const writer = fs.bulkWriter();
          snap.docs.forEach((d) => writer.delete(d.ref));
          await writer.close();
        }
      }
      // activityDays/{uid} is keyed by uid; also covers a doc created without a uid field.
      await fs.doc(`activityDays/${uid}`).delete();
      // users/{uid} and its settings subcollection.
      await fs.recursiveDelete(fs.doc(`users/${uid}`));
    },

    async deleteDatabaseData(uid) {
      await db.transaction(async (tx) => {
        await tx.delete(tasks).where(eq(tasks.userId, uid));
        await tx.delete(taskLists).where(eq(taskLists.userId, uid));
        await tx.delete(effectRequests).where(eq(effectRequests.userId, uid));
        await tx.delete(effectProgress).where(eq(effectProgress.userId, uid));
        // express-session rows (passport stores the user id, or the user object, per session).
        await tx.execute(sql`DELETE FROM sessions WHERE sess->'passport'->>'user' = ${uid} OR sess->'passport'->'user'->>'id' = ${uid}`);
        await tx.delete(users).where(eq(users.id, uid));
      });
    },

    async deleteFirebaseAuthUser(uid) {
      ensureFirebaseAdmin();
      try {
        await admin.auth().deleteUser(uid);
      } catch (e: any) {
        if (e?.code === 'auth/user-not-found') return;
        throw e;
      }
    },
  };
}
