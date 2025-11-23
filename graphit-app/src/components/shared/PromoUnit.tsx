'use client';

import Link from 'next/link';
import { Card } from '../ui/Card';
import { ArrowUpRight } from 'lucide-react';

const projects = [
  {
    name: 'Sat DB',
    description: 'Free Digital SAT Practice Tests & Prep',
    href: 'https://www.satdbfor.me',
    videoSrc: '/satdb.webm',
  },
  {
    name: 'notLLM',
    description: 'A 2-minute chat game to determine if you are talking to a human or an LLM.',
    href: 'https://not-llm.vercel.app',
    videoSrc: '/notllm.webm',
  },
];

const PromoUnit = () => {
  return (
    <div className="mt-2 mb-4 pt-4 border-t border-neutral-dark/30 text-center">
      <p className="text-xs text-text/70 mb-3">
        If you found this tool useful, check out my other projects!
      </p>
      <div className="flex flex-col gap-3">
        {projects.map((project) => (
          <Link
            key={project.name}
            href={project.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card className="!p-0 overflow-hidden text-left relative transition-all group-hover:border-accent">
                <div className="aspect-video relative bg-neutral-dark/30">
                    <video
                        src={project.videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm flex items-center">
                  {project.name}
                  <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-xs text-text/70">{project.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PromoUnit;