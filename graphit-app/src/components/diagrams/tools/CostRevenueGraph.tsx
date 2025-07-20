'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

interface CostRevenueProps {
  initialFixedCost?: number;
  initialVariableCost?: number;
  initialDemandPrice?: number;
}

const formatValue = (value: unknown): React.ReactNode => {
    if (typeof value === 'number') return Number(value.toFixed(2));
    return String(value);
};

export default function CostRevenueGraph({ initialFixedCost = 1000, initialVariableCost = 20, initialDemandPrice = 100 }: CostRevenueProps) {
  const [fixedCost, setFixedCost] = useState(initialFixedCost);
  const [variableCost, setVariableCost] = useState(initialVariableCost);
  const [demandPrice, setDemandPrice] = useState(initialDemandPrice);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const { data, breakEven, profitMax } = useMemo(() => {
    const chartData = [];
    let breakEvenPoint = { q: 0, val: 0 };
    let profitMaxPoint = { q: 0, profit: -Infinity };

    for (let q = 0; q <= 100; q++) {
      const price = demandPrice - 0.8 * q;
      const totalRevenue = price * q;
      const totalCost = fixedCost + variableCost * q;
      const profit = totalRevenue - totalCost;
      
      chartData.push({ quantity: q, 'Total Revenue': totalRevenue, 'Total Cost': totalCost, Profit: profit });

      if (profit >= 0 && breakEvenPoint.q === 0) {
        breakEvenPoint = { q, val: totalRevenue };
      }
      if (profit > profitMaxPoint.profit) {
        profitMaxPoint = { q, profit };
      }
    }
    return { data: chartData, breakEven: breakEvenPoint, profitMax: profitMaxPoint };
  }, [fixedCost, variableCost, demandPrice]);

  const getDiagramState = () => ({
    initialFixedCost: fixedCost,
    initialVariableCost: variableCost,
    initialDemandPrice: demandPrice,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>{`Firm's Costs & Revenue`}</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
              <div><Label>Fixed Cost: {fixedCost}</Label><input type="range" min="500" max="2000" step="100" value={fixedCost} onChange={(e) => setFixedCost(Number(e.target.value))} className="w-full mt-2" /></div>
              <div><Label>Variable Cost (per unit): {variableCost}</Label><input type="range" min="10" max="50" step="2" value={variableCost} onChange={(e) => setVariableCost(Number(e.target.value))} className="w-full mt-2" /></div>
              <div><Label>Max Price (Demand): {demandPrice}</Label><input type="range" min="80" max="150" step="5" value={demandPrice} onChange={(e) => setDemandPrice(Number(e.target.value))} className="w-full mt-2" /></div>
              <div className="text-sm border-t border-neutral-dark/50 pt-4"><h4 className="font-semibold mb-2">Key Points</h4><p>Break-even at Q ≈ {breakEven.q}</p><p>Profit Maximized at Q = {profitMax.q}</p></div>
              
              <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
                <Button onClick={() => openExportModal(diagramContainerRef, 'cost-revenue-graph')}>
                    <Save className="mr-2 h-4 w-4" /> Save & Export Image
                </Button>
                {session?.isLoggedIn && (
                  <SaveGraphButton diagramName="Firm's Cost & Revenue Curves" getDiagramState={getDiagramState} />
                )}
              </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[500px]">
        <Card className="h-full !p-4">
          <div ref={diagramContainerRef} data-testid="diagram-container" className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                    <XAxis type="number" dataKey="quantity" domain={[0, 100]} label={{ value: 'Quantity', position: 'insideBottom', offset: -10 }}/>
                    <YAxis type="number" yAxisId="left" domain={[0, 'dataMax + 1000']} label={{ value: 'Cost/Revenue', angle: -90, position: 'insideLeft' }}/>
                    <YAxis type="number" yAxisId="right" orientation="right" domain={['dataMin - 500', 'dataMax + 500']} label={{ value: 'Profit', angle: 90, position: 'insideRight' }}/>
                    <Tooltip formatter={formatValue}/>
                    <Legend verticalAlign="top" height={36}/>
                    <Area yAxisId="left" type="monotone" dataKey="Total Revenue" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
                    <Area yAxisId="left" type="monotone" dataKey="Total Cost" stroke="#f87171" fill="#f87171" fillOpacity={0.2} />
                    <Area yAxisId="right" type="monotone" dataKey="Profit" stroke="#34d399" fill="#34d399" fillOpacity={0.3} />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}