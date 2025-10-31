'use client';

import React from 'react';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';

interface SelectControlProps<T extends string> extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string }[];
  helpText?: string;
}

export function SelectControl<T extends string>({ label, value, onValueChange, options, helpText, ...props }: SelectControlProps<T>) {
  return (
    <div>
      <Label>{label}</Label>
      {helpText && <p className="text-xs text-text/60 mb-2">{helpText}</p>}
      <Select
        value={value}
        onChange={(e) => onValueChange(e.target.value as T)}
        className="mt-1"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </Select>
    </div>
  );
}