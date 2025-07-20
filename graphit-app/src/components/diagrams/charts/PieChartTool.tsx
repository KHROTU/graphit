'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const defaultData = `Item,Share\nElectronics,45\nClothing,25\nGroceries,15\nBooks,10\nOther,5`;

export default function PieChartTool() {
  const [csvData, setCsvData] = useState(defaultData);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();

  const data = useMemo(() => {
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return {
        name: values[0],
        value: parseFloat(values[1]),
      };
    });
  }, [csvData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Pie Chart Data</CardTitle></CardHeader>
          <div className="p-6 space-y-4">
            <Label>Data (CSV Format)</Label>
            <textarea value={csvData} onChange={e => setCsvData(e.target.value)} rows={8} className="w-full mt-1 p-2 bg-transparent border border-neutral-dark rounded-apple text-sm font-mono"/>
            <Button onClick={() => openExportModal(diagramContainerRef, 'pie-chart')} className="w-full !mt-8"><Save className="mr-2 h-4 w-4" /> Save & Export</Button>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" label>
                  {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}