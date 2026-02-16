/**
 * Sorting utility functions for ordering data by date and time
 */

/**
 * Sorts an array of items by date and time in descending order (latest first)
 * @param items Array of items with date and time properties
 * @returns Sorted array with latest items first
 */
export const sortByDateTimeDesc = <T extends { date: Date | string; time?: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
    const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
    
    // Sort by date descending
    if (dateA !== dateB) {
      return dateB - dateA;
    }
    
    // If dates are equal, sort by time descending
    const timeA = a.time || "00:00";
    const timeB = b.time || "00:00";
    return timeB.localeCompare(timeA);
  });
};

/**
 * Sorts an array of items by date and time in ascending order (oldest first)
 * @param items Array of items with date and time properties
 * @returns Sorted array with oldest items first
 */
export const sortByDateTimeAsc = <T extends { date: Date | string; time?: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
    const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
    
    // Sort by date ascending
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    
    // If dates are equal, sort by time ascending
    const timeA = a.time || "00:00";
    const timeB = b.time || "00:00";
    return timeA.localeCompare(timeB);
  });
};
