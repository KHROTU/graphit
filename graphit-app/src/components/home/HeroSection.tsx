import Link from 'next/link';
import { Button } from '../ui/Button';

const HeroSection = () => {
  return (
    <section className="text-center py-20 md:py-32">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter mb-4 animate-fadeIn">
        Creating diagrams has never been easier.
      </h1>
      <p className="max-w-2xl mx-auto text-base md:text-xl text-text/80 mb-8 animate-fadeIn [animation-delay:0.2s]">
        GraphIt! empowers students and teachers to create beautiful, accurate educational diagrams in seconds. From IGCSE to A-Levels, master your subjects visually.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeIn [animation-delay:0.4s]">
        <Link href="/topics#igcse">
          <Button size="lg" className="w-full sm:w-auto">Explore IGCSE Topics</Button>
        </Link>
        <Link href="/topics#a-level">
          <Button size="lg" variant="outline" className="w-full sm:w-auto">
            Discover A-Level Content
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;