import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPlumberSchema, insertBookingSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "your-secret-key";

// Middleware for authentication
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Plumber assignment algorithm
async function assignPlumberToBooking(bookingId: string, category: string) {
  try {
    const availablePlumbers = await storage.getAvailablePlumbers(category);

    if (availablePlumbers.length === 0) {
      console.log(`No available plumbers for category: ${category}`);
      return null;
    }

    // Simple assignment: pick the plumber with the highest rating
    const assignedPlumber = availablePlumbers.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

    // Update booking with assigned plumber
    const booking = await storage.updateBooking(bookingId, {
      assignedPlumber: assignedPlumber.id,
      status: 'assigned',
      assignmentHistory: [{
        plumberId: assignedPlumber.id,
        assignedAt: new Date(),
        status: 'assigned',
      }]
    });

    // In a real app, this would send SMS/email notification
    console.log(`Plumber ${assignedPlumber.id} assigned to booking ${bookingId}`);

    return assignedPlumber;
  } catch (error) {
    console.error('Error assigning plumber:', error);
    return null;
  }
}

// Re-assign plumber when job is rejected
async function reassignPlumber(bookingId: string, rejectedPlumberId: string) {
  try {
    const booking = await storage.getBooking(bookingId);
    if (!booking) return null;

    // Get available plumbers excluding the one who rejected
    const availablePlumbers = await storage.getAvailablePlumbers(booking.category);
    const filteredPlumbers = availablePlumbers.filter(p => p.id !== rejectedPlumberId);

    if (filteredPlumbers.length === 0) {
      // No other plumbers available
      await storage.updateBooking(bookingId, {
        status: 'pending',
        assignedPlumber: null,
      });
      return null;
    }

    // Assign to next best plumber
    const nextPlumber = filteredPlumbers.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

    // Update assignment history
    const updatedHistory = [...(booking.assignmentHistory || []), {
      plumberId: nextPlumber.id,
      assignedAt: new Date(),
      status: 'assigned',
    }];

    await storage.updateBooking(bookingId, {
      assignedPlumber: nextPlumber.id,
      status: 'assigned',
      assignmentHistory: updatedHistory,
    });

    console.log(`Booking ${bookingId} reassigned to plumber ${nextPlumber.id}`);
    return nextPlumber;
  } catch (error) {
    console.error('Error reassigning plumber:', error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // If user is a plumber, create plumber profile
      if (userData.role === 'plumber') {
        await storage.createPlumber({
          userId: user.id,
          specializations: [],
          isAvailable: false, // Needs admin approval
          isVerified: false,
          experienceYears: 0,
          rating: 0,
          totalJobs: 0,
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: "Registration failed", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email: rawEmail, password } = req.body;
      const email = rawEmail?.toLowerCase().trim();

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      console.log(`Login attempt for: ${email}`);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`User not found: ${email}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log(`Password valid: ${isPasswordValid}`);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Bookings
  app.post("/api/bookings", authenticateToken, async (req: any, res) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.userId,
      });

      const booking = await storage.createBooking(bookingData);

      // Automatically assign a plumber
      const assignedPlumber = await assignPlumberToBooking(booking.id, booking.category);

      res.json({
        booking,
        assignedPlumber,
        message: assignedPlumber
          ? "Booking created and plumber assigned successfully"
          : "Booking created, but no plumbers available at the moment"
      });
    } catch (error) {
      console.error('Booking creation error:', error);
      res.status(400).json({ message: "Failed to create booking", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/bookings", authenticateToken, async (req: any, res) => {
    try {
      let bookings: any[] = [];

      if (req.user.role === 'admin') {
        bookings = await storage.getAllBookings();
      } else if (req.user.role === 'plumber') {
        const plumber = await storage.getPlumberByUserId(req.user.userId);
        if (plumber) {
          bookings = await storage.getBookingsByPlumberId(plumber.id);
        } else {
          bookings = [];
        }
      } else {
        bookings = await storage.getBookingsByUserId(req.user.userId);
      }

      res.json(bookings);
    } catch (error) {
      console.error('Fetch bookings error:', error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.patch("/api/bookings/:id/status", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Handle plumber job acceptance/rejection
      if (req.user.role === 'plumber') {
        const plumber = await storage.getPlumberByUserId(req.user.userId);
        if (!plumber || booking.assignedPlumber !== plumber.id) {
          return res.status(403).json({ message: "Not authorized to update this booking" });
        }

        if (status === 'rejected') {
          // Reassign to another plumber
          const newPlumber = await reassignPlumber(id, plumber.id);

          return res.json({
            message: newPlumber
              ? "Job rejected and reassigned to another plumber"
              : "Job rejected, no other plumbers available",
            reassigned: !!newPlumber
          });
        }
      }

      const updatedBooking = await storage.updateBooking(id, { status });
      res.json(updatedBooking);
    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Plumber routes
  app.get("/api/plumbers", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const plumbers = await storage.getAllPlumbers();

      // Enrich with user data
      const enrichedPlumbers = await Promise.all(
        plumbers.map(async (plumber) => {
          const user = await storage.getUser(plumber.userId);
          return { ...plumber, user };
        })
      );

      res.json(enrichedPlumbers);
    } catch (error) {
      console.error('Fetch plumbers error:', error);
      res.status(500).json({ message: "Failed to fetch plumbers" });
    }
  });

  app.patch("/api/plumbers/:id/verify", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { isVerified } = req.body;

      const updatedPlumber = await storage.updatePlumber(id, {
        isVerified,
        isAvailable: isVerified // Make available when verified
      });

      if (!updatedPlumber) {
        return res.status(404).json({ message: "Plumber not found" });
      }

      res.json(updatedPlumber);
    } catch (error) {
      console.error('Verify plumber error:', error);
      res.status(500).json({ message: "Failed to verify plumber" });
    }
  });

  app.post("/api/plumbers/onboard", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { name, email, phone, password, specializations, experienceYears, licenseNumber } = req.body;

      // Create user account
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'plumber',
        address: '',
      });

      // Create plumber profile
      const plumber = await storage.createPlumber({
        userId: user.id,
        specializations: specializations || [],
        isAvailable: true,
        isVerified: true,
        experienceYears: experienceYears || 0,
        rating: 0,
        totalJobs: 0,
        licenseNumber,
      });

      res.json({ user, plumber });
    } catch (error) {
      console.error('Onboard plumber error:', error);
      res.status(400).json({ message: "Failed to onboard plumber", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allBookings = await storage.getAllBookings();
      const allPlumbers = await storage.getAllPlumbers();
      const allUsers = await storage.getAllUsers();

      const stats = {
        totalBookings: allBookings.length,
        activePlumbers: allPlumbers.filter(p => p.isVerified && p.isAvailable).length,
        totalCustomers: allUsers.filter(u => u.role === 'user').length,
        pendingBookings: allBookings.filter(b => b.status === 'pending').length,
        completedBookings: allBookings.filter(b => b.status === 'completed').length,
      };

      res.json(stats);
    } catch (error) {
      console.error('Fetch dashboard stats error:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
