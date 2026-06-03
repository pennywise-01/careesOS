import { useApp } from '../store/AppContext';

const navItems = [
  { id: 'dashboard', label: 'Matches', icon: '◇' },
  { id: 'feedback', label: 'Feedback Loop', icon: '◉' },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const activeView = state.view;

  return (
    <div className="w-64 flex-shrink-0 border-r border-accent/10 bg-surface/50 flex flex-col">
      <div className="p-4 border-b border-accent/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
            HM
          </div>
          <div>
            <div className="text-sm font-medium text-text">Hiring Manager</div>
            <div className="text-xs text-text-muted">Platform Engineering</div>
          </div>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => dispatch({ type: 'NAVIGATE', view: item.id })}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              activeView === item.id
                ? 'bg-accent/10 text-accent font-medium border border-accent/20'
                : 'text-text-secondary hover:text-text hover:bg-elevated'
            }`}
          >
            <span className="text-xs w-5">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-accent/10">
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-2">System Status</div>
        <div className="space-y-2">
          <div className="text-xs text-text-secondary flex gap-2">
            <span className="text-success mt-0.5 flex-shrink-0">●</span>
            <span>Layer 1: Semantic Engine Active</span>
          </div>
          <div className="text-xs text-text-secondary flex gap-2">
            <span className="text-success mt-0.5 flex-shrink-0">●</span>
            <span>Layer 2: Verification Pipeline Ready</span>
          </div>
          <div className="text-xs text-text-secondary flex gap-2">
            <span className="text-accent mt-0.5 flex-shrink-0">●</span>
            <span>Layer 3: 2 Outcomes Logged</span>
          </div>
        </div>
      </div>
    </div>
  );
}