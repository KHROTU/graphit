'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { diagramRegistry } from './registry';
import { Card } from '@/components/ui/Card';
import SkeletonCard from '../shared/SkeletonCard';

function DiagramToolComponent({ diagramId }: { diagramId: string }) {
  const searchParams = useSearchParams();
  const config = searchParams.get('config');
  let initialProps = {};
  
  if (config) {
    try {
      initialProps = JSON.parse(config);
    } catch (e) {
      console.error("Failed to parse config from URL", e);
    }
  }

  const DiagramComponent = diagramRegistry[diagramId];

  if (!DiagramComponent) {
    return <NotFoundState />;
  }
  
  return <DiagramComponent key={config} {...initialProps} />;
}


export default function DiagramTool({ diagramId }: { diagramId: string }) {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <DiagramToolComponent diagramId={diagramId} />
    </Suspense>
  );
}

const NotFoundState = () => (
    <Card className="flex items-center justify-center min-h-[400px]">
      <p className="text-secondary">Error: Diagram tool not found.</p>
    </Card>
);