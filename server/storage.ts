import {
  User,
  Store,
  Attendance,
  Target,
  Brand,
  Product,
  Inventory,
  InsertUser,
  InsertStore,
  InsertAttendance,
  UpdateAttendance,
  InsertTarget,
  UpdateTarget,
  InsertBrand,
  InsertProduct,
  InsertInventory,
  UpdateInventory,
  StoreWithProducts,
  FullTarget,
  FullAttendance,
} from "@shared/schema";

// Modify the interface with CRUD methods required
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Store methods
  getStore(id: number): Promise<Store | undefined>;
  getStores(): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  getStoreByCoordinates(coordinates: string): Promise<Store | undefined>;
  
  // Attendance methods
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, data: UpdateAttendance): Promise<Attendance | undefined>;
  getAttendanceByUserId(userId: number): Promise<Attendance[]>;
  getAttendanceByStoreId(storeId: number): Promise<Attendance[]>;
  getLatestAttendance(userId: number): Promise<Attendance | undefined>;
  getAllAttendance(): Promise<FullAttendance[]>;
  
  // Target methods
  createTarget(target: InsertTarget): Promise<Target>;
  updateTarget(id: number, data: UpdateTarget): Promise<Target | undefined>;
  getTargetByUserIdAndDate(userId: number, date: Date): Promise<Target | undefined>;
  getTargetsByStoreId(storeId: number): Promise<FullTarget[]>;
  
  // Brand methods
  getBrands(): Promise<Brand[]>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  
  // Product methods
  getProducts(): Promise<Product[]>;
  getProductsByBrandId(brandId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Inventory methods
  createInventory(inventory: InsertInventory): Promise<Inventory>;
  updateInventory(id: number, data: UpdateInventory): Promise<Inventory | undefined>;
  getInventoryByStoreId(storeId: number): Promise<(Inventory & { product: Product & { brand: Brand } })[]>;
  getInventoryByProductId(productId: number): Promise<Inventory[]>;
  getStoreWithProducts(storeId: number): Promise<StoreWithProducts | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stores: Map<number, Store>;
  private attendance: Map<number, Attendance>;
  private targets: Map<number, Target>;
  private brands: Map<number, Brand>;
  private products: Map<number, Product>;
  private inventory: Map<number, Inventory>;
  
  currentUserId: number;
  currentStoreId: number;
  currentAttendanceId: number;
  currentTargetId: number;
  currentBrandId: number;
  currentProductId: number;
  currentInventoryId: number;

  constructor() {
    this.users = new Map();
    this.stores = new Map();
    this.attendance = new Map();
    this.targets = new Map();
    this.brands = new Map();
    this.products = new Map();
    this.inventory = new Map();
    
    this.currentUserId = 1;
    this.currentStoreId = 1;
    this.currentAttendanceId = 1;
    this.currentTargetId = 1;
    this.currentBrandId = 1;
    this.currentProductId = 1;
    this.currentInventoryId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    try {
      // Create sample stores synchronously to avoid promises
      const storeData = [
        { name: "Lagos - Ikeja", location: "Ikeja, Lagos", coordinates: "6.5955,3.3671" },
        { name: "Lagos - Lekki", location: "Lekki, Lagos", coordinates: "6.593047,3.363732" },
        { name: "Abuja - Central", location: "Central, Abuja", coordinates: "9.0765,7.3986" },
        { name: "Port Harcourt", location: "Port Harcourt", coordinates: "4.8156,7.0498" }
      ];
      
      // Create stores directly instead of using async method
      storeData.forEach((storeInfo, index) => {
        const id = index + 1;
        const store: Store = { ...storeInfo, id };
        this.stores.set(id, store);
        this.currentStoreId = id + 1;
      });
      
      // Create admin user directly
      const adminId = this.currentUserId++;
      const adminUser: User = {
        id: adminId,
        phone: "+2348000000000",
        storeId: 1,
        isAdmin: true,
        password: "admin123"
      };
      this.users.set(adminId, adminUser);
      
      // Create regular users directly
      const userData = [
        { phone: "+2348001234567", storeId: 1 },
        { phone: "+2348012345678", storeId: 2 },
        { phone: "+2348023456789", storeId: 3 },
        { phone: "+2348034567890", storeId: 4 }
      ];
      
      userData.forEach(userInfo => {
        const id = this.currentUserId++;
        const user: User = { 
          ...userInfo, 
          id, 
          isAdmin: false,
          password: null 
        };
        this.users.set(id, user);
      });
      
      // Create brands directly
      const brandNames = ["Dettol", "Harpic", "Mortein", "Air Wick"];
      const brandIds: number[] = [];
      
      brandNames.forEach(name => {
        const id = this.currentBrandId++;
        const brand: Brand = { name, id };
        this.brands.set(id, brand);
        brandIds.push(id);
      });
      
      // Create products directly
      const productData = [
        { name: "Dettol Original Soap 100g", brandId: brandIds[0] },
        { name: "Dettol Cool Soap 100g", brandId: brandIds[0] },
        { name: "Harpic Power Plus 500ml", brandId: brandIds[1] },
        { name: "Mortein Instant Power Spray 300ml", brandId: brandIds[2] },
        { name: "Air Wick Freshmatic Refill Lavender", brandId: brandIds[3] }
      ];
      
      productData.forEach(productInfo => {
        const id = this.currentProductId++;
        const product: Product = { ...productInfo, id };
        this.products.set(id, product);
      });
      
      // Initialize inventory for each store
      for (let storeId = 1; storeId <= 4; storeId++) {
        for (let productId = 1; productId <= 5; productId++) {
          const id = this.currentInventoryId++;
          const inventory: Inventory = { 
            id,
            storeId,
            productId,
            openingStock: Math.floor(Math.random() * 100) + 50,
            date: new Date(),
            closingStock: null,
            unitsSold: null
          };
          this.inventory.set(id, inventory);
        }
      }
      
      // Initialize targets
      for (let userId = 2; userId <= 5; userId++) {
        const id = this.currentTargetId++;
        const target: Target = {
          id,
          userId,
          storeId: userId - 1,
          engagementDailyTarget: 50,
          conversationDailyTarget: 30,
          engagementAchieved: 0,
          conversationAchieved: 0,
          date: new Date()
        };
        this.targets.set(id, target);
      }
    } catch (error) {
      console.error("Error initializing data:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phone === phone
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin || false,  // Ensure isAdmin is always defined
      password: insertUser.password || null  // Ensure password is always defined
    };
    this.users.set(id, user);
    return user;
  }

  // Store methods
  async getStore(id: number): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async getStores(): Promise<Store[]> {
    return Array.from(this.stores.values());
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const id = this.currentStoreId++;
    const store: Store = { ...insertStore, id };
    this.stores.set(id, store);
    return store;
  }

  async getStoreByCoordinates(coordinates: string): Promise<Store | undefined> {
    return Array.from(this.stores.values()).find(
      (store) => this.isCoordinateInStore(store.coordinates, coordinates)
    );
  }

  private isCoordinateInStore(storeCoordinates: string, userCoordinates: string): boolean {
    // Simple implementation for demo purposes - in a real app would use proper geofencing
    const [storeLat, storeLng] = storeCoordinates.split(',').map(Number);
    const [userLat, userLng] = userCoordinates.split(',').map(Number);
    
    // Check if within ~500m (rough approximation)
    const latDiff = Math.abs(storeLat - userLat);
    const lngDiff = Math.abs(storeLng - userLng);
    
    return latDiff < 0.005 && lngDiff < 0.005;
  }

  // Attendance methods
  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.currentAttendanceId++;
    const attendance: Attendance = { ...insertAttendance, id, logoutTime: null, duration: null };
    this.attendance.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: number, data: UpdateAttendance): Promise<Attendance | undefined> {
    const attendance = this.attendance.get(id);
    if (!attendance) return undefined;
    
    const updated = { ...attendance, ...data };
    this.attendance.set(id, updated);
    return updated;
  }

  async getAttendanceByUserId(userId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (a) => a.userId === userId
    );
  }

  async getAttendanceByStoreId(storeId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (a) => a.storeId === storeId
    );
  }

  async getLatestAttendance(userId: number): Promise<Attendance | undefined> {
    const userAttendance = await this.getAttendanceByUserId(userId);
    if (userAttendance.length === 0) return undefined;
    
    return userAttendance.reduce((latest, current) => {
      if (!latest) return current;
      
      const latestDate = new Date(latest.loginTime).getTime();
      const currentDate = new Date(current.loginTime).getTime();
      
      return currentDate > latestDate ? current : latest;
    }, undefined as Attendance | undefined);
  }

  async getAllAttendance(): Promise<FullAttendance[]> {
    return Promise.all(
      Array.from(this.attendance.values()).map(async (a) => {
        const user = await this.getUser(a.userId);
        const store = await this.getStore(a.storeId);
        
        return {
          ...a,
          user: user!,
          store: store!,
        };
      })
    );
  }

  // Target methods
  async createTarget(insertTarget: InsertTarget): Promise<Target> {
    const id = this.currentTargetId++;
    const target: Target = { 
      ...insertTarget, 
      id,
      engagementAchieved: 0,
      conversationAchieved: 0
    };
    this.targets.set(id, target);
    return target;
  }

  async updateTarget(id: number, data: UpdateTarget): Promise<Target | undefined> {
    const target = this.targets.get(id);
    if (!target) return undefined;
    
    const updated = { ...target, ...data };
    this.targets.set(id, updated);
    return updated;
  }

  async getTargetByUserIdAndDate(userId: number, date: Date): Promise<Target | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    
    return Array.from(this.targets.values()).find((target) => {
      const targetDate = new Date(target.date).toISOString().split('T')[0];
      return target.userId === userId && targetDate === dateStr;
    });
  }

  async getTargetsByStoreId(storeId: number): Promise<FullTarget[]> {
    const targets = Array.from(this.targets.values()).filter(
      (t) => t.storeId === storeId
    );
    
    return Promise.all(
      targets.map(async (t) => {
        const user = await this.getUser(t.userId);
        const store = await this.getStore(t.storeId);
        
        return {
          ...t,
          user: user!,
          store: store!,
        };
      })
    );
  }

  // Brand methods
  async getBrands(): Promise<Brand[]> {
    return Array.from(this.brands.values());
  }

  async createBrand(insertBrand: InsertBrand): Promise<Brand> {
    const id = this.currentBrandId++;
    const brand: Brand = { ...insertBrand, id };
    this.brands.set(id, brand);
    return brand;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductsByBrandId(brandId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (p) => p.brandId === brandId
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  // Inventory methods
  async createInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const id = this.currentInventoryId++;
    const inventory: Inventory = { 
      ...insertInventory, 
      id, 
      closingStock: null, 
      unitsSold: null 
    };
    this.inventory.set(id, inventory);
    return inventory;
  }

  async updateInventory(id: number, data: UpdateInventory): Promise<Inventory | undefined> {
    const inventory = this.inventory.get(id);
    if (!inventory) return undefined;
    
    const unitsSold = inventory.openingStock - data.closingStock;
    const updated = { 
      ...inventory, 
      ...data,
      unitsSold 
    };
    
    this.inventory.set(id, updated);
    return updated;
  }

  async getInventoryByStoreId(storeId: number): Promise<(Inventory & { product: Product & { brand: Brand } })[]> {
    const inventoryItems = Array.from(this.inventory.values()).filter(
      (i) => i.storeId === storeId
    );
    
    const result = [];
    
    for (const item of inventoryItems) {
      try {
        const product = this.products.get(item.productId);
        if (!product) {
          console.error(`Product with ID ${item.productId} not found`);
          continue;
        }
        
        // Ensure brandId exists before trying to access the brand
        if (product.brandId === undefined) {
          console.error(`Product with ID ${item.productId} does not have a brandId`);
          continue;
        }
        
        const brand = this.brands.get(product.brandId);
        if (!brand) {
          console.error(`Brand with ID ${product.brandId} not found`);
          continue;
        }
        
        result.push({
          ...item,
          product: {
            ...product,
            brand
          }
        });
      } catch (error) {
        console.error(`Error processing inventory item:`, error);
      }
    }
    
    return result;
  }

  async getInventoryByProductId(productId: number): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(
      (i) => i.productId === productId
    );
  }

  async getStoreWithProducts(storeId: number): Promise<StoreWithProducts | undefined> {
    const store = await this.getStore(storeId);
    if (!store) return undefined;
    
    try {
      const inventory = await this.getInventoryByStoreId(storeId);
      
      return {
        ...store,
        inventory
      } as StoreWithProducts;
    } catch (error) {
      console.error("Error getting store inventory:", error);
      return {
        ...store,
        inventory: []
      } as StoreWithProducts;
    }
  }
}

export const storage = new MemStorage();
