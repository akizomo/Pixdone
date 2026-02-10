import {
  users,
  tasks,
  taskLists,
  type User,
  type UpsertUser,
  type Task,
  type TaskList,
  type InsertTask,
  type InsertTaskList,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcrypt";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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
}

export class DatabaseStorage implements IStorage {
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
}

export const storage = new DatabaseStorage();