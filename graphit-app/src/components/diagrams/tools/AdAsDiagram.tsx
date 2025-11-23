'use client';

import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SelectControl } from '../controls/SelectControl';

interface AdAsProps {
  initialAdShift?: number;
  initialSrasShift?: number;
  initialLrasPosition?: number;
  initialModel?: 'classical' | 'keynesian';
}

type State = { adShift: number; srasShift: number; lrasPosition: number; model: 'classical' | 'keynesian' };
type Action = 
    | { type: 'SET_AD_SHIFT', payload: number }
    | { type: 'SET_SRAS_SHIFT', payload: number }
    | { type: 'SET_LRAS_POS', payload: number }
    | { type: 'SET_MODEL', payload: 'classical' | 'keynesian' };

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_AD_SHIFT': return { ...state, adShift: action.payload };
        case 'SET_SRAS_SHIFT': return { ...state, srasShift: action.payload };
        case 'SET_LRAS_POS': return { ...state, lrasPosition: action.payload };
        case 'SET_MODEL': return { ...state, model: action.payload };
        default: return state;
    }
}

const formatValue = (value: number | string) => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return value;
};

export default function AdAsDiagram(props: AdAsProps) {
  const initialState: State = {
      adShift: props.initialAdShift || 0,
      srasShift: props.initialSrasShift || 0,
      lrasPosition: props.initialLrasPosition || 80,
      model: props.initialModel || 'classical',
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { adShift, srasShift, lrasPosition, model } = state;
  
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const data = useMemo(() => {
    const adSlope = 1, srasSlope = 1;
    const baseAdIntercept = 180;
    const baseSrasIntercept = 20;
    
    const adIntercept = baseAdIntercept + adShift;
    const srasIntercept = baseSrasIntercept + srasShift;
    
    const chartData = [];
    for (let q = 0; q <= 160; q+=2) {
        const adVal = Math.max(0, adIntercept - adSlope * q);
        
        let srasVal: number | null = null;
        let lrasVal: number | null = null;
        
        if (model === 'classical') {
            srasVal = Math.max(0, srasIntercept + srasSlope * q);
        } 
        else {
           const fullEmployment = lrasPosition;
           if (q < fullEmployment) {
               lrasVal = 20 + (q * 0.3); 
           } else {
               lrasVal = 20 + (fullEmployment * 0.3) + Math.pow(q - fullEmployment, 1.5) * 2;
           }
           if (lrasVal > 200) lrasVal = null;
        }

        chartData.push({
            gdp: q,
            AD: adVal,
            SRAS: model === 'classical' ? srasVal : null,
            LRAS_Keynesian: model === 'keynesian' ? lrasVal : null
        });
    }
    return chartData;
  }, [adShift, srasShift, lrasPosition, model]);

  const getDiagramState = () => ({
    initialAdShift: adShift,
    initialSrasShift: srasShift,
    initialLrasPosition: lrasPosition,
    initialModel: model
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Macroeconomic Equilibrium</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
              <SelectControl 
                label="Model Type"
                value={model}
                onValueChange={(val) => dispatch({type: 'SET_MODEL', payload: val as 'classical' | 'keynesian'})}
                options={[
                    { value: 'classical', label: 'Monetarist / Classical' },
                    { value: 'keynesian', label: 'Keynesian' }
                ]}
              />

              <div>
                  <Label>AD Shift</Label>
                  <input type="range" min="-50" max="50" value={adShift} onChange={(e) => dispatch({type: 'SET_AD_SHIFT', payload: parseInt(e.target.value)})} className="w-full mt-2" />
              </div>
              
              {model === 'classical' ? (
                  <>
                    <div>
                        <Label>SRAS Shift</Label>
                        <input type="range" min="-50" max="50" value={srasShift} onChange={(e) => dispatch({type: 'SET_SRAS_SHIFT', payload: parseInt(e.target.value)})} className="w-full mt-2" />
                    </div>
                    <div>
                        <Label>LRAS Position (Full Employment)</Label>
                        <input type="range" min="50" max="120" value={lrasPosition} onChange={(e) => dispatch({type: 'SET_LRAS_POS', payload: parseInt(e.target.value)})} className="w-full mt-2" />
                    </div>
                  </>
              ) : (
                  <div>
                      <Label>Full Employment Level (Yfe)</Label>
                      <input type="range" min="50" max="120" value={lrasPosition} onChange={(e) => dispatch({type: 'SET_LRAS_POS', payload: parseInt(e.target.value)})} className="w-full mt-2" />
                  </div>
              )}

              <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
                <Button onClick={() => openExportModal(diagramContainerRef, 'ad-as-diagram')}>
                    <Save className="mr-2 h-4 w-4" /> Save & Export Image
                </Button>
                {session?.isLoggedIn && (
                  <SaveGraphButton diagramName="AD/AS Diagram" getDiagramState={getDiagramState} />
                )}
              </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px] md:min-h-0">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="gdp" stroke="var(--color-text)" type="number" domain={[0, 160]} label={{ value: 'Real GDP (Y)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }} />
                    <YAxis stroke="var(--color-text)" type="number" domain={[0, 200]} label={{ value: 'Price Level (PL)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }} />
                    <Tooltip formatter={formatValue} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
                    
                    <Line type="monotone" dataKey="AD" stroke="var(--color-accent)" strokeWidth={3} dot={false} name="Aggregate Demand" connectNulls />
                    
                    {model === 'classical' && (
                        <>
                            <Line type="monotone" dataKey="SRAS" stroke="var(--color-secondary)" strokeWidth={3} dot={false} name="SRAS" connectNulls />
                            <ReferenceLine x={lrasPosition} stroke="var(--color-text)" strokeWidth={2} label={{ value: 'LRAS', position: 'insideTopRight', fill: 'var(--color-text)' }} />
                        </>
                    )}

                    {model === 'keynesian' && (
                        <Line type="monotone" dataKey="LRAS_Keynesian" stroke="var(--color-secondary)" strokeWidth={3} dot={false} name="Keynesian AS" connectNulls />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}