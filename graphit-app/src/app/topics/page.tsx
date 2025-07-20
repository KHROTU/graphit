import { getTopicStructure } from '@/lib/content';
import TopicNavigator from '@/components/topics/TopicNavigator';
import Feedback from '@/components/topics/Feedback';

export const metadata = {
  title: 'Explore Topics | GraphIt!',
  description: 'Select an academic level, subject, and topic to start creating diagrams.',
};

export default async function TopicsPage() {
  const topicStructure = await getTopicStructure();

  return (
    <>
      <div className="py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Find Your Topic
          </h1>
          <p className="mt-2 text-lg text-text/80">
            Select a level, then a subject, then a topic to begin.
          </p>
        </div>
        
        <TopicNavigator initialData={topicStructure} />
      </div>
      <Feedback />
    </>
  );
}