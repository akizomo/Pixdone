import {
  users,
  tasks,
  taskLists,
  effectProgress,
  type User,
  type UpsertUser,
  type Task,
  type TaskList,
  type InsertTask,
  type InsertTaskList,
  type EffectProgressRow,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, desc } from "drizzle-orm";
import { ACTIVE_CHALLENGE_EFFECTS } from "./constants/challengeEffects.js";

// Interface for storage operations
interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
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
  processChallengeProgressOnTaskComplete(userId: string): Promise<{ unlockedEffectIds: string[] }>;
}

class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

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
    return await db
      .select()
      .from(effectProgress)
      .where(eq(effectProgress.userId, userId));
  }

  async processChallengeProgressOnTaskComplete(userId: string): Promise<{ unlockedEffectIds: string[] }> {
    const unlockedEffectIds: string[] = [];
    const now = Date.now();

    for (const challenge of ACTIVE_CHALLENGE_EFFECTS) {
      if (now > challenge.deadline.getTime()) continue; // 期限切れはスキップ

      // 既存の進捗行を取得または新規作成
      const [existing] = await db
        .select()
        .from(effectProgress)
        .where(and(
          eq(effectProgress.userId, userId),
          eq(effectProgress.effectId, challenge.effectId),
        ));

      if (existing?.owned) continue; // 既に所持済み

      const currentProgress = existing?.challengeProgress ?? 0;
      const newProgress = currentProgress + 1;
      const justUnlocked = newProgress >= challenge.threshold;

      await db
        .insert(effectProgress)
        .values({
          userId,
          effectId: challenge.effectId,
          owned: justUnlocked,
          equippedLevel: 1,
          evolutionProgress: 0,
          challengeProgress: newProgress,
          earnedAt: justUnlocked ? new Date() : null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [effectProgress.userId, effectProgress.effectId],
          set: {
            challengeProgress: newProgress,
            owned: justUnlocked,
            earnedAt: justUnlocked ? new Date() : (existing?.earnedAt ?? null),
            updatedAt: new Date(),
          },
        });

      if (justUnlocked) unlockedEffectIds.push(challenge.effectId);
    }

    return { unlockedEffectIds };
  }
}

export const storage = new DatabaseStorage();