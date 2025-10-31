'use client';

import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataPoint { id: number; name: string; value: number; }
type ChartType = 'bar' | 'pie' | 'histogram';
type State = {
    chartType: ChartType;
    data: DataPoint[];
    rawData: string;
    binCount: number;
};
type Action = 
    | { type: 'SET_CHART_TYPE', payload: ChartType }
    | { type: 'ADD_DATA_POINT' }
    | { type: 'UPDATE_DATA_POINT', payload: { id: number, field: keyof DataPoint, value: string | number } }
    | { type: 'REMOVE_DATA_POINT', payload: { id: number } }
    | { type: 'SET_RAW_DATA', payload: string }
    | { type: 'SET_BIN_COUNT', payload: number };

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_CHART_TYPE': return { ...state, chartType: action.payload };
        case 'ADD_DATA_POINT': return { ...state, data: [...state.data, { id: Date.now(), name: 'New', value: 100 }] };
        case 'UPDATE_DATA_POINT': {
            const { id, field, value } = action.payload;
            return { ...state, data: state.data.map(d => d.id === id ? { ...d, [field]: value } : d) };
        }
        case 'REMOVE_DATA_POINT': return { ...state, data: state.data.filter(d => d.id !== action.payload.id) };
        case 'SET_RAW_DATA': return { ...state, rawData: action.payload };
        case 'SET_BIN_COUNT': return { ...state, binCount: action.payload };
        default: return state;
    }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function StatisticalChart() {
  const initialState: State = {
      chartType: 'bar',
      data: [
        { id: 1, name: 'Category A', value: 400 },
        { id: 2, name: 'Category B', value: 300 },
        { id: 3, name: 'Category C', value: 300 },
        { id: 4, name: 'Category D', value: 200 },
      ],
      rawData: '8, 12, 15, 17, 18, 22, 23, 23, 25, 28, 30, 31, 33, 35, 35, 38, 40, 42, 45, 50, 51, 53, 55, 58, 60',
      binCount: 5,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { chartType, data, rawData, binCount } = state;

  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  
  const histogramData = useMemo(() => {
    const numbers = rawData.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if (numbers.length === 0 || binCount <= 0) return [];

    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const range = max - min;
    const binWidth = range === 0 ? 1 : Math.ceil(range / binCount);

    const bins = Array.from({ length: binCount }, (_, i) => {
        const binMin = min + i * binWidth;
        const binMax = min + (i + 1) * binWidth;
        return { range: `${binMin.toFixed(0)}-${binMax.toFixed(0)}`, frequency: 0 };
    });

    numbers.forEach(num => {
        let binIndex = Math.floor((num - min) / binWidth);
        if (num === max) binIndex = binCount - 1;
        if (bins[binIndex]) bins[binIndex].frequency++;
    });
    return bins;
  }, [rawData, binCount]);

  const renderChart = () => {
    if (chartType === 'pie') {
      return (
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} label>
            {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      );
    }
    if (chartType === 'histogram') {
        return (
            <BarChart data={histogramData} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis dataKey="range" label={{ value: 'Value Range', position: 'insideBottom', offset: -5 }}/>
                <YAxis allowDecimals={false} label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}/>
                <Tooltip />
                <Bar dataKey="frequency" name="Frequency" fill={COLORS[0]} />
            </BarChart>
        )
    }
    return (
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" name="Value">
            {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
        </Bar>
      </BarChart>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Chart Data & Type</CardTitle></CardHeader>
          <div className="p-4 space-y-4">
            <div>
                <Label>Chart Type</Label>
                <Select value={chartType} onChange={e => dispatch({type: 'SET_CHART_TYPE', payload: e.target.value as ChartType})}>
                    <option value="bar">Bar Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="histogram">Histogram</option>
                </Select>
            </div>
          </div>
          <div className="p-4 border-t border-neutral-dark/50 space-y-2 max-h-[400px] overflow-y-auto">
            {chartType === 'histogram' ? (
                <div className="space-y-4">
                    <div>
                        <Label>Raw Data (comma-separated)</Label>
                        <textarea value={rawData} onChange={e => dispatch({type: 'SET_RAW_DATA', payload: e.target.value})} rows={5} className="w-full mt-1 p-2 bg-transparent border border-neutral-dark rounded-apple text-sm"/>
                    </div>
                    <div>
                        <Label>Number of Bins</Label>
                        <Input type="number" value={binCount} min={1} max={20} onChange={e => dispatch({type: 'SET_BIN_COUNT', payload: Number(e.target.value)})} />
                    </div>
                </div>
            ) : (
                <>
                    <Label>Data Points</Label>
                    {data.map(d => (
                    <div key={d.id} className="flex gap-2 items-center">
                        <Input value={d.name} onChange={e => dispatch({type: 'UPDATE_DATA_POINT', payload: {id: d.id, field: 'name', value: e.target.value}})} placeholder="Label"/>
                        <Input type="number" value={d.value} onChange={e => dispatch({type: 'UPDATE_DATA_POINT', payload: {id: d.id, field: 'value', value: Number(e.target.value)}})} placeholder="Value"/>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => dispatch({type: 'REMOVE_DATA_POINT', payload: {id: d.id}})}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                    </div>
                    ))}
                    <Button variant="outline" onClick={() => dispatch({type: 'ADD_DATA_POINT'})} className="w-full"><Plus className="mr-2 h-4 w-4"/>Add Data Point</Button>
                </>
            )}
          </div>
          <div className="p-4 border-t border-neutral-dark/30">
            <Button onClick={() => openExportModal(diagramContainerRef, 'statistical-chart')} className="w-full"><Save className="mr-2 h-4 w-4"/> Save & Export</Button>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}