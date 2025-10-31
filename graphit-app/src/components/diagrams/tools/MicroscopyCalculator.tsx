'use client';

import React, { useReducer, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Save, Calculator, XCircle } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

type Unit = 'mm' | 'μm' | 'nm';
interface ValueUnit { value: string; unit: Unit; }
interface MicroscopyProps {
  initialImage?: ValueUnit;
  initialActual?: ValueUnit;
  initialMagnification?: string;
}

type State = { image: ValueUnit; actual: ValueUnit; magnification: string; result: string; };
type Action = 
    | { type: 'SET_IMAGE', payload: Partial<ValueUnit> }
    | { type: 'SET_ACTUAL', payload: Partial<ValueUnit> }
    | { type: 'SET_MAGNIFICATION', payload: string }
    | { type: 'CALCULATE' }
    | { type: 'RESET' };
    
const conversionFactors: Record<Unit, number> = { mm: 1_000_000, 'μm': 1_000, nm: 1 };

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_IMAGE': return { ...state, image: { ...state.image, ...action.payload }};
        case 'SET_ACTUAL': return { ...state, actual: { ...state.actual, ...action.payload }};
        case 'SET_MAGNIFICATION': return { ...state, magnification: action.payload };
        case 'RESET': return { image: { value: '', unit: 'mm' }, actual: { value: '', unit: 'μm' }, magnification: '', result: '' };
        case 'CALCULATE': {
            const i = parseFloat(state.image.value);
            const a = parseFloat(state.actual.value);
            const m = parseFloat(state.magnification);
            const i_nm = i * conversionFactors[state.image.unit];
            const a_nm = a * conversionFactors[state.actual.unit];
            const formatNumber = (num: number) => (num < 0.01 && num > 0) ? num.toExponential(2) : Number(num.toFixed(2)).toString();

            if (!state.magnification && state.image.value && state.actual.value) {
                return { ...state, result: `Magnification = ${formatNumber(i_nm / a_nm)}x` };
            } else if (!state.actual.value && state.image.value && state.magnification) {
                const actualNm = i_nm / m;
                return { ...state, result: `Actual Size = ${formatNumber(actualNm / conversionFactors[state.actual.unit])} ${state.actual.unit}` };
            } else if (!state.image.value && state.actual.value && state.magnification) {
                const imageNm = a_nm * m;
                return { ...state, result: `Image Size = ${formatNumber(imageNm / conversionFactors[state.image.unit])} ${state.image.unit}` };
            } else {
                return { ...state, result: 'Please provide two values to calculate the third.' };
            }
        }
        default: return state;
    }
}

export default function MicroscopyCalculator(props: MicroscopyProps) {
  const initialState: State = {
      image: props.initialImage || { value: '', unit: 'mm' },
      actual: props.initialActual || { value: '', unit: 'μm' },
      magnification: props.initialMagnification || '',
      result: '',
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { image, actual, magnification, result } = state;

  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const getDiagramState = () => ({
    initialImage: image, initialActual: actual, initialMagnification: magnification,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Microscopy Calculator (I=AM)</CardTitle></CardHeader>
          <div className="p-6 space-y-4">
            <div>
              <Label>Image Size (I)</Label>
              <div className="flex gap-2"><Input type="number" placeholder="e.g., 50" value={image.value} onChange={e => dispatch({type: 'SET_IMAGE', payload: { value: e.target.value }})} /><Select value={image.unit} onChange={e => dispatch({type: 'SET_IMAGE', payload: { unit: e.target.value as Unit }})}><option>mm</option><option>μm</option><option>nm</option></Select></div>
            </div>
            <div>
              <Label>Actual Size (A)</Label>
              <div className="flex gap-2"><Input type="number" placeholder="e.g., 100" value={actual.value} onChange={e => dispatch({type: 'SET_ACTUAL', payload: { value: e.target.value }})} /><Select value={actual.unit} onChange={e => dispatch({type: 'SET_ACTUAL', payload: { unit: e.target.value as Unit }})}><option>mm</option><option>μm</option><option>nm</option></Select></div>
            </div>
            <div><Label>Magnification (M)</Label><Input type="number" placeholder="e.g., 1000" value={magnification} onChange={e => dispatch({type: 'SET_MAGNIFICATION', payload: e.target.value})} /></div>
            <div className="flex gap-2 pt-2"><Button onClick={() => dispatch({type: 'CALCULATE'})} className="flex-grow"><Calculator className="mr-2 h-4 w-4"/> Calculate</Button><Button onClick={() => dispatch({type: 'RESET'})} variant="ghost"><XCircle className="h-4 w-4"/></Button></div>
            {result && <div className="p-3 bg-accent/20 text-accent font-bold rounded-lg text-center">{result}</div>}
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'microscopy-calculator')}><Save className="mr-2 h-4 w-4" /> Save & Export Image</Button>
              {session?.isLoggedIn && (<SaveGraphButton diagramName="Microscopy Calculations" getDiagramState={getDiagramState} />)}
            </div>
          </div>
        </Card>
      </div>
      <div ref={diagramContainerRef} data-testid="diagram-container" className="md:col-span-2 min-h-[500px]">
        <Card className="h-full flex items-center justify-center !p-4">
          <svg viewBox="0 0 400 300" className="w-full h-full text-text">
            <text x="200" y="25" textAnchor="middle" className="font-bold text-lg fill-current">Image Size = Actual Size × Magnification</text>
            <circle cx="100" cy="150" r="20" fill="var(--color-accent)" fillOpacity="0.3" stroke="var(--color-accent)" strokeWidth="2" />
            <text x="100" y="210" textAnchor="middle" className="fill-current">Actual Object (A)</text>
            <path d="M140 150 l80 -50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
            <path d="M140 150 l80 50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
            <text x="225" y="155" textAnchor="middle" transform="rotate(-15 225 150)" className="fill-current">Magnification (M)</text>
            <circle cx="300" cy="150" r="60" fill="var(--color-secondary)" fillOpacity="0.3" stroke="var(--color-secondary)" strokeWidth="2" />
            <text x="300" y="250" textAnchor="middle" className="fill-current">Observed Image (I)</text>
          </svg>
        </Card>
      </div>
    </div>
  );
}