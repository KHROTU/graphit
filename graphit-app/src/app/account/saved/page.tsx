'use client';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
interface SavedGraph {
    id: string;
    diagramName: string;
    diagramUrl: string;
    configJson: string;
    previewImage: string;
    createdAt: string;
}
const STORAGE_KEY = 'graphit-saved-graphs';
function loadGraphs(): SavedGraph[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}
export default function SavedGraphsPage() {
    const [graphs, setGraphs] = useState<SavedGraph[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        setGraphs(loadGraphs().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setIsLoading(false);
    }, []);
    const handleDelete = (id: string) => {
        const updated = graphs.filter(g => g.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setGraphs(updated);
    };
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Saved Graphs</CardTitle>
            </CardHeader>
            <div className="p-6">
                {isLoading ? (
                    <p className="text-center text-text/70 py-12">Loading your saved graphs...</p>
                ) : graphs.length === 0 ? (
                    <div className="text-center text-text/70 py-12">
                        <p>You haven&apos;t saved any graphs yet.</p>
                        <p className="mt-2">Use the &quot;Save&quot; button on any diagram page to save it here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {graphs.map(graph => (
                            <div key={graph.id} className="group relative rounded-[var(--border-radius-apple)] border border-neutral-dark/30 overflow-hidden hover:border-accent transition-colors">
                                <Link href={`${graph.diagramUrl}?config=${encodeURIComponent(graph.configJson)}`}>
                                    <div className="relative aspect-video bg-neutral-dark/50">
                                        <Image src={graph.previewImage || '/previews/placeholder.png'} alt={graph.diagramName} fill className="object-cover"/>
                                    </div>
                                    <div className="p-3 bg-neutral/50">
                                        <p className="font-semibold truncate">{graph.diagramName}</p>
                                        <p className="text-xs text-text/60">{new Date(graph.createdAt).toLocaleString()}</p>
                                    </div>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-dark/80 hover:bg-secondary/80"
                                    onClick={() => handleDelete(graph.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}