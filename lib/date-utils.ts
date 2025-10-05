/**
 * Date utility functions for handling IST timezone and dd/mm/yyyy format
 */

// IST timezone offset (+05:30)
export const IST_TIMEZONE = 'Asia/Kolkata'

/**
 * Get current date in IST timezone
 */
export function getCurrentDateIST(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: IST_TIMEZONE }))
}

/**
 * Format date to dd/mm/yyyy format
 */
export function formatDateDDMMYYYY(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: IST_TIMEZONE
  }).format(dateObj)
}

/**
 * Format date to dd/mm/yyyy with time
 */
export function formatDateTimeIST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: IST_TIMEZONE
  }).format(dateObj)
}

/**
 * Format date to full readable format in IST
 */
export function formatDateFullIST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: IST_TIMEZONE
  }).format(dateObj)
}

/**
 * Convert date input (yyyy-mm-dd) to Date object for form handling
 */
export function parseInputDate(dateString: string): Date | null {
  if (!dateString) return null
  
  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return null
  
  // Create date in IST timezone
  const date = new Date()
  date.setFullYear(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  
  return date
}

/**
 * Convert Date object to yyyy-mm-dd format for input fields
 */
export function formatDateForInput(date: Date | string): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Get date components in IST
  const istDate = new Date(dateObj.toLocaleString("en-US", { timeZone: IST_TIMEZONE }))
  
  const year = istDate.getFullYear()
  const month = String(istDate.getMonth() + 1).padStart(2, '0')
  const day = String(istDate.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Convert dd/mm/yyyy format to Date object
 */
export function parseDDMMYYYY(dateString: string): Date | null {
  if (!dateString) return null
  
  const parts = dateString.split('/')
  if (parts.length !== 3) return null
  
  const [day, month, year] = parts.map(Number)
  if (!day || !month || !year) return null
  
  return new Date(year, month - 1, day)
}

/**
 * Get age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth
  const today = getCurrentDateIST()
  
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  
  return age
}

/**
 * Check if date is in IST business hours (9 AM to 6 PM)
 */
export function isBusinessHoursIST(date?: Date): boolean {
  const checkDate = date || getCurrentDateIST()
  const istDate = new Date(checkDate.toLocaleString("en-US", { timeZone: IST_TIMEZONE }))
  const hour = istDate.getHours()
  
  return hour >= 9 && hour < 18
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTimeIST(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = getCurrentDateIST()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return formatDateDDMMYYYY(dateObj)
}