'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { ArrowRight, Book, FlaskConical, Atom, Dna, BarChart3, Waves } from 'lucide-react';

interface Diagram {
  name: string;
  subject: string;
  href: string;
}

const subjectIcons: { [key: string]: React.ElementType } = {
  physics: Atom,
  biology: Dna,
  chemistry: FlaskConical,
  economics: Book,
  geography: Waves,
  mathematics: BarChart3,
  default: Book,
};

const BentoCard = ({ diagram, className }: { diagram: Diagram, className?: string }) => {
  const Icon = subjectIcons[diagram.subject] || subjectIcons.default;
  return (
    <Link href={diagram.href} className={className}>
      <motion.div
        whileHover={{ scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
        className="h-full"
      >
        <Card className="h-full flex flex-col justify-between p-6 group transition-colors duration-200 hover:bg-neutral-dark/50">
          <div>
            <Icon className="w-8 h-8 mb-4 text-text/50" />
            <h3 className="font-bold text-lg text-text/90">{diagram.name}</h3>
          </div>
          <div className="flex items-center text-sm font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            View Tool
            <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </Card>
      </motion.div>
    </Link>
  );
};

export default function BentoGridClient({ diagrams }: { diagrams: Diagram[] }) {
  if (!diagrams || diagrams.length < 6) {
    return <p className="text-center text-text/50">Could not load featured tools.</p>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ staggerChildren: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-3 grid-rows-3 gap-4 md:h-[600px]"
    >
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="md:col-span-2 md:row-span-2">
        <BentoCard diagram={diagrams[0]} className="h-full" />
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
        <BentoCard diagram={diagrams[1]} />
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
        <BentoCard diagram={diagrams[2]} />
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="md:col-span-1">
        <BentoCard diagram={diagrams[3]} />
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="md:col-span-2">
        <BentoCard diagram={diagrams[4]} />
      </motion.div>
    </motion.div>
  );
}