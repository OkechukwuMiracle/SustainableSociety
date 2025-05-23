import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  storeId: integer("store_id").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  password: text("password"),
});

// Stores table
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  coordinates: text("coordinates").notNull(),
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  storeId: integer("store_id").notNull(),
  loginTime: timestamp("login_time").notNull(),
  loginStatus: text("login_status").notNull(), // early, ontime, late
  logoutTime: timestamp("logout_time"),
  duration: integer("duration"), // in minutes
  faceScanLogin: text("face_scan_login").notNull(),
  faceScanLogout: text("face_scan_logout"),
});

// Targets table
export const targets = pgTable("targets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  storeId: integer("store_id").notNull(),
  engagementDailyTarget: integer("engagement_daily_target").notNull(),
  engagementAchieved: integer("engagement_achieved").default(0).notNull(),
  conversationDailyTarget: integer("conversation_daily_target").notNull(),
  conversationAchieved: integer("conversation_achieved").default(0).notNull(),
  date: timestamp("date").notNull(),
});

// Brands table
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brandId: integer("brand_id").notNull(),
});

// Inventory table
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull(),
  productId: integer("product_id").notNull(),
  openingStock: integer("opening_stock").notNull(),
  closingStock: integer("closing_stock"),
  unitsSold: integer("units_sold"),
  date: timestamp("date").notNull(),
});

// Schema definitions
export const insertUserSchema = createInsertSchema(users).pick({
  phone: true,
  storeId: true,
  isAdmin: true,
  password: true,
});

export const insertStoreSchema = createInsertSchema(stores).pick({
  name: true,
  location: true,
  coordinates: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  userId: true,
  storeId: true,
  loginTime: true,
  loginStatus: true,
  faceScanLogin: true,
});

export const updateAttendanceSchema = createInsertSchema(attendance).pick({
  logoutTime: true,
  duration: true,
  faceScanLogout: true,
});

export const insertTargetSchema = createInsertSchema(targets).pick({
  userId: true,
  storeId: true,
  engagementDailyTarget: true,
  conversationDailyTarget: true,
  date: true,
});

export const updateTargetSchema = z.object({
  engagementDailyTarget: z.number().optional(),
  engagementAchieved: z.number().optional(),
  conversationDailyTarget: z.number().optional(),
  conversationAchieved: z.number().optional(),
});

export const insertBrandSchema = createInsertSchema(brands).pick({
  name: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  brandId: true,
});

export const insertInventorySchema = createInsertSchema(inventory).pick({
  storeId: true,
  productId: true,
  openingStock: true,
  date: true,
});

export const updateInventorySchema = z.object({
  closingStock: z.number(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type UpdateAttendance = z.infer<typeof updateAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export type InsertTarget = z.infer<typeof insertTargetSchema>;
export type UpdateTarget = z.infer<typeof updateTargetSchema>;
export type Target = typeof targets.$inferSelect;

export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brands.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type UpdateInventory = z.infer<typeof updateInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

// Additional types for frontend use
export type LoginRequest = {
  phone: string;
  storeId: number;
  coordinates: { latitude: number; longitude: number };
  faceScan: string; // base64 encoded image
};

export type AdminLoginRequest = {
  phone: string;
  password: string;
};

export type StoreWithProducts = Store & {
  inventory: (Inventory & { product: Product & { brand: Brand } })[];
};

export type FullTarget = Target & {
  user: User;
  store: Store;
};

export type FullAttendance = Attendance & {
  user: User;
  store: Store;
};

export type FullInventoryItem = Inventory & {
  product: Product & { brand: Brand };
  store: Store;
};