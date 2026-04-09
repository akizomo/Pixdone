import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  boolean,
  integer,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: varchar("password"),
  emailVerified: boolean("email_verified").default(false),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  themeKey: varchar("theme_key").default('arcade'),
  // PixDone+ subscription
  subscriptionPlan: varchar("subscription_plan").default('free'),         // 'free' | 'plus'
  billingCycle: varchar("billing_cycle"),                                  // 'monthly' | 'yearly' | null
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  trialEnd: timestamp("trial_end"),                                         // 無料トライアル終了日
  unlockedThemes: jsonb("unlocked_themes").default([]),                   // AI生成テーマID配列 (将来用)
  customSoundEffect: varchar("custom_sound_effect"),                      // カスタムSE (データモデルのみ)
  activeSEId: varchar("active_se_id"),                                    // SEオーバーライド (将来用)
  aiThemeCredits: integer("ai_theme_credits").notNull().default(0),       // AIテーマ生成クレジット (将来用)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_stripe_customer_id").on(table.stripeCustomerId),
]);

// Task lists table
export const taskLists = pgTable("task_lists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  details: text("details"),
  completed: boolean("completed").default(false),
  dueDate: varchar("due_date"),
  repeat: varchar("repeat"),
  listId: integer("list_id").notNull().references(() => taskLists.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Effect progress table
export const effectProgress = pgTable("effect_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  effectId: varchar("effect_id").notNull(),
  owned: boolean("owned").notNull().default(false),
  equippedLevel: integer("equipped_level").notNull().default(1),
  evolutionProgress: integer("evolution_progress").notNull().default(0),
  challengeProgress: integer("challenge_progress").notNull().default(0),
  earnedAt: timestamp("earned_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("user_effect_uniq").on(t.userId, t.effectId),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  taskLists: many(taskLists),
  tasks: many(tasks),
}));

export const taskListsRelations = relations(taskLists, ({ one, many }) => ({
  user: one(users, {
    fields: [taskLists.userId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  taskList: one(taskLists, {
    fields: [tasks.listId],
    references: [taskLists.id],
  }),
}));

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskList = typeof taskLists.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type InsertTaskList = typeof taskLists.$inferInsert;
export type EffectProgressRow = typeof effectProgress.$inferSelect;
export type InsertEffectProgress = typeof effectProgress.$inferInsert;