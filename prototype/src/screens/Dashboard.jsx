import { useApp } from '../store/AppContext';
import Sidebar from '../components/Sidebar';
import TrajectoryGraph from '../components/TrajectoryGraph';
import SkillRadar from '../components/SkillRadar';
import FairPayEngine from '../components/FairPayEngine';
import FeedbackLoop from '../components/FeedbackLoop';
import AiCoach from '../components/AiCoach';
import { trajectoryNodes } from '../data/trajectory';

function MainPanel({ view, selectedNode, onNodeClick }) {
  const { dispatch } = useApp();

  switch (view) {
    case 'skills':
      return (
        <div className="p-6 max-w-lg mx-auto">
          <SkillRadar targetNode={selectedNode} />
        </div>
      );
    case 'salary':
      return (
        <div className="p-6 max-w-lg mx-auto overflow-y-auto h-full">
          <FairPayEngine targetNode={selectedNode} />
        </div>
      );
    case 'coach':
      return <AiCoach />;
    case 'feedback':
      return (
        <div className="p-6 max-w-lg mx-auto overflow-y-auto h-full">
          <FeedbackLoop />
        </div>
      );
    case 'dashboard':
    case 'graph':
    default:
      return (
        <div className="flex flex-col h-full">
          <div className="px-5 py-3 border-b border-accent/10 flex items-center justify-between flex-shrink-0">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent">01 · Discovery</span>
              <h3 className="font-display text-lg">Career Trajectory Map</h3>
            </div>
            <div className="flex gap-2">
              {['IT/Tech', 'Finance', 'All Industries'].map(filter => (
                <button key={filter} className="px-3 py-1 rounded-full bg-surface border border-accent/10 text-xs text-text-secondary hover:border-accent/30 transition-all">
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <TrajectoryGraph onNodeClick={onNodeClick} />
          </div>
          {selectedNode && (
            <div className="px-5 py-3 border-t border-accent/10 bg-surface/30 flex items-center gap-4 text-xs flex-shrink-0">
              <span className="text-text-secondary">Selected: <span className="text-text font-medium">{selectedNode.role}</span></span>
              <span className="font-mono text-accent">RM {selectedNode.salaryMin.toLocaleString()} – {selectedNode.salaryMax.toLocaleString()}</span>
              <button
                onClick={() => dispatch({ type: 'NAVIGATE', view: 'skills' })}
                className="ml-auto px-3 py-1 rounded-full bg-accent/10 text-accent text-xs hover:bg-accent/20 transition-all">
                View Skill Gap →
              </button>
            </div>
          )}
        </div>
      );
  }
}

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const view = state.subView === 'dashboard' ? 'graph' : state.subView;

  const handleNodeClick = (node) => {
    dispatch({ type: 'SELECT_PATH_NODE', node });
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 py-3 border-b border-accent/10 flex-shrink-0 bg-surface/30">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent">[T] Career OS</span>
          <span className="text-text-muted text-xs">|</span>
          <span className="text-sm text-text-secondary">{state.currentPersona?.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_EMPLOYER' })}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Employer
          </button>
          <button
            onClick={() => dispatch({ type: 'RESET' })}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Logout
          </button>
          <span className="text-xl cursor-pointer">🔔</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-hidden bg-bg">
          <MainPanel view={view} selectedNode={state.selectedPathNode} onNodeClick={handleNodeClick} />
        </div>
        {view !== 'coach' && (
          <div className="w-80 flex-shrink-0 border-l border-accent/10 bg-surface/30">
            <AiCoach />
          </div>
        )}
      </div>
    </div>
  );
}
