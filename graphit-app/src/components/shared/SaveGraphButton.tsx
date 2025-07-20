'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Bookmark } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface Props {
    diagramName: string;
    getDiagramState: () => Record<string, unknown>;
}

export default function SaveGraphButton({ diagramName, getDiagramState }: Props) {
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const pathname = usePathname();

    const handleSave = async () => {
        setIsSaving(true);
        setStatus('idle');
        
        const configState = getDiagramState();
        const diagramId = pathname.split('/').pop() || 'unknown';
        const previewImage = `/previews/${diagramId}.png`;
        
        try {
            const response = await fetch('/api/graphs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    diagramName,
                    diagramUrl: pathname,
                    configJson: JSON.stringify(configState),
                    previewImage
                })
            });

            if (response.ok) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (e) {
            console.error("Save graph failed:", e);
            setStatus('error');
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatus('idle'), 2500);
        }
    };
    
    const buttonText = {
        idle: 'Save Configuration',
        success: 'Saved!',
        error: 'Failed to Save',
    };

    const getButtonVariant = () => {
        if (status === 'success') return 'default';
        if (status === 'error') return 'destructive';
        return 'outline';
    }

    return (
        <Button onClick={handleSave} disabled={isSaving || status !== 'idle'} variant={getButtonVariant()}>
            <Bookmark className="mr-2 h-4 w-4" /> {buttonText[status]}
        </Button>
    );
}