import { productDb as mockProductDb } from "@/lib/db";
import { getDatabase, isMongoDBAvailable } from "@/lib/mongodb-safe";
import { ObjectId } from "mongodb";
import type { Product } from "@/lib/types";

// Database abstraction layer without Redis
export class DatabaseService {
  private static mongoChecked = false;

  static async getProducts(options: {
    featured?: boolean;
    limit?: number;
    sort?: 'newest' | 'trending';
  } = {}): Promise<(Product & { _id: string })[]> {
    try {
      console.log(`Fetching products from database with options:`, options);
      
      if (!this.mongoChecked) {
        await this.checkMongoConnection();
      }

      if (isMongoDBAvailable()) {
        return await this.getMongoProducts(options);
      } else {
        return await this.getMockProducts(options);
      }
    } catch (error) {
      console.warn('Database connection failed, falling back to mock data:', error);
      return await this.getMockProducts(options);
    }
  }

  static async getProductById(id: string): Promise<(Product & { _id: string }) | null> {
    try {
      console.log(`Fetching product ${id} from database`);
      
      if (!this.mongoChecked) {
        await this.checkMongoConnection();
      }

      if (isMongoDBAvailable()) {
        return await this.getMongoProductById(id);
      } else {
        return await this.getMockProductById(id);
      }
    } catch (error) {
      console.warn('Product fetch failed, falling back to mock data:', error);
      return await this.getMockProductById(id);
    }
  }

  private static async checkMongoConnection() {
    this.mongoChecked = true;
    try {
      if (isMongoDBAvailable()) {
        console.log('MongoDB connection successful');
      } else {
        console.log('MongoDB not available, using mock data');
      }
    } catch (error) {
      console.warn('MongoDB connection check failed:', error);
    }
  }

  private static async getMongoProducts(options: {
    featured?: boolean;
    limit?: number;
    sort?: 'newest' | 'trending';
  }): Promise<(Product & { _id: string })[]> {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');
    
    const collection = db.collection<Product>('products');

    const pipeline: any[] = [];

    if (options.featured) {
      pipeline.push({ $match: { featured: true } });
    }

    if (options.sort === 'newest') {
      pipeline.push({ $sort: { createdAt: -1 } });
    } else if (options.sort === 'trending') {
      pipeline.push({ $sort: { views: -1, rating: -1 } });
    }

    if (options.limit) {
      pipeline.push({ $limit: options.limit });
    }

    const products = await collection.aggregate(pipeline).toArray();
    return products.map((product: any) => ({
      ...product,
      _id: product._id.toString()
    }));
  }

  private static async getMongoProductById(id: string): Promise<(Product & { _id: string }) | null> {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');
    
    const collection = db.collection<Product>('products');
    
    // Use ObjectId for lookup
    if (!ObjectId.isValid(id)) {
      return null;
    }
    
    const product = await collection.findOne({ _id: new ObjectId(id) as any });
    
    return product ? { 
      ...product, 
      _id: product._id.toString() 
    } : null;
  }

  private static async getMockProducts(options: {
    featured?: boolean;
    limit?: number;
    sort?: 'newest' | 'trending';
  }): Promise<(Product & { _id: string })[]> {
    const filters: any = {};
    if (options.featured) {
      filters.featured = true;
    }

    const products = await mockProductDb.find(filters);
    return products.map((p: any) => ({
      ...p,
      _id: p._id.toString()
    }));
  }

  private static async getMockProductById(id: string): Promise<(Product & { _id: string }) | null> {
    const products = await mockProductDb.find({});
    const product = products.find((p: any) => p._id === id);
    return product ? { ...product, _id: product._id.toString() } : null;
  }
}