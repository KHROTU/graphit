'use client';

import React from 'react';
import { Label } from '@/components/ui/Label';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface SelectControlProps<T extends string> {
  label: string;
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string }[];
  helpText?: string;
  className?: string;
}

export function SelectControl<T extends string>({ label, value, onValueChange, options, helpText, className }: SelectControlProps<T>) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {helpText && <p className="text-xs text-text/60 mb-2">{helpText}</p>}
      <CustomSelect
        value={value}
        onChange={(val) => onValueChange(val as T)}
        options={options}
        className="mt-1"
      />
    </div>
  );
}