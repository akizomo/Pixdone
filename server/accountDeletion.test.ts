import { describe, expect, it } from 'vitest';
import { deleteAccount, type AccountDeletionDeps } from './accountDeletion.js';

function makeDeps(calls: string[], failAt?: keyof AccountDeletionDeps): AccountDeletionDeps {
  const step = (name: keyof AccountDeletionDeps) => async () => {
    calls.push(name);
    if (failAt === name) throw new Error(`${name} failed`);
  };
  return {
    deleteStripeCustomer: step('deleteStripeCustomer'),
    deleteFirestoreData: step('deleteFirestoreData'),
    deleteDatabaseData: step('deleteDatabaseData'),
    deleteFirebaseAuthUser: step('deleteFirebaseAuthUser'),
  };
}

describe('deleteAccount', () => {
  it('deletes Stripe first and the Firebase Auth user last', async () => {
    const calls: string[] = [];
    await deleteAccount({ uid: 'u1', stripeCustomerId: 'cus_1' }, makeDeps(calls));
    expect(calls).toEqual(['deleteStripeCustomer', 'deleteFirestoreData', 'deleteDatabaseData', 'deleteFirebaseAuthUser']);
  });

  it('skips Stripe for users without a customer', async () => {
    const calls: string[] = [];
    await deleteAccount({ uid: 'u1', stripeCustomerId: null }, makeDeps(calls));
    expect(calls).toEqual(['deleteFirestoreData', 'deleteDatabaseData', 'deleteFirebaseAuthUser']);
  });

  it('stops at the first failure so nothing later is deleted (and the user can retry)', async () => {
    const calls: string[] = [];
    await expect(deleteAccount({ uid: 'u1', stripeCustomerId: 'cus_1' }, makeDeps(calls, 'deleteStripeCustomer'))).rejects.toThrow();
    expect(calls).toEqual(['deleteStripeCustomer']);

    const calls2: string[] = [];
    await expect(deleteAccount({ uid: 'u1', stripeCustomerId: null }, makeDeps(calls2, 'deleteDatabaseData'))).rejects.toThrow();
    expect(calls2).toEqual(['deleteFirestoreData', 'deleteDatabaseData']); // Auth user untouched
  });

  it('refuses an empty uid before touching anything', async () => {
    const calls: string[] = [];
    await expect(deleteAccount({ uid: '', stripeCustomerId: 'cus_1' }, makeDeps(calls))).rejects.toThrow('uid');
    expect(calls).toEqual([]);
  });
});
