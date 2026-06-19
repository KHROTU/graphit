'use client';
import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import dynamic from 'next/dynamic';
import { BarChart as BarChartIcon, PieChart as PieChartIcon, ScatterChart as ScatterChartIcon } from 'lucide-react';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
import { DiagramToolbar } from '../DiagramToolbar';
import { SegmentControl } from '../controls/SegmentControl';
const BarChartTool = dynamic(() => import('./BarChartTool'), { ssr: false, loading: () => <p>Loading...</p> });
const PieChartTool = dynamic(() => import('./PieChartTool'), { ssr: false, loading: () => <p>Loading...</p> });
const ScatterPlotTool = dynamic(() => import('./ScatterPlotTool'), { ssr: false, loading: () => <p>Loading...</p> });
type ToolType = 'bar' | 'pie' | 'scatter';
const chartTypeOptions: { value: ToolType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'pie', label: 'Pie' },
  { value: 'scatter', label: 'Scatter' },
];
const chartToolMap: Record<ToolType, React.ReactNode> = {
  bar: <BarChartTool />,
  pie: <PieChartTool />,
  scatter: <ScatterPlotTool />,
};
const chartIcons: Record<ToolType, React.ElementType> = {
  bar: BarChartIcon,
  pie: PieChartIcon,
  scatter: ScatterChartIcon,
};
export default function GeneralGraphTool() {
  const [activeTool, setActiveTool] = useState<ToolType>('bar');
  const getDiagramState = useCallback((): Record<string, unknown> => {
    return { activeTool };
  }, [activeTool]);
  const handleReset = useCallback(() => {
    setActiveTool('bar');
  }, []);
  const ActiveIcon = chartIcons[activeTool];
  return (
    <DiagramErrorBoundary diagramName="General Graph Tool">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Chart Type</CardTitle></CardHeader>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <ActiveIcon className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium text-text">
                  {chartTypeOptions.find(o => o.value === activeTool)?.label}
                </span>
              </div>
              <SegmentControl
                options={chartTypeOptions}
                value={activeTool}
                onValueChange={setActiveTool}
              />
              <DiagramToolbar
                diagramName="General Graph"
                getDiagramState={getDiagramState}
                onExport={() => {}}
                onReset={handleReset}
              />
            </div>
          </Card>
        </div>
        <div className="md:col-span-2">
          {chartToolMap[activeTool]}
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}