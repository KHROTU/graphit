import Link from 'next/link';
import { Button } from '../ui/Button';

const HeroSection = () => {
  return (
    <section className="text-center py-20 md:py-32">
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 animate-fadeIn">
        Creating diagrams has never been easier.
      </h1>
      <p className="max-w-2xl mx-auto text-lg md:text-xl text-text/80 mb-8 animate-fadeIn [animation-delay:0.2s]">
        GraphIt! empowers students and teachers to create beautiful, accurate educational diagrams in seconds. From IGCSE to A-Levels, master your subjects visually.
      </p>
      <div className="flex justify-center gap-4 animate-fadeIn [animation-delay:0.4s]">
        <Link href="/topics#igcse">
          <Button size="lg">Explore IGCSE Topics</Button>
        </Link>
        <Link href="/topics#a-level">
          <Button size="lg" variant="outline">
            Discover A-Level Content
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;