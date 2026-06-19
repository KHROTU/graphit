'use client';
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
import { DiagramToolbar } from '../DiagramToolbar';
import { SliderControl } from '../controls/SliderControl';
const CHART_COLORS = ['var(--color-accent)', 'var(--color-secondary)', '#34d399', '#a78bfa', '#facc15', '#fb923c'];
const defaultCSV = `Item,Share\nElectronics,45\nClothing,25\nGroceries,15\nBooks,10\nOther,5`;
const defaultInnerRadius = 0;
export default function PieChartTool() {
  const [csvData, setCsvData] = useState(defaultCSV);
  const [innerRadius, setInnerRadius] = useState(defaultInnerRadius);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const value = parseFloat(values[1]);
      return {
        name: values[0],
        value: isNaN(value) ? 0 : value,
      };
    });
  }, [csvData]);
  const getDiagramState = useCallback((): Record<string, unknown> => {
    return { csvData, innerRadius };
  }, [csvData, innerRadius]);
  const handleExport = useCallback(() => {
    openExportModal(diagramContainerRef, 'pie-chart');
  }, [openExportModal]);
  const handleReset = useCallback(() => {
    setCsvData(defaultCSV);
    setInnerRadius(defaultInnerRadius);
  }, []);
  return (
    <DiagramErrorBoundary diagramName="Pie Chart Tool">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Pie Chart Data</CardTitle></CardHeader>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Data (CSV Format)</Label>
                <textarea
                  value={csvData}
                  onChange={e => setCsvData(e.target.value)}
                  rows={8}
                  className="w-full p-3 bg-background border border-neutral-dark rounded-apple text-sm font-mono text-text resize-y focus:outline-none focus:border-accent/50"
                />
              </div>
              <SliderControl
                label="Inner Radius"
                value={innerRadius}
                min={0}
                max={70}
                step={5}
                unit="%"
                onChange={setInnerRadius}
              />
              <DiagramToolbar
                diagramName="Pie Chart"
                getDiagramState={getDiagramState}
                onExport={handleExport}
                onReset={handleReset}
              />
            </div>
          </Card>
        </div>
        <div className="md:col-span-2 min-h-[400px] md:min-h-0">
          <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  innerRadius={`${innerRadius}%`}
                  label={{ fill: 'var(--color-text)' }}
                >
                  {data.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-neutral-dark)',
                    borderRadius: 'var(--border-radius-apple)',
                    color: 'var(--color-text)',
                  }}
                />
                <Legend wrapperStyle={{ color: 'var(--color-text)' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}