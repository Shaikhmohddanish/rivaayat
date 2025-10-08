export interface User {
  _id?: string
  name: string
  email: string
  password?: string
  role: "user" | "admin"
  image?: string
  provider?: "credentials" | "google"
  phone?: string
  dateOfBirth?: Date | string
  addresses?: Address[] // For backward compatibility
  addressIds?: string[] // New reference-based approach
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  _id?: string
  type: "home" | "work" | "billing" | "shipping"
  firstName: string
  lastName: string
  company?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  isDefault: boolean
}

export interface ProductImage {
  publicId: string
  url: string
  sortOrder: number
}

export interface ProductVariant {
  color: string
  size: string
}

export interface Product {
  _id?: string
  name: string
  slug: string
  description: string
  images: ProductImage[]
  price: number
  isFeatured: boolean
  category?: string
  subcategory?: string
  brand?: string
  tags?: string[]
  rating?: number
  variations: {
    colors: string[]
    sizes: string[]
    variants: ProductVariant[]
  }
  createdAt: Date
  updatedAt: Date
}

// Re-export SearchableProduct for backward compatibility
export interface SearchableProduct extends Product {
  category?: string
  subcategory?: string
  brand?: string
  tags?: string[]
  rating?: number
}

export interface Order {
  _id?: string
  userId: string
  items: OrderItem[]
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

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  variant: {
    color: string
    size: string
  }
}

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  color: string
  size: string
  image: string
}

export interface Coupon {
  _id?: string
  code: string
  discountPercent: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
