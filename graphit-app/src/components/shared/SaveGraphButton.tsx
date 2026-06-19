'use client';
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Bookmark, Check } from 'lucide-react';
import { usePathname } from 'next/navigation';
interface Props {
    diagramName: string;
    getDiagramState: () => Record<string, unknown>;
}
const STORAGE_KEY = 'graphit-saved-graphs';
export default function SaveGraphButton({ diagramName, getDiagramState }: Props) {
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const pathname = usePathname();
    const handleSave = () => {
        try {
            const configState = getDiagramState();
            const diagramId = pathname.split('/').pop() || 'unknown';
            const previewImage = `/previews/${diagramId}.png`;
            const graph = {
                id: crypto.randomUUID(),
                diagramName,
                diagramUrl: pathname,  // always save without ?config so default loads fresh
                configJson: JSON.stringify(configState),
                previewImage,
                createdAt: new Date().toISOString(),
            };
            const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            existing.push(graph);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };
    const buttonText = {
        idle: 'Save',
        success: 'Saved!',
        error: 'Failed',
    };
    const getButtonVariant = () => {
        if (status === 'success') return 'default';
        if (status === 'error') return 'destructive';
        return 'outline';
    };
    return (
        <Button onClick={handleSave} disabled={status !== 'idle'} variant={getButtonVariant()}>
            {status === 'success' ? <Check className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
            {buttonText[status]}
        </Button>
    );
}