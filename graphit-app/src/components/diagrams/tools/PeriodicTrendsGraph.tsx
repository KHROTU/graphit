'use client';

import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

type Trend = 'ionisation' | 'radius' | 'electronegativity';
type Period = '1' | '2' | '3' | '4' | '5' | '6';

interface PeriodicTrendsProps {
  initialSelectedTrend?: Trend;
  initialSelectedPeriod?: Period;
}

type State = { selectedTrend: Trend; selectedPeriod: Period; };
type Action = 
    | { type: 'SET_TREND', payload: Trend }
    | { type: 'SET_PERIOD', payload: Period };

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_TREND': return { ...state, selectedTrend: action.payload };
        case 'SET_PERIOD': return { ...state, selectedPeriod: action.payload };
        default: return state;
    }
}

const periodicData = {
  '1': { elements: ['H', 'He'], ionisation: [1312, 2372], radius: [53, 31], electronegativity: [2.20, null] },
  '2': { elements: ['Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'], ionisation: [520, 900, 801, 1087, 1402, 1314, 1681, 2081], radius: [167, 112, 87, 67, 56, 48, 42, 38], electronegativity: [0.98, 1.57, 2.04, 2.55, 3.04, 3.44, 3.98, null] },
  '3': { elements: ['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'], ionisation: [496, 738, 578, 789, 1012, 1000, 1251, 1521], radius: [190, 145, 118, 111, 98, 88, 79, 71], electronegativity: [0.93, 1.31, 1.61, 1.90, 2.19, 2.58, 3.16, null] },
  '4': { elements: ['K', 'Ca', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'], ionisation: [419, 590, 579, 762, 947, 941, 1140, 1351], radius: [243, 194, 136, 125, 114, 103, 94, 88], electronegativity: [0.82, 1.00, 1.81, 2.01, 2.18, 2.55, 2.96, 3.00] },
  '5': { elements: ['Rb', 'Sr', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe'], ionisation: [403, 550, 558, 709, 834, 869, 1008, 1170], radius: [265, 219, 156, 145, 133, 123, 115, 108], electronegativity: [0.82, 0.95, 1.78, 1.96, 2.05, 2.1, 2.66, 2.60] },
  '6': { elements: ['Cs', 'Ba', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn'], ionisation: [376, 503, 589, 716, 703, 812, 890, 1037], radius: [298, 253, 156, 154, 143, 135, 127, 120], electronegativity: [0.79, 0.89, 1.62, 2.33, 2.02, 2.0, 2.2, 2.2] },
};
const trendInfo = {
  ionisation: { label: 'First Ionisation Energy', unit: 'kJ/mol' },
  radius: { label: 'Atomic Radius', unit: 'pm' },
  electronegativity: { label: 'Electronegativity', unit: '(Pauling)' },
};
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

export default function PeriodicTrendsGraph(props: PeriodicTrendsProps) {
  const initialState: State = {
      selectedTrend: props.initialSelectedTrend || 'ionisation',
      selectedPeriod: props.initialSelectedPeriod || '3',
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { selectedTrend, selectedPeriod } = state;

  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const chartData = useMemo(() => {
    const dataForPeriod = periodicData[selectedPeriod];
    return dataForPeriod.elements.map((element, i) => ({
      name: element,
      value: (dataForPeriod[selectedTrend] as (number | null)[])[i],
    }));
  }, [selectedTrend, selectedPeriod]);

  const getDiagramState = () => ({
    initialSelectedTrend: selectedTrend,
    initialSelectedPeriod: selectedPeriod,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Periodic Trends Grapher</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <div>
              <Label>Select Trend</Label>
              <div className="flex flex-col gap-2 mt-2">
                <Button variant={selectedTrend === 'ionisation' ? 'default' : 'outline'} onClick={() => dispatch({type: 'SET_TREND', payload: 'ionisation'})}>Ionisation Energy</Button>
                <Button variant={selectedTrend === 'radius' ? 'default' : 'outline'} onClick={() => dispatch({type: 'SET_TREND', payload: 'radius'})}>Atomic Radius</Button>
                <Button variant={selectedTrend === 'electronegativity' ? 'default' : 'outline'} onClick={() => dispatch({type: 'SET_TREND', payload: 'electronegativity'})}>Electronegativity</Button>
              </div>
            </div>
            
            <div>
              <Label>Select Period</Label>
              <p className="text-xs text-text/60 mb-2">(Note: Transition metals are excluded for clarity)</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(Object.keys(periodicData) as Period[]).map(p => (
                  <Button key={p} variant={selectedPeriod === p ? 'default' : 'outline'} onClick={() => dispatch({type: 'SET_PERIOD', payload: p})}>{`Period ${p}`}</Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'periodic-trends-graph')}>
                  <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              {session?.isLoggedIn && (
                <SaveGraphButton diagramName="Periodic Trends Grapher" getDiagramState={getDiagramState} />
              )}
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis dataKey="name" label={{ value: 'Element', position: 'insideBottom', offset: -10 }}/>
                <YAxis label={{ value: trendInfo[selectedTrend].unit, angle: -90, position: 'insideLeft' }} domain={['dataMin - 5', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)' }}/>
                <Legend verticalAlign="top" />
                <Bar dataKey="value" name={trendInfo[selectedTrend].label}>
                    {chartData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}