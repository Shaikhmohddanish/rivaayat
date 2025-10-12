/**
 * Utility functions for generating and validating product slugs
 */

/**
 * Generate an SEO-friendly slug from a product name
 * 
 * @param name - The product name to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()                            // Convert to lowercase
    .trim()                                   // Remove leading/trailing spaces
    .replace(/[^\w\s-]/g, '')                // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')                    // Replace spaces with hyphens
    .replace(/-+/g, '-')                     // Remove consecutive hyphens
    .replace(/^-+|-+$/g, '')                 // Remove leading/trailing hyphens
    .replace(/^the-|^a-|^an-/, '')           // Remove common articles from beginning (SEO improvement)
}

/**
 * Make a slug unique by appending a counter or timestamp if needed
 * 
 * @param baseSlug - The original slug
 * @param isUnique - Whether the slug is already unique
 * @param attempt - The current attempt number (for recursion)
 * @returns A unique slug
 */
export function makeSlugUnique(baseSlug: string, isUnique: boolean = true, attempt: number = 1): string {
  if (isUnique) return baseSlug
  
  // For first attempt, use a short timestamp suffix
  if (attempt === 1) {
    const timestamp = Date.now().toString().slice(-5)
    return `${baseSlug}-${timestamp}`
  }
  
  // For subsequent attempts, use a counter
  return `${baseSlug}-${attempt}`
}

/**
 * Get keyword-rich terms from a product name for SEO purposes
 * 
 * @param name - The product name
 * @returns An array of important keywords
 */
export function extractKeywords(name: string): string[] {
  // Remove common stop words
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with']
  
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
}