import { type User, type InsertUser, type Plumber, type InsertPlumber, type Booking, type InsertBooking, type Category, type InsertCategory, users, plumbers, bookings, categories } from "../shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;

  // Plumbers
  getPlumber(id: string): Promise<Plumber | undefined>;
  getPlumberByUserId(userId: string): Promise<Plumber | undefined>;
  createPlumber(plumber: InsertPlumber): Promise<Plumber>;
  updatePlumber(id: string, plumber: Partial<Plumber>): Promise<Plumber | undefined>;
  getAvailablePlumbers(specialization?: string): Promise<Plumber[]>;
  getAllPlumbers(): Promise<Plumber[]>;

  // Bookings
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<Booking>): Promise<Booking | undefined>;
  getBookingsByUserId(userId: string): Promise<Booking[]>;
  getBookingsByPlumberId(plumberId: string): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  getPendingBookings(): Promise<Booking[]>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set({
      ...updateData,
      updatedAt: new Date(),
    }).where(eq(users.id, id)).returning();
    return user;
  }

  async getPlumber(id: string): Promise<Plumber | undefined> {
    const [plumber] = await db.select().from(plumbers).where(eq(plumbers.id, id));
    return plumber;
  }

  async getPlumberByUserId(userId: string): Promise<Plumber | undefined> {
    const [plumber] = await db.select().from(plumbers).where(eq(plumbers.userId, userId));
    return plumber;
  }

  async createPlumber(insertPlumber: InsertPlumber): Promise<Plumber> {
    const [plumber] = await db.insert(plumbers).values({
      ...insertPlumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return plumber;
  }

  async updatePlumber(id: string, updateData: Partial<Plumber>): Promise<Plumber | undefined> {
    const [plumber] = await db.update(plumbers).set({
      ...updateData,
      updatedAt: new Date(),
    }).where(eq(plumbers.id, id)).returning();
    return plumber;
  }

  async getAvailablePlumbers(specialization?: string): Promise<Plumber[]> {
    const allPlumbers = await db.select().from(plumbers).where(eq(plumbers.isAvailable, true));
    if (specialization) {
      return allPlumbers.filter(p => Array.isArray(p.specializations) && (p.specializations as string[]).includes(specialization));
    }
    return allPlumbers;
  }

  async getAllPlumbers(): Promise<Plumber[]> {
    return await db.select().from(plumbers);
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values({
      ...insertBooking,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return booking;
  }

  async updateBooking(id: string, updateData: Partial<Booking>): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings).set({
      ...updateData,
      updatedAt: new Date(),
    }).where(eq(bookings.id, id)).returning();
    return booking;
  }

  async getBookingsByUserId(userId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
  }

  async getBookingsByPlumberId(plumberId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.assignedPlumber, plumberId)).orderBy(desc(bookings.createdAt));
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getPendingBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.status, 'pending')).orderBy(desc(bookings.createdAt));
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }
}

export const storage = new DatabaseStorage();

