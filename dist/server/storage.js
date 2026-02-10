import { users, tasks, taskLists, } from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, desc } from "drizzle-orm";
export class DatabaseStorage {
    // User operations
    // (IMPORTANT) these user operations are mandatory for Replit Auth.
    async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }
    async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
    }
    async upsertUser(userData) {
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
    async ensureDefaultTaskList(userId) {
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
    async getUserTasks(userId) {
        return await db
            .select()
            .from(tasks)
            .where(eq(tasks.userId, userId))
            .orderBy(desc(tasks.createdAt));
    }
    async createTask(task) {
        const [newTask] = await db.insert(tasks).values(task).returning();
        return newTask;
    }
    async updateTask(taskId, updates) {
        const [updatedTask] = await db
            .update(tasks)
            .set({ ...updates })
            .where(eq(tasks.id, taskId))
            .returning();
        return updatedTask;
    }
    async deleteTask(taskId) {
        await db.delete(tasks).where(eq(tasks.id, taskId));
    }
    // TaskList operations
    async getUserTaskLists(userId) {
        return await db
            .select()
            .from(taskLists)
            .where(eq(taskLists.userId, userId))
            .orderBy(desc(taskLists.createdAt));
    }
    async createTaskList(taskList) {
        const [newTaskList] = await db.insert(taskLists).values(taskList).returning();
        return newTaskList;
    }
    async updateTaskList(listId, updates) {
        const [updatedTaskList] = await db
            .update(taskLists)
            .set({ ...updates })
            .where(eq(taskLists.id, listId))
            .returning();
        return updatedTaskList;
    }
    async deleteTaskList(listId) {
        // First delete all tasks in the list
        await db.delete(tasks).where(eq(tasks.listId, listId));
        // Then delete the list
        await db.delete(taskLists).where(eq(taskLists.id, listId));
    }
    async getTasksByListId(listId, userId) {
        return await db
            .select()
            .from(tasks)
            .where(and(eq(tasks.listId, listId), eq(tasks.userId, userId)))
            .orderBy(desc(tasks.createdAt));
    }
}
export const storage = new DatabaseStorage();
