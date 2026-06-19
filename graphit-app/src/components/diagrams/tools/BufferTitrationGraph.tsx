'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SegmentControl } from '../controls/SegmentControl';
import { SliderControl } from '../controls/SliderControl';
type Pairing = 'SA-SB' | 'SA-WB' | 'WA-SB';
interface BufferTitrationGraphProps {
  initialPairing?: Pairing;
  initialAcidConc?: number;
  initialAcidVolume?: number;
  initialBasePKa?: number;
  initialAcidPKa?: number;
}
type State = {
  pairing: Pairing;
  acidConc: number;
  acidVolume: number;
  basePKa: number;
  acidPKa: number;
};
type Action =
  | { type: 'SET_PAIRING'; payload: Pairing }
  | { type: 'SET_ACID_CONC'; payload: number }
  | { type: 'SET_ACID_VOLUME'; payload: number }
  | { type: 'SET_BASE_PKA'; payload: number }
  | { type: 'SET_ACID_PKA'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_PAIRING': return { ...state, pairing: action.payload };
    case 'SET_ACID_CONC': return { ...state, acidConc: action.payload };
    case 'SET_ACID_VOLUME': return { ...state, acidVolume: action.payload };
    case 'SET_BASE_PKA': return { ...state, basePKa: action.payload };
    case 'SET_ACID_PKA': return { ...state, acidPKa: action.payload };
    default: return state;
  }
}
const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  return String(value);
};
const pairingOptions = [
  { value: 'SA-SB' as const, label: 'Strong Acid–Strong Base' },
  { value: 'SA-WB' as const, label: 'Strong Acid–Weak Base' },
  { value: 'WA-SB' as const, label: 'Weak Acid–Strong Base' },
];
export default function BufferTitrationGraph(props: BufferTitrationGraphProps) {
  const initialState: State = {
    pairing: props.initialPairing || 'WA-SB',
    acidConc: props.initialAcidConc || 0.1,
    acidVolume: props.initialAcidVolume || 25,
    basePKa: props.initialBasePKa || 9.25,
    acidPKa: props.initialAcidPKa || 4.76,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { pairing, acidConc, acidVolume, basePKa, acidPKa } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { data, equivalenceVolume, equivalencePH, bufferRangeStart, bufferRangeEnd } = useMemo(() => {
    const isWeakAcid = pairing === 'WA-SB';
    const isWeakBase = pairing === 'SA-WB';
    const eqVol = (acidConc * acidVolume) / 0.1;
    const chartData: { volume: number; pH: number }[] = [];
    const maxVol = eqVol * 2;
    let eqPH = 7;
    if (isWeakAcid) eqPH = 8.5;
    if (isWeakBase) eqPH = 5.5;
    for (let v = 0; v <= maxVol; v += maxVol / 400) {
      let pH: number;
      if (isWeakAcid) {
        if (v < eqVol * 0.001) {
          pH = acidPKa - Math.log10(acidConc) / 2;
        } else if (v < eqVol) {
          const molesAcid = (acidConc * acidVolume) / 1000;
          const molesBase = (0.1 * v) / 1000;
          const remainingHA = molesAcid - molesBase;
          const formedA = molesBase;
          if (remainingHA > 0 && formedA > 0) {
            pH = acidPKa + Math.log10(formedA / remainingHA);
          } else {
            pH = eqPH;
          }
        } else {
          const excess = (0.1 * (v - eqVol)) / 1000;
          const totalVolume = (acidVolume + v) / 1000;
          const excessOH = excess / totalVolume;
          pH = 14 + Math.log10(excessOH);
        }
      } else if (isWeakBase) {
        if (v < eqVol * 0.001) {
          pH = -Math.log10(acidConc);
        } else if (v < eqVol) {
          const molesAcid = (acidConc * acidVolume) / 1000;
          const molesBase = (0.1 * v) / 1000;
          const molesAcidLeft = molesAcid - molesBase;
          const molesConj = molesBase;
          if (molesAcidLeft > 0 && molesConj > 0) {
            const totalVolume = (acidVolume + v) / 1000;
            pH = -Math.log10(molesAcidLeft / totalVolume);
          } else {
            pH = eqPH;
          }
        } else {
          const excess = (0.1 * (v - eqVol)) / 1000;
          const totalVolume = (acidVolume + v) / 1000;
          const molesB = excess / totalVolume;
          pH = 14 - basePKa - Math.log10(molesB > 0.001 ? molesB : 0.001);
          if (pH > 12) pH = 12;
        }
      } else {
        if (v < eqVol) {
          const molesAcid = (acidConc * acidVolume) / 1000;
          const molesBase = (0.1 * v) / 1000;
          const excessAcid = molesAcid - molesBase;
          const totalVolume = (acidVolume + v) / 1000;
          pH = -Math.log10(excessAcid / totalVolume);
        } else if (Math.abs(v - eqVol) < 0.01) {
          pH = 7;
        } else {
          const excessBase = (0.1 * (v - eqVol)) / 1000;
          const totalVolume = (acidVolume + v) / 1000;
          pH = 14 + Math.log10(excessBase / totalVolume);
        }
      }
      pH = Math.max(0, Math.min(14, pH));
      if (!isFinite(pH)) pH = v < eqVol ? 0 : 14;
      chartData.push({ volume: Number(v.toFixed(2)), pH: Number(pH.toFixed(2)) });
    }
    const bufStart = isWeakAcid ? eqVol * 0.1 : 0;
    const bufEnd = isWeakAcid ? eqVol : 0;
    return {
      data: chartData,
      equivalenceVolume: eqVol,
      equivalencePH: isWeakAcid ? 8.5 : isWeakBase ? 5.5 : 7,
      bufferRangeStart: bufStart,
      bufferRangeEnd: bufEnd,
    };
  }, [pairing, acidConc, acidVolume, basePKa, acidPKa]);
  const getDiagramState = () => ({
    initialPairing: pairing,
    initialAcidConc: acidConc,
    initialAcidVolume: acidVolume,
    initialBasePKa: basePKa,
    initialAcidPKa: acidPKa,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Buffer Titration Graphs</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SegmentControl
              value={pairing}
              onValueChange={(val) => dispatch({ type: 'SET_PAIRING', payload: val })}
              options={pairingOptions}
            />
            <SliderControl
              label="Acid Concentration"
              value={acidConc}
              unit=" M"
              min={0.01}
              max={0.5}
              step={0.01}
              onChange={(val) => dispatch({ type: 'SET_ACID_CONC', payload: val })}
            />
            <SliderControl
              label="Acid Volume"
              value={acidVolume}
              unit=" mL"
              min={10}
              max={50}
              step={1}
              onChange={(val) => dispatch({ type: 'SET_ACID_VOLUME', payload: val })}
            />
            {(pairing === 'WA-SB' || pairing === 'SA-WB') && (
              <>
                {pairing === 'WA-SB' && (
                  <SliderControl
                    label="pKa (Weak Acid)"
                    value={acidPKa}
                    unit=""
                    min={2}
                    max={10}
                    step={0.1}
                    onChange={(val) => dispatch({ type: 'SET_ACID_PKA', payload: val })}
                  />
                )}
                {pairing === 'SA-WB' && (
                  <SliderControl
                    label="pKa (Weak Base)"
                    value={basePKa}
                    unit=""
                    min={3}
                    max={12}
                    step={0.1}
                    onChange={(val) => dispatch({ type: 'SET_BASE_PKA', payload: val })}
                  />
                )}
              </>
            )}
            <div className="text-sm border-t border-neutral-dark/50 pt-4">
              <h4 className="font-semibold mb-2">Titration Data</h4>
              <p>Equivalence Volume: <span className="font-mono text-accent">{equivalenceVolume.toFixed(1)} mL</span></p>
              <p>Equivalence pH: <span className="font-mono text-accent">{equivalencePH.toFixed(1)}</span></p>
              {pairing === 'WA-SB' && (
                <p className="mt-1 text-xs text-text/60">
                  Buffer region (pH ≈ pKa ± 1): pKa = {acidPKa.toFixed(1)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'buffer-titration-graph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Buffer & Titration Curves" getDiagramState={getDiagramState} />
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                type="number"
                dataKey="volume"
                domain={[0, 'dataMax']}
                stroke="var(--color-text)"
                label={{ value: 'Volume of Base Added (mL)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}
              />
              <YAxis
                type="number"
                domain={[0, 14]}
                stroke="var(--color-text)"
                label={{ value: 'pH', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}
              />
              <Tooltip
                formatter={formatValue}
                contentStyle={{
                  backgroundColor: 'var(--color-neutral)',
                  border: '1px solid var(--color-neutral-dark)',
                  borderRadius: 'var(--border-radius-apple)',
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
              {pairing === 'WA-SB' && bufferRangeEnd > 0 && (
                <ReferenceArea
                  x1={bufferRangeStart}
                  x2={bufferRangeEnd}
                  y1={acidPKa - 1}
                  y2={acidPKa + 1}
                  fill="var(--color-secondary)"
                  fillOpacity={0.1}
                  stroke="none"
                />
              )}
              <Line
                type="monotone"
                dataKey="pH"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={false}
                name="Titration Curve"
              />
              <ReferenceLine
                x={equivalenceVolume}
                stroke="var(--color-secondary)"
                strokeDasharray="3 3"
                label={{ value: `Eq. Pt. ${equivalenceVolume.toFixed(1)} mL`, position: 'insideTopRight', fill: 'var(--color-secondary)' }}
              />
              {pairing === 'WA-SB' && (
                <ReferenceLine
                  y={acidPKa}
                  stroke="var(--color-secondary)"
                  strokeDasharray="6 3"
                  strokeOpacity={0.5}
                  label={{ value: `pKa = ${acidPKa}`, position: 'right', fill: 'var(--color-secondary)', fontSize: 11 }}
                />
              )}
              {(pairing === 'WA-SB' || pairing === 'SA-WB') && (
                <ReferenceLine
                  y={7}
                  stroke="var(--color-text)"
                  strokeDasharray="2 2"
                  strokeOpacity={0.3}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}