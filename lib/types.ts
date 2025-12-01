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
  disabled?: boolean // Flag to disable user accounts
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
  stock: number  // Available quantity for this color-size combination
}

export interface Product {
  _id: string
  name: string
  slug: string
  description: string
  images: ProductImage[]
  price: number
  mrp?: number
  isFeatured: boolean
  category?: string
  subcategory?: string
  brand?: string
  material?: string
  detailsHtml?: string
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

export interface OrderTrackingStatus {
  status: "placed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled"
  timestamp: Date
  message: string
  updatedBy?: string // Admin user ID who updated the status
}

// Separate collection for order tracking events
export interface OrderTracking {
  _id?: string
  orderId: string // Reference to Order._id
  trackingNumber: string // For quick lookup
  userId: string // For user-specific queries
  events: OrderTrackingStatus[] // Array of tracking events
  currentStatus: OrderTrackingStatus['status'] // Denormalized for quick queries
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  _id?: string
  userId: string
  items: OrderItem[]
  status: "placed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled"
  trackingNumber?: string
  trackingHistory?: OrderTrackingStatus[] // Array of tracking events for backward compatibility
  tracking?: {
    carrier?: string
    trackingId?: string
    notes?: string
  }
  shippingAddress?: {
    fullName: string
    email: string
    phone: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    country: string
  }
  coupon?: {
    code: string
    discountPercent: number
  }
  createdAt: Date
  updatedAt?: Date
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
  // Support both formats for backward compatibility
  variant?: {
    color: string
    size: string
  }
  // Legacy format
  color?: string
  size?: string
  image: string
}

export interface Coupon {
  _id?: string
  code: string
  discountPercent: number
  isActive: boolean
  minOrderValue?: number
  expiryDate?: Date
  singleUse?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SiteSettings {
  _id: string
  contactPhone: string
  contactEmail: string
  freeShippingThreshold: number // Free shipping threshold (e.g., 1499)
  activePromoCouponCode?: string // Reference to active coupon code
  announcementBar: {
    isEnabled: boolean
    headline: string
    highlight: string
    subtext?: string
    badgeText?: string
    shippingText?: string
  }
  promoBanner: {
    isEnabled: boolean
    message: string
  }
  whatsapp: {
    isEnabled: boolean
    helperText: string
    defaultMessage: string
    number: string
  }
  createdAt?: Date | string
  updatedAt?: Date | string
}
