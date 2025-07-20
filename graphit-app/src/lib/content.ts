import 'server-only';
import structure from '@/content/structure.json';

export interface Diagram {
  id: string;
  diagram: string;
  name: string;
  description: string;
  level: string;
  subject: string;
  levelTag?: 'AS' | 'A-Level';
  previewImage?: string;
  previewVideo?: string;
  usage: number;
  rating: number;
  ratingCount: number;
}

interface StructureDiagram {
  diagramId: string;
  description: string;
  levelTag?: 'AS' | 'A-Level';
  previewImage?: string;
  previewVideo?: string;
}

export interface Topic {
  topicId: string;
  topicName: string;
  diagrams: StructureDiagram[];
}

export interface Subject {
  subjectId: string;
  subjectName: string;
  topics: Topic[];
}

export interface Level {
  levelId: string;
  levelName: string;
  description: string;
  subjects: Subject[];
}

const BACKEND_URL = process.env.BACKEND_URL;

interface DbAnalyticsData {
    views: number;
    total_rating: number;
    rating_count: number;
}

interface AnalyticsMap {
    [diagramId: string]: DbAnalyticsData;
}

async function fetchAnalytics(): Promise<AnalyticsMap> {
    try {
        const res = await fetch(`${BACKEND_URL}/get-all-analytics`, { cache: 'no-store' });
        if (res.ok) {
            return await res.json();
        }
        console.error(`Failed to fetch analytics from backend (${res.status})`);
    } catch (error) {
        console.error("Error fetching analytics:", error);
    }
    return {};
}

export async function getTopicStructure(): Promise<Level[]> {
  return structure as Level[];
}

export async function getAllDiagrams(): Promise<Diagram[]> {
  const levels: Level[] = structure as Level[];
  const dbAnalytics = await fetchAnalytics();
  
  const allDiagrams: Diagram[] = [];

  levels.forEach(level => {
    level.subjects.forEach(subject => {
      subject.topics.forEach(topic => {
        topic.diagrams.forEach(diag => {
          const diagramId = `${level.levelId}-${subject.subjectId}-${topic.topicId}-${diag.diagramId}`;
          const analytics = dbAnalytics[diagramId];

          allDiagrams.push({
            id: diagramId,
            level: level.levelId,
            subject: subject.subjectId,
            diagram: diag.diagramId,
            name: topic.topicName,
            description: diag.description,
            levelTag: diag.levelTag,
            previewImage: diag.previewImage,
            previewVideo: diag.previewVideo,
            usage: analytics?.views || 0,
            ratingCount: analytics?.rating_count || 0,
            rating: (analytics && analytics.rating_count > 0) 
                ? analytics.total_rating / analytics.rating_count 
                : 0,
          });
        });
      });
    });
  });

  return allDiagrams;
}