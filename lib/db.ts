// Mock database using in-memory storage
// Replace with actual database implementation when ready

interface Cart {
  _id: string
  userId: string
  items: Array<{
    productId: string
    name: string
    price: number
    variant: { color: string; size: string }
    quantity: number
    image?: string
  }>
  updatedAt: Date
}

interface Wishlist {
  _id: string
  userId: string
  productIds: string[]
  updatedAt: Date
}

interface Order {
  _id: string
  userId: string
  items: Array<{
    productId: string
    name: string
    price: number
    variant: { color: string; size: string }
    quantity: number
  }>
  status: "placed" | "processing" | "shipped" | "delivered" | "cancelled"
  tracking?: {
    carrier?: string
    trackingId?: string
    notes?: string
  }
  coupon?: {
    code: string
    discountPercent: number
  }
  createdAt: Date
}

interface Product {
  _id: string
  name: string
  slug: string
  description: string
  images: Array<{ publicId: string; url: string; sortOrder: number }>
  price: number
  isFeatured: boolean
  variations: {
    colors: string[]
    sizes: string[]
    variants: Array<{ color: string; size: string }>
  }
  createdAt: Date
  updatedAt: Date
}

// In-memory storage
const carts = new Map<string, Cart>()
const wishlists = new Map<string, Wishlist>()
const orders = new Map<string, Order>()
const products = new Map<string, Product>()

// Initialize with sample products
const sampleProducts: Product[] = [
  {
    _id: "1",
    name: "Elegant Silk Dress",
    slug: "elegant-silk-dress",
    description: "A beautiful flowing silk dress perfect for any occasion",
    images: [
      {
        publicId: "dress1",
        url: "/elegant-silk-dress.jpg",
        sortOrder: 0,
      },
    ],
    price: 129.99,
    isFeatured: true,
    variations: {
      colors: ["Black", "Navy", "Burgundy"],
      sizes: ["XS", "S", "M", "L", "XL"],
      variants: [
        { color: "Black", size: "S" },
        { color: "Black", size: "M" },
        { color: "Navy", size: "M" },
        { color: "Burgundy", size: "L" },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "2",
    name: "Classic Trench Coat",
    slug: "classic-trench-coat",
    description: "Timeless trench coat in premium fabric",
    images: [
      {
        publicId: "coat1",
        url: "/classic-trench-coat.png",
        sortOrder: 0,
      },
    ],
    price: 199.99,
    isFeatured: true,
    variations: {
      colors: ["Beige", "Black"],
      sizes: ["S", "M", "L"],
      variants: [
        { color: "Beige", size: "M" },
        { color: "Black", size: "L" },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

sampleProducts.forEach((p) => products.set(p._id, p))

// Cart operations
export const cartDb = {
  async findByUserId(userId: string): Promise<Cart | null> {
    return carts.get(userId) || null
  },

  async upsert(userId: string, items: Cart["items"]): Promise<Cart> {
    const cart: Cart = {
      _id: userId,
      userId,
      items,
      updatedAt: new Date(),
    }
    carts.set(userId, cart)
    return cart
  },

  async deleteItem(userId: string, productId: string, variant: { color: string; size: string }): Promise<boolean> {
    const cart = carts.get(userId)
    if (!cart) return false

    cart.items = cart.items.filter(
      (item) =>
        !(item.productId === productId && item.variant.color === variant.color && item.variant.size === variant.size),
    )
    cart.updatedAt = new Date()
    carts.set(userId, cart)
    return true
  },
}

// Wishlist operations
export const wishlistDb = {
  async findByUserId(userId: string): Promise<Wishlist | null> {
    return wishlists.get(userId) || null
  },

  async toggle(userId: string, productId: string): Promise<Wishlist> {
    let wishlist = wishlists.get(userId)

    if (!wishlist) {
      wishlist = {
        _id: userId,
        userId,
        productIds: [productId],
        updatedAt: new Date(),
      }
    } else {
      const index = wishlist.productIds.indexOf(productId)
      if (index > -1) {
        wishlist.productIds.splice(index, 1)
      } else {
        wishlist.productIds.push(productId)
      }
      wishlist.updatedAt = new Date()
    }

    wishlists.set(userId, wishlist)
    return wishlist
  },
}

// Order operations
export const orderDb = {
  async create(order: Omit<Order, "_id">): Promise<Order> {
    const id = Date.now().toString()
    const newOrder: Order = {
      _id: id,
      ...order,
    }
    orders.set(id, newOrder)
    return newOrder
  },

  async findById(id: string): Promise<Order | null> {
    return orders.get(id) || null
  },

  async findByUserId(userId: string): Promise<Order[]> {
    return Array.from(orders.values()).filter((order) => order.userId === userId)
  },
}

// Product operations
export const productDb = {
  async find(filters: {
    q?: string
    color?: string
    size?: string
    featured?: boolean
    limit?: number
    page?: number
  }): Promise<Product[]> {
    let results = Array.from(products.values())

    if (filters.q) {
      const query = filters.q.toLowerCase()
      results = results.filter(
        (p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query),
      )
    }

    if (filters.color) {
      results = results.filter((p) => p.variations.colors.includes(filters.color!))
    }

    if (filters.size) {
      results = results.filter((p) => p.variations.sizes.includes(filters.size!))
    }

    if (filters.featured !== undefined) {
      results = results.filter((p) => p.isFeatured === filters.featured)
    }

    const page = filters.page || 1
    const limit = filters.limit || 20
    const start = (page - 1) * limit
    const end = start + limit

    return results.slice(start, end)
  },

  async findById(id: string): Promise<Product | null> {
    return products.get(id) || null
  },

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    const product = products.get(id)
    if (!product) return null

    const updated = { ...product, ...updates, updatedAt: new Date() }
    products.set(id, updated)
    return updated
  },
}
