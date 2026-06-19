'use client';
import React from 'react';
import { Label } from '@/components/ui/Label';
interface SliderControlProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}
export function SliderControl({ label, value, unit = '', min, max, step = 1, onChange, ...props }: SliderControlProps) {
  const displayValue = Number.isInteger(step) && Number.isInteger(value) ? value : Number(value).toFixed(step < 1 ? 1 : 0);
  return (
    <div>
      <Label>{label}: {displayValue}{unit}</Label>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-2 accent-[var(--color-accent)] cursor-pointer"
        {...props}
      />
    </div>
  );
}