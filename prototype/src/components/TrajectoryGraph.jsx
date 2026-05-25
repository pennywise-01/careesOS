import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useApp } from '../store/AppContext';
import { trajectoryNodes as allNodes, trajectoryEdges as allEdges } from '../data/trajectory';

function getNodeColor(probability) {
  if (probability >= 0.35) return 'var(--color-success)';
  if (probability >= 0.15) return 'var(--color-node-possible)';
  return 'var(--color-node-unlikely)';
}

function TrajectoryNode({ data }) {
  const color = getNodeColor(data.probability || (data.isCurrent ? 1 : 0.35));
  const borderColor = data.isCurrent ? 'var(--color-accent)' : color;
  const bg = data.isCurrent ? 'rgba(245, 197, 24, 0.15)' : 'var(--color-surface)';

  return (
    <div
      className="rounded-xl border-2 p-3 min-w-[180px] cursor-pointer transition-all hover:scale-105"
      style={{ borderColor, background: bg, boxShadow: data.isCurrent ? '0 0 20px rgba(245,197,24,0.2)' : 'none' }}
    >
      <Handle type="target" position={Position.Top} style={{ background: borderColor }} />
      <div className="font-medium text-sm text-text">{data.label}</div>
      {data.specialisation && <div className="text-xs text-text-secondary">{data.specialisation}</div>}
      {data.salary && <div className="font-mono text-xs text-accent mt-1">{data.salary}</div>}
      {data.probability !== undefined && (
        <div className="mt-1 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-surface overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${data.probability * 100}%`, backgroundColor: color }} />
          </div>
          <span className="font-mono text-[10px] text-text-muted">{Math.round(data.probability * 100)}%</span>
        </div>
      )}
      {data.avgTime && <div className="text-[10px] text-text-muted mt-1">~{data.avgTime} months</div>}
      <Handle type="source" position={Position.Bottom} style={{ background: borderColor }} />
    </div>
  );
}

const nodeTypes = { trajectoryNode: TrajectoryNode };

export default function TrajectoryGraph({ onNodeClick }) {
  const { state } = useApp();
  const persona = state.currentPersona;

  const startNodeId = useMemo(() => {
    if (!persona) return 'it-support';
    const role = persona.currentRole;
    const node = allNodes.find(n => n.role === role);
    return node?.id || 'it-support';
  }, [persona]);

  const { initialNodes, initialEdges } = useMemo(() => {
    const relevantEdges = [];
    const visited = new Set();
    const queue = [startNodeId];
    visited.add(startNodeId);

    while (queue.length > 0) {
      const current = queue.shift();
      const outgoing = allEdges.filter(e => e.from === current);
      outgoing.forEach(e => {
        relevantEdges.push(e);
        if (!visited.has(e.to)) {
          visited.add(e.to);
          queue.push(e.to);
        }
      });
    }

    const relevantNodeIds = new Set();
    relevantEdges.forEach(e => { relevantNodeIds.add(e.from); relevantNodeIds.add(e.to); });
    relevantNodeIds.add(startNodeId);

    const nodes = allNodes
      .filter(n => relevantNodeIds.has(n.id))
      .map((n, i) => ({
        id: n.id,
        type: 'trajectoryNode',
        position: { x: i * 250, y: (Math.floor(i / 3)) * 200 },
        data: {
          label: n.role,
          specialisation: n.specialisation,
          salary: `RM ${n.salaryMin.toLocaleString()} – ${n.salaryMax.toLocaleString()}`,
          isCurrent: n.id === startNodeId,
          probability: n.id === startNodeId ? undefined : allEdges.find(e => e.to === n.id)?.probability,
          avgTime: allEdges.find(e => e.to === n.id)?.avgTimeMonths,
        },
      }));

    const edges = relevantEdges.map(e => {
      const prob = e.probability;
      const highProb = prob >= 0.35;
      const mediumProb = prob < 0.35 && prob >= 0.15;
      return {
        id: e.id,
        source: e.from,
        target: e.to,
        animated: highProb,
        style: {
          stroke: highProb ? 'var(--color-success)' : mediumProb ? 'var(--color-node-possible)' : 'var(--color-node-unlikely)',
          strokeWidth: 2,
          strokeDasharray: highProb || mediumProb ? undefined : '6 4',
        },
        label: `${Math.round(prob * 100)}%`,
        labelStyle: { fill: 'var(--color-text-muted)', fontSize: 10 },
        labelBgStyle: { fill: 'var(--color-surface)', fillOpacity: 0.9 },
      };
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [startNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClickHandler = useCallback((event, node) => {
    const n = allNodes.find(nn => nn.id === node.id);
    if (n && onNodeClick) onNodeClick(n);
  }, [onNodeClick, allNodes]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClickHandler}
        nodeTypes={nodeTypes}
        fitView
        className="bg-bg"
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background color="var(--color-elevated)" gap={20} />
        <Controls className="!bg-surface !border-accent/10 !rounded-lg [&_button]:!bg-surface [&_button]:!text-text-secondary [&_button]:!border-accent/10 [&_button:hover]:!bg-elevated [&_svg]:!fill-text-secondary" />
        <MiniMap
          style={{ background: 'var(--color-surface)', border: '1px solid rgba(245,197,24,0.1)' }}
          nodeColor={(n) => n.data?.isCurrent ? 'var(--color-accent)' : 'var(--color-elevated)'}
          maskColor="rgba(13,31,26,0.7)"
        />
        <Panel position="bottom-left" className="!m-3">
          <div className="bg-surface/95 border border-accent/10 rounded-xl p-4 text-xs backdrop-blur-sm">
            <div className="font-mono text-[10px] uppercase tracking-wider text-accent mb-3">Legend</div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded border-2 flex-shrink-0" style={{ borderColor: 'var(--color-accent)', background: 'rgba(245,197,24,0.2)', boxShadow: '0 0 8px rgba(245,197,24,0.3)' }} />
                <span className="text-text">Current Position</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded border-2 flex-shrink-0" style={{ borderColor: 'var(--color-success)', background: 'rgba(76,175,125,0.15)' }} />
                <span className="text-text">High Probability (&gt;35%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded border-2 flex-shrink-0" style={{ borderColor: 'var(--color-node-possible)', background: 'rgba(107,168,255,0.1)' }} />
                <span className="text-text">Possible (15–35%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded border-2 flex-shrink-0" style={{ borderColor: 'var(--color-node-unlikely)', background: 'rgba(61,90,78,0.15)' }} />
                <span className="text-text-muted">Unlikely (&lt;15%)</span>
              </div>
              <div className="border-t border-accent/10 pt-2.5 mt-2">
                <div className="flex items-center gap-3">
                  <svg width="32" height="12" className="flex-shrink-0"><line x1="0" y1="6" x2="28" y2="6" stroke="var(--color-success)" strokeWidth="2" /><polygon points="28,2 32,6 28,10" fill="var(--color-success)" /></svg>
                  <span className="text-text-secondary">Solid arrow — high probability path</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <svg width="32" height="12" className="flex-shrink-0"><line x1="0" y1="6" x2="28" y2="6" stroke="var(--color-node-possible)" strokeWidth="2" /><polygon points="28,2 32,6 28,10" fill="var(--color-node-possible)" /></svg>
                  <span className="text-text-secondary">Solid arrow — possible path</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <svg width="32" height="12" className="flex-shrink-0"><line x1="0" y1="6" x2="28" y2="6" stroke="var(--color-node-unlikely)" strokeWidth="1.5" strokeDasharray="5 3" /><polygon points="28,2 32,6 28,10" fill="var(--color-node-unlikely)" /></svg>
                  <span className="text-text-muted">Dotted arrow — unlikely path</span>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
