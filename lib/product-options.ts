/**
 * Predefined product options for consistent data entry
 */

export const STANDARD_SIZES = [
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: '2XL', label: '2XL' },
  { value: '3XL', label: '3XL' },
];

export const STANDARD_COLORS = [
  { value: 'Black', label: 'Black', hex: '#000000' },
  { value: 'White', label: 'White', hex: '#FFFFFF' },
  { value: 'Red', label: 'Red', hex: '#FF0000' },
  { value: 'Green', label: 'Green', hex: '#008000' },
  { value: 'Blue', label: 'Blue', hex: '#0000FF' },
  { value: 'Yellow', label: 'Yellow', hex: '#FFFF00' },
  { value: 'Purple', label: 'Purple', hex: '#800080' },
  { value: 'Pink', label: 'Pink', hex: '#FFC0CB' },
  { value: 'Orange', label: 'Orange', hex: '#FFA500' },
  { value: 'Gray', label: 'Gray', hex: '#808080' },
  { value: 'Brown', label: 'Brown', hex: '#A52A2A' },
  { value: 'Navy Blue', label: 'Navy Blue', hex: '#000080' },
  { value: 'Teal', label: 'Teal', hex: '#008080' },
  { value: 'Maroon', label: 'Maroon', hex: '#800000' },
  { value: 'Gold', label: 'Gold', hex: '#FFD700' },
  { value: 'Silver', label: 'Silver', hex: '#C0C0C0' },
  { value: 'Emerald Green', label: 'Emerald Green', hex: '#50C878' },
  { value: 'Rose Pink', label: 'Rose Pink', hex: '#FF66CC' },
  { value: 'Lavender', label: 'Lavender', hex: '#E6E6FA' },
  { value: 'Sky Blue', label: 'Sky Blue', hex: '#87CEEB' },
];

/**
 * Get color object by color name
 */
export function getColorByName(name: string) {
  return STANDARD_COLORS.find(color => 
    color.value.toLowerCase() === name.toLowerCase()
  ) || { value: name, label: name, hex: '#CCCCCC' };
}

/**
 * Add a custom color to the standard colors array
 */
export function addCustomColor(name: string, hex: string) {
  // Ensure we don't add duplicates
  if (!STANDARD_COLORS.find(c => c.value.toLowerCase() === name.toLowerCase())) {
    STANDARD_COLORS.push({ value: name, label: name, hex });
  }
}