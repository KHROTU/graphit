import { notFound } from 'next/navigation';
import Link from 'next/link';
import DiagramTool from '@/components/diagrams/DiagramTool';
import { getAllDiagrams } from '@/lib/content';
import RatingWidget from '@/components/shared/RatingWidget';
import ViewTracker from '@/components/shared/ViewTracker';

type PageProps = {
  params: Promise<{ level: string; subject: string; diagram: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function formatLevelName(levelId: string): string {
  if (levelId === 'a-level') return 'A-Level';
  return levelId.toUpperCase();
}

async function getDiagramDetails(level: string, subject: string, diagram: string) {
  const allDiagrams = await getAllDiagrams();
  return allDiagrams.find(d => d.level === level && d.subject === subject && d.diagram === diagram) || null;
}

export default async function DiagramPage({ params }: PageProps) {
  const { level, subject, diagram } = await params;
  
  const diagramDetails = await getDiagramDetails(level, subject, diagram);

  if (!diagramDetails) {
    notFound();
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: formatLevelName(level), href: `/topics#${level}` },
    { name: subject.charAt(0).toUpperCase() + subject.slice(1), href: `/topics#${level}-${subject}` },
    { name: diagramDetails.name, href: '#' },
  ];

  return (
    <>
      <div className="py-8">
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center space-x-2 text-sm text-text/60">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.name} className="flex items-center">
                {index < breadcrumbs.length - 1 ? (
                  <Link href={crumb.href} className="hover:text-accent">{crumb.name}</Link>
                ) : (
                  <span className="font-medium text-text">{crumb.name}</span>
                )}
                {index < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{diagramDetails.name}</h1>
            {diagramDetails.levelTag && (
                <span className="px-4 py-1.5 text-base font-semibold rounded-full bg-accent/20 text-accent self-start">
                    {diagramDetails.levelTag}
                </span>
            )}
        </div>
        <DiagramTool diagramId={diagram} />
      </div>
      <ViewTracker diagramId={diagramDetails.id} />
      <RatingWidget diagramId={diagramDetails.id} />
    </>
  );
}