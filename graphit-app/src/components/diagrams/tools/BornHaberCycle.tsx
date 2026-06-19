'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Label as RechartsLabel,
} from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SliderControl } from '../controls/SliderControl';
import { SelectControl } from '../controls/SelectControl';
type Compound = 'NaCl' | 'MgO' | 'CaO';
interface BornHaberCycleProps {
  initialCompound?: Compound;
  initialAtomizationMetal?: number;
  initialAtomizationNonmetal?: number;
  initialIonization1?: number;
  initialIonization2?: number;
  initialElectronAffinity1?: number;
  initialElectronAffinity2?: number;
}
type State = {
  compound: Compound;
  atomizationMetal: number;
  atomizationNonmetal: number;
  ionization1: number;
  ionization2: number;
  electronAffinity1: number;
  electronAffinity2: number;
};
type Action =
  | { type: 'SET_COMPOUND'; payload: Compound }
  | { type: 'SET_ATOMIZATION_METAL'; payload: number }
  | { type: 'SET_ATOMIZATION_NONMETAL'; payload: number }
  | { type: 'SET_IONIZATION_1'; payload: number }
  | { type: 'SET_IONIZATION_2'; payload: number }
  | { type: 'SET_EA_1'; payload: number }
  | { type: 'SET_EA_2'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_COMPOUND':
      if (action.payload === 'NaCl') return { ...state, compound: action.payload, atomizationMetal: 108, atomizationNonmetal: 121, ionization1: 496, ionization2: 0, electronAffinity1: -349, electronAffinity2: 0 };
      if (action.payload === 'MgO') return { ...state, compound: action.payload, atomizationMetal: 148, atomizationNonmetal: 249, ionization1: 738, ionization2: 1451, electronAffinity1: -141, electronAffinity2: 798 };
      return { ...state, compound: action.payload, atomizationMetal: 178, atomizationNonmetal: 249, ionization1: 590, ionization2: 1145, electronAffinity1: -141, electronAffinity2: 798 };
    case 'SET_ATOMIZATION_METAL': return { ...state, atomizationMetal: action.payload };
    case 'SET_ATOMIZATION_NONMETAL': return { ...state, atomizationNonmetal: action.payload };
    case 'SET_IONIZATION_1': return { ...state, ionization1: action.payload };
    case 'SET_IONIZATION_2': return { ...state, ionization2: action.payload };
    case 'SET_EA_1': return { ...state, electronAffinity1: action.payload };
    case 'SET_EA_2': return { ...state, electronAffinity2: action.payload };
    default: return state;
  }
}
const formatValue = (value: unknown): React.ReactNode => {
  if (typeof value === 'number') return `${value > 0 ? '+' : ''}${value.toFixed(0)} kJ`;
  return String(value);
};
const compoundOptions = [
  { value: 'NaCl' as const, label: 'NaCl (Sodium Chloride)' },
  { value: 'MgO' as const, label: 'MgO (Magnesium Oxide)' },
  { value: 'CaO' as const, label: 'CaO (Calcium Oxide)' },
];
export default function BornHaberCycle(props: BornHaberCycleProps) {
  const initialState: State = {
    compound: props.initialCompound || 'NaCl',
    atomizationMetal: props.initialAtomizationMetal || 108,
    atomizationNonmetal: props.initialAtomizationNonmetal || 121,
    ionization1: props.initialIonization1 || 496,
    ionization2: props.initialIonization2 || 0,
    electronAffinity1: props.initialElectronAffinity1 || -349,
    electronAffinity2: props.initialElectronAffinity2 || 0,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { compound, atomizationMetal, atomizationNonmetal, ionization1, ionization2, electronAffinity1, electronAffinity2 } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { data, levels, latticeEnthalpy } = useMemo(() => {
    const level0 = 0;
    const level1 = level0 + atomizationMetal;
    const level2 = level1 + (ionization1 + ionization2);
    const level3 = level2 + atomizationNonmetal;
    const level4 = level3 + (electronAffinity1 + electronAffinity2);
    const levelNacl = compound === 'NaCl' ? -787 : compound === 'MgO' ? -3795 : -3414;
    const allLevels = [level0, level1, level2, level3, level4, levelNacl];
    const chartData = [
      { progress: 0, energy: level0 },
      { progress: 10, energy: level0 },
      { progress: 15, energy: level1 },
      { progress: 35, energy: level1 },
      { progress: 40, energy: level2 },
      { progress: 60, energy: level2 },
      { progress: 65, energy: level3 },
      { progress: 85, energy: level3 },
      { progress: 90, energy: level4 },
      { progress: 100, energy: level4 },
    ];
    return {
      data: chartData,
      levels: allLevels,
      latticeEnthalpy: levelNacl,
    };
  }, [atomizationMetal, atomizationNonmetal, ionization1, ionization2, electronAffinity1, electronAffinity2, compound]);
  const minY = Math.min(...levels) - 500;
  const maxY = Math.max(...levels) + 200;
  const getDiagramState = () => ({
    initialCompound: compound,
    initialAtomizationMetal: atomizationMetal,
    initialAtomizationNonmetal: atomizationNonmetal,
    initialIonization1: ionization1,
    initialIonization2: ionization2,
    initialElectronAffinity1: electronAffinity1,
    initialElectronAffinity2: electronAffinity2,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Born-Haber Cycle</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SelectControl
              label="Compound"
              value={compound}
              onValueChange={(val) => dispatch({ type: 'SET_COMPOUND', payload: val })}
              options={compoundOptions}
            />
            <SliderControl
              label="ΔH°at (Metal)"
              value={atomizationMetal}
              unit=" kJ/mol"
              min={50}
              max={300}
              step={1}
              onChange={(val) => dispatch({ type: 'SET_ATOMIZATION_METAL', payload: val })}
            />
            {compound !== 'NaCl' && (
              <SliderControl
                label="2nd Ionization Energy"
                value={ionization2}
                unit=" kJ/mol"
                min={500}
                max={2000}
                step={10}
                onChange={(val) => dispatch({ type: 'SET_IONIZATION_2', payload: val })}
              />
            )}
            <SliderControl
              label="1st Ionization Energy"
              value={ionization1}
              unit=" kJ/mol"
              min={300}
              max={1500}
              step={10}
              onChange={(val) => dispatch({ type: 'SET_IONIZATION_1', payload: val })}
            />
            <SliderControl
              label="ΔH°at (Non-metal)"
              value={atomizationNonmetal}
              unit=" kJ/mol"
              min={50}
              max={300}
              step={1}
              onChange={(val) => dispatch({ type: 'SET_ATOMIZATION_NONMETAL', payload: val })}
            />
            <SliderControl
              label="1st Electron Affinity"
              value={electronAffinity1}
              unit=" kJ/mol"
              min={-500}
              max={0}
              step={1}
              onChange={(val) => dispatch({ type: 'SET_EA_1', payload: val })}
            />
            {compound !== 'NaCl' && (
              <SliderControl
                label="2nd Electron Affinity"
                value={electronAffinity2}
                unit=" kJ/mol"
                min={600}
                max={1000}
                step={1}
                onChange={(val) => dispatch({ type: 'SET_EA_2', payload: val })}
              />
            )}
            <div className="text-sm border-t border-neutral-dark/50 pt-4">
              <h4 className="font-semibold mb-2">Lattice Enthalpy</h4>
              <p className="font-mono text-accent font-bold text-lg">ΔH°L = {latticeEnthalpy.toFixed(0)} kJ/mol</p>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'born-haber-cycle')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="Born-Haber Cycle" getDiagramState={getDiagramState} />
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" dataKey="progress" domain={[0, 100]} tick={false} axisLine={false} />
              <YAxis
                type="number"
                domain={[minY, maxY]}
                stroke="var(--color-text)"
                label={{ value: 'Enthalpy (kJ/mol)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}
              />
              <Tooltip formatter={formatValue} />
              <Area type="stepAfter" dataKey="energy" stroke="var(--color-accent)" strokeWidth={2} fill="var(--color-accent)" fillOpacity={0.05} isAnimationActive={false} />
              <ReferenceLine y={levels[0]} stroke="var(--color-text)" strokeDasharray="4 4">
                <RechartsLabel value="M(s) + ½X₂(g)" position="left" fill="var(--color-text)" fontSize={11} offset={10} />
              </ReferenceLine>
              <ReferenceLine y={levels[1]} stroke="var(--color-text)" strokeDasharray="4 4">
                <RechartsLabel value="M(g) + ½X₂(g)" position="left" fill="var(--color-text)" fontSize={11} offset={10} />
              </ReferenceLine>
              <ReferenceLine y={levels[2]} stroke="var(--color-text)" strokeDasharray="4 4">
                <RechartsLabel value="M⁺(g) + e⁻ + ½X₂(g)" position="left" fill="var(--color-text)" fontSize={11} offset={10} />
              </ReferenceLine>
              <ReferenceLine y={levels[3]} stroke="var(--color-text)" strokeDasharray="4 4">
                <RechartsLabel value="M⁺(g) + X(g) + e⁻" position="left" fill="var(--color-text)" fontSize={11} offset={10} />
              </ReferenceLine>
              <ReferenceLine y={levels[4]} stroke="var(--color-text)" strokeDasharray="4 4">
                <RechartsLabel value="M⁺(g) + X⁻(g)" position="left" fill="var(--color-text)" fontSize={11} offset={10} />
              </ReferenceLine>
              <ReferenceLine y={latticeEnthalpy} stroke="var(--color-secondary)" strokeWidth={2}>
                <RechartsLabel value={`MX(s) ${latticeEnthalpy.toFixed(0)} kJ`} position="left" fill="var(--color-secondary)" fontSize={12} offset={10} />
              </ReferenceLine>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}