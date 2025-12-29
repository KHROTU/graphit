export function syncAnalytics() {
  try {
    const rawData = localStorage.getItem('graphit-analytics');
    if (rawData) {
      const blob = new Blob([rawData], { type: 'application/json' });
      const didSend = navigator.sendBeacon('/api/sync-analytics', blob);

      if (didSend) {
        localStorage.removeItem('graphit-analytics');
        console.log('Local analytics data queued for sync and cleared.');
      } else {
        console.error('Failed to queue analytics sync with the server.');
      }
    }
  } catch (error) {
    console.error('Error during analytics sync:', error);
  }
}