import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import Sidebar from '../components/Sidebar';
import { candidates } from '../data/mockData';

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  
  const candidate = state.selectedCandidate || candidates.find(c => c.id === id);

  if (!candidate) return <div className="p-8 text-text-muted">Candidate not found</div>;

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
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="font-display text-3xl text-text">{candidate.name}</h1>
              <p className="text-text-secondary mt-1">Candidate ID: {candidate.id}</p>
            </div>

            <div className="p-4 rounded-lg bg-surface border border-accent/10">
              <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-3">Layer 1: Semantic Profile</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-text-muted mb-1">Goals</div>
                  <div className="text-sm text-text">{candidate.goals.direction}</div>
                  <div className="text-xs text-danger mt-1">Avoids: {candidate.goals.anti_preferences.join(', ')}</div>
                </div>
                <div>
                  <div className="text-xs text-text-muted mb-1">Work Context</div>
                  <div className="text-sm text-text">
                    Team: {candidate.work_context.preferred_team_size} · Pace: {candidate.work_context.preferred_pace} · Autonomy: {candidate.work_context.autonomy_level}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-surface border border-accent/10">
              <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-3">Layer 2: Skill Verification</h3>
              <div className="space-y-3">
                {candidate.skills.map((skill, idx) => (
                  <div key={idx} className="p-3 rounded bg-bg/50 border border-accent/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-text font-medium capitalize">{skill.name}</span>
                      {skill.verified ? (
                        <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-medium uppercase tracking-wider">
                          Verified ({(skill.verified_score * 100).toFixed(0)}th percentile)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-elevated text-text-muted text-[10px] font-medium uppercase tracking-wider">
                          Unverified
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-secondary italic mb-2">"{skill.evidence_quote}"</div>
                    <div className="flex gap-4 text-[10px] text-text-muted font-mono">
                      <span>Level: {skill.inferred_level}</span>
                      <span>Confidence: {(skill.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}