'use client';

import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, LabelList } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

type Tab = 'mass' | 'ir';
type MassMolecule = 'ethanol' | 'propanone' | 'bromoethane';
type IRMolecule = 'alcohol' | 'acid' | 'ketone';
interface SpectroscopyProps { initialTab?: Tab; initialMassMolecule?: MassMolecule; initialIRMolecule?: IRMolecule; }

type State = { activeTab: Tab; massMolecule: MassMolecule; irMolecule: IRMolecule; };
type Action = 
    | { type: 'SET_TAB', payload: Tab }
    | { type: 'SET_MASS_MOLECULE', payload: MassMolecule }
    | { type: 'SET_IR_MOLECULE', payload: IRMolecule };

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_TAB': return { ...state, activeTab: action.payload };
        case 'SET_MASS_MOLECULE': return { ...state, massMolecule: action.payload };
        case 'SET_IR_MOLECULE': return { ...state, irMolecule: action.payload };
        default: return state;
    }
}

const massSpecData = {
  ethanol: { M: 46, fragments: [{mz: 45, ab: 60}, {mz: 31, ab: 100}, {mz: 29, ab: 55}] },
  propanone: { M: 58, fragments: [{mz: 43, ab: 100}, {mz: 58, ab: 50}] },
  bromoethane: { M: 108, M2: 110, fragments: [{mz: 29, ab: 100}, {mz: 108, ab: 50}, {mz: 110, ab: 50}]}
};

const irSpecData = {
  alcohol: { 'O-H (alcohol)': [3200, 3600], 'C-H': [2850, 3000] },
  acid: { 'O-H (acid)': [2500, 3300], 'C=O': [1680, 1750], 'C-H': [2850, 3000] },
  ketone: { 'C=O': [1680, 1750], 'C-H': [2850, 3000] },
};

interface CustomBarLabelProps { x?: number; y?: number; width?: number; payload?: { mz: number }; molecule: MassMolecule; }
const CustomBarLabel: React.FC<CustomBarLabelProps> = (props) => {
  const { x = 0, y = 0, width = 0, payload } = props;
  const data = massSpecData[props.molecule];
  let labelText = '';
  if (payload && payload.mz === data.M) labelText = 'M+';
  if (payload && 'M2' in data && payload.mz === data.M2) labelText = 'M+2';
  if (!labelText) return null;
  return (<text x={x + width / 2} y={y} dy={-4} fill="var(--color-secondary)" fontSize={10} textAnchor="middle">{labelText}</text>);
};

const MassSpec = ({ molecule }: { molecule: MassMolecule }) => {
  const chartData = useMemo(() => {
    const data = massSpecData[molecule];
    return [...data.fragments].sort((a,b) => a.mz - b.mz);
  }, [molecule]);
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
        <XAxis dataKey="mz" label={{ value: 'Mass/Charge (m/z)', position: 'insideBottom', offset: -10 }}/>
        <YAxis label={{ value: 'Relative Abundance', angle: -90, position: 'insideLeft' }} domain={[0, 110]}/>
        <Tooltip cursor={{fill: 'transparent'}}/>
        <Bar dataKey="ab" fill="var(--color-accent)" barSize={5}>
          <LabelList dataKey="mz" content={<CustomBarLabel molecule={molecule} />} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const IRSpec = ({ molecule }: { molecule: IRMolecule }) => {
    const data = irSpecData[molecule];
    const chartData = useMemo(() => {
        return Array.from({ length: 351 }, (_, i) => {
            const wavenumber = 4000 - i * 10;
            let transmittance = 95 - Math.random() * 5;
            for (const range of Object.values(data)) {
                if (wavenumber >= range[0] && wavenumber <= range[1]) {
                    const mid = (range[0] + range[1]) / 2;
                    const width = (range[1] - range[0]) / 2;
                    const dip = 1 - Math.pow((wavenumber - mid) / width, 2);
                    transmittance -= (50 + Math.random() * 20) * dip;
                }
            }
            return { wavenumber, transmittance: Math.max(10, transmittance) };
        });
    }, [data]);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis type="number" dataKey="wavenumber" domain={[4000, 500]} reversed={true} label={{ value: 'Wavenumber (cm⁻¹)', position: 'insideBottom', offset: -10 }} />
        <YAxis domain={[0, 100]} reversed={true} label={{ value: 'Transmittance (%)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Line type="monotone" dataKey="transmittance" stroke="var(--color-accent)" dot={false} strokeWidth={1} />
        {Object.entries(data).map(([label, range]) => (
            <ReferenceArea key={label} x1={range[1]} x2={range[0]} stroke="var(--color-secondary)" strokeOpacity={0.5} label={{ value: label, position: "insideTop", fill: 'var(--color-secondary)', fontSize: 12 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default function SpectroscopyTool(props: SpectroscopyProps) {
  const initialState: State = {
      activeTab: props.initialTab || 'mass',
      massMolecule: props.initialMassMolecule || 'ethanol',
      irMolecule: props.initialIRMolecule || 'alcohol',
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { activeTab, massMolecule, irMolecule } = state;

  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const getDiagramState = () => ({
    initialTab: activeTab, initialMassMolecule: massMolecule, initialIRMolecule: irMolecule,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Analytical Spectroscopy</CardTitle></CardHeader>
          <div className="p-4 flex gap-2 border-b border-neutral-dark/30">
            <Button className="flex-1" variant={activeTab === 'mass' ? 'default' : 'outline'} onClick={() => dispatch({type: 'SET_TAB', payload: 'mass'})}>Mass Spec</Button>
            <Button className="flex-1" variant={activeTab === 'ir' ? 'default' : 'outline'} onClick={() => dispatch({type: 'SET_TAB', payload: 'ir'})}>IR Spec</Button>
          </div>
          <div className="p-6 space-y-4">
            {activeTab === 'mass' ? (
              <div><Label>Molecule</Label><Select value={massMolecule} onChange={e => dispatch({type: 'SET_MASS_MOLECULE', payload: e.target.value as MassMolecule})}><option value="ethanol">Ethanol</option><option value="propanone">Propanone</option><option value="bromoethane">Bromoethane</option></Select></div>
            ) : (
              <div><Label>Functional Group</Label><Select value={irMolecule} onChange={e => dispatch({type: 'SET_IR_MOLECULE', payload: e.target.value as IRMolecule})}><option value="alcohol">Alcohol (O-H)</option><option value="acid">Carboxylic Acid (C=O, O-H)</option><option value="ketone">Ketone (C=O)</option></Select></div>
            )}
          </div>
          <div className="p-4 border-t border-neutral-dark/30 flex flex-col gap-2">
            <Button onClick={() => openExportModal(diagramContainerRef, 'spectroscopy-tool')}><Save className="mr-2 h-4 w-4" /> Save & Export Image</Button>
            {session?.isLoggedIn && (<SaveGraphButton diagramName="Analytical Spectroscopy" getDiagramState={getDiagramState} />)}
          </div>
        </Card>
      </div>
      <div ref={diagramContainerRef} data-testid="diagram-container" className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4">
          {activeTab === 'mass' ? <MassSpec molecule={massMolecule} /> : <IRSpec molecule={irMolecule} />}
        </Card>
      </div>
    </div>
  );
}