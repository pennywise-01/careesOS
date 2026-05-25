import { useApp } from '../store/AppContext';

const navItems = [
  { id: 'graph', label: 'Trajectory', icon: '◇' },
  { id: 'skills', label: 'Skills', icon: '◎' },
  { id: 'salary', label: 'Salary', icon: '◆' },
  { id: 'coach', label: 'Coach', icon: '◈' },
  { id: 'feedback', label: 'Feedback', icon: '◉' },
];

const marketByChapter = {
  student: ['Internship applications peak in March for Malaysia', 'Tech companies hiring fresh grads: 12% increase YoY', 'Soft skills are ranked #1 by SEA employers'],
  young_adult: ['Entry-level Cloud roles growing 18% in KL', 'Fresh grads with AWS cert earn 22% more starting', 'SG is the top destination for early career moves'],
  early_career: ['3 Cloud Engineer roles trending in KL this week', 'DevOps demand up 18% across SEA', 'AWS certified profiles see 31% higher response'],
  mid_career: ['Engineering Manager roles up 22% in SEA MNCs', 'Senior engineers pivoting to PM see 15% salary bump', 'Leadership roles fill 3x faster through referrals'],
  senior_career: ['Board positions in property sector trending up', 'Consultant day rates up 12% in JB and KL', 'Executive headhunters prefer LinkedIn presence'],
  executive: ['C-suite moves driven by network, not applications', 'SEA boards seeking digital transformation expertise', 'Advisory roles are growing 25% across APAC'],
};

function getMarketSignals(persona) {
  if (!persona) return marketByChapter.early_career;
  if (marketByChapter[persona.chapter]) return marketByChapter[persona.chapter];
  if (persona.id && marketByChapter[persona.id]) return marketByChapter[persona.id];
  return marketByChapter.early_career;
}

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const persona = state.currentPersona;
  const activeView = state.subView || 'graph';

  const signals = getMarketSignals(persona);

  if (!persona) return null;
  return (
    <div className="w-64 flex-shrink-0 border-r border-accent/10 bg-surface/50 flex flex-col">
      <div className="p-4 border-b border-accent/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
            {persona.name ? persona.name.split(' ').map(n => n[0]).join('') : '?'}
          </div>
          <div>
            <div className="text-sm font-medium text-text">{persona.name || persona.chapterLabel}</div>
            <div className="text-xs text-text-muted">{persona.chapterLabel} · {persona.city}</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {persona.currentRole ? (
            <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-medium">{persona.currentRole}</span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-elevated text-text-muted text-[10px] font-medium">{persona.chapterLabel}</span>
          )}
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => dispatch({ type: 'NAVIGATE', view: item.id, node: null })}
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
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-2">Market Signals</div>
        <div className="space-y-2">
          {signals.map((signal, i) => (
            <div key={i} className="text-xs text-text-secondary flex gap-2">
              <span className="text-success mt-0.5 flex-shrink-0">●</span>
              <span>{signal}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-accent/10">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_EMPLOYER' })}
          className="w-full py-2 rounded-lg bg-surface border border-employer-accent/20 hover:border-employer-accent/50 text-employer-accent text-xs font-medium transition-all"
        >
          Employer View →
        </button>
      </div>
    </div>
  );
}
