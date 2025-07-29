'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useEffect, useState } from 'react';
import { Tag, GitCommit, PlusCircle, Wrench, Package } from 'lucide-react';

interface VersionInfo {
  release_name: string;
  release_notes: string;
  commit_hash: string;
  repo_url: string;
}

const ParsedReleaseNotes = ({ notes }: { notes: string }) => {
    if (!notes) {
        return <p className="text-sm text-text/70">No release notes available for this version.</p>;
    }

    const lines = notes.trim().split('\n');
    const sections: { title: string, items: string[], icon: React.ReactNode }[] = [];
    let currentSection: { title: string, items: string[], icon: React.ReactNode } | null = null;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.toLowerCase().startsWith('added')) {
            if (currentSection) sections.push(currentSection);
            currentSection = { title: 'Added', items: [], icon: <PlusCircle className="h-5 w-5 text-green-500" /> };
        } else if (trimmedLine.toLowerCase().startsWith('fixed')) {
            if (currentSection) sections.push(currentSection);
            currentSection = { title: 'Fixed', items: [], icon: <Wrench className="h-5 w-5 text-blue-500" /> };
        } else if (trimmedLine.startsWith('- ') && currentSection) {
            currentSection.items.push(trimmedLine.substring(2).trim());
        }
    }
    if (currentSection) sections.push(currentSection);

    if (sections.length === 0) {
        return <div className="text-sm text-text/90 whitespace-pre-wrap font-sans">{notes}</div>;
    }

    return (
        <div className="space-y-4">
            {sections.map((section, index) => (
                <div key={index}>
                    <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                        {section.icon}
                        {section.title}
                    </h4>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-text/80">
                        {section.items.length > 0 ? (
                            section.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)
                        ) : (
                             <li>N/A</li>
                        )}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default function AccountInfoPage() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVersionInfo() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/version-info');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: VersionInfo = await response.json();
        setVersionInfo(data);
      } catch (e) {
        console.error("Failed to fetch version info:", e);
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("An unknown error occurred while fetching version information.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchVersionInfo();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-6 space-y-4 animate-pulse">
            <div className="h-8 bg-neutral-dark/50 rounded w-3/4 mb-4"></div>
            <div className="flex gap-6">
                <div className="h-5 bg-neutral-dark/50 rounded w-1/3"></div>
                <div className="h-5 bg-neutral-dark/50 rounded w-1/3"></div>
            </div>
            <div className="space-y-2 pt-6 border-t border-neutral-dark/30 mt-6">
                <div className="h-6 bg-neutral-dark/50 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-neutral-dark/50 rounded w-full"></div>
                <div className="h-4 bg-neutral-dark/50 rounded w-full"></div>
                <div className="h-4 bg-neutral-dark/50 rounded w-5/6"></div>
            </div>
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-secondary p-12">{error}</p>;
    }

    if (versionInfo) {
      return (
        <div className="p-6 space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-3">
                <Package className="h-7 w-7 text-accent" />
                <span>{versionInfo.release_name || 'Latest Version'}</span>
            </h3>
            
            <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-sm text-text/70 pt-2">
                <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>Version: {versionInfo.release_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <GitCommit className="h-4 w-4" />
                    <span>Commit:</span>
                    {versionInfo.commit_hash ? (
                        <a 
                        href={`${versionInfo.repo_url}/commit/${versionInfo.commit_hash}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-mono text-accent hover:underline"
                        >
                        {versionInfo.commit_hash.substring(0, 7)}
                        </a>
                    ) : (
                        <span>N/A</span>
                    )}
                </div>
            </div>

            <div className="pt-6 mt-2 border-t border-neutral-dark/30">
                <ParsedReleaseNotes notes={versionInfo.release_notes} />
            </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Information</CardTitle>
      </CardHeader>
      {renderContent()}
    </Card>
  );
}