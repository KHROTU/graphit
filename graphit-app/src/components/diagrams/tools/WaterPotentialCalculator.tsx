'use client';

import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { useSession } from '@/lib/hooks/useSession';
import SaveGraphButton from '@/components/shared/SaveGraphButton';

interface WaterPotentialProps {
  initialCellSolute?: number;
  initialCellPressure?: number;
  initialSolutionSolute?: number;
}

type State = { cellSolute: number; cellPressure: number; solutionSolute: number; };
type Action = 
    | { type: 'SET_CELL_SOLUTE', payload: number }
    | { type: 'SET_CELL_PRESSURE', payload: number }
    | { type: 'SET_SOLUTION_SOLUTE', payload: number };

function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_CELL_SOLUTE': return { ...state, cellSolute: action.payload };
        case 'SET_CELL_PRESSURE': return { ...state, cellPressure: action.payload };
        case 'SET_SOLUTION_SOLUTE': return { ...state, solutionSolute: action.payload };
        default: return state;
    }
}

const PlantCell = ({ state }: { state: 'turgid' | 'flaccid' | 'plasmolyzed' }) => {
  const styles = {
    turgid: { wallPath: "M50 50 H250 V250 H50 Z", membranePath: "M60 60 H240 V240 H60 Z", fill: "var(--color-accent)" },
    flaccid: { wallPath: "M50 50 H250 V250 H50 Z", membranePath: "M80 80 H220 V220 H80 Z", fill: "var(--color-secondary)" },
    plasmolyzed: { wallPath: "M50 50 H250 V250 H50 Z", membranePath: "M100 100 H200 V200 H100 Z", fill: "var(--color-secondary)" },
  };
  return (
    <g>
      <path d={styles[state].wallPath} stroke="currentColor" strokeWidth="4" fill="none" />
      <path d={styles[state].membranePath} stroke="currentColor" strokeWidth="2" fill={styles[state].fill} fillOpacity="0.3" />
      <text x="150" y="150" textAnchor="middle" dy=".3em" className="font-bold fill-current">Cell</text>
    </g>
  );
};

export default function WaterPotentialCalculator(props: WaterPotentialProps) {
  const initialState: State = {
      cellSolute: props.initialCellSolute || -700,
      cellPressure: props.initialCellPressure || 400,
      solutionSolute: props.initialSolutionSolute || -900,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { cellSolute, cellPressure, solutionSolute } = state;

  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { session } = useSession();

  const { cellPotential, solutionPotential, netMovement, cellState, explanation } = useMemo(() => {
    const cellPsi = cellSolute + cellPressure;
    const solutionPsi = solutionSolute;
    let movement = 'none';
    let state: 'turgid' | 'flaccid' | 'plasmolyzed' = 'flaccid';
    let explainer = '';

    if (cellPsi > solutionPsi) {
      movement = 'out';
      state = cellPsi > -500 ? 'flaccid' : 'plasmolyzed';
      explainer = `Water moves out of the cell (from ${cellPsi}kPa to ${solutionPsi}kPa), causing it to become ${state}.`;
    } else if (cellPsi < solutionPsi) {
      movement = 'in';
      state = 'turgid';
      explainer = `Water moves into the cell (from ${solutionPsi}kPa to ${cellPsi}kPa), causing it to become turgid.`;
    } else {
      explainer = `The system is at equilibrium (${cellPsi}kPa). There is no net movement of water.`;
    }
    return { cellPotential: cellPsi, solutionPotential: solutionPsi, netMovement: movement, cellState: state, explanation: explainer };
  }, [cellSolute, cellPressure, solutionSolute]);
  
  const getDiagramState = () => ({
    initialCellSolute: cellSolute, initialCellPressure: cellPressure, initialSolutionSolute: solutionSolute,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>Water Potential (Ψ) Calculator</CardTitle></CardHeader>
          <div className="p-6 space-y-4">
            <div className="p-3 bg-neutral-dark/30 rounded-lg space-y-2">
              <h4 className="font-semibold">Plant Cell</h4>
              <div><Label>Solute Potential (Ψs): {cellSolute} kPa</Label><input type="range" min={-1500} max={0} step={50} value={cellSolute} onChange={e => dispatch({type: 'SET_CELL_SOLUTE', payload: Number(e.target.value)})} className="w-full" /></div>
              <div><Label>Pressure Potential (Ψp): {cellPressure} kPa</Label><input type="range" min={0} max={1500} step={50} value={cellPressure} onChange={e => dispatch({type: 'SET_CELL_PRESSURE', payload: Number(e.target.value)})} className="w-full" /></div>
              <p className="text-center font-bold !mt-4">Cell Ψ = {cellPotential} kPa</p>
            </div>
            <div className="p-3 bg-neutral-dark/30 rounded-lg space-y-2">
              <h4 className="font-semibold">External Solution</h4>
              <div><Label>Solute Potential (Ψs): {solutionSolute} kPa</Label><input type="range" min={-1500} max={0} step={50} value={solutionSolute} onChange={e => dispatch({type: 'SET_SOLUTION_SOLUTE', payload: Number(e.target.value)})} className="w-full" /></div>
              <p className="text-center font-bold !mt-4">Solution Ψ = {solutionPotential} kPa</p>
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'water-potential-calculator')}><Save className="mr-2 h-4 w-4" /> Save & Export Image</Button>
              {session?.isLoggedIn && (<SaveGraphButton diagramName="Water Potential Calculator" getDiagramState={getDiagramState} />)}
            </div>
          </div>
        </Card>
      </div>
      <div ref={diagramContainerRef} data-testid="diagram-container" className="md:col-span-2 min-h-[500px]">
        <Card className="h-full flex flex-col !p-4">
          <svg viewBox="0 0 300 350" className="w-full h-full text-text">
            <rect x="0" y="0" width="300" height="350" fill="var(--color-accent)" fillOpacity="0.05" />
            <PlantCell state={cellState} />
            {netMovement === 'in' && <path d="M40 150 L80 150 M60 140 L80 150 L60 160" stroke="var(--color-secondary)" strokeWidth="3" />}
            {netMovement === 'out' && <path d="M80 150 L40 150 M60 140 L40 150 L60 160" stroke="var(--color-secondary)" strokeWidth="3" />}
            <text x="150" y="320" textAnchor="middle" className="text-sm fill-current">{explanation}</text>
            <text x="150" y="30" textAnchor="middle" className="font-bold fill-current">Net Water Movement</text>
          </svg>
        </Card>
      </div>
    </div>
  );
}