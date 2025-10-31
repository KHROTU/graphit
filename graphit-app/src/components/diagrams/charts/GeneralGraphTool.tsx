'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import dynamic from 'next/dynamic';
import { BarChart as BarChartIcon, PieChart as PieChartIcon, ScatterChart as ScatterChartIcon } from 'lucide-react';

const BarChartTool = dynamic(() => import('./BarChartTool'), { ssr: false, loading: () => <p>Loading...</p> });
const PieChartTool = dynamic(() => import('./PieChartTool'), { ssr: false, loading: () => <p>Loading...</p> });
const ScatterPlotTool = dynamic(() => import('./ScatterPlotTool'), { ssr: false, loading: () => <p>Loading...</p> });

type ToolType = 'bar' | 'pie' | 'scatter';

export default function GeneralGraphTool() {
  const [activeTool, setActiveTool] = useState<ToolType>('bar');

  const tools: { id: ToolType; name: string; icon: React.ElementType; component: React.ReactNode }[] = [
    { id: 'bar', name: 'Bar Chart', icon: BarChartIcon, component: <BarChartTool /> },
    { id: 'pie', name: 'Pie Chart', icon: PieChartIcon, component: <PieChartTool /> },
    { id: 'scatter', name: 'Scatter Plot', icon: ScatterChartIcon, component: <ScatterPlotTool /> },
  ];

  return (
    <div data-testid="diagram-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
                <Card>
                <CardHeader><CardTitle>Chart Type</CardTitle></CardHeader>
                <div className="p-4 space-y-2">
                    {tools.map(tool => (
                    <Button
                        key={tool.id}
                        variant={activeTool === tool.id ? 'default' : 'ghost'}
                        onClick={() => setActiveTool(tool.id)}
                        className="w-full justify-start"
                    >
                        <tool.icon className="mr-2 h-4 w-4" />
                        {tool.name}
                    </Button>
                    ))}
                </div>
                </Card>
            </div>
            <div className="md:col-span-3 min-h-[70vh]">
                {tools.find(t => t.id === activeTool)?.component}
            </div>
        </div>
    </div>
  );
}