// image-logger.js - Activity logging system for image operations
// Tracks all CRUD operations, moves, and changes

const LOG_KEY = '4k_image_logs';
const MAX_LOG_ENTRIES = 1000; // Keep last 1000 entries

// Activity types
export const ACTIVITY_TYPES = {
  IMAGE_CREATED: 'image_created',
  IMAGE_UPDATED: 'image_updated',
  IMAGE_DELETED: 'image_deleted',
  IMAGE_MOVED: 'image_moved',
  BATCH_DELETE: 'batch_delete',
  BATCH_MOVE: 'batch_move',
  IMAGES_REORDERED: 'images_reordered',
  PORTRAIT_CHANGED: 'portrait_changed',
  CAROUSEL_TOGGLED: 'carousel_toggled',
  TAGS_ADDED: 'tags_added',
  TAGS_REMOVED: 'tags_removed',
  GITHUB_SYNC: 'github_sync',
  GITHUB_SYNC_FAILED: 'github_sync_failed'
};

// Log entry structure
class LogEntry {
  constructor(type, data, userId = null) {
    this.id = generateLogId();
    this.type = type;
    this.data = data;
    this.userId = userId || getCurrentUserId();
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      data: this.data,
      userId: this.userId,
      timestamp: this.timestamp
    };
  }
}

// Generate unique log ID
function generateLogId() {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get current user ID
function getCurrentUserId() {
  try {
    const auth = JSON.parse(localStorage.getItem('4k_studio_auth') || '{}');
    return auth.username || 'unknown';
  } catch {
    return 'unknown';
  }
}

// Log an activity
export function logActivity(type, data) {
  try {
    const logs = getLogs();
    const entry = new LogEntry(type, data);
    
    logs.push(entry.toJSON());
    
    // Trim if exceeds max
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.splice(0, logs.length - MAX_LOG_ENTRIES);
    }
    
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    
    // Also log to console in development
    console.log(`[IMAGE LOG] ${type}:`, data);
    
    return entry;
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Get all logs
export function getLogs() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

// Get logs filtered by type
export function getLogsByType(type) {
  return getLogs().filter(log => log.type === type);
}

// Get logs for specific character
export function getCharacterLogs(characterId) {
  return getLogs().filter(log => {
    return log.data && log.data.characterId === characterId;
  });
}

// Get logs for specific image
export function getImageLogs(imageId) {
  return getLogs().filter(log => {
    return log.data && log.data.imageId === imageId;
  });
}

// Get logs by user
export function getUserLogs(userId) {
  return getLogs().filter(log => log.userId === userId);
}

// Get logs within date range
export function getLogsByDateRange(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return getLogs().filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    return logTime >= start && logTime <= end;
  });
}

// Get recent logs (last N entries)
export function getRecentLogs(count = 50) {
  const logs = getLogs();
  return logs.slice(-count).reverse(); // Most recent first
}

// Get activity summary
export function getActivitySummary(characterId = null) {
  const logs = characterId ? getCharacterLogs(characterId) : getLogs();
  
  const summary = {
    total: logs.length,
    byType: {},
    byUser: {},
    lastActivity: logs.length > 0 ? logs[logs.length - 1].timestamp : null,
    firstActivity: logs.length > 0 ? logs[0].timestamp : null
  };
  
  logs.forEach(log => {
    // Count by type
    summary.byType[log.type] = (summary.byType[log.type] || 0) + 1;
    
    // Count by user
    summary.byUser[log.userId] = (summary.byUser[log.userId] || 0) + 1;
  });
  
  return summary;
}

// Format log entry for display
export function formatLogEntry(log) {
  const date = new Date(log.timestamp);
  const timeStr = date.toLocaleString();
  
  let description = '';
  
  switch (log.type) {
    case ACTIVITY_TYPES.IMAGE_CREATED:
      description = `Created image "${log.data.fileName}" in ${log.data.album}`;
      break;
    case ACTIVITY_TYPES.IMAGE_UPDATED:
      description = `Updated image metadata`;
      break;
    case ACTIVITY_TYPES.IMAGE_DELETED:
      description = `Deleted image "${log.data.fileName}" from ${log.data.album}`;
      break;
    case ACTIVITY_TYPES.IMAGE_MOVED:
      description = `Moved image from ${log.data.fromAlbum} to ${log.data.toAlbum}`;
      break;
    case ACTIVITY_TYPES.BATCH_DELETE:
      description = `Deleted ${log.data.success} images`;
      break;
    case ACTIVITY_TYPES.BATCH_MOVE:
      description = `Moved ${log.data.success} images to ${log.data.targetAlbum}`;
      break;
    case ACTIVITY_TYPES.IMAGES_REORDERED:
      description = `Reordered ${log.data.imageIds.length} images`;
      break;
    case ACTIVITY_TYPES.PORTRAIT_CHANGED:
      description = `Changed portrait image`;
      break;
    case ACTIVITY_TYPES.CAROUSEL_TOGGLED:
      description = `${log.data.isCarousel ? 'Added to' : 'Removed from'} carousel`;
      break;
    case ACTIVITY_TYPES.TAGS_ADDED:
      description = `Added tags: ${log.data.tags.join(', ')}`;
      break;
    case ACTIVITY_TYPES.TAGS_REMOVED:
      description = `Removed tags: ${log.data.tags.join(', ')}`;
      break;
    case ACTIVITY_TYPES.GITHUB_SYNC:
      description = `Synced to GitHub`;
      break;
    case ACTIVITY_TYPES.GITHUB_SYNC_FAILED:
      description = `GitHub sync failed: ${log.data.error}`;
      break;
    default:
      description = `Unknown activity: ${log.type}`;
  }
  
  return {
    time: timeStr,
    user: log.userId,
    description,
    type: log.type,
    rawData: log.data
  };
}

// Export logs as JSON
export function exportLogsAsJson() {
  const logs = getLogs();
  const dataStr = JSON.stringify(logs, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `4k-studio-logs-${Date.now()}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}

// Export logs as CSV
export function exportLogsAsCsv() {
  const logs = getLogs();
  
  // CSV headers
  let csv = 'ID,Type,User,Timestamp,Data\n';
  
  logs.forEach(log => {
    const data = JSON.stringify(log.data).replace(/"/g, '""'); // Escape quotes
    csv += `"${log.id}","${log.type}","${log.userId}","${log.timestamp}","${data}"\n`;
  });
  
  const dataBlob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `4k-studio-logs-${Date.now()}.csv`;
  link.click();
  
  URL.revokeObjectURL(url);
}

// Clear old logs (keep last N days)
export function clearOldLogs(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffTime = cutoffDate.getTime();
  
  const logs = getLogs();
  const filteredLogs = logs.filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    return logTime >= cutoffTime;
  });
  
  const removedCount = logs.length - filteredLogs.length;
  localStorage.setItem(LOG_KEY, JSON.stringify(filteredLogs));
  
  console.log(`Cleared ${removedCount} old log entries`);
  return removedCount;
}

// Clear all logs (with confirmation)
export function clearAllLogs() {
  if (confirm('Are you sure you want to delete all activity logs? This cannot be undone.')) {
    localStorage.setItem(LOG_KEY, JSON.stringify([]));
    console.log('All logs cleared');
    return true;
  }
  return false;
}

// Get storage size of logs
export function getLogStorageSize() {
  const logs = JSON.stringify(getLogs());
  const bytes = new Blob([logs]).size;
  return {
    bytes,
    kb: (bytes / 1024).toFixed(2),
    mb: (bytes / 1024 / 1024).toFixed(2)
  };
}

console.log('Image Logger initialized');