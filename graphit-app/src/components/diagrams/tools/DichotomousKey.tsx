'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, Plus, Trash2, GitBranch, Leaf } from 'lucide-react';
import { useExportModal } from '@/lib/context/ExportModalContext';
import { motion, AnimatePresence } from 'framer-motion';

interface KeyNode {
  id: string;
  type: 'question' | 'species';
  content: string;
  yesId?: string;
  noId?: string;
}

type NodeMap = Record<string, KeyNode>;

const NodeComponent = ({ nodeId, nodeMap, updateNode, addNode, removeNode, setNodeType }: {
  nodeId: string;
  nodeMap: NodeMap;
  updateNode: (id: string, content: string) => void;
  addNode: (parentId: string, branch: 'yes' | 'no') => void;
  removeNode: (nodeId: string) => void;
  setNodeType: (nodeId: string, type: 'question' | 'species') => void;
}) => {
  const node = nodeMap[nodeId];
  if (!node) return null;

  const yesChild = node.yesId ? nodeMap[node.yesId] : null;
  const noChild = node.noId ? nodeMap[node.noId] : null;

  const isQuestion = node.type === 'question';

  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 flex flex-col items-center group relative">
        <div className={`p-2 border-2 rounded-apple w-48 text-center transition-colors ${ isQuestion ? 'bg-neutral border-accent' : 'bg-accent/20 border-secondary'}`}>
          <Input 
            value={node.content} 
            onChange={(e) => updateNode(node.id, e.target.value)}
            className="text-center text-xs h-auto p-1 bg-transparent border-none focus:ring-0"
            placeholder={isQuestion ? 'Enter Question...' : 'Enter Species...'}
          />
        </div>

        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNodeType(node.id, 'question')} title="Convert to Question">
                <GitBranch className={`w-4 h-4 ${isQuestion ? 'text-accent' : ''}`}/>
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNodeType(node.id, 'species')} title="Convert to Species">
                <Leaf className={`w-4 h-4 ${!isQuestion ? 'text-secondary' : ''}`} />
            </Button>
            {node.id !== 'root' && (
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => removeNode(node.id)} title="Delete Branch">
                    <Trash2 className="w-4 h-4"/>
                </Button>
            )}
        </div>
        
        {isQuestion && (
          <div className="text-xs mt-1 flex gap-2">
            {!yesChild && <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => addNode(node.id, 'yes')}><Plus className="w-3 h-3 mr-1"/> Yes</Button>}
            {!noChild && <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => addNode(node.id, 'no')}><Plus className="w-3 h-3 mr-1"/> No</Button>}
          </div>
        )}
      </div>
      
      {(yesChild || noChild) && (
        <div className="pl-12 pt-5 relative">
          <svg className="absolute top-0 left-0 w-12 h-full text-text" viewBox="0 0 48 100" preserveAspectRatio="none">
            {yesChild && <path d="M0 19 H24" stroke="currentColor" strokeWidth="1" />}
            {noChild && yesChild && <path d="M24 19 V 79" stroke="currentColor" strokeWidth="1" />}
            {noChild && <path d="M0 79 H24" stroke="currentColor" strokeWidth="1" />}
          </svg>

          <div className="flex flex-col gap-12">
            {yesChild && <div className="flex items-center"><span className="text-xs mr-2 font-bold text-green-600">Yes:</span><NodeComponent {...{nodeId: node.yesId!, nodeMap, updateNode, addNode, removeNode, setNodeType}} /></div>}
            {noChild && <div className="flex items-center"><span className="text-xs mr-2 font-bold text-red-600">No:</span><NodeComponent {...{nodeId: node.noId!, nodeMap, updateNode, addNode, removeNode, setNodeType}} /></div>}
          </div>
        </div>
      )}
    </div>
  );
};


export default function DichotomousKey() {
  const [nodes, setNodes] = useState<NodeMap>({
    'root': { id: 'root', type: 'question', content: 'Does it have feathers?', yesId: 'node-1', noId: 'node-2' },
    'node-1': { id: 'node-1', type: 'species', content: 'Bird' },
    'node-2': { id: 'node-2', type: 'species', content: 'Fish' },
  });
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const { openExportModal } = useExportModal();
  const nextId = useRef(3);

  const addNode = useCallback((parentId: string, branch: 'yes' | 'no') => {
    const newId = `node-${nextId.current++}`;
    const newNode: KeyNode = { id: newId, type: 'species', content: 'New Item' };
    
    setNodes(prev => {
      const newNodes = { ...prev };
      newNodes[newId] = newNode;
      newNodes[parentId] = { ...newNodes[parentId], [branch === 'yes' ? 'yesId' : 'noId']: newId };
      return newNodes;
    });
  }, []);

  const updateNode = useCallback((id: string, content: string) => {
    setNodes(prev => ({ ...prev, [id]: { ...prev[id], content } }));
  }, []);
  
  const setNodeType = useCallback((id: string, type: 'question' | 'species') => {
    setNodes(prev => ({ ...prev, [id]: { ...prev[id], type } }));
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => {
        const newNodes = { ...prev };
        
        Object.values(newNodes).forEach(parent => {
            if(parent.yesId === nodeId) delete parent.yesId;
            if(parent.noId === nodeId) delete parent.noId;
        });

        const deleteBranch = (id: string) => {
            const node = newNodes[id];
            if(!node) return;
            if(node.yesId) deleteBranch(node.yesId);
            if(node.noId) deleteBranch(node.noId);
            delete newNodes[id];
        }
        deleteBranch(nodeId);
        
        return newNodes;
    });
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
           <div className="p-6 space-y-3 text-sm text-text/80">
              <p>• Build your key visually! Click into any box to edit the text.</p>
              <p>• Hover over a node to see options to change its type (Question or Species) or delete it.</p>
              <p>• Click the <span className="text-accent font-semibold">[+ Yes]</span> or <span className="text-accent font-semibold">[+ No]</span> buttons on a question node to add a new branch.</p>
           </div>
           <div className="p-4 border-t border-neutral-dark/30">
               <Button onClick={() => openExportModal(diagramContainerRef, 'dichotomous-key')} className="w-full">
                  <Save className="mr-2 h-4 w-4" /> Save & Export
              </Button>
           </div>
        </Card>
      </div>
      <div className="lg:col-span-2 min-h-[500px] lg:min-h-0">
        <Card className="h-full !p-6 overflow-auto">
          <div ref={diagramContainerRef} data-testid="diagram-container">
            <AnimatePresence>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {nodes['root'] && <NodeComponent nodeId="root" nodeMap={nodes} updateNode={updateNode} addNode={addNode} removeNode={removeNode} setNodeType={setNodeType} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>
      </div>
    </div>
  );
}