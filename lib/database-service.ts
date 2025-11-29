import { getDatabase } from "@/lib/mongodb-safe";
import { ObjectId } from "mongodb";
import type { Product } from "@/lib/types";

// Database abstraction layer using MongoDB
export class DatabaseService {
  static async getProducts(options: {
    featured?: boolean;
    limit?: number;
    sort?: 'newest' | 'trending';
  } = {}): Promise<Product[]> {
    try {
      console.log(`Fetching products from database with options:`, options);
      return await this.getMongoProducts(options);
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Failed to fetch products from database');
    }
  }

  static async getProductById(id: string): Promise<Product | null> {
    try {
      console.log(`Fetching product ${id} from database`);
      return await this.getMongoProductById(id);
    } catch (error) {
      console.error('Product fetch failed:', error);
      throw new Error('Failed to fetch product from database');
    }
  }

  static async getCategories(): Promise<Array<{ name: string; count: number; image?: string }>> {
    try {
      console.log('Fetching categories from database');
      return await this.getMongoCategories();
    } catch (error) {
      console.error('Categories fetch failed:', error);
      throw new Error('Failed to fetch categories from database');
    }
  }

  // No connection check needed since we're using only MongoDB

  private static async getMongoProducts(options: {
    featured?: boolean;
    limit?: number;
    sort?: 'newest' | 'trending';
  }): Promise<Product[]> {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');
    
    const collection = db.collection<Product>('products');

    const pipeline: any[] = [];

    if (options.featured) {
      pipeline.push({ $match: { isFeatured: true } });
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

  private static async getMongoProductById(id: string): Promise<Product | null> {
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

  private static async getMongoCategories(): Promise<Array<{ name: string; count: number; image?: string }>> {
    const db = await getDatabase();
    if (!db) throw new Error('Database not available');
    
    // First, get categories from the categories collection
    const categoriesCollection = db.collection<any>('categories');
    const categoriesList = await categoriesCollection.find({}).toArray();
    
    // Then get product counts for each category
    const productsCollection = db.collection<Product>('products');
    
    const result = await Promise.all(
      categoriesList.map(async (cat) => {
        const count = await productsCollection.countDocuments({ category: cat.name });
        return {
          name: cat.name,
          count,
          image: cat.image || undefined
        };
      })
    );
    
    // Filter out categories with no products and sort by count
    return result.filter(cat => cat.count > 0).sort((a, b) => b.count - a.count);
  }

  // Mock methods removed as we're using MongoDB exclusively
}