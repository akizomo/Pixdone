import { pgTable, text, varchar, timestamp, jsonb, index, boolean, integer, serial, } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable("sessions", {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
}, (table) => [index("IDX_session_expire").on(table.expire)]);
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
    // Premium entitlement for the Synthwave visual theme (Stripe one-time unlock).
    synthwavePremium: boolean("synthwave_premium").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
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
