import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull().$type<'user' | 'plumber' | 'admin'>(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const plumbers = pgTable("plumbers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  specializations: jsonb("specializations").$type<string[]>().default([]).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  experienceYears: integer("experience_years"),
  rating: integer("rating").default(0),
  totalJobs: integer("total_jobs").default(0),
  licenseNumber: text("license_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  preferredDate: timestamp("preferred_date"),
  status: text("status").$type<'pending' | 'assigned' | 'accepted' | 'rejected' | 'in-progress' | 'completed' | 'cancelled'>().default('pending').notNull(),
  assignedPlumber: varchar("assigned_plumber").references(() => plumbers.id),
  assignmentHistory: jsonb("assignment_history").$type<Array<{
    plumberId: string;
    assignedAt: Date;
    status: string;
    respondedAt?: Date;
  }>>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlumberSchema = createInsertSchema(plumbers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  assignmentHistory: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPlumber = z.infer<typeof insertPlumberSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type User = typeof users.$inferSelect;
export type Plumber = typeof plumbers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Category = typeof categories.$inferSelect;
