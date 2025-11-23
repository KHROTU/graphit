'use client';

import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { Label } from '@/components/ui/Label';
import { CustomSelect } from '@/components/ui/CustomSelect';

type ClimatePreset = 'rainforest' | 'desert' | 'tundra' | 'custom';
interface ClimateGraphProps { initialPreset?: ClimatePreset; initialCustomData?: { temp: string, precip: string } }

type State = { 
    preset: ClimatePreset;
    customTempStr: string;
    customPrecipStr: string;
};

type Action = 
    | { type: 'SET_PRESET', payload: ClimatePreset }
    | { type: 'SET_CUSTOM_TEMP', payload: string }
    | { type: 'SET_CUSTOM_PRECIP', payload: string };

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_PRESET': return { ...state, preset: action.payload };
        case 'SET_CUSTOM_TEMP': return { ...state, customTempStr: action.payload };
        case 'SET_CUSTOM_PRECIP': return { ...state, customPrecipStr: action.payload };
        default: return state;
    }
}

const climatePresets: { [key in Exclude<ClimatePreset, 'custom'>]: { temp: number[], precip: number[] } } = {
  rainforest: { temp: [27,27,28,28,27,26,26,26,27,27,27,27], precip: [250,230,280,300,290,180,160,150,180,220,240,260] },
  desert:     { temp: [12,15,20,25,30,35,38,37,32,26,18,13], precip: [5,5,5,2,1,0,0,1,2,5,5,5] },
  tundra:     { temp: [-25,-26,-22,-15,-5,2,5,4,-1,-10,-18,-22], precip: [10,8,10,10,10,15,25,30,20,15,12,10] },
};
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const climateOptions = [
    { value: 'rainforest', label: 'Tropical Rainforest' },
    { value: 'desert', label: 'Hot Desert' },
    { value: 'tundra', label: 'Arctic Tundra' },
    { value: 'custom', label: 'Custom Data' },
];

export default function ClimateGraph(props: ClimateGraphProps) {
  const initialState: State = { 
      preset: props.initialPreset || 'rainforest',
      customTempStr: props.initialCustomData?.temp || '15, 16, 18, 22, 25, 28, 30, 29, 26, 21, 17, 14',
      customPrecipStr: props.initialCustomData?.precip || '50, 45, 60, 80, 70, 40, 20, 20, 50, 80, 90, 60',
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { preset, customTempStr, customPrecipStr } = state;

  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const data = useMemo(() => {
    let temp: number[], precip: number[];

    if (preset === 'custom') {
        temp = customTempStr.split(',').map(s => parseFloat(s.trim()) || 0);
        precip = customPrecipStr.split(',').map(s => parseFloat(s.trim()) || 0);
        while(temp.length < 12) temp.push(0);
        while(precip.length < 12) precip.push(0);
    } else {
        const pData = climatePresets[preset];
        temp = pData.temp;
        precip = pData.precip;
    }

    return months.map((month, i) => ({ month, Temperature: temp[i], Precipitation: precip[i] }));
  }, [preset, customTempStr, customPrecipStr]);

  const tooltipFormatter = (value: number | string, name: string) => {
    const formattedValue = typeof value === 'number' ? Number(value.toFixed(1)) : value;
    if (name === 'Temperature') return `${formattedValue}°C`;
    if (name === 'Precipitation') return `${formattedValue}mm`;
    return formattedValue;
  };

  const getDiagramState = () => ({ 
      initialPreset: preset,
      initialCustomData: { temp: customTempStr, precip: customPrecipStr }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
              <div className="space-y-2">
                  <Label>Climate Type</Label>
                  <CustomSelect
                    value={preset}
                    onChange={(val) => dispatch({type: 'SET_PRESET', payload: val as ClimatePreset})}
                    options={climateOptions}
                  />
              </div>
              
              {preset === 'custom' && (
                  <div className="space-y-4 animate-fadeIn">
                      <div className="space-y-2">
                          <Label>Temperature (°C) <span className="text-xs text-text/60 font-normal">(Jan-Dec, comma separated)</span></Label>
                          <textarea 
                            value={customTempStr} 
                            onChange={e => dispatch({type: 'SET_CUSTOM_TEMP', payload: e.target.value})}
                            className="w-full h-20 p-2 text-sm bg-transparent border border-neutral-dark rounded-[var(--border-radius-apple)] font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                          />
                      </div>
                      <div className="space-y-2">
                          <Label>Precipitation (mm) <span className="text-xs text-text/60 font-normal">(Jan-Dec, comma separated)</span></Label>
                          <textarea 
                            value={customPrecipStr} 
                            onChange={e => dispatch({type: 'SET_CUSTOM_PRECIP', payload: e.target.value})}
                            className="w-full h-20 p-2 text-sm bg-transparent border border-neutral-dark rounded-[var(--border-radius-apple)] font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                          />
                      </div>
                  </div>
              )}

              <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
                <Button onClick={() => openExportModal(diagramContainerRef, 'climate-graph')}>
                    <Save className="mr-2 h-4 w-4" /> Save & Export Image
                </Button>
                {session?.isLoggedIn && (
                  <SaveGraphButton diagramName="Climate Graphs" getDiagramState={getDiagramState} />
                )}
              </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px] md:min-h-0">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="month" stroke="var(--color-text)" label={{ value: 'Month', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                    <YAxis yAxisId="left" orientation="left" stroke="var(--color-accent)" label={{ value: 'Precipitation (mm)', angle: -90, position: 'insideLeft', fill: 'var(--color-accent)' }}/>
                    <YAxis yAxisId="right" orientation="right" stroke="var(--color-secondary)" label={{ value: 'Temperature (°C)', angle: 90, position: 'insideRight', fill: 'var(--color-secondary)' }}/>
                    <Tooltip formatter={tooltipFormatter} contentStyle={{ backgroundColor: 'var(--color-neutral)', border: '1px solid var(--color-neutral-dark)', borderRadius: 'var(--border-radius-apple)', color: 'var(--color-text)' }} />
                    <Legend wrapperStyle={{ color: 'var(--color-text)' }} verticalAlign="top" height={36}/>
                    <Bar yAxisId="left" dataKey="Precipitation" fill="var(--color-accent)" fillOpacity={0.8} />
                    <Line yAxisId="right" type="monotone" dataKey="Temperature" stroke="var(--color-secondary)" strokeWidth={2} />
                </ComposedChart>
            </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}