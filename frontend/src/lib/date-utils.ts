// frontend/src/lib/date-utils.ts

/**
 * Safely formats a date string to a localized date format
 * Handles invalid dates gracefully
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'No date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Formats date as relative time (e.g., "2 hours ago", "Yesterday")
 * Falls back to formatDate for older dates
 */
export function formatRelativeDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'No date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Future dates
    if (diffMs < 0) return formatDate(dateString);
    
    // Recent times
    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    // Days
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    
    // Fall back to formatted date for older
    return formatDate(dateString);
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'Invalid date';
  }
}

/**
 * Formats date with time (e.g., "Jan 15, 2025 at 3:30 PM")
 */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'No date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'Invalid date';
  }
}

/**
 * Formats date for display in compact spaces
 * Shows relative time for recent, short date for older
 */
export function formatCompactDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'No date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    
    // Use relative for recent
    if (diffDays < 7) return formatRelativeDate(dateString);
    
    // Use short format for older
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting compact date:', error);
    return 'Invalid date';
  }
}

/**
 * Checks if a date string is valid
 */
export function isValidDate(dateString: string | Date | null | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Converts various date formats to ISO string for backend
 */
export function toISOString(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toISOString();
  } catch {
    return null;
  }
}