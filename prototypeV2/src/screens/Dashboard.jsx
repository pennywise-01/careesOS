import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { candidates, job, outcomes } from '../data/mockData';

function cosineSimilarity(vec1, vec2) {
  const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
  const norm2 = Math.sqrt(vec2.reduce((sum, b) => sum + b * b, 0));
  return norm1 === 0 || norm2 === 0 ? 0 : dotProduct / (norm1 * norm2);
}

function calculateScores(candidate, jobData, weights) {
  const semantic = cosineSimilarity(candidate.embedding_mock, jobData.embedding_mock);
  const requiredNames = jobData.required_skills.filter(s => s.non_negotiable).map(s => s.name.toLowerCase());
  const candidateNames = candidate.skills.map(s => s.name.toLowerCase());
  const matched = requiredNames.filter(name => candidateNames.includes(name)).length;
  const skillCoverage = requiredNames.length > 0 ? matched / requiredNames.length : 1.0;
  
  const verifiedScores = candidate.skills.filter(s => s.verified && s.verified_score !== null).map(s => s.verified_score);
  const verification = verifiedScores.length > 0 ? verifiedScores.reduce((a, b) => a + b, 0) / verifiedScores.length : 0.0;
  
  let contextMatches = 0;
  let contextTotal = 0;
  if (candidate.work_context.preferred_pace === jobData.team_context.pace) { contextMatches++; contextTotal++; }
  if (candidate.work_context.autonomy_level === jobData.team_context.autonomy_offered) { contextMatches++; contextTotal++; }
  const contextFit = contextTotal > 0 ? contextMatches / contextTotal : 0.5;

  const composite = (semantic * weights.semantic) + (skillCoverage * weights.skill_coverage) + (verification * weights.verification) + (contextFit * weights.context_fit);

  return {
    semantic: semantic.toFixed(3),
    skillCoverage: skillCoverage.toFixed(3),
    verification: verification.toFixed(3),
    contextFit: contextFit.toFixed(3),
    composite: composite.toFixed(3)
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [weights, setWeights] = useState({ semantic: 0.40, skill_coverage: 0.25, verification: 0.20, context_fit: 0.15 });
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainMessage, setRetrainMessage] = useState("");

  const matches = candidates.map(c => ({
    ...c,
    scores: calculateScores(c, job, weights)
  })).sort((a, b) => parseFloat(b.scores.composite) - parseFloat(a.scores.composite));

  const handleRetrain = (rating) => {
    setIsRetraining(true);
    setRetrainMessage("Analyzing outcome data and retraining matching weights...");
    
    setTimeout(() => {
      if (rating >= 4) {
        setWeights({ semantic: 0.35, skill_coverage: 0.20, verification: 0.30, context_fit: 0.15 });
        setRetrainMessage("Success: Model detected high Verification scores predict success. Verification weight increased to 30%.");
      } else {
        setWeights({ semantic: 0.45, skill_coverage: 0.30, verification: 0.10, context_fit: 0.15 });
        setRetrainMessage("Warning: Model detected Verification was low for this poor hire. Adjusting weights to penalize unverified claims.");
      }
      setIsRetraining(false);
    }, 2000);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 py-3 border-b border-accent/10 flex-shrink-0 bg-surface/30">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent">[T] Career OS V2</span>
          <span className="text-text-muted text-xs">|</span>
          <span className="text-sm text-text-secondary">Reviewer Dashboard</span>
        </div>
        <button onClick={() => navigate('/')} className="text-xs text-employer-accent hover:text-employer-accent/80 transition-colors border border-employer-accent/30 px-3 py-1 rounded-full">
          ← Switch to Applicant View
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto bg-bg p-6">
          <div className="max-w-5xl mx-auto">
            
            <AnimatePresence mode="wait">
              {!selectedCandidate ? (
                /* CANDIDATE LIST VIEW */
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Reviewer View · Layer 1 & 2</span>
                    <h2 className="font-display text-2xl text-text mt-1">{job.title} Applicants</h2>
                    <p className="text-text-secondary text-sm mt-1">Ranked by dynamic composite score. Click a candidate to view AI-extracted evidence and verification status.</p>
                  </div>

                  <div className="space-y-3">
                    {matches.map((match, idx) => (
                      <div 
                        key={match.id} 
                        onClick={() => setSelectedCandidate(match)}
                        className="p-4 rounded-lg bg-surface border border-accent/10 hover:border-accent/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center text-accent font-mono text-xs">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-text font-medium">{match.name}</div>
                              <div className="text-xs text-text-muted">ID: {match.id} · Applied 2 days ago</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-display text-2xl text-accent">{match.scores.composite}</div>
                            <div className="text-[10px] text-text-muted uppercase tracking-wider">Composite Score</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="p-2 rounded bg-bg/50">
                            <div className="text-text-muted mb-1">Semantic</div>
                            <div className="text-text font-mono">{match.scores.semantic}</div>
                          </div>
                          <div className="p-2 rounded bg-bg/50">
                            <div className="text-text-muted mb-1">Skill Coverage</div>
                            <div className="text-text font-mono">{match.scores.skillCoverage}</div>
                          </div>
                          <div className="p-2 rounded bg-bg/50">
                            <div className="text-text-muted mb-1">Verification</div>
                            <div className={`font-mono ${parseFloat(match.scores.verification) > 0 ? 'text-success' : 'text-text-muted'}`}>
                              {match.scores.verification} {parseFloat(match.scores.verification) > 0 && '✓'}
                            </div>
                          </div>
                          <div className="p-2 rounded bg-bg/50">
                            <div className="text-text-muted mb-1">Context Fit</div>
                            <div className="text-text font-mono">{match.scores.contextFit}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* LAYER 3: POST-HIRE FEEDBACK LOOP SIMULATION */}
                  <div className="mt-12 p-6 rounded-lg bg-employer-surface border border-employer-accent/20">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-employer-accent">Layer 3 · Post-Hire Feedback Loop</span>
                    <h3 className="font-display text-lg text-text mt-1">Simulate Hiring Outcome</h3>
                    <p className="text-text-secondary text-sm mt-2 mb-4">
                      Imagine 90 days have passed since hiring the #1 candidate. Rate their performance to trigger the model retraining.
                    </p>
                    
                    {isRetraining ? (
                      <div className="p-4 rounded bg-bg/50 border border-employer-accent/20 font-mono text-xs text-employer-accent animate-pulse text-center">
                        {`> ${retrainMessage}`}
                      </div>
                    ) : retrainMessage ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded bg-success/10 border border-success/30 text-sm text-text">
                          {retrainMessage}
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 rounded bg-bg/50"><div className="text-text-muted">Semantic</div><div className="font-mono text-text">{(weights.semantic * 100).toFixed(0)}%</div></div>
                          <div className="p-2 rounded bg-bg/50"><div className="text-text-muted">Coverage</div><div className="font-mono text-text">{(weights.skill_coverage * 100).toFixed(0)}%</div></div>
                          <div className="p-2 rounded bg-bg/50"><div className="text-text-muted">Verification</div><div className="font-mono text-accent">{(weights.verification * 100).toFixed(0)}%</div></div>
                          <div className="p-2 rounded bg-bg/50"><div className="text-text-muted">Context</div><div className="font-mono text-text">{(weights.context_fit * 100).toFixed(0)}%</div></div>
                        </div>
                        <button onClick={() => { setWeights({ semantic: 0.40, skill_coverage: 0.25, verification: 0.20, context_fit: 0.15 }); setRetrainMessage(""); }} className="text-xs text-text-muted hover:text-text underline">
                          Reset Weights to Default
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-3">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button key={rating} onClick={() => handleRetrain(rating)} className="w-12 h-12 rounded-full bg-elevated hover:bg-employer-accent hover:text-bg text-text font-medium transition-all">
                            {rating}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* CANDIDATE DETAIL VIEW */
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <button onClick={() => setSelectedCandidate(null)} className="text-xs text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
                    ← Back to Applicant List
                  </button>

                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-display text-3xl text-text">{selectedCandidate.name}</h2>
                      <p className="text-text-secondary">Composite Score: <span className="text-accent font-display text-xl">{selectedCandidate.scores.composite}</span></p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-text-muted mb-1">Current Model Weights</div>
                      <div className="font-mono text-[10px] text-text-secondary">
                        Sem: {(weights.semantic * 100).toFixed(0)}% | Cov: {(weights.skill_coverage * 100).toFixed(0)}% | Ver: {(weights.verification * 100).toFixed(0)}% | Ctx: {(weights.context_fit * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* AI Extracted Profile */}
                    <div className="p-5 rounded-lg bg-surface border border-accent/10">
                      <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-4">Layer 1: AI Extracted Evidence</h3>
                      <div className="space-y-4">
                        {selectedCandidate.skills.map((skill, idx) => (
                          <div key={idx} className="p-3 rounded bg-bg/50 border border-accent/5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-text font-medium capitalize">{skill.name}</span>
                              {skill.verified ? (
                                <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-medium uppercase">
                                  Verified ({(skill.verified_score * 100).toFixed(0)}%)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-elevated text-text-muted text-[10px] font-medium uppercase">
                                  Unverified
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-text-secondary italic mb-2">"{skill.evidence_quote}"</div>
                            <div className="flex gap-3 text-[10px] text-text-muted font-mono">
                              <span>Level: {skill.inferred_level}</span>
                              <span>Confidence: {(skill.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 p-3 rounded bg-bg/50 border border-accent/5">
                        <div className="text-[10px] text-text-muted uppercase mb-1">Work Context & Goals</div>
                        <div className="text-sm text-text">Pace: {selectedCandidate.work_context.preferred_pace} · Autonomy: {selectedCandidate.work_context.autonomy_level}</div>
                        <div className="text-sm text-text mt-1">Direction: {selectedCandidate.goals.direction}</div>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="p-5 rounded-lg bg-surface border border-accent/10">
                      <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-4">Layer 2: Score Breakdown</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-accent/10">
                          <span className="text-text-secondary text-sm">Semantic Similarity</span>
                          <span className="font-mono text-text">{selectedCandidate.scores.semanticRaw || selectedCandidate.scores.semantic} × {(weights.semantic * 100).toFixed(0)}% = <span className="text-accent">{selectedCandidate.scores.semantic}</span></span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-accent/10">
                          <span className="text-text-secondary text-sm">Skill Coverage</span>
                          <span className="font-mono text-text">{selectedCandidate.scores.skillCoverage} × {(weights.skill_coverage * 100).toFixed(0)}% = <span className="text-accent">{selectedCandidate.scores.skillCoverage}</span></span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-accent/10">
                          <span className="text-text-secondary text-sm">Verification Score</span>
                          <span className="font-mono text-text">{selectedCandidate.scores.verification} × {(weights.verification * 100).toFixed(0)}% = <span className="text-success">{(parseFloat(selectedCandidate.scores.verification) * weights.verification).toFixed(3)}</span></span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-accent/10">
                          <span className="text-text-secondary text-sm">Context Fit</span>
                          <span className="font-mono text-text">{selectedCandidate.scores.contextFit} × {(weights.context_fit * 100).toFixed(0)}% = <span className="text-accent">{selectedCandidate.scores.contextFit}</span></span>
                        </div>
                      </div>

                      <div className="mt-6 p-4 rounded bg-employer-surface border border-employer-accent/20">
                        <h4 className="text-sm font-medium text-employer-accent mb-2">Reviewer Actions</h4>
                        <div className="flex gap-2">
                          <button className="flex-1 py-2 rounded bg-employer-accent text-bg text-sm font-medium hover:opacity-90">Shortlist for Interview</button>
                          <button className="flex-1 py-2 rounded bg-elevated text-text-secondary text-sm font-medium hover:bg-highlight">Reject</button>
                        </div>
                        <p className="text-[10px] text-text-muted mt-2 text-center">
                          Note: Candidate's resume is available in the ATS for human context, but was excluded from this AI scoring.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}