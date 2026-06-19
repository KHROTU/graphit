'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SliderControl } from '../controls/SliderControl';
interface SolubilityCurveProps {
  initialTempRange?: number;
  initialShowNaCl?: boolean;
  initialShowKNO3?: boolean;
  initialShowKCl?: boolean;
  initialShowNaNO3?: boolean;
  initialShowSO2?: boolean;
  initialShowNaClVal?: number;
  initialShowKNO3Val?: number;
  initialShowKClVal?: number;
  initialShowNaNO3Val?: number;
  initialShowSO2Val?: number;
}
type State = {
  tempRange: number;
  showNaCl: boolean;
  showKNO3: boolean;
  showKCl: boolean;
  showNaNO3: boolean;
  showSO2: boolean;
  naclBase: number;
  kno3Base: number;
  kclBase: number;
  nano3Base: number;
  so2Base: number;
};
type Action =
  | { type: 'SET_TEMP_RANGE'; payload: number }
  | { type: 'TOGGLE_NACL' }
  | { type: 'TOGGLE_KNO3' }
  | { type: 'TOGGLE_KCL' }
  | { type: 'TOGGLE_NANO3' }
  | { type: 'TOGGLE_SO2' }
  | { type: 'SET_NACL_BASE'; payload: number }
  | { type: 'SET_KNO3_BASE'; payload: number }
  | { type: 'SET_KCL_BASE'; payload: number }
  | { type: 'SET_NANO3_BASE'; payload: number }
  | { type: 'SET_SO2_BASE'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TEMP_RANGE': return { ...state, tempRange: action.payload };
    case 'TOGGLE_NACL': return { ...state, showNaCl: !state.showNaCl };
    case 'TOGGLE_KNO3': return { ...state, showKNO3: !state.showKNO3 };
    case 'TOGGLE_KCL': return { ...state, showKCl: !state.showKCl };
    case 'TOGGLE_NANO3': return { ...state, showNaNO3: !state.showNaNO3 };
    case 'TOGGLE_SO2': return { ...state, showSO2: !state.showSO2 };
    case 'SET_NACL_BASE': return { ...state, naclBase: action.payload };
    case 'SET_KNO3_BASE': return { ...state, kno3Base: action.payload };
    case 'SET_KCL_BASE': return { ...state, kclBase: action.payload };
    case 'SET_NANO3_BASE': return { ...state, nano3Base: action.payload };
    case 'SET_SO2_BASE': return { ...state, so2Base: action.payload };
    default: return state;
  }
}
const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return Number(value.toFixed(1));
  return String(value);
};
const saltColors: Record<string, string> = {
  NaCl: 'var(--color-accent)',
  KNO3: 'var(--color-secondary)',
  KCl: '#82ca9d',
  NaNO3: '#ffc658',
  SO2: '#ff7300',
};
function getSolubility(temp: number, salt: string, base: number): number {
  switch (salt) {
    case 'NaCl':
      return base + 0.05 * temp;
    case 'KNO3':
      return base * Math.exp(0.015 * temp);
    case 'KCl':
      return base + 0.4 * temp;
    case 'NaNO3':
      return base + 0.55 * temp;
    case 'SO2':
      return Math.max(0, base * (1 - 0.02 * temp));
    default:
      return 0;
  }
}
export default function SolubilityCurve(props: SolubilityCurveProps) {
  const initialState: State = {
    tempRange: props.initialTempRange || 100,
    showNaCl: props.initialShowNaCl ?? true,
    showKNO3: props.initialShowKNO3 ?? true,
    showKCl: props.initialShowKCl ?? true,
    showNaNO3: props.initialShowNaNO3 ?? true,
    showSO2: props.initialShowSO2 ?? false,
    naclBase: props.initialShowNaClVal || 36,
    kno3Base: props.initialShowKNO3Val || 13,
    kclBase: props.initialShowKClVal || 28,
    nano3Base: props.initialShowNaNO3Val || 73,
    so2Base: props.initialShowSO2Val || 23,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { tempRange, showNaCl, showKNO3, showKCl, showNaNO3, showSO2, naclBase, kno3Base, kclBase, nano3Base, so2Base } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const data = useMemo(() => {
    const chartData: Record<string, number>[] = [];
    const step = tempRange / 200;
    for (let t = 0; t <= tempRange; t += step) {
      const row: Record<string, number> = { temperature: Number(t.toFixed(1)) };
      if (showNaCl) row.NaCl = getSolubility(t, 'NaCl', naclBase);
      if (showKNO3) row.KNO3 = getSolubility(t, 'KNO3', kno3Base);
      if (showKCl) row.KCl = getSolubility(t, 'KCl', kclBase);
      if (showNaNO3) row.NaNO3 = getSolubility(t, 'NaNO3', nano3Base);
      if (showSO2) row.SO2 = getSolubility(t, 'SO2', so2Base);
      chartData.push(row);
    }
    return chartData;
  }, [tempRange, showNaCl, showKNO3, showKCl, showNaNO3, showSO2, naclBase, kno3Base, kclBase, nano3Base, so2Base]);
  const activeSalts = [
    showNaCl && { key: 'NaCl', base: naclBase, label: `NaCl (${naclBase})` },
    showKNO3 && { key: 'KNO3', base: kno3Base, label: `KNO₃ (${kno3Base})` },
    showKCl && { key: 'KCl', base: kclBase, label: `KCl (${kclBase})` },
    showNaNO3 && { key: 'NaNO3', base: nano3Base, label: `NaNO₃ (${nano3Base})` },
    showSO2 && { key: 'SO2', base: so2Base, label: `SO₂ (${so2Base})` },
  ].filter(Boolean) as { key: string; base: number; label: string }[];
  const getDiagramState = () => ({
    initialTempRange: tempRange,
    initialShowNaCl: showNaCl,
    initialShowKNO3: showKNO3,
    initialShowKCl: showKCl,
    initialShowNaNO3: showNaNO3,
    initialShowSO2: showSO2,
    initialShowNaClVal: naclBase,
    initialShowKNO3Val: kno3Base,
    initialShowKClVal: kclBase,
    initialShowNaNO3Val: nano3Base,
    initialShowSO2Val: so2Base,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Solubility Curves</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SliderControl
              label="Temperature Range"
              value={tempRange}
              unit=" °C"
              min={20}
              max={120}
              step={5}
              onChange={(val) => dispatch({ type: 'SET_TEMP_RANGE', payload: val })}
            />
            <div className="space-y-3 border-t border-neutral-dark/50 pt-4">
              <h4 className="font-semibold text-sm">Select Solutes</h4>
              <div className="flex flex-col gap-2">
                {[
                  { show: showNaCl, toggle: 'TOGGLE_NACL' as const, label: 'NaCl', base: naclBase, set: 'SET_NACL_BASE' as const },
                  { show: showKNO3, toggle: 'TOGGLE_KNO3' as const, label: 'KNO₃', base: kno3Base, set: 'SET_KNO3_BASE' as const },
                  { show: showKCl, toggle: 'TOGGLE_KCL' as const, label: 'KCl', base: kclBase, set: 'SET_KCL_BASE' as const },
                  { show: showNaNO3, toggle: 'TOGGLE_NANO3' as const, label: 'NaNO₃', base: nano3Base, set: 'SET_NANO3_BASE' as const },
                  { show: showSO2, toggle: 'TOGGLE_SO2' as const, label: 'SO₂ (Gas)', base: so2Base, set: 'SET_SO2_BASE' as const },
                ].map((salt) => (
                  <div key={salt.label} className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={salt.show}
                        onChange={() => dispatch({ type: salt.toggle })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{salt.label}</span>
                    </label>
                    {salt.show && (
                      <SliderControl
                        label=""
                        value={salt.base}
                        unit=" g/100g"
                        min={1}
                        max={300}
                        step={1}
                        onChange={(val) => dispatch({ type: salt.set, payload: val })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'solubility-curve')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Solubility Curves" getDiagramState={getDiagramState} />
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
                dataKey="temperature"
                domain={[0, tempRange]}
                stroke="var(--color-text)"
                label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}
              />
              <YAxis
                type="number"
                domain={[0, 'dataMax']}
                stroke="var(--color-text)"
                label={{ value: 'Solubility (g/100g H₂O)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}
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
              {activeSalts.map((salt) => (
                <Line
                  key={salt.key}
                  type="monotone"
                  dataKey={salt.key}
                  stroke={saltColors[salt.key] || 'var(--color-accent)'}
                  strokeWidth={2}
                  dot={false}
                  name={salt.label}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}