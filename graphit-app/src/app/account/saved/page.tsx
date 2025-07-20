'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SavedGraph {
    id: number;
    diagram_name: string;
    diagram_url: string;
    config_json: string;
    preview_image: string;
    created_at: string;
}

export default function SavedGraphsPage() {
    const [graphs, setGraphs] = useState<SavedGraph[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchGraphs() {
            try {
                const response = await fetch('/api/graphs');
                if (response.ok) {
                    const data = await response.json();
                    data.sort((a: SavedGraph, b: SavedGraph) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    setGraphs(data);
                } else {
                    const errorData = await response.json();
                    setError(errorData.error || "Failed to load graphs.");
                }
            } catch(e) {
                console.error("Failed to fetch graphs:", e);
                setError("An error occurred while fetching your saved graphs.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchGraphs();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Saved Graphs</CardTitle>
            </CardHeader>
            <div className="p-6">
                {isLoading ? (
                    <p className="text-center text-text/70 py-12">Loading your saved graphs...</p>
                ) : error ? (
                    <p className="text-center text-secondary py-12">{error}</p>
                ) : graphs.length === 0 ? (
                    <div className="text-center text-text/70 py-12">
                        <p>You haven&apos;t saved any graphs yet.</p>
                        <p className="mt-2">A &quot;Save Configuration&quot; button will appear on diagram pages when you are logged in.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {graphs.map(graph => (
                            <Link key={graph.id} href={`${graph.diagram_url}?config=${encodeURIComponent(graph.config_json)}`}>
                                <div className="group rounded-[var(--border-radius-apple)] border border-neutral-dark/30 overflow-hidden hover:border-accent transition-colors">
                                    <div className="relative aspect-video bg-neutral-dark/50">
                                        <Image src={graph.preview_image || '/previews/placeholder.png'} alt={graph.diagram_name} fill className="object-cover"/>
                                    </div>
                                    <div className="p-3 bg-neutral/50">
                                        <p className="font-semibold truncate">{graph.diagram_name}</p>
                                        <p className="text-xs text-text/60">{new Date(graph.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}