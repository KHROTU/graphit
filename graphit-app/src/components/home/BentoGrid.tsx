import { getAllDiagrams } from '@/lib/content';
import BentoGridClient from './BentoGridClient';

function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  
  return array;
}

export default async function BentoGrid() {
  const allDiagrams = await getAllDiagrams();
  
  const selectedDiagrams = shuffle([...allDiagrams]).slice(0, 6).map(d => ({
    name: d.name,
    subject: d.subject,
    href: `/${d.level}/${d.subject}/${d.diagram}`
  }));

  return (
    <section className="py-24 text-left">
      <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Tools for Every Subject</h2>
      <p className="text-lg text-text/70 mb-10 max-w-2xl">
        {`From plotting functions to building food webs, here's a taste of what you can create.`}
      </p>
      <BentoGridClient diagrams={selectedDiagrams} />
    </section>
  );
};