'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
}

export function SegmentControl<T extends string>({ options, value, onValueChange }: SegmentControlProps<T>) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          className="flex-1"
          variant={value === option.value ? 'default' : 'outline'}
          onClick={() => onValueChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}