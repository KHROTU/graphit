'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import type { Node, Edge, Options, IdType } from 'vis-network'; 
import { useTheme } from 'next-themes';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Plus, Download, Link2, Trash2, MousePointer } from 'lucide-react';

interface FoodWebNode extends Node { id: string; label: string; group: 'producer' | 'primary' | 'secondary' | 'tertiary'; }
const initialNodesData: FoodWebNode[] = [
  { id: '1', label: "Grass", group: "producer" }, { id: '2', label: "Rabbit", group: "primary" },
  { id: '3', label: "Fox", group: "secondary" }, { id: '4', label: "Grasshopper", group: "primary" },
];
const initialEdgesData: Edge[] = [
  { from: '1', to: '2', arrows: "to" }, { from: '1', to: '4', arrows: "to" }, { from: '2', to: '3', arrows: "to" },
];

type ToolbarMode = 'navigate' | 'addEdge' | 'delete';

interface ClickParams {
  nodes: IdType[];
  edges: IdType[];
}

const Toolbar = ({ onModeChange, activeMode }: {
  onModeChange: (mode: ToolbarMode) => void;
  activeMode: string;
}) => {
  const modes = [
    { id: 'navigate', label: 'Navigate & Select', icon: MousePointer },
    { id: 'addEdge', label: 'Add Edge (Link)', icon: Link2 },
    { id: 'delete', label: 'Delete Item (Click)', icon: Trash2 },
  ];
  return (
    <div className="absolute top-2 left-2 z-10 flex gap-1 p-1 bg-neutral rounded-[var(--border-radius-apple)] shadow-md">
      {modes.map(mode => (
        <Button key={mode.id} variant={activeMode === mode.id ? 'default' : 'ghost'} size="icon" onClick={() => onModeChange(mode.id as ToolbarMode)} title={mode.label}>
          <mode.icon className={`w-4 h-4 ${mode.id === 'delete' && activeMode === 'delete' ? 'text-red-500' : ''}`} />
        </Button>
      ))}
    </div>
  );
};

export default function FoodWeb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const { resolvedTheme } = useTheme();
  const { openExportModal } = useExportModal();

  const [data] = useState({
    nodes: new DataSet<FoodWebNode>(initialNodesData),
    edges: new DataSet<Edge>(initialEdgesData),
  });
  
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeGroup, setNewNodeGroup] = useState<FoodWebNode['group']>('primary');
  const [activeMode, setActiveMode] = useState<ToolbarMode>('navigate');

  const addNode = useCallback(() => {
    if (!newNodeLabel.trim()) return;
    const newId = new Date().getTime().toString();
    data.nodes.add({ id: newId, label: newNodeLabel, group: newNodeGroup });
    setNewNodeLabel('');
  }, [data.nodes, newNodeLabel, newNodeGroup]);
  
  useEffect(() => {
    if (!containerRef.current) return;

    const options: Options = {
        nodes: { 
            shape: 'dot', 
            size: 25, 
            font: { size: 16, color: resolvedTheme === 'dark' ? '#E8ECEF' : '#2F4F4F' }, 
            borderWidth: 2 
        },
        edges: { 
            width: 2, 
            arrows: { to: { enabled: true, scaleFactor: 0.7 } }, 
            smooth: { enabled: true, type: 'dynamic', roundness: 0.5 } 
        },
        groups: { 
            producer: { color: { background: '#22c55e', border: '#16a34a' } }, 
            primary: { color: { background: '#f97316', border: '#ea580c' } }, 
            secondary: { color: { background: '#ef4444', border: '#dc2626' } }, 
            tertiary: { color: { background: '#8b5cf6', border: '#7c3aed' } } 
        },
        physics: { 
            enabled: true, 
            forceAtlas2Based: { gravitationalConstant: -80, centralGravity: 0.015, springLength: 150, springConstant: 0.1 } 
        },
        interaction: { 
            dragNodes: true, 
            hover: true, 
            tooltipDelay: 200 
        },
        manipulation: { enabled: false },
    };

    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;
    return () => network.destroy();
  }, [data, resolvedTheme]);

  useEffect(() => {
    const network = networkRef.current;
    if (!network) return;

    const handleDeleteClick = (params: ClickParams) => {
        if (params && params.nodes && params.nodes.length > 0) data.nodes.remove(params.nodes);
        if (params && params.edges && params.edges.length > 0) data.edges.remove(params.edges);
    };
    
    network.off('click', handleDeleteClick);
    network.disableEditMode();
    if(containerRef.current) {
        containerRef.current.style.cursor = 'default';
    }

    if (activeMode === 'addEdge') {
        if(containerRef.current) containerRef.current.style.cursor = 'cell';
        network.addEdgeMode();
    } else if (activeMode === 'delete') {
        if(containerRef.current) containerRef.current.style.cursor = 'crosshair';
        network.on('click', handleDeleteClick);
    }
  }, [activeMode, data.nodes, data.edges]);

  useEffect(() => {
    if(networkRef.current) {
        const fontColor = resolvedTheme === 'dark' ? '#E8ECEF' : '#2F4F4F';
        networkRef.current.setOptions({ nodes: { font: { color: fontColor } } });
    }
  }, [resolvedTheme]);

  return (
    <div className="w-full h-full flex flex-col gap-4">
        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 items-center p-2 bg-neutral-dark/30 rounded-[var(--border-radius-apple)]">
            <Input placeholder="New Species Name..." value={newNodeLabel} onChange={(e) => setNewNodeLabel(e.target.value)} className="flex-grow" />
            <Select value={newNodeGroup} onChange={(e) => setNewNodeGroup(e.target.value as FoodWebNode['group'])} className="h-10 w-full sm:w-auto">
              <option value="producer">Producer</option>
              <option value="primary">Primary Consumer</option>
              <option value="secondary">Secondary Consumer</option>
              <option value="tertiary">Tertiary Consumer</option>
            </Select>
            <Button onClick={addNode} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4"/> Add Species</Button>
            <Button onClick={() => openExportModal(containerRef, 'food-web')} variant="outline" className="w-full sm:w-auto"><Download className="mr-2 h-4 w-4"/> Export</Button>
        </div>
        <p className="text-xs text-center text-text/60">Use the toolbar to switch modes. In delete mode, click any item to remove it.</p>
        <div className="flex-grow w-full h-full relative bg-neutral-dark/30 rounded-[var(--border-radius-apple)] overflow-hidden">
            <Toolbar onModeChange={setActiveMode} activeMode={activeMode} />
            <div className="w-full h-full" ref={containerRef} />
        </div>
    </div>
  );
}