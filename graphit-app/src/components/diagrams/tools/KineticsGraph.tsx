'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

// --- Props and State Types ---
type Tab = 'rate' | 'boltzmann';
interface KineticsGraphProps {
  initialTab?: Tab;
  initialConc?: number;
  initialRateConstant?: number;
  initialTemp?: number;
  initialEa?: number;
}

// --- Main Component ---
export default function KineticsGraph(props: KineticsGraphProps) {
  // Centralized state management
  const [activeTab, setActiveTab] = useState<Tab>(props.initialTab || 'rate');
  const [conc, setConc] = useState(props.initialConc || 1.0);
  const [rateConstant, setRateConstant] = useState(props.initialRateConstant || 0.1);
  const [temp, setTemp] = useState(props.initialTemp || 300);
  const [ea, setEa] = useState(props.initialEa || 40);

  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  // Data calculation for Rate of Reaction
  const rateData = useMemo(() => {
    return Array.from({ length: 101 }, (_, i) => {
      const t = i * 0.5;
      return { time: t, concentration: conc * Math.exp(-rateConstant * t) };
    });
  }, [conc, rateConstant]);

  // Data calculation for Boltzmann Distribution
  const boltzmannData = useMemo(() => {
    const T = temp / 50; // Scaling factor for visual effect
    return Array.from({ length: 101 }, (_, i) => {
      const energy = i;
      const val = (energy / (T * T)) * Math.exp(-energy / T);
      return { energy, molecules: val > 0 ? val : 0 };
    });
  }, [temp]);

  const getDiagramState = () => ({
    initialTab: activeTab,
    initialConc: conc,
    initialRateConstant: rateConstant,
    initialTemp: temp,
    initialEa: ea,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* --- Left Panel: Controls --- */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Kinetics Simulator</CardTitle></CardHeader>
          <div className="p-4 flex gap-2 border-b border-neutral-dark/30">
            <Button className="flex-1" variant={activeTab === 'rate' ? 'default' : 'outline'} onClick={() => setActiveTab('rate')}>Reaction Rate</Button>
            <Button className="flex-1" variant={activeTab === 'boltzmann' ? 'default' : 'outline'} onClick={() => setActiveTab('boltzmann')}>Boltzmann Curve</Button>
          </div>
          
          {/* Conditional Controls */}
          {activeTab === 'rate' ? (
            <div className="p-6 space-y-6">
              <div><Label>Initial Concentration (M): {conc.toFixed(2)}</Label><input type="range" min="0.1" max="2.0" step="0.1" value={conc} onChange={(e) => setConc(Number(e.target.value))} className="w-full mt-2" /></div>
              <div><Label>Rate Constant (k): {rateConstant.toFixed(2)}</Label><input type="range" min="0.01" max="0.5" step="0.01" value={rateConstant} onChange={(e) => setRateConstant(Number(e.target.value))} className="w-full mt-2" /></div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div><Label>Temperature (K): {temp}</Label><input type="range" min="100" max="1000" step="25" value={temp} onChange={(e) => setTemp(Number(e.target.value))} className="w-full mt-2" /></div>
              <div><Label>Activation Energy (Ea): {ea}</Label><input type="range" min="10" max="90" step="5" value={ea} onChange={(e) => setEa(Number(e.target.value))} className="w-full mt-2" /></div>
            </div>
          )}

          <div className="p-4 border-t border-neutral-dark/30 flex flex-col gap-2">
            <Button onClick={() => openExportModal(diagramContainerRef, 'kinetics-graph')}>
              <Save className="mr-2 h-4 w-4" /> Save & Export Image
            </Button>
            {session?.isLoggedIn && (
              <SaveGraphButton diagramName="Reaction Kinetics Simulator" getDiagramState={getDiagramState} />
            )}
          </div>
        </Card>
      </div>

      {/* --- Right Panel: Chart Display --- */}
      <div ref={diagramContainerRef} data-testid="diagram-container" className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4">
          {activeTab === 'rate' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rateData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis type="number" dataKey="time" domain={[0, 50]} label={{ value: 'Time (s)', position: 'insideBottom', offset: -10 }} />
                <YAxis type="number" domain={[0, 'dataMax']} label={{ value: 'Concentration (M)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="concentration" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Reactant Concentration" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={boltzmannData} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis type="number" dataKey="energy" domain={[0, 100]} label={{ value: 'Kinetic Energy', position: 'insideBottom', offset: -10 }} />
                <YAxis label={{ value: 'Number of Molecules', angle: -90, position: 'insideLeft' }} tick={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <defs>
                  <linearGradient id="splitColor" x1="0" y1="0" x2="1" y2="0">
                      <stop offset={`${ea}%`} stopColor="var(--color-accent)" stopOpacity={0.4}/>
                      <stop offset={`${ea}%`} stopColor="var(--color-secondary)" stopOpacity={0.5}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="molecules" stroke="var(--color-accent)" fill="url(#splitColor)" name="Distribution" />
                <ReferenceLine x={ea} stroke="var(--color-secondary)" strokeWidth={2} strokeDasharray="3 3" label={{ value: 'Ea', position: 'insideTopRight', fill: 'var(--color-secondary)' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}