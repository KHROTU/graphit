'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import dynamic from 'next/dynamic';

const FoodWeb = dynamic(() => import('./FoodWeb'), { ssr: false, loading: () => <p className="text-center animate-pulse">Loading Food Web...</p>, });

interface PyramidTier { id: number; label: string; value: number; }

const PyramidDiagram = ({ data, textSize }: { data: PyramidTier[], textSize: number }) => {
  const width = 500, height = 300;
  const maxValue = useMemo(() => Math.max(...data.map(tier => tier.value), 100), [data]);
  const tierHeight = Math.min(40, (height - 20) / (data.length || 1));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-text">
      {data.map((tier, i) => {
        const tierIndexFromBottom = data.length - 1 - i;
        const y = height - (tierIndexFromBottom + 1) * tierHeight;
        const barWidth = Math.max(20, (tier.value / maxValue) * (width * 0.9));
        return (
          <g key={tier.id}>
            <rect x={(width - barWidth) / 2} y={y} width={barWidth} height={tierHeight} fill="var(--color-accent)" style={{ opacity: 1 - (i / (data.length || 1)) * 0.6 }} />
            <text x={width / 2} y={y + tierHeight / 2} dy=".3em" textAnchor="middle" fontSize={textSize} className="fill-[var(--color-text-inverted)] font-bold pointer-events-none">{tier.label} ({tier.value})</text>
          </g>
        );
      })}
    </svg>
  );
};

const PyramidEditor = ({ title }: { title: string }) => {
  const initialData = title === "Numbers"
    ? [{id: 1, label: 'Producer', value: 1000}, {id: 2, label: 'Primary C.', value: 100}, {id: 3, label: 'Secondary C.', value: 10}]
    : [{id: 1, label: 'Phytoplankton', value: 40}, {id: 2, label: 'Zooplankton', value: 100}];
  
  const [tiers, setTiers] = useState<PyramidTier[]>(initialData);
  const [textSize, setTextSize] = useState(14);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();

  const updateTier = (id: number, field: 'label' | 'value', newValue: string | number) => { setTiers(tiers.map(tier => tier.id === id ? { ...tier, [field]: field === 'value' ? Math.max(0, Number(newValue)) : newValue } : tier )); };
  const addTier = () => { const newId = tiers.length > 0 ? Math.max(...tiers.map(t => t.id)) + 1 : 1; setTiers([...tiers, { id: newId, label: 'New Tier', value: 50 }]); };
  const removeTier = (id: number) => { setTiers(tiers.filter(tier => tier.id !== id)); };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Pyramid of {title}</CardTitle></CardHeader>
          <div className="p-4 space-y-4 border-b border-neutral-dark/50 max-h-[350px] overflow-y-auto">
            {tiers.map((tier, index) => (
              <div key={tier.id} className="p-3 border border-neutral-dark/50 rounded-apple space-y-2 relative">
                <Label className="font-semibold text-xs">Tier {index + 1}</Label>
                <div className="flex gap-2 items-center">
                  <Input placeholder="Label" value={tier.label} onChange={(e) => updateTier(tier.id, 'label', e.target.value)} className="flex-grow" />
                  <Input type="number" placeholder="Value" value={tier.value} onChange={(e) => updateTier(tier.id, 'value', e.target.value)} className="w-24 flex-shrink-0" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeTier(tier.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addTier} className="w-full"><Plus className="mr-2 h-4 w-4" /> Add Tier</Button>
          </div>
          <div className="p-4 space-y-4">
             <div><Label>Text Size ({textSize}pt)</Label><input type="range" min="6" max="24" value={textSize} onChange={e => setTextSize(Number(e.target.value))} className="w-full" /></div>
            <Button onClick={() => openExportModal(diagramContainerRef, `pyramid-of-${title.toLowerCase()}`)} className="w-full"><Save className="mr-2 h-4 w-4" /> Save & Export</Button>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px] md:min-h-0">
          <Card className="h-full !p-2 flex items-center justify-center">
            <div ref={diagramContainerRef} className="w-full h-full p-4">
              <PyramidDiagram data={tiers} textSize={textSize} />
            </div>
          </Card>
      </div>
    </div>
  );
};

export default function EcologyDiagrams() {
  const [activeTab, setActiveTab] = useState('foodWeb');
  const diagrams: { [key: string]: { component: React.ReactNode } } = {
    foodWeb: { component: <FoodWeb /> },
    pyramidNumbers: { component: <PyramidEditor title="Numbers" /> },
    pyramidBiomass: { component: <PyramidEditor title="Biomass" /> },
  };
  return (
    <div data-testid="diagram-container" className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Diagram Type</CardTitle></CardHeader>
          <div className="p-4 space-y-2">
            <Button variant={activeTab === 'foodWeb' ? 'default' : 'ghost'} onClick={() => setActiveTab('foodWeb')} className="w-full justify-start">Food Web</Button>
            <Button variant={activeTab === 'pyramidNumbers' ? 'default' : 'ghost'} onClick={() => setActiveTab('pyramidNumbers')} className="w-full justify-start">Pyramid of Numbers</Button>
            <Button variant={activeTab === 'pyramidBiomass' ? 'default' : 'ghost'} onClick={() => setActiveTab('pyramidBiomass')} className="w-full justify-start">Pyramid of Biomass</Button>
          </div>
        </Card>
      </div>
      <div className="md:col-span-3 min-h-[70vh]">
        {diagrams[activeTab].component}
      </div>
    </div>
  );
}