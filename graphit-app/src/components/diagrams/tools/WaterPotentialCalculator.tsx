'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { SliderControl } from '../controls/SliderControl';
import { DiagramToolbar } from '../DiagramToolbar';
import { DiagramErrorBoundary } from '../DiagramErrorBoundary';
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
const DEFAULT_STATE: State = { cellSolute: -700, cellPressure: 400, solutionSolute: -900 };
function reducer(state: State, action: Action): State {
    switch(action.type) {
        case 'SET_CELL_SOLUTE': return { ...state, cellSolute: action.payload };
        case 'SET_CELL_PRESSURE': return { ...state, cellPressure: action.payload };
        case 'SET_SOLUTION_SOLUTE': return { ...state, solutionSolute: action.payload };
        default: return state;
    }
}
const PlantCell = ({ cellState }: { cellState: 'turgid' | 'flaccid' | 'plasmolyzed' }) => {
  const styles: Record<string, { wallPath: string; membranePath: string; fill: string }> = {
    turgid: { wallPath: "M50 50 H250 V250 H50 Z", membranePath: "M60 60 H240 V240 H60 Z", fill: "var(--color-accent)" },
    flaccid: { wallPath: "M50 50 H250 V250 H50 Z", membranePath: "M80 80 H220 V220 H80 Z", fill: "var(--color-secondary)" },
    plasmolyzed: { wallPath: "M50 50 H250 V250 H50 Z", membranePath: "M100 100 H200 V200 H100 Z", fill: "var(--color-secondary)" },
  };
  const s = styles[cellState];
  return (
    <g>
      <path d={s.wallPath} stroke="currentColor" strokeWidth="4" fill="none" />
      <path d={s.membranePath} stroke="currentColor" strokeWidth="2" fill={s.fill} fillOpacity="0.3" />
      <text x="150" y="150" textAnchor="middle" dy=".3em" className="font-bold fill-current">Cell</text>
    </g>
  );
};
export default function WaterPotentialCalculator(props: WaterPotentialProps) {
  const initialState: State = {
      cellSolute: props.initialCellSolute ?? DEFAULT_STATE.cellSolute,
      cellPressure: props.initialCellPressure ?? DEFAULT_STATE.cellPressure,
      solutionSolute: props.initialSolutionSolute ?? DEFAULT_STATE.solutionSolute,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { cellSolute, cellPressure, solutionSolute } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const { cellPotential, solutionPotential, netMovement, cellState, explanation } = useMemo(() => {
    const cellPsi = cellSolute + cellPressure;
    const solutionPsi = solutionSolute;
    let movement = 'none';
    let cState: 'turgid' | 'flaccid' | 'plasmolyzed' = 'flaccid';
    let explainer = '';
    if (cellPsi > solutionPsi) {
      movement = 'out';
      cState = cellPsi > -500 ? 'flaccid' : 'plasmolyzed';
      explainer = `Water moves out of the cell (from ${cellPsi}kPa to ${solutionPsi}kPa), causing it to become ${cState}.`;
    } else if (cellPsi < solutionPsi) {
      movement = 'in';
      cState = 'turgid';
      explainer = `Water moves into the cell (from ${solutionPsi}kPa to ${cellPsi}kPa), causing it to become turgid.`;
    } else {
      explainer = `The system is at equilibrium (${cellPsi}kPa). There is no net movement of water.`;
    }
    return { cellPotential: cellPsi, solutionPotential: solutionPsi, netMovement: movement, cellState: cState, explanation: explainer };
  }, [cellSolute, cellPressure, solutionSolute]);
  const getDiagramState = () => ({
    initialCellSolute: cellSolute, initialCellPressure: cellPressure, initialSolutionSolute: solutionSolute,
  });
  const handleReset = () => {
    dispatch({ type: 'SET_CELL_SOLUTE', payload: DEFAULT_STATE.cellSolute });
    dispatch({ type: 'SET_CELL_PRESSURE', payload: DEFAULT_STATE.cellPressure });
    dispatch({ type: 'SET_SOLUTION_SOLUTE', payload: DEFAULT_STATE.solutionSolute });
  };
  return (
    <DiagramErrorBoundary diagramName="Water Potential Calculator">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><CardTitle>Water Potential (Ψ) Calculator</CardTitle></CardHeader>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-neutral-dark/30 rounded-lg space-y-2">
                <h4 className="font-semibold">Plant Cell</h4>
                <SliderControl label="Solute Potential (Ψs)" unit=" kPa" value={cellSolute} min={-1500} max={0} step={50} onChange={(val) => dispatch({type: 'SET_CELL_SOLUTE', payload: val})} />
                <SliderControl label="Pressure Potential (Ψp)" unit=" kPa" value={cellPressure} min={0} max={1500} step={50} onChange={(val) => dispatch({type: 'SET_CELL_PRESSURE', payload: val})} />
                <p className="text-center font-bold !mt-4">Cell Ψ = {cellPotential} kPa</p>
              </div>
              <div className="p-3 bg-neutral-dark/30 rounded-lg space-y-2">
                <h4 className="font-semibold">External Solution</h4>
                <SliderControl label="Solute Potential (Ψs)" unit=" kPa" value={solutionSolute} min={-1500} max={0} step={50} onChange={(val) => dispatch({type: 'SET_SOLUTION_SOLUTE', payload: val})} />
                <p className="text-center font-bold !mt-4">Solution Ψ = {solutionPotential} kPa</p>
              </div>
              <DiagramToolbar
                diagramName="Water Potential Calculator"
                getDiagramState={getDiagramState}
                onExport={() => openExportModal(diagramContainerRef, 'water-potential-calculator')}
                onReset={handleReset}
              />
            </div>
          </Card>
        </div>
        <div ref={diagramContainerRef} data-testid="diagram-container" className="md:col-span-2 min-h-[500px]">
          <Card className="h-full flex flex-col !p-4">
            <svg viewBox="0 0 300 350" className="w-full h-full text-text">
              <rect x="0" y="0" width="300" height="350" fill="var(--color-accent)" fillOpacity="0.05" />
              <PlantCell cellState={cellState} />
              {netMovement === 'in' && <path d="M40 150 L80 150 M60 140 L80 150 L60 160" stroke="var(--color-secondary)" strokeWidth="3" />}
              {netMovement === 'out' && <path d="M80 150 L40 150 M60 140 L40 150 L60 160" stroke="var(--color-secondary)" strokeWidth="3" />}
              <text x="150" y="320" textAnchor="middle" className="text-sm fill-current">{explanation}</text>
              <text x="150" y="30" textAnchor="middle" className="font-bold fill-current">Net Water Movement</text>
            </svg>
          </Card>
        </div>
      </div>
    </DiagramErrorBoundary>
  );
}