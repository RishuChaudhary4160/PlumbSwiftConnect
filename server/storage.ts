import { type User, type InsertUser, type Plumber, type InsertPlumber, type Booking, type InsertBooking, type Category, type InsertCategory } from "@shared/schema";
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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private plumbers: Map<string, Plumber>;
  private bookings: Map<string, Booking>;
  private categories: Map<string, Category>;

  constructor() {
    this.users = new Map();
    this.plumbers = new Map();
    this.bookings = new Map();
    this.categories = new Map();
    
    this.initializeCategories();
    this.initializeSampleData();
  }

  private initializeCategories() {
    const defaultCategories = [
      { id: randomUUID(), name: "Leak Repair", description: "Fix dripping faucets, pipe leaks, and water damage", icon: "tint", isActive: true },
      { id: randomUUID(), name: "Installation", description: "Expert installation of fixtures, pipes, and water systems", icon: "tools", isActive: true },
      { id: randomUUID(), name: "Maintenance", description: "Regular maintenance to prevent costly future repairs", icon: "clipboard-check", isActive: true },
      { id: randomUUID(), name: "Emergency", description: "24/7 emergency response for urgent plumbing issues", icon: "exclamation-triangle", isActive: true },
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  private initializeSampleData() {
    // Create admin user
    const adminId = randomUUID();
    const admin: User = {
      id: adminId,
      name: "Admin User",
      email: "admin@plumbpro.com",
      password: "$2b$10$hashedpassword", // In real app, this would be properly hashed
      phone: "+1 (555) 000-0000",
      role: "admin",
      address: "PlumbPro HQ",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminId, admin);

    // Create sample plumber
    const plumberUserId = randomUUID();
    const plumberUser: User = {
      id: plumberUserId,
      name: "Mike Johnson",
      email: "mike@plumbpro.com",
      password: "$2b$10$hashedpassword",
      phone: "+1 (555) 123-4567",
      role: "plumber",
      address: "123 Service St",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(plumberUserId, plumberUser);

    const plumberId = randomUUID();
    const plumber: Plumber = {
      id: plumberId,
      userId: plumberUserId,
      specializations: ["Leak Repair", "Installation", "Emergency"],
      isAvailable: true,
      isVerified: true,
      experienceYears: 8,
      rating: 49, // 4.9 * 10 for storage
      totalJobs: 127,
      licenseNumber: "PL-12345",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.plumbers.set(plumberId, plumber);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      name: insertUser.name,
      email: insertUser.email,
      password: insertUser.password,
      phone: insertUser.phone,
      role: insertUser.role,
      address: insertUser.address || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updateData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Plumber methods
  async getPlumber(id: string): Promise<Plumber | undefined> {
    return this.plumbers.get(id);
  }

  async getPlumberByUserId(userId: string): Promise<Plumber | undefined> {
    return Array.from(this.plumbers.values()).find(plumber => plumber.userId === userId);
  }

  async createPlumber(insertPlumber: InsertPlumber): Promise<Plumber> {
    const id = randomUUID();
    const plumber: Plumber = {
      id,
      userId: insertPlumber.userId,
      specializations: Array.isArray(insertPlumber.specializations) ? insertPlumber.specializations : [],
      isAvailable: insertPlumber.isAvailable ?? true,
      isVerified: insertPlumber.isVerified ?? false,
      experienceYears: insertPlumber.experienceYears ?? null,
      rating: insertPlumber.rating ?? null,
      totalJobs: insertPlumber.totalJobs ?? null,
      licenseNumber: insertPlumber.licenseNumber ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.plumbers.set(id, plumber);
    return plumber;
  }

  async updatePlumber(id: string, updateData: Partial<Plumber>): Promise<Plumber | undefined> {
    const plumber = this.plumbers.get(id);
    if (!plumber) return undefined;

    const updatedPlumber = { ...plumber, ...updateData, updatedAt: new Date() };
    this.plumbers.set(id, updatedPlumber);
    return updatedPlumber;
  }

  async getAvailablePlumbers(specialization?: string): Promise<Plumber[]> {
    return Array.from(this.plumbers.values()).filter(plumber => {
      if (!plumber.isAvailable || !plumber.isVerified) return false;
      if (specialization && !plumber.specializations.includes(specialization)) return false;
      return true;
    });
  }

  async getAllPlumbers(): Promise<Plumber[]> {
    return Array.from(this.plumbers.values());
  }

  // Booking methods
  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = {
      id,
      userId: insertBooking.userId,
      category: insertBooking.category,
      description: insertBooking.description,
      address: insertBooking.address,
      phone: insertBooking.phone,
      preferredDate: insertBooking.preferredDate ?? null,
      status: (insertBooking.status as any) || 'pending',
      assignedPlumber: insertBooking.assignedPlumber ?? null,
      assignmentHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, updateData: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const updatedBooking = { ...booking, ...updateData, updatedAt: new Date() };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async getBookingsByUserId(userId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.userId === userId);
  }

  async getBookingsByPlumberId(plumberId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.assignedPlumber === plumberId);
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getPendingBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.status === 'pending');
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(category => category.isActive);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = {
      ...insertCategory,
      description: insertCategory.description || null,
      icon: insertCategory.icon || null,
      isActive: insertCategory.isActive !== undefined ? insertCategory.isActive : true,
      id,
    };
    this.categories.set(id, category);
    return category;
  }
}

export const storage = new MemStorage();
