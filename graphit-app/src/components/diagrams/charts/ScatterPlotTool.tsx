'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const defaultData = `Height,Weight\n150,55\n155,60\n160,62\n165,68\n170,72\n175,75\n180,80\n185,85`;

export default function ScatterPlotTool() {
  const [csvData, setCsvData] = useState(defaultData);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();

  const data = useMemo(() => {
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const x = parseFloat(values[0]);
      const y = parseFloat(values[1]);
      return (isNaN(x) || isNaN(y)) ? null : { x, y };
    }).filter(p => p !== null) as { x: number; y: number }[];
  }, [csvData]);

  const lineOfBestFit = useMemo(() => {
    if (!data || data.length < 2) return null;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = data.length;

    for (const point of data) {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumXX += point.x * point.x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    if (isNaN(slope) || isNaN(intercept)) return null;
    
    const xMin = Math.min(...data.map(p => p.x));
    const xMax = Math.max(...data.map(p => p.x));

    return [
      { x: xMin, y: slope * xMin + intercept },
      { x: xMax, y: slope * xMax + intercept },
    ];
  }, [data]);

  const headers = useMemo(() => {
    return csvData.split('\n')[0]?.split(',').map(h => h.trim()) || ['x', 'y'];
  }, [csvData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Scatter Plot Data</CardTitle></CardHeader>
          <div className="p-6 space-y-4">
            <Label>Data (CSV Format)</Label>
            <textarea value={csvData} onChange={e => setCsvData(e.target.value)} rows={8} className="w-full mt-1 p-2 bg-transparent border border-neutral-dark rounded-apple text-sm font-mono"/>
            <Button onClick={() => openExportModal(diagramContainerRef, 'scatter-plot')} className="w-full !mt-8"><Save className="mr-2 h-4 w-4" /> Save & Export</Button>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis type="number" dataKey="x" name={headers[0]} unit="" domain={['dataMin', 'dataMax']} label={{ value: headers[0], position: 'insideBottom', offset: -10 }} />
                <YAxis type="number" dataKey="y" name={headers[1]} unit="" domain={['dataMin', 'dataMax']} label={{ value: headers[1], angle: -90, position: 'insideLeft' }}/>
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name="Data Set" data={data} fill="#8884d8" />
                {lineOfBestFit && (
                  <Line data={lineOfBestFit} dataKey="y" stroke="var(--color-secondary)" strokeWidth={2} dot={false} name="Line of Best Fit" legendType='none' />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}