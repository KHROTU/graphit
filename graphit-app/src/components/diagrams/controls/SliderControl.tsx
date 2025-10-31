'use client';

import React from 'react';
import { Label } from '@/components/ui/Label';

interface SliderControlProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function SliderControl({ label, value, unit = '', onChange, ...props }: SliderControlProps) {
  return (
    <div>
      <Label>{label}: {value}{unit}</Label>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-2"
        {...props}
      />
    </div>
  );
}