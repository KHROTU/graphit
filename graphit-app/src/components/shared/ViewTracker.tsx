'use client';

import { useEffect } from 'react';

interface AnalyticsData {
  [diagramId: string]: {
    views?: number;
    ratings?: number[];
  };
}

export default function ViewTracker({ diagramId }: { diagramId: string }) {
  useEffect(() => {
    try {
      const rawData = localStorage.getItem('graphit-analytics') || '{}';
      const allData: AnalyticsData = JSON.parse(rawData);

      if (!allData[diagramId]) {
        allData[diagramId] = {};
      }

      const currentViews = allData[diagramId].views || 0;
      allData[diagramId].views = currentViews + 1;

      localStorage.setItem('graphit-analytics', JSON.stringify(allData));
    } catch (error) {
      console.error("Failed to update view count:", error);
    }
  }, [diagramId]);

  return null;
}