'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Level, Topic } from '@/lib/content'; 
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Book, FlaskConical, Atom, Dna, ChevronsRight, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface TopicNavigatorProps {
  initialData: Level[];
}

const subjectIcons: { [key: string]: React.ElementType } = {
  physics: Atom,
  biology: Dna,
  chemistry: FlaskConical,
  economics: Book,
  geography: Book,
  mathematics: ChevronsRight,
  default: Book,
};

const Column = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
    className="flex-1 min-w-[280px] max-w-sm bg-neutral/50 rounded-[var(--border-radius-apple)] p-4 border border-neutral-dark/30 flex flex-col"
  >
    <h3 className="font-bold text-lg mb-4 text-text/90 px-2">{title}</h3>
    {children}
  </motion.div>
);

const ListItem = ({
  id,
  onClick,
  isActive,
  children,
}: {
  id: string;
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}) => (
  <li id={id}> 
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-[var(--border-radius-apple)] transition-colors duration-200 flex items-center gap-3 ${
        isActive ? 'bg-accent text-white shadow-md' : 'hover:bg-neutral-dark'
      }`}
    >
      {children}
    </button>
  </li>
);

const ColumnSearch = ({ value, onChange, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; }) => (
  <div className="relative mb-4 px-1">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text/40" />
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="pl-9"
    />
     {value && (
        <button
          onClick={() => onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X className="h-4 w-4 text-text/40 hover:text-text" />
        </button>
      )}
  </div>
);


export default function TopicNavigator({ initialData }: TopicNavigatorProps) {
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (!hash) return;
    
    const directLevelMatch = initialData.find(level => level.levelId === hash);
    if (directLevelMatch) {
      setSelectedLevelId(directLevelMatch.levelId);
      setSelectedSubjectId(null);
      return;
    }

    for (const level of initialData) {
        const prefix = `${level.levelId}-`;
        if (hash.startsWith(prefix)) {
            const levelId = level.levelId;
            const subjectId = hash.substring(prefix.length);
            const levelMatch = initialData.find(l => l.levelId === levelId);

            if (levelMatch && levelMatch.subjects.some(sub => sub.subjectId === subjectId)) {
                setSelectedLevelId(levelId);
                setSelectedSubjectId(subjectId);
                return;
            }
        }
    }
  }, [initialData]);

  const selectedLevel = useMemo(
    () => initialData.find((level) => level.levelId === selectedLevelId),
    [selectedLevelId, initialData]
  );

  const filteredSubjects = useMemo(() => {
    if (!selectedLevel) return [];
    return selectedLevel.subjects.filter(subject =>
      subject.subjectName.toLowerCase().includes(subjectFilter.toLowerCase())
    );
  }, [selectedLevel, subjectFilter]);

  const selectedSubject = useMemo(
    () => selectedLevel?.subjects.find((sub) => sub.subjectId === selectedSubjectId),
    [selectedSubjectId, selectedLevel]
  );

  const filteredTopics = useMemo(() => {
    if (!selectedSubject) return [];
    return selectedSubject.topics.filter(topic =>
      topic.topicName.toLowerCase().includes(topicFilter.toLowerCase())
    );
  }, [selectedSubject, topicFilter]);

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevelId(levelId);
    setSelectedSubjectId(null);
    setSubjectFilter('');
    setTopicFilter('');
  };

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setTopicFilter('');
  };
  
  const getTopicLink = (levelId: string, subjectId: string, topic: Topic) => {
    if (topic.diagrams.length === 1) {
      return `/${levelId}/${subjectId}/${topic.diagrams[0].diagramId}`;
    }
    return `/topics#${levelId}-${subjectId}`;
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <Column title="1. Select Level">
        <ul className="space-y-2">
            {initialData.map((level) => (
            <ListItem key={level.levelId} id={level.levelId}
                onClick={() => handleLevelSelect(level.levelId)}
                isActive={selectedLevelId === level.levelId}>
                <div>
                <p className="font-semibold">{level.levelName}</p>
                <p className="text-xs opacity-80">{level.description}</p>
                </div>
            </ListItem>
            ))}
        </ul>
      </Column>

      <AnimatePresence>
        {selectedLevel && (
          <Column title="2. Select Subject">
            <ColumnSearch
              placeholder="Filter subjects..."
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            />
            <ul className="space-y-2 overflow-y-auto">
              {filteredSubjects.map((subject) => {
                const Icon = subjectIcons[subject.subjectId] || subjectIcons.default;
                return (
                  <ListItem key={subject.subjectId} id={`${selectedLevel.levelId}-${subject.subjectId}`}
                    onClick={() => handleSubjectSelect(subject.subjectId)}
                    isActive={selectedSubjectId === subject.subjectId}>
                    <Icon className="w-5 h-5 opacity-70 flex-shrink-0" />
                    <span className="font-medium">{subject.subjectName}</span>
                  </ListItem>
                );
              })}
            </ul>
          </Column>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSubject && (
          <Column title="3. Select Topic">
            <ColumnSearch
              placeholder="Filter topics..."
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
            />
            <ul className="space-y-2 overflow-y-auto">
              {filteredTopics.map((topic) => {
                 const href = getTopicLink(selectedLevelId!, selectedSubjectId!, topic);
                 const levelTag = topic.diagrams[0]?.levelTag;
                 return (
                  <li key={topic.topicId}>
                      <Link 
                        href={href} 
                        className="w-full text-left p-3 rounded-[var(--border-radius-apple)] transition-colors duration-200 flex items-center justify-between gap-3 hover:bg-neutral-dark"
                      >
                          <span>{topic.topicName}</span>
                          {levelTag && (
                            <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-accent/20 text-accent">
                                {levelTag}
                            </span>
                          )}
                      </Link>
                  </li>
                 )
              })}
            </ul>
          </Column>
        )}
      </AnimatePresence>
    </div>
  );
}