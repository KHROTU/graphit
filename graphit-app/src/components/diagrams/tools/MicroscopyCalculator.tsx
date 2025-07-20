'use client';

import React, { useState, useRef } from 'react';
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

const conversionFactors: Record<Unit, number> = { mm: 1_000_000, 'μm': 1_000, nm: 1 };

export default function MicroscopyCalculator(props: MicroscopyProps) {
  const [image, setImage] = useState<ValueUnit>(props.initialImage || { value: '', unit: 'mm' });
  const [actual, setActual] = useState<ValueUnit>(props.initialActual || { value: '', unit: 'μm' });
  const [magnification, setMagnification] = useState(props.initialMagnification || '');
  const [result, setResult] = useState('');
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const calculate = () => {
    const i = parseFloat(image.value);
    const a = parseFloat(actual.value);
    const m = parseFloat(magnification);
    const i_nm = i * conversionFactors[image.unit];
    const a_nm = a * conversionFactors[actual.unit];

    if (!magnification && image.value && actual.value) {
      setResult(`Magnification = ${formatNumber(i_nm / a_nm)}x`);
    } else if (!actual.value && image.value && magnification) {
      const actualNm = i_nm / m;
      setResult(`Actual Size = ${formatNumber(actualNm / conversionFactors[actual.unit])} ${actual.unit}`);
    } else if (!image.value && actual.value && magnification) {
      const imageNm = a_nm * m;
      setResult(`Image Size = ${formatNumber(imageNm / conversionFactors[image.unit])} ${image.unit}`);
    } else {
      setResult('Please provide two values to calculate the third.');
    }
  };

  const formatNumber = (num: number) => {
    if (num < 0.01 && num > 0) return num.toExponential(2);
    return Number(num.toFixed(2)).toString();
  };

  const reset = () => {
    setImage({ value: '', unit: 'mm' });
    setActual({ value: '', unit: 'μm' });
    setMagnification('');
    setResult('');
  };

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
              <div className="flex gap-2"><Input type="number" placeholder="e.g., 50" value={image.value} onChange={e => setImage({...image, value: e.target.value})} /><Select value={image.unit} onChange={e => setImage({...image, unit: e.target.value as Unit})}><option>mm</option><option>μm</option><option>nm</option></Select></div>
            </div>
            <div>
              <Label>Actual Size (A)</Label>
              <div className="flex gap-2"><Input type="number" placeholder="e.g., 100" value={actual.value} onChange={e => setActual({...actual, value: e.target.value})} /><Select value={actual.unit} onChange={e => setActual({...actual, unit: e.target.value as Unit})}><option>mm</option><option>μm</option><option>nm</option></Select></div>
            </div>
            <div><Label>Magnification (M)</Label><Input type="number" placeholder="e.g., 1000" value={magnification} onChange={e => setMagnification(e.target.value)} /></div>
            <div className="flex gap-2 pt-2"><Button onClick={calculate} className="flex-grow"><Calculator className="mr-2 h-4 w-4"/> Calculate</Button><Button onClick={reset} variant="ghost"><XCircle className="h-4 w-4"/></Button></div>
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