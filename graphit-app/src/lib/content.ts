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
export async function getTopicStructure(): Promise<Level[]> {
  return structure as Level[];
}
export async function getAllDiagrams(): Promise<Diagram[]> {
  const levels: Level[] = structure as Level[];
  const allDiagrams: Diagram[] = [];
  levels.forEach(level => {
    level.subjects.forEach(subject => {
      subject.topics.forEach(topic => {
        topic.diagrams.forEach(diag => {
          const diagramId = `${level.levelId}-${subject.subjectId}-${topic.topicId}-${diag.diagramId}`;
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
            usage: 0,
            ratingCount: 0,
            rating: 0,
          });
        });
      });
    });
  });
  return allDiagrams;
}