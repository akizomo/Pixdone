import {
  users,
  tasks,
  taskLists,
  effectProgress,
  effectRequests,
  type User,
  type UpsertUser,
  type Task,
  type TaskList,
  type InsertTask,
  type InsertTaskList,
  type EffectProgressRow,
  type EffectRequest,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import {
  ACTIVE_CHALLENGE_EFFECTS,
  EVOLVABLE_EFFECTS,
  EVOLUTION_CHILD_UNLOCKS,
} from "./constants/challengeEffects.js";

// Interface for storage operations
interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<Pick<User, 'id'> | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserTheme(userId: string, themeKey: string): Promise<User>;
  isPremium(userId: string): Promise<boolean>;
  updateSubscription(userId: string, data: {
    plan: string;
    billingCycle?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: Date | null;
    trialEnd?: Date | null;
  }): Promise<User>;
  getSubscription(userId: string): Promise<{ plan: string; billingCycle: string | null; currentPeriodEnd: Date | null; stripeSubscriptionId: string | null; trialEnd: Date | null } | undefined>;

  // Task operations
  getUserTasks(userId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(taskId: number, updates: Partial<Task>): Promise<Task>;
  deleteTask(taskId: number): Promise<void>;

  // TaskList operations
  getUserTaskLists(userId: string): Promise<TaskList[]>;
  createTaskList(taskList: InsertTaskList): Promise<TaskList>;
  updateTaskList(listId: number, updates: Partial<TaskList>): Promise<TaskList>;
  deleteTaskList(listId: number): Promise<void>;
  getTasksByListId(listId: number, userId: string): Promise<Task[]>;

  // Effect progress operations
  getUserEffectProgress(userId: string): Promise<EffectProgressRow[]>;
  processChallengeProgressOnTaskComplete(userId: string): Promise<{ unlockedEffectIds: string[]; evolvedEffectIds: string[] }>;

  // Effect request operations
  createEffectRequest(userId: string, description: string): Promise<EffectRequest>;
  countEffectRequestsSince(userId: string, since: Date): Promise<number>;
}

class DatabaseStorage implements IStorage {
  // User operations

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByStripeCustomerId(customerId: string): Promise<Pick<User, 'id'> | undefined> {
    const [row] = await db.select({ id: users.id }).from(users).where(eq(users.stripeCustomerId, customerId));
    return row;
  }



  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
        },
      })
      .returning();

    // Create default "My Tasks" list if it doesn't exist
    await this.ensureDefaultTaskList(user.id);

    return user;
  }

  async updateUserTheme(userId: string, themeKey: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ themeKey, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async isPremium(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    return user?.subscriptionPlan === 'plus';
  }

  async updateSubscription(userId: string, data: {
    plan: string;
    billingCycle?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: Date | null;
    trialEnd?: Date | null;
  }): Promise<User> {
    const setData: Partial<typeof users.$inferInsert> = {
      subscriptionPlan: data.plan,
      billingCycle: data.billingCycle ?? null,
      subscriptionCurrentPeriodEnd: data.currentPeriodEnd ?? null,
      updatedAt: new Date(),
    };
    if (data.stripeCustomerId !== undefined) setData.stripeCustomerId = data.stripeCustomerId;
    if (data.stripeSubscriptionId !== undefined) setData.stripeSubscriptionId = data.stripeSubscriptionId;
    if (data.trialEnd !== undefined) setData.trialEnd = data.trialEnd;
    const [user] = await db
      .update(users)
      .set(setData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getSubscription(userId: string): Promise<{ plan: string; billingCycle: string | null; currentPeriodEnd: Date | null; stripeSubscriptionId: string | null; trialEnd: Date | null } | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    return {
      plan: user.subscriptionPlan ?? 'free',
      billingCycle: user.billingCycle ?? null,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd ?? null,
      stripeSubscriptionId: user.stripeSubscriptionId ?? null,
      trialEnd: user.trialEnd ?? null,
    };
  }

  async ensureDefaultTaskList(userId: string): Promise<void> {
    const existingLists = await db
      .select()
      .from(taskLists)
      .where(eq(taskLists.userId, userId));

    if (existingLists.length === 0) {
      await db.insert(taskLists).values({
        name: 'My Tasks',
        userId: userId,
      });
    }
  }

  // Task operations
  async getUserTasks(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(taskId: number, updates: Partial<Task>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...updates })
      .where(eq(tasks.id, taskId))
      .returning();
    return updatedTask;
  }

  async deleteTask(taskId: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, taskId));
  }

  // TaskList operations
  async getUserTaskLists(userId: string): Promise<TaskList[]> {
    return await db
      .select()
      .from(taskLists)
      .where(eq(taskLists.userId, userId))
      .orderBy(desc(taskLists.createdAt));
  }

  async createTaskList(taskList: InsertTaskList): Promise<TaskList> {
    const [newTaskList] = await db.insert(taskLists).values(taskList).returning();
    return newTaskList;
  }

  async updateTaskList(listId: number, updates: Partial<TaskList>): Promise<TaskList> {
    const [updatedTaskList] = await db
      .update(taskLists)
      .set({ ...updates })
      .where(eq(taskLists.id, listId))
      .returning();
    return updatedTaskList;
  }

  async deleteTaskList(listId: number): Promise<void> {
    // First delete all tasks in the list
    await db.delete(tasks).where(eq(tasks.listId, listId));
    // Then delete the list
    await db.delete(taskLists).where(eq(taskLists.id, listId));
  }

  async getTasksByListId(listId: number, userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.listId, listId), eq(tasks.userId, userId)))
      .orderBy(desc(tasks.createdAt));
  }

  // Effect progress operations

  async getUserEffectProgress(userId: string): Promise<EffectProgressRow[]> {
    await this.migrateLegacyFighterRows(userId);
    return await db
      .select()
      .from(effectProgress)
      .where(eq(effectProgress.userId, userId));
  }

  /**
   * Idempotent lazy migration: rename legacy `fighter` rows to `fighter_punch`
   * so existing users' progress carries over into the new split-card structure.
   *
   * For users whose legacy row had `equippedLevel >= 2` (meaning they had already
   * evolved to Kick), we additionally insert a `fighter_punch_lv2` row with
   * `owned=true` so the Kick card appears in their collection.
   *
   * Safe to run on every read: the UPDATE skips rows that have already been
   * renamed (WHERE effect_id = 'fighter'), and the INSERT is guarded by
   * ON CONFLICT DO NOTHING.
   */
  private async migrateLegacyFighterRows(userId: string): Promise<void> {
    // Step A: rename the legacy row to `fighter_punch`. If both rows somehow
    // exist, prefer the existing `fighter_punch` and delete the legacy.
    const [legacy] = await db
      .select()
      .from(effectProgress)
      .where(and(
        eq(effectProgress.userId, userId),
        eq(effectProgress.effectId, 'fighter'),
      ));

    if (!legacy) return;

    const [existingPunch] = await db
      .select()
      .from(effectProgress)
      .where(and(
        eq(effectProgress.userId, userId),
        eq(effectProgress.effectId, 'fighter_punch'),
      ));

    if (existingPunch) {
      // Collision: keep the already-migrated row and drop the legacy one.
      await db
        .delete(effectProgress)
        .where(and(
          eq(effectProgress.userId, userId),
          eq(effectProgress.effectId, 'fighter'),
        ));
    } else {
      await db
        .update(effectProgress)
        .set({
          effectId: 'fighter_punch',
          // Reset equippedLevel to 1 — levels are now separate cards.
          equippedLevel: 1,
          updatedAt: new Date(),
        })
        .where(and(
          eq(effectProgress.userId, userId),
          eq(effectProgress.effectId, 'fighter'),
        ));
    }

    // Step B: if the legacy row had equippedLevel >= 2, they had already
    // evolved to Kick. Grant them the Lv2 card as owned.
    if (legacy.equippedLevel >= 2 && legacy.owned) {
      await db
        .insert(effectProgress)
        .values({
          userId,
          effectId: 'fighter_punch_lv2',
          owned: true,
          equippedLevel: 1,
          evolutionProgress: 0,
          challengeProgress: 0,
          earnedAt: legacy.earnedAt ?? new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing({
          target: [effectProgress.userId, effectProgress.effectId],
        });
    }
  }

  async processChallengeProgressOnTaskComplete(userId: string): Promise<{ unlockedEffectIds: string[]; evolvedEffectIds: string[] }> {
    const unlockedEffectIds: string[] = [];
    const evolvedEffectIds: string[] = [];
    const now = Date.now();

    // Make sure legacy data is migrated before we start writing so we don't
    // accidentally double-count against `fighter` and `fighter_punch` rows.
    await this.migrateLegacyFighterRows(userId);

    // ── 1. Challenge unlock progress ──────────────────────────────────────────
    // Atomic upsert: サーバー側で現在値+1 を計算し、閾値到達で owned を自動フリップ。
    // read-modify-write パターンだと同一ユーザーの高速連続 POST でレースし +1 が lost する。
    for (const challenge of ACTIVE_CHALLENGE_EFFECTS) {
      if (now > challenge.deadline.getTime()) continue; // 期限切れはスキップ

      const threshold = challenge.threshold;

      const [returned] = await db
        .insert(effectProgress)
        .values({
          userId,
          effectId: challenge.effectId,
          owned: 1 >= threshold,
          equippedLevel: 1,
          evolutionProgress: 0,
          challengeProgress: 1,
          earnedAt: 1 >= threshold ? new Date() : null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [effectProgress.userId, effectProgress.effectId],
          // 既に owned=true なら何も変更しない (challengeProgress も止める)
          setWhere: sql`${effectProgress.owned} = false`,
          set: {
            challengeProgress: sql`${effectProgress.challengeProgress} + 1`,
            owned: sql`(${effectProgress.challengeProgress} + 1) >= ${threshold}`,
            earnedAt: sql`CASE WHEN (${effectProgress.challengeProgress} + 1) >= ${threshold} THEN NOW() ELSE ${effectProgress.earnedAt} END`,
            updatedAt: sql`NOW()`,
          },
        })
        .returning();

      if (returned?.owned && returned.challengeProgress >= threshold) {
        // owned が新しく true になった場合のみ unlock 通知。既に owned のケース(上記 setWhere で無視)
        // は returning が空になるので含まれない。
        unlockedEffectIds.push(challenge.effectId);
      }
    }

    // ── 2. Child-unlock (evolution-kind) progress ─────────────────────────────
    // When the parent is already owned, we accrue challengeProgress on the
    // child row; crossing the threshold flips owned=true on the child and the
    // new card becomes available in the collection.
    for (const unlock of EVOLUTION_CHILD_UNLOCKS) {
      const [parent] = await db
        .select()
        .from(effectProgress)
        .where(and(
          eq(effectProgress.userId, userId),
          eq(effectProgress.effectId, unlock.parentEffectId),
        ));

      if (!parent?.owned) continue; // Parent not yet earned — gate the child.

      // Premium gate is applied at the moment of unlock (threshold crossing).
      // Until then we keep counting so that the user can see progress grow
      // once they upgrade.
      const threshold = unlock.threshold;
      const premium = unlock.requiresPremium ? await this.isPremium(userId) : true;

      const [returned] = await db
        .insert(effectProgress)
        .values({
          userId,
          effectId: unlock.childEffectId,
          owned: premium && 1 >= threshold,
          equippedLevel: 1,
          evolutionProgress: 0,
          challengeProgress: 1,
          earnedAt: premium && 1 >= threshold ? new Date() : null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [effectProgress.userId, effectProgress.effectId],
          setWhere: sql`${effectProgress.owned} = false`,
          set: {
            challengeProgress: sql`${effectProgress.challengeProgress} + 1`,
            owned: sql`(${effectProgress.challengeProgress} + 1) >= ${threshold} AND ${premium}`,
            earnedAt: sql`CASE WHEN (${effectProgress.challengeProgress} + 1) >= ${threshold} AND ${premium} THEN NOW() ELSE ${effectProgress.earnedAt} END`,
            updatedAt: sql`NOW()`,
          },
        })
        .returning();

      if (returned?.owned && returned.challengeProgress >= threshold) {
        evolvedEffectIds.push(unlock.childEffectId);
      }
    }

    // ── 3. Legacy in-place evolution (EVOLVABLE_EFFECTS) ─────────────────────
    // Retained so any future effect that opts into evolutionStages>=2 keeps
    // working. `fighter` has moved out of this list in Phase 3.
    for (const evo of EVOLVABLE_EFFECTS) {
      const [existing] = await db
        .select()
        .from(effectProgress)
        .where(and(
          eq(effectProgress.userId, userId),
          eq(effectProgress.effectId, evo.effectId),
        ));

      if (!existing?.owned) continue;
      if (existing.equippedLevel >= evo.maxLevel) continue;

      const newEvolutionProgress = existing.evolutionProgress + 1;

      let justEvolved = false;
      if (newEvolutionProgress >= evo.evolutionThreshold && evo.requiresPremium) {
        const premium = await this.isPremium(userId);
        justEvolved = premium;
      } else if (newEvolutionProgress >= evo.evolutionThreshold && !evo.requiresPremium) {
        justEvolved = true;
      }

      await db
        .update(effectProgress)
        .set({
          evolutionProgress: newEvolutionProgress,
          equippedLevel: justEvolved ? evo.maxLevel : existing.equippedLevel,
          updatedAt: new Date(),
        })
        .where(and(
          eq(effectProgress.userId, userId),
          eq(effectProgress.effectId, evo.effectId),
        ));

      if (justEvolved) evolvedEffectIds.push(evo.effectId);
    }

    return { unlockedEffectIds, evolvedEffectIds };
  }

  // Effect request operations

  async createEffectRequest(userId: string, description: string): Promise<EffectRequest> {
    const [row] = await db
      .insert(effectRequests)
      .values({ userId, description })
      .returning();
    return row;
  }

  async countEffectRequestsSince(userId: string, since: Date): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(effectRequests)
      .where(and(
        eq(effectRequests.userId, userId),
        gte(effectRequests.createdAt, since),
      ));
    return row?.count ?? 0;
  }
}

export const storage = new DatabaseStorage();