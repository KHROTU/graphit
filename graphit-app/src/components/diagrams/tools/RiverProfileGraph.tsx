'use client';
import React, { useReducer, useMemo, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import SaveGraphButton from '@/components/shared/SaveGraphButton';
import { SegmentControl } from '../controls/SegmentControl';
import { SliderControl } from '../controls/SliderControl';
type ProfileView = 'long' | 'cross';
type RiverPreset = 'upper' | 'middle' | 'lower' | 'custom';
interface RiverProfileGraphProps {
  initialView?: ProfileView;
  initialPreset?: RiverPreset;
  initialSlopeSteepness?: number;
  initialChannelWidth?: number;
  initialChannelDepth?: number;
}
type State = {
  view: ProfileView;
  preset: RiverPreset;
  slopeSteepness: number;
  channelWidth: number;
  channelDepth: number;
};
type Action =
  | { type: 'SET_VIEW'; payload: ProfileView }
  | { type: 'SET_PRESET'; payload: RiverPreset }
  | { type: 'SET_SLOPE'; payload: number }
  | { type: 'SET_WIDTH'; payload: number }
  | { type: 'SET_DEPTH'; payload: number };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_VIEW': return { ...state, view: action.payload };
    case 'SET_PRESET':
      const defaults: Record<RiverPreset, { slope: number; width: number; depth: number }> = {
        upper: { slope: 85, width: 4, depth: 2 },
        middle: { slope: 45, width: 15, depth: 5 },
        lower: { slope: 10, width: 40, depth: 8 },
        custom: { slope: state.slopeSteepness, width: state.channelWidth, depth: state.channelDepth },
      };
      const d = defaults[action.payload];
      return { ...state, preset: action.payload, slopeSteepness: d.slope, channelWidth: d.width, channelDepth: d.depth };
    case 'SET_SLOPE': return { ...state, slopeSteepness: action.payload, preset: 'custom' };
    case 'SET_WIDTH': return { ...state, channelWidth: action.payload, preset: 'custom' };
    case 'SET_DEPTH': return { ...state, channelDepth: action.payload, preset: 'custom' };
    default: return state;
  }
}
export default function RiverProfileGraph(props: RiverProfileGraphProps) {
  const initialState: State = {
    view: props.initialView || 'long',
    preset: props.initialPreset || 'middle',
    slopeSteepness: props.initialSlopeSteepness ?? 45,
    channelWidth: props.initialChannelWidth ?? 15,
    channelDepth: props.initialChannelDepth ?? 5,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { view, preset, slopeSteepness, channelWidth, channelDepth } = state;
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const longProfileData = useMemo(() => {
    const points = 60;
    const decay = slopeSteepness / 100;
    return Array.from({ length: points }, (_, i) => {
      const ratio = i / (points - 1);
      const elevation = 100 * Math.pow(1 - ratio, decay * 3 + ratio * 4);
      return { distance: Math.round(ratio * 100), elevation: Math.round(elevation) };
    });
  }, [slopeSteepness]);
  const crossProfileData = useMemo(() => {
    const points = 40;
    const halfW = channelWidth / 2;
    const bankHeight = 2;
    return Array.from({ length: points }, (_, i) => {
      const x = -halfW + (i / (points - 1)) * channelWidth * 1.6;
      const absX = Math.abs(x);
      let depth = 0;
      let label = 'Bank';
      if (absX <= halfW * 0.85) {
        const normalized = absX / (halfW * 0.85);
        depth = channelDepth * (1 - Math.pow(normalized, 3));
        label = 'Channel';
      } else {
        depth = bankHeight;
      }
      return { position: Number(x.toFixed(1)), depth: Number(depth.toFixed(1)), label };
    });
  }, [channelWidth, channelDepth]);
  const getDiagramState = () => ({
    initialView: view,
    initialPreset: preset,
    initialSlopeSteepness: slopeSteepness,
    initialChannelWidth: channelWidth,
    initialChannelDepth: channelDepth,
  });
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <Card>
          <CardHeader><CardTitle>River Profile</CardTitle></CardHeader>
          <div className="p-6 space-y-6">
            <SegmentControl
              value={view}
              onValueChange={(val) => dispatch({ type: 'SET_VIEW', payload: val as ProfileView })}
              options={[
                { value: 'long', label: 'Long Profile' },
                { value: 'cross', label: 'Cross Section' },
              ]}
            />
            <div>
              <Label>River Stage</Label>
              <div className="grid grid-cols-3 gap-1 mt-2">
                {(['upper', 'middle', 'lower'] as RiverPreset[]).map((p) => (
                  <Button
                    key={p}
                    variant={preset === p ? 'default' : 'outline'}
                    onClick={() => dispatch({ type: 'SET_PRESET', payload: p })}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            {view === 'long' ? (
              <SliderControl
                label="Slope Steepness"
                value={slopeSteepness}
                unit="%"
                min={5}
                max={95}
                step={1}
                onChange={(v) => dispatch({ type: 'SET_SLOPE', payload: v })}
              />
            ) : (
              <>
                <SliderControl
                  label="Channel Width"
                  value={channelWidth}
                  unit=" m"
                  min={2}
                  max={60}
                  step={0.5}
                  onChange={(v) => dispatch({ type: 'SET_WIDTH', payload: v })}
                />
                <SliderControl
                  label="Channel Depth"
                  value={channelDepth}
                  unit=" m"
                  min={0.5}
                  max={15}
                  step={0.5}
                  onChange={(v) => dispatch({ type: 'SET_DEPTH', payload: v })}
                />
              </>
            )}
            <div className="flex flex-col gap-2 pt-4 border-t border-neutral-dark/30">
              <Button onClick={() => openExportModal(diagramContainerRef, 'river-profile-graph')}>
                <Save className="mr-2 h-4 w-4" /> Save & Export Image
              </Button>
              <SaveGraphButton diagramName="River Profile Graph" getDiagramState={getDiagramState} />
            </div>
          </div>
        </Card>
      </div>
      <div className="md:col-span-2 min-h-[400px] md:min-h-0">
        <Card className="h-full !p-4" ref={diagramContainerRef} data-testid="diagram-container">
          {view === 'long' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={longProfileData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis
                  dataKey="distance"
                  type="number"
                  reversed
                  stroke="var(--color-text)"
                  domain={[0, 100]}
                  label={{ value: 'Distance from Source (km)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}
                />
                <YAxis
                  stroke="var(--color-text)"
                  domain={[0, 100]}
                  label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}
                />
                <Tooltip
                  formatter={(value: number) => `${value} m`}
                  labelFormatter={(label: number) => `${label} km from source`}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
                <Area type="monotone" dataKey="elevation" stroke="var(--color-accent)" strokeWidth={2} fill="var(--color-accent)" fillOpacity={0.25} name="Elevation" />
                <ReferenceLine y={0} stroke="var(--color-text)" strokeOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={crossProfileData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis
                  dataKey="position"
                  type="number"
                  stroke="var(--color-text)"
                  tickFormatter={(v: number) => `${Math.abs(v).toFixed(0)}`}
                  label={{ value: 'Distance from Center (m)', position: 'insideBottom', offset: -10, fill: 'var(--color-text)' }}
                />
                <YAxis
                  stroke="var(--color-text)"
                  reversed
                  domain={[0, channelDepth + 4]}
                  tickFormatter={(v: number) => `${v}`}
                  label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', fill: 'var(--color-text)' }}
                />
                <Tooltip
                  formatter={(value: number) => `${value} m`}
                  labelFormatter={(label: number) => `${Math.abs(label).toFixed(1)}m from center`}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--color-text)' }} />
                <Line type="monotone" dataKey="depth" stroke="var(--color-accent)" strokeWidth={2} dot={false} name="Channel Depth" />
                <ReferenceLine y={0} stroke="var(--color-text)" strokeOpacity={0.4} label={{ value: 'Water Surface', position: 'right', fill: 'var(--color-text)', fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}