import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in Indian Rupees
 * @param amount - The amount to format
 * @param locale - The locale to use (default: 'en-IN')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, locale: string = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format price with Indian Rupee symbol
 * @param price - The price to format
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`
}

/**
 * Format price range
 * @param min - Minimum price
 * @param max - Maximum price  
 * @returns Formatted price range string
 */
export function formatPriceRange(min: number, max: number): string {
  return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`
}
