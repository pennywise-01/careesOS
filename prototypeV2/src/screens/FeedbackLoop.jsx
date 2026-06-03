import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import Sidebar from '../components/Sidebar';
import { outcomes } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function FeedbackLoop() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const successful = outcomes.filter(o => o.label === 'successful');
  const poor = outcomes.filter(o => o.label === 'poor');

  const avgVerSuccessful = successful.reduce((sum, o) => sum + (o.verification_score_at_hire || 0), 0) / (successful.length || 1);
  const avgVerPoor = poor.reduce((sum, o) => sum + (o.verification_score_at_hire || 0), 0) / (poor.length || 1);

  const chartData = [
    { name: 'Successful Hires', score: avgVerSuccessful, fill: '#4caf7d' },
    { name: 'Poor Hires', score: avgVerPoor, fill: '#e05555' }
  ];

  const shouldRetrain = avgVerSuccessful > avgVerPoor + 0.2;
  const newWeights = shouldRetrain 
    ? { semantic: 0.35, skill_coverage: 0.20, verification: 0.30, context_fit: 0.15 }
    : state.weights;

  const handleRetrain = () => {
    if (shouldRetrain) {
      dispatch({ type: 'UPDATE_WEIGHTS', weights: newWeights });
      alert('Model retrained! Verification weight increased from 20% to 30%.');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 py-3 border-b border-accent/10 flex-shrink-0 bg-surface/30">
        <button onClick={() => navigate('/')} className="text-xs text-accent hover:text-accent-hover transition-colors">
          ← Back to Matches
        </button>
        <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent">[T] Career OS V2</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto bg-bg p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-accent">03 · Post-Hire Feedback Loop</span>
              <h2 className="font-display text-2xl text-text mt-1">Outcome Analysis & Model Retraining</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-surface border border-accent/10">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Outcomes</div>
                <div className="font-display text-3xl text-text">{outcomes.length}</div>
              </div>
              <div className="p-4 rounded-lg bg-surface border border-success/20">
                <div className="text-xs text-success uppercase tracking-wider mb-1">Successful</div>
                <div className="font-display text-3xl text-success">{successful.length}</div>
              </div>
              <div className="p-4 rounded-lg bg-surface border border-danger/20">
                <div className="text-xs text-danger uppercase tracking-wider mb-1">Poor</div>
                <div className="font-display text-3xl text-danger">{poor.length}</div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-surface border border-accent/10">
              <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-4">Verification Score Predictiveness</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a3d2e" />
                    <XAxis dataKey="name" stroke="#8aab97" fontSize={12} />
                    <YAxis stroke="#8aab97" fontSize={12} domain={[0, 1]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#112820', border: '1px solid #1f4a36', color: '#f0f4f0' }}
                      itemStyle={{ color: '#f0f4f0' }}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {shouldRetrain && (
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-2">Retraining Recommendation</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Verification score is highly predictive of success (Avg: {(avgVerSuccessful * 100).toFixed(0)}% vs {(avgVerPoor * 100).toFixed(0)}%). 
                  The model recommends increasing the verification weight in the composite score from 20% to 30%.
                </p>
                <button 
                  onClick={handleRetrain}
                  className="px-4 py-2 rounded-lg bg-accent text-bg font-medium text-sm hover:bg-accent-hover transition-colors"
                >
                  Apply New Weights & Retrain Model
                </button>
              </div>
            )}

            <div className="p-4 rounded-lg bg-surface border border-accent/10">
              <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-3">Current Model Weights</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded bg-bg/50">
                  <div className="text-[10px] text-text-muted uppercase">Semantic</div>
                  <div className="font-mono text-text">{(state.weights.semantic * 100).toFixed(0)}%</div>
                </div>
                <div className="p-2 rounded bg-bg/50">
                  <div className="text-[10px] text-text-muted uppercase">Skill Coverage</div>
                  <div className="font-mono text-text">{(state.weights.skill_coverage * 100).toFixed(0)}%</div>
                </div>
                <div className="p-2 rounded bg-bg/50">
                  <div className="text-[10px] text-text-muted uppercase">Verification</div>
                  <div className="font-mono text-accent">{(state.weights.verification * 100).toFixed(0)}%</div>
                </div>
                <div className="p-2 rounded bg-bg/50">
                  <div className="text-[10px] text-text-muted uppercase">Context Fit</div>
                  <div className="font-mono text-text">{(state.weights.context_fit * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}