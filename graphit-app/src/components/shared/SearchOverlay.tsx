'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearch } from '@/lib/context/SearchContext';
import { Search as SearchIcon, X, TrendingUp, Star, Zap } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import Fuse from 'fuse.js';
import type { Diagram } from '@/lib/content';

const useDebounce = (value: string, delay: number) => {  
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const ResultCard = ({ item, onNavigate }: { item: Diagram, onNavigate: () => void }) => {
  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className="h-full"
    >
      <Link 
        href={`/${item.level}/${item.subject}/${item.diagram}`} 
        className="block h-full group"
        onClick={onNavigate}
      >
        <div className="bg-neutral/50 h-full rounded-[var(--border-radius-apple)] border border-neutral-dark/30 hover:border-accent transition-all duration-300 p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-bold text-text">{item.name}</h3>
            <p className="text-sm text-text/70 mt-1">{item.description}</p>
          </div>
          <div className="mt-4 relative aspect-video rounded-[var(--border-radius-apple)] overflow-hidden">
             <Image
                src={item.previewImage || '/previews/placeholder.png'}
                alt={`Preview of ${item.name}`}
                fill
                className="object-cover transition-opacity duration-300 group-hover:opacity-0"
             />
             {item.previewVideo && (
                <video
                    src={item.previewVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
             )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

interface AnalyticsData {
  [diagramId: string]: {
    views?: number;
    ratings?: number[];
  };
}

export default function SearchOverlay({ allDiagrams }: { allDiagrams: Diagram[] }) {
  const { isOpen, closeSearch } = useSearch();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'relevance' | 'popular' | 'used'>('relevance');
  const [results, setResults] = useState<Diagram[]>([]);
  const [enrichedDiagrams, setEnrichedDiagrams] = useState<Diagram[]>(allDiagrams);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (isOpen) {
      try {
        const rawData = localStorage.getItem('graphit-analytics');
        if (!rawData) {
          setEnrichedDiagrams(allDiagrams);
          return;
        }

        const analytics: AnalyticsData = JSON.parse(rawData);
        const mergedDiagrams = allDiagrams.map(diagram => {
          const dynamicData = analytics[diagram.id];
          if (!dynamicData) return diagram;

          const newRatingCount = dynamicData.ratings?.length || 0;
          const newAverageRating = newRatingCount > 0
            ? dynamicData.ratings!.reduce((a, b) => a + b, 0) / newRatingCount
            : 0;
          
          return {
            ...diagram,
            usage: (diagram.usage || 0) + (dynamicData.views || 0),
            rating: newRatingCount > 0 ? newAverageRating : diagram.rating,
            ratingCount: (diagram.ratingCount || 0) + newRatingCount,
          };
        });
        setEnrichedDiagrams(mergedDiagrams);
      } catch (error) {
        console.error("Failed to parse analytics data:", error);
        setEnrichedDiagrams(allDiagrams);
      }
    }
  }, [isOpen, allDiagrams]);

  const fuse = useMemo(() => new Fuse(enrichedDiagrams, {
    keys: ['name', 'description', 'subject', 'level'],
    threshold: 0.4,
  }), [enrichedDiagrams]);
  
  const globalMeanRating = useMemo(() => {
    const total = enrichedDiagrams.reduce((acc, d) => acc + (d.rating || 0) * (d.ratingCount || 0), 0);
    const count = enrichedDiagrams.reduce((acc, d) => acc + (d.ratingCount || 0), 0);
    return count > 0 ? total / count : 3.5;
  }, [enrichedDiagrams]);
  
  const m = 10;

  useEffect(() => {
    let searchResult: Diagram[] = [];
    if (debouncedQuery.trim()) {
      searchResult = fuse.search(debouncedQuery).map(res => res.item);
    } else {
      searchResult = [...enrichedDiagrams];
    }

    if (filter === 'popular') {
      searchResult.sort((a, b) => {
        const scoreA = ((a.rating || 0) * (a.ratingCount || 0) + globalMeanRating * m) / ((a.ratingCount || 0) + m);
        const scoreB = ((b.rating || 0) * (b.ratingCount || 0) + globalMeanRating * m) / ((b.ratingCount || 0) + m);
        return scoreB - scoreA;
      });
    } else if (filter === 'used') {
      searchResult.sort((a, b) => (b.usage || 0) - (a.usage || 0));
    }
    
    setResults(searchResult);
  }, [debouncedQuery, filter, enrichedDiagrams, fuse, globalMeanRating]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setQuery(''), 300);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] p-4 sm:p-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full h-full flex flex-col"
          >
            <div className="flex-shrink-0 flex items-center gap-4">
              <div className="relative flex-grow">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text/40" />
                <Input
                  type="text"
                  placeholder="Search for a diagram or topic..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                  autoFocus
                />
              </div>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full" onClick={closeSearch}><X/></Button>
            </div>

            <div className="flex-shrink-0 flex items-center gap-2 py-4 border-b border-neutral-dark/30">
                <Button variant={filter === 'relevance' ? 'default' : 'ghost'} onClick={() => setFilter('relevance')}><Zap className="mr-2 h-4 w-4"/> Relevance</Button>
                <Button variant={filter === 'popular' ? 'default' : 'ghost'} onClick={() => setFilter('popular')}><Star className="mr-2 h-4 w-4"/> Most Popular</Button>
                <Button variant={filter === 'used' ? 'default' : 'ghost'} onClick={() => setFilter('used')}><TrendingUp className="mr-2 h-4 w-4"/> Most Used</Button>
            </div>

            <div className="flex-grow overflow-y-auto py-6">
              {results.length > 0 ? (
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    {results.map(item => <ResultCard key={item.id} item={item} onNavigate={closeSearch} />)}
                </motion.div>
              ) : (
                <div className="text-center pt-20">
                    <p className="font-semibold text-lg">No results found</p>
                    <p className="text-text/60">Try a different search term or check your spelling.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}