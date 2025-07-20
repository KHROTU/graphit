'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// A simple interface for our analytics data structure
interface AnalyticsData {
  [diagramId: string]: {
    views?: number;
    ratings?: number[];
  };
}

export default function RatingWidget({ diagramId }: { diagramId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Check localStorage on mount to see if user has already rated this diagram
  useEffect(() => {
    const data = localStorage.getItem('graphit-analytics');
    if (data) {
      const parsedData: AnalyticsData = JSON.parse(data);
      if (parsedData[diagramId]?.ratings) {
        setHasSubmitted(true);
      }
    }
  }, [diagramId]);
  
  const handleSubmitRating = () => {
    if (currentRating === 0) return;

    try {
        const rawData = localStorage.getItem('graphit-analytics') || '{}';
        const allData: AnalyticsData = JSON.parse(rawData);

        if (!allData[diagramId]) {
        allData[diagramId] = {};
        }
        if (!allData[diagramId].ratings) {
            allData[diagramId].ratings = [];
        }

        allData[diagramId].ratings!.push(currentRating);
        localStorage.setItem('graphit-analytics', JSON.stringify(allData));
        
        setHasSubmitted(true);
        setTimeout(() => setIsOpen(false), 1500); // Close modal after a short delay
    } catch (error) {
        console.error("Failed to save rating:", error);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <Button size="lg" className="rounded-full shadow-lg !p-4 h-auto" onClick={() => setIsOpen(true)}>
          <MessageSquare className="h-6 w-6" />
          <span className="ml-2 hidden sm:inline">Rate this Tool</span>
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="bg-neutral/95 backdrop-blur-sm rounded-[var(--border-radius-apple)] w-full max-w-sm flex flex-col gap-4 p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{hasSubmitted ? 'Thank You!' : 'Rate this Diagram'}</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}><X className="h-4 w-4"/></Button>
              </div>
              
              {hasSubmitted ? (
                <p className="text-center text-text/80 py-8">Your feedback helps us improve!</p>
              ) : (
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="flex gap-2" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-10 h-10 cursor-pointer transition-colors"
                        fill={(hoverRating || currentRating) >= star ? 'var(--color-secondary)' : 'transparent'}
                        stroke="var(--color-secondary)"
                        strokeWidth={1.5}
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => setCurrentRating(star)}
                      />
                    ))}
                  </div>
                  <Button onClick={handleSubmitRating} disabled={currentRating === 0} className="w-full">
                    Submit Rating
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}