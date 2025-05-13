import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { LoginRequest, AdminLoginRequest, insertTargetSchema, updateTargetSchema, updateInventorySchema } from "@shared/schema";
import session from 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: number;
    storeId: number;
    isAdmin: boolean;
    loginTime: Date;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'reckitt-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    }
  }));

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId || !req.session.isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };

  // Helper function to calculate login status
  const getLoginStatus = (loginTime: Date): string => {
    const hour = loginTime.getHours();
    const minute = loginTime.getMinutes();
    
    if (hour < 8) {
      return 'early';
    } else if (hour === 8 && minute <= 30) {
      return 'ontime';
    } else {
      return 'late';
    }
  };

  // Calculate distance between coordinates (haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // in meters
  };

  // Check if user is at store location
  const isUserAtStoreLocation = (storeCoords: string, userCoords: { latitude: number, longitude: number }): boolean => {
    const [storeLat, storeLng] = storeCoords.split(',').map(parseFloat);
    const { latitude: userLat, longitude: userLng } = userCoords;
    
    // Calculate distance in meters
    const distance = calculateDistance(storeLat, storeLng, userLat, userLng);
    
    // Allow if within 500 meters of the store
    return distance <= 30000;
  };

  // API Routes
  app.get('/api/stores', async (req, res) => {
    try {
      const stores = await storage.getStores();
      res.json(stores);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const loginSchema = z.object({
        phone: z.string(),
        storeId: z.number(),
        coordinates: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
        faceScan: z.string().optional(), // In a real app, this would be required
      });

      const data = loginSchema.parse(req.body) as LoginRequest;
      
      // Check if user exists
      const user = await storage.getUserByPhone(data.phone);
      if (!user) {
        return res.status(401).json({ message: 'User not found with this phone number' });
      }
      
      // Check if user belongs to the specified store
      if (user.storeId !== data.storeId) {
        return res.status(403).json({ message: 'You are not authorized to access this store' });
      }

      // Check location
      const store = await storage.getStore(data.storeId);
      if (!store) {
        return res.status(404).json({ message: 'Store not found' });
      }

      if (!isUserAtStoreLocation(store.coordinates, data.coordinates)) {
        return res.status(403).json({ message: 'You must be at the store location to login' });
      }
      
      // Create attendance record
      const now = new Date();
      const loginStatus = getLoginStatus(now);
      
      const attendance = await storage.createAttendance({
        userId: user.id,
        storeId: user.storeId,
        loginTime: now,
        loginStatus,
        faceScanLogin: data.faceScan // Use the faceScan from the login request
      });

      // Set session data
      req.session.userId = user.id;
      req.session.storeId = user.storeId;
      req.session.isAdmin = false;
      req.session.loginTime = now;

      // Get or create today's targets
      let target = await storage.getTargetByUserIdAndDate(user.id, now);
      
      if (!target) {
        target = await storage.createTarget({
          userId: user.id,
          storeId: user.storeId,
          engagementDailyTarget: 50, // Default values
          conversationDailyTarget: 30, // Default values
          date: now,
        });
      }

      // Get store inventory
      const storeData = await storage.getStoreWithProducts(user.storeId);

      res.json({
        user,
        store,
        attendance,
        target,
        inventory: storeData?.inventory || [],
        loginStatus,
      });
      
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/admin/login', async (req, res) => {
    try {
      const loginSchema = z.object({
        phone: z.string(),
        password: z.string(),
      });

      const data = loginSchema.parse(req.body) as AdminLoginRequest;
      
      // Check if admin exists
      const user = await storage.getUserByPhone(data.phone);
      if (!user || !user.isAdmin) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // In a real app, we'd check the password hash
      if (user.password !== data.password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Set session data
      req.session.userId = user.id;
      req.session.storeId = user.storeId;
      req.session.isAdmin = true;
      req.session.loginTime = new Date();

      // Get all stores, attendance, and targets for admin dashboard
      const stores = await storage.getStores();
      const attendance = await storage.getAllAttendance();
      
      // Get today's attendance count by status
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance.filter(a => 
        new Date(a.loginTime).toISOString().split('T')[0] === today
      );
      
      const earlyCount = todayAttendance.filter(a => a.loginStatus === 'early').length;
      const ontimeCount = todayAttendance.filter(a => a.loginStatus === 'ontime').length;
      const lateCount = todayAttendance.filter(a => a.loginStatus === 'late').length;

      res.json({
        user,
        stores,
        attendance,
        summary: {
          totalStores: stores.length,
          activeStores: todayAttendance.map(a => a.storeId).filter((v, i, a) => a.indexOf(v) === i).length,
          earlyCount,
          ontimeCount,
          lateCount,
        }
      });
      
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/logout', requireAuth, async (req, res) => {
    try {
      const faceScanSchema = z.object({
        faceScan: z.string().optional(), // In a real app, this would be required
      });

      const { faceScan } = faceScanSchema.parse(req.body);
      
      // Update attendance record for logout
      const userId = req.session.userId!;
      const latestAttendance = await storage.getLatestAttendance(userId);
      
      if (latestAttendance && !latestAttendance.logoutTime) {
        const now = new Date();
        const loginTime = new Date(latestAttendance.loginTime);
        const durationMinutes = Math.round((now.getTime() - loginTime.getTime()) / (1000 * 60));
        
        await storage.updateAttendance(latestAttendance.id, {
          logoutTime: now,
          duration: durationMinutes,
          faceScanLogout: faceScan || null,
        });
      }

      // Clear session
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to logout' });
        }
        res.json({ message: 'Logged out successfully' });
      });
      
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/user/current', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const storeId = req.session.storeId!;
      
      const user = await storage.getUser(userId);
      const store = await storage.getStore(storeId);
      const latestAttendance = await storage.getLatestAttendance(userId);
      
      if (!user || !store) {
        return res.status(404).json({ message: 'User or store not found' });
      }

      const now = new Date();
      const target = await storage.getTargetByUserIdAndDate(userId, now);

      res.json({
        user,
        store,
        attendance: latestAttendance,
        target,
      });
      
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/targets/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const target = await storage.updateTarget(id, updateTargetSchema.parse(req.body));
      
      if (!target) {
        return res.status(404).json({ message: 'Target not found' });
      }
      
      res.json(target);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/inventory/store/:storeId', requireAuth, async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const inventory = await storage.getInventoryByStoreId(storeId);
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/inventory/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const inventory = await storage.updateInventory(id, updateInventorySchema.parse(req.body));
      
      if (!inventory) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
      
      res.json(inventory);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/brands', requireAuth, async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get('/api/admin/attendance', requireAdmin, async (req, res) => {
    try {
      const attendance = await storage.getAllAttendance();
      res.json(attendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/stores', requireAdmin, async (req, res) => {
    try {
      const stores = await storage.getStores();
      res.json(stores);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Add route to get all targets for admin
  app.get('/api/admin/targets', requireAdmin, async (req, res) => {
    try {
      const stores = await storage.getStores();
      const allTargets = [];
      
      // Get targets for each store
      for (const store of stores) {
        const storeTargets = await storage.getTargetsByStoreId(store.id);
        allTargets.push(...storeTargets);
      }
      
      res.json(allTargets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/summary', requireAdmin, async (req, res) => {
    try {
      const stores = await storage.getStores();
      const attendance = await storage.getAllAttendance();
      
      // Get today's attendance count by status
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance.filter(a => 
        new Date(a.loginTime).toISOString().split('T')[0] === today
      );
      
      const earlyCount = todayAttendance.filter(a => a.loginStatus === 'early').length;
      const ontimeCount = todayAttendance.filter(a => a.loginStatus === 'ontime').length;
      const lateCount = todayAttendance.filter(a => a.loginStatus === 'late').length;

      res.json({
        totalStores: stores.length,
        activeStores: todayAttendance.map(a => a.storeId).filter((v, i, a) => a.indexOf(v) === i).length,
        earlyCount,
        ontimeCount,
        lateCount,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
