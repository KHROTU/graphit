'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';

interface ResistorInputProps {
    value: number;
    onChange: (value: number) => void;
    onRemove: () => void;
}

export function ResistorInput({ value, onChange, onRemove }: ResistorInputProps) {
    return (
        <div className="flex gap-2 items-center">
            <Input 
                type="number" 
                value={value} 
                onChange={e => onChange(Number(e.target.value))} 
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove}>
                <Trash2 className="w-4 h-4 text-red-500"/>
            </Button>
        </div>
    );
}