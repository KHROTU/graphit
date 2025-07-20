'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const defaultData = `Category,Value\nApples,12\nOranges,19\nBananas,3\nGrapes,5\nPears,2`;

export default function BarChartTool() {
  const [csvData, setCsvData] = useState(defaultData);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();

  const data = useMemo(() => {
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return {
        [headers[0]]: values[0],
        [headers[1]]: parseFloat(values[1]),
      };
    });
  }, [csvData]);

  const headers = useMemo(() => {
    return csvData.split('\n')[0]?.split(',').map(h => h.trim()) || ['Category', 'Value'];
  }, [csvData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Bar Chart Data</CardTitle></CardHeader>
          <div className="p-6 space-y-4">
            <Label>Data (CSV Format)</Label>
            <textarea value={csvData} onChange={e => setCsvData(e.target.value)} rows={8} className="w-full mt-1 p-2 bg-transparent border border-neutral-dark rounded-apple text-sm font-mono"/>
            <Button onClick={() => openExportModal(diagramContainerRef, 'bar-chart')} className="w-full !mt-8"><Save className="mr-2 h-4 w-4" /> Save & Export</Button>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis dataKey={headers[0]} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={headers[1]}>
                  {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}