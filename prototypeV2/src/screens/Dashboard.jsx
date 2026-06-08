import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { candidates, job, jobs, outcomes } from '../data/mockData';

function cosineSimilarity(vec1, vec2) {
  const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
  const norm2 = Math.sqrt(vec2.reduce((sum, b) => sum + b * b, 0));
  return norm1 === 0 || norm2 === 0 ? 0 : dotProduct / (norm1 * norm2);
}

function calculateScores(candidate, jobData, weights) {
  if (!jobData || !candidate.embedding_mock || !jobData.embedding_mock) {
    return { semantic: '0.000', skillCoverage: '0.000', verification: '0.000', contextFit: '0.000', composite: '0.000' };
  }
  const semantic = cosineSimilarity(candidate.embedding_mock, jobData.embedding_mock);
  const requiredNames = (jobData.required_skills || []).filter(s => s.non_negotiable).map(s => s.name.toLowerCase());
  const candidateNames = (candidate.skills || []).map(s => s.name.toLowerCase());
  const skillMatches = (req, extracted) => {
    const words = req.split(/\s+/).filter(w => w.length > 3);
    return words.some(w => extracted.some(s => s.includes(w))) || extracted.some(s => s.includes(req));
  };
  const matched = requiredNames.filter(req => skillMatches(req, candidateNames)).length;
  const skillCoverage = requiredNames.length > 0 ? matched / requiredNames.length : 1.0;
  const verifiedScores = (candidate.skills || []).filter(s => s.verified && s.verified_score !== null).map(s => s.verified_score);
  const verification = verifiedScores.length > 0 ? verifiedScores.reduce((a, b) => a + b, 0) / verifiedScores.length : 0.0;
  let contextMatches = 0, contextTotal = 0;
  if (jobData.team_context) {
    if (candidate.work_context?.preferred_pace === jobData.team_context.pace) { contextMatches++; contextTotal++; }
    if (candidate.work_context?.autonomy_level === jobData.team_context.autonomy_offered) { contextMatches++; contextTotal++; }
  }
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

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [weights, setWeights] = useState({ semantic: 0.40, skill_coverage: 0.25, verification: 0.20, context_fit: 0.15 });
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainMessage, setRetrainMessage] = useState("");

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const liveApplications = JSON.parse(localStorage.getItem('careesOS_applications') || '[]');

  const allCandidates = [
    ...liveApplications,
    ...candidates
  ];

  const matches = allCandidates.map(c => {
    const jobData = c.jobId ? jobs.find(j => j.id === c.jobId) : null;
    // Live application with full L1+L2 composite score from the applicant flow
    if (c.submittedAt && c.matchScore?.semanticRaw) {
      return {
        ...c, jobData: jobData || job,
        scores: {
          semantic: parseFloat(c.matchScore.semanticRaw).toFixed(3),
          skillCoverage: parseFloat(c.matchScore.skillCoverageRaw).toFixed(3),
          verification: parseFloat(c.matchScore.verificationRaw).toFixed(3),
          contextFit: parseFloat(c.matchScore.contextFitRaw).toFixed(3),
          composite: c.matchScore.composite,
        },
        isLiveApp: true,
      };
    }
    // Live application with simple L1-only score (normal job, no work sample)
    if (c.submittedAt && c.matchScore?.composite) {
      return {
        ...c, jobData: jobData || job,
        scores: { semantic: 'n/a', skillCoverage: 'n/a', verification: 'n/a', contextFit: 'n/a', composite: c.matchScore.composite },
        isLiveApp: true,
      };
    }
    // Mock candidate — recalculate with current weights
    return { ...c, jobData: jobData || job, scores: calculateScores(c, jobData || job, weights) };
  }).sort((a, b) => parseFloat(b.scores.composite) - parseFloat(a.scores.composite));

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
          <button onClick={() => navigate('/')} className="text-xs text-text-muted hover:text-text transition-colors">← Home</button>
          <span className="text-text-muted text-xs">|</span>
          <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent">[T] Career OS V2</span>
          <span className="text-text-muted text-xs">·</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-accent/10 text-accent border border-accent/30">PREMIUM</span>
          <span className="text-sm text-text-secondary">Reviewer Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/post/premium')} className="text-xs text-text-secondary hover:text-text border border-accent/20 px-3 py-1 rounded-full transition-colors">
            + Post Job
          </button>
          <button onClick={() => navigate('/reviewer/normal')} className="text-xs text-text-muted hover:text-text transition-colors border border-accent/20 px-3 py-1 rounded-full">
            Standard Dashboard
          </button>
          <button onClick={() => navigate('/apply/premium')} className="text-xs text-employer-accent hover:text-employer-accent/80 transition-colors border border-employer-accent/30 px-3 py-1 rounded-full">
            ← Applicant View
          </button>
        </div>
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
                    <h2 className="font-display text-2xl text-text mt-1">All Applicants</h2>
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
                              <div className="flex items-center gap-2">
                              <span className="text-text font-medium">{match.name}</span>
                              {match.isLiveApp && <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-success/10 text-success border border-success/20">LIVE</span>}
                            </div>
                              <div className="text-xs text-text-muted">
                                {match.jobTitle && <span className="text-employer-accent/80 mr-2">{match.jobTitle}</span>}
                                {match.roleInput && <span className="text-accent/60 mr-2">· {match.roleInput}</span>}
                                {match.submittedAt ? `Applied ${timeAgo(match.submittedAt)}` : 'Applied 2 days ago'}
                                {match.email && <span className="text-accent/70"> · {match.email}</span>}
                              </div>
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
                      {selectedCandidate.email && (
                        <div className="flex gap-4 text-xs text-text-muted mt-1">
                          <span>✉ {selectedCandidate.email}</span>
                          {selectedCandidate.phone && <span>✆ {selectedCandidate.phone}</span>}
                          {selectedCandidate.submittedAt && <span>Applied {timeAgo(selectedCandidate.submittedAt)}</span>}
                        </div>
                      )}
                      <p className="text-text-secondary mt-1">Composite Score: <span className="text-accent font-display text-xl">{selectedCandidate.scores.composite}</span></p>
                      {selectedCandidate.roleInput && (
                        <p className="text-xs text-text-muted mt-0.5">Target role: <span className="text-accent/80">{selectedCandidate.roleInput}</span></p>
                      )}
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
                      <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-4">Layer 1 + Layer 2: Score Breakdown</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-accent/10">
                          <span className="text-text-secondary text-sm">Semantic Similarity</span>
                          <span className="font-mono text-text">{selectedCandidate.scores.semantic} × {(weights.semantic * 100).toFixed(0)}% = <span className="text-accent">{(parseFloat(selectedCandidate.scores.semantic) * weights.semantic).toFixed(3)}</span></span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-accent/10">
                          <span className="text-text-secondary text-sm">Skill Coverage</span>
                          <span className="font-mono text-text">{selectedCandidate.scores.skillCoverage} × {(weights.skill_coverage * 100).toFixed(0)}% = <span className="text-accent">{(parseFloat(selectedCandidate.scores.skillCoverage) * weights.skill_coverage).toFixed(3)}</span></span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-accent/10">
                          <span className="text-text-secondary text-sm">Verification Score</span>
                          <span className="font-mono text-text">{selectedCandidate.scores.verification} × {(weights.verification * 100).toFixed(0)}% = <span className="text-success">{(parseFloat(selectedCandidate.scores.verification) * weights.verification).toFixed(3)}</span></span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-accent/10">
                          <span className="text-text-secondary text-sm">Context Fit</span>
                          <span className="font-mono text-text">{selectedCandidate.scores.contextFit} × {(weights.context_fit * 100).toFixed(0)}% = <span className="text-accent">{(parseFloat(selectedCandidate.scores.contextFit) * weights.context_fit).toFixed(3)}</span></span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-accent/20">
                          <span className="text-text-secondary text-sm font-medium">Composite</span>
                          <span className="font-mono text-accent font-medium">{selectedCandidate.scores.composite}</span>
                        </div>
                      </div>

                      {selectedCandidate.workSampleGrade && (
                        <div className="mt-4 p-3 rounded bg-success/5 border border-success/20 space-y-2">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-success mb-2">Work Sample AI Grade</div>
                          {[
                            { label: 'Task Completion', val: selectedCandidate.workSampleGrade.task_completion },
                            { label: 'Technical Accuracy', val: selectedCandidate.workSampleGrade.technical_accuracy },
                            { label: 'Work Quality', val: selectedCandidate.workSampleGrade.work_quality },
                            { label: 'Communication', val: selectedCandidate.workSampleGrade.communication },
                          ].map(row => (
                            <div key={row.label} className="flex items-center justify-between text-xs">
                              <span className="text-text-secondary">{row.label}</span>
                              <span className="font-mono text-success">{((row.val || 0) * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                          {selectedCandidate.workSampleGrade.feedback && (
                            <p className="text-[10px] text-text-muted italic border-t border-success/10 pt-2 mt-1">"{selectedCandidate.workSampleGrade.feedback}"</p>
                          )}
                        </div>
                      )}

                      <div className="mt-4 p-4 rounded bg-bg/50 border border-accent/10">
                        <h4 className="font-mono text-[10px] uppercase tracking-wider text-accent mb-3">Reviewer Scoring Guide</h4>
                        <div className="space-y-3 text-xs">
                          <div>
                            <div className="text-text-muted uppercase tracking-wider mb-1.5 text-[10px]">Composite Decision Thresholds</div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0"></span><span className="text-text"><strong>0.75 – 1.00:</strong> Proceed to interview. Strong signal across multiple factors.</span></div>
                              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0"></span><span className="text-text"><strong>0.60 – 0.74:</strong> Human review required. Check which factor is dragging the score.</span></div>
                              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-danger flex-shrink-0"></span><span className="text-text"><strong>&lt; 0.60:</strong> Likely reject. Significant gaps in skill, context, or evidence quality.</span></div>
                            </div>
                          </div>
                          <div className="border-t border-accent/10 pt-3">
                            <div className="text-text-muted uppercase tracking-wider mb-1.5 text-[10px]">What Each Factor Measures</div>
                            <div className="space-y-1 text-text-secondary">
                              <div><strong className="text-text">Semantic (40%):</strong> How closely the candidate's narrative aligns with the role's domain and language.</div>
                              <div><strong className="text-text">Skill Coverage (25%):</strong> Proportion of non-negotiable required skills found in their extracted evidence.</div>
                              <div><strong className="text-employer-accent">Verification (20%):</strong> Work sample assessment score — the only independently tested signal. A low score here means claims are unverified.</div>
                              <div><strong className="text-text">Context Fit (15%):</strong> Match between candidate's preferred working style and the team's structure and pace.</div>
                            </div>
                          </div>
                          <div className="border-t border-accent/10 pt-3">
                            <div className="text-text-muted uppercase tracking-wider mb-1.5 text-[10px]">Red Flag Signals</div>
                            <div className="space-y-1 text-text-secondary">
                              <div><strong className="text-danger">High semantic + low verification:</strong> Candidate may be keyword-optimising. Prioritise work sample score.</div>
                              <div><strong className="text-danger">High verification + low skill coverage:</strong> Strong performer but skills don't map to this role specifically.</div>
                              <div><strong className="text-accent">Low context fit:</strong> May underperform regardless of skill — worth probing in interview.</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-4 rounded bg-employer-surface border border-employer-accent/20">
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