'use client';

import React from 'react';
import { Label } from '@/components/ui/Label';
import { Input, InputProps } from '@/components/ui/Input';

interface InputControlProps extends InputProps {
    label: string;
}

export function InputControl({ label, ...props }: InputControlProps) {
    return (
        <div>
            <Label>{label}</Label>
            <Input className="mt-2" {...props} />
        </div>
    );
}