'use client';
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
import { DiagramToolbar } from '../DiagramToolbar';
import { SliderControl } from '../controls/SliderControl';
const CHART_COLORS = ['var(--color-accent)', 'var(--color-secondary)', '#34d399', '#a78bfa', '#facc15', '#fb923c'];
const defaultCSV = `Category,Value\nApples,12\nOranges,19\nBananas,3\nGrapes,5\nPears,2`;
const defaultBarSize = 20;
export default function BarChartTool() {
  const [csvData, setCsvData] = useState(defaultCSV);
  const [barSize, setBarSize] = useState(defaultBarSize);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const value = parseFloat(values[1]);
      return {
        [headers[0]]: values[0],
        [headers[1]]: isNaN(value) ? 0 : value,
      };
    });
  }, [csvData]);
  const headers = useMemo(() => {
    return csvData.split('\n')[0]?.split(',').map(h => h.trim()) || ['Category', 'Value'];
  }, [csvData]);
  const getDiagramState = useCallback((): Record<string, unknown> => {
    return { csvData, barSize };
  }, [csvData, barSize]);
  const handleExport = useCallback(() => {
    openExportModal(diagramContainerRef, 'bar-chart');
  }, [openExportModal]);
  const handleReset = useCallback(() => {
    setCsvData(defaultCSV);
    setBarSize(defaultBarSize);
  }, []);
  return (
    <DiagramErrorBoundary diagramName="Bar Chart Tool">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Bar Chart Data</CardTitle></CardHeader>
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
                label="Bar Width"
                value={barSize}
                min={5}
                max={80}
                step={5}
                unit="px"
                onChange={setBarSize}
              />
              <DiagramToolbar
                diagramName="Bar Chart"
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
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey={headers[0]} stroke="var(--color-text)" />
                <YAxis stroke="var(--color-text)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-neutral-dark)',
                    borderRadius: 'var(--border-radius-apple)',
                    color: 'var(--color-text)',
                  }}
                />
                <Legend wrapperStyle={{ color: 'var(--color-text)' }} />
                <Bar dataKey={headers[1]} barSize={barSize}>
                  {data.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}