import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jobs, normalJobs } from '../data/mockData';

function generateQuestionsForRole(role) {
  return [
    {
      id: 'q1',
      question: `Tell me about your proudest achievement in ${role} work. What was the specific problem, what did you personally do, and what was the measurable outcome?`,
    },
    {
      id: 'q2',
      question: `Describe the most complex challenge you've tackled as a ${role}. Walk me through your approach, the tools or methods you relied on, and the result.`,
    },
    {
      id: 'q3',
      question: `What specific tools, technologies, or frameworks do you consider yourself strongest in as a ${role}? Give a concrete example of how you applied them to solve a real problem.`,
    },
    {
      id: 'q4',
      question: `What kind of team and work environment brings out your best as a ${role}? Think about team size, pace, autonomy, and how decisions get made.`,
    },
    {
      id: 'q5',
      question: `Tell me about a time something you owned as a ${role} went wrong or underperformed. What happened, what was your role in it, and what did you do differently after?`,
    },
    {
      id: 'q6',
      question: `Where are you taking your ${role} career over the next 2 years? What kinds of work or environments are you moving toward — and what are you actively stepping away from?`,
    },
  ];
}

function calculateJobMatch(profile, jobItem, roleInput) {
  if (!profile || !profile.skills) return 0;
  const candidateSkills = profile.skills.map(s => s.name.toLowerCase());

  // Role relevance — computed first as it gates everything else
  const roleWords = roleInput.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const jobText = `${jobItem.title} ${jobItem.department || ''} ${jobItem.description || ''}`.toLowerCase();
  const matchedWords = roleWords.filter(w => jobText.includes(w));
  const roleRelevance = roleWords.length > 0 ? matchedWords.length / roleWords.length : 0;

  const avgConf = profile.skills.length > 0
    ? profile.skills.reduce((sum, s) => sum + (s.confidence || 0), 0) / profile.skills.length
    : 0.5;
  const semantic = Math.min(0.99, (avgConf * 0.8) + 0.15);

  const hasSkillReqs = jobItem.required_skills && jobItem.required_skills.filter(s => s.non_negotiable).length > 0;

  if (hasSkillReqs) {
    const required = jobItem.required_skills.filter(s => s.non_negotiable).map(s => s.name.toLowerCase());
    const isMatch = (req) => {
      const words = req.split(/\s+/).filter(w => w.length > 3);
      return words.some(w => candidateSkills.some(s => s.includes(w))) || candidateSkills.some(s => s.includes(req));
    };
    const skillCoverage = required.filter(isMatch).length / required.length;
    // Completely unrelated job — no skills match AND role doesn't match
    if (skillCoverage === 0 && roleRelevance === 0) return Math.round(semantic * 0.08 * 100);
    const raw = (skillCoverage * 0.45) + (semantic * 0.35) + (roleRelevance * 0.20);
    return Math.round(Math.min(raw, 0.99) * 100);
  }

  // For normal jobs without required_skills: role relevance gates the score.
  // If completely unrelated (roleRelevance = 0), score stays very low.
  if (roleRelevance === 0) return Math.round(semantic * 0.10 * 100);
  const raw = (semantic * 0.55) + (roleRelevance * 0.45);
  return Math.round(Math.min(raw, 0.99) * 100);
}

export default function UserJourney() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const postedPremiumJobs = JSON.parse(localStorage.getItem('careesOS_premium_jobs') || '[]');
  const allJobs = [...jobs, ...normalJobs, ...postedPremiumJobs];

  const [roleInput, setRoleInput] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLog, setProcessingLog] = useState('');
  const [profile, setProfile] = useState(null);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });
  const [workSampleAnswer, setWorkSampleAnswer] = useState('');
  const [workSampleGrade, setWorkSampleGrade] = useState(null);
  const [compositeScore, setCompositeScore] = useState(null);

  // Step 1 → 2
  const handleRoleSubmit = (e) => {
    e.preventDefault();
    if (!roleInput.trim()) return;
    setQuestions(generateQuestionsForRole(roleInput.trim()));
    setAnswers({});
    setStep(2);
  };

  // Step 2 → 3: extract profile then calculate matches
  const handleAnswersSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setProcessingLog('Sending your answers to AI for profile extraction...');
    try {
      const res = await fetch('/api/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        const extracted = {
          skills: result.data.skills.map(s => ({ ...s, verified: false, verified_score: null })),
          work_context: result.data.work_context || {},
          goals: result.data.goals || {},
          soft_signals: result.data.soft_signals || {},
          red_flags: result.data.red_flags || [],
        };
        setProfile(extracted);
        setProcessingLog('Calculating your best job matches...');
        const allScored = allJobs
          .map(j => ({ ...j, matchPct: calculateJobMatch(extracted, j, roleInput) }))
          .sort((a, b) => b.matchPct - a.matchPct);
        // Only show jobs above 25% — never pad with unrelated roles
        const relevant = allScored.filter(j => j.matchPct >= 25).slice(0, 3);
        const scored = relevant.length > 0 ? relevant : allScored.slice(0, 1);
        setMatchedJobs(scored);
        setStep(3);
      } else {
        const reason = result.error || 'Unknown error';
        alert(`Failed to extract profile: ${reason}\n\nCheck that DEEPSEEK_API_KEY is set in your .env file and restart the dev server.`);
      }
    } catch (err) {
      console.error(err);
      alert(`Network error: ${err.message}\n\nMake sure the Vite dev server is running (npm run dev).`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3 → 4: grade work sample and compute composite score
  const handleWorkSampleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setProcessingLog('Grading your work sample with AI...');
    try {
      const task = selectedJob.work_sample_task || selectedJob.work_sample?.title || 'Complete the assigned task';
      const res = await fetch('/api/grade-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: workSampleAnswer, task }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setWorkSampleGrade(result.data);
        const avgConf = profile.skills.length > 0
          ? profile.skills.reduce((sum, s) => sum + (s.confidence || 0), 0) / profile.skills.length
          : 0.5;
        const semanticRaw = Math.min(0.99, (avgConf * 0.8) + 0.15);
        const candidateSkills = profile.skills.map(s => s.name.toLowerCase());
        let skillCoverageRaw = 0.5;
        if (selectedJob.required_skills) {
          const required = selectedJob.required_skills.filter(s => s.non_negotiable).map(s => s.name.toLowerCase());
          if (required.length > 0) {
            const isMatch = (req) => {
              const words = req.split(/\s+/).filter(w => w.length > 3);
              return words.some(w => candidateSkills.some(s => s.includes(w))) || candidateSkills.some(s => s.includes(req));
            };
            skillCoverageRaw = required.filter(isMatch).length / required.length;
          }
        }
        const verificationRaw = result.data.normalised_score || 0;
        const contextFitRaw = profile.work_context?.preferred_pace ? 0.70 : 0.40;
        const composite = (semanticRaw * 0.40) + (skillCoverageRaw * 0.25) + (verificationRaw * 0.20) + (contextFitRaw * 0.15);
        setCompositeScore({
          composite: composite.toFixed(3),
          semantic: (semanticRaw * 0.40).toFixed(3),
          skillCoverage: (skillCoverageRaw * 0.25).toFixed(3),
          verification: (verificationRaw * 0.20).toFixed(3),
          contextFit: (contextFitRaw * 0.15).toFixed(3),
          semanticRaw: semanticRaw.toFixed(2),
          skillCoverageRaw: skillCoverageRaw.toFixed(2),
          verificationRaw: verificationRaw.toFixed(2),
          contextFitRaw: contextFitRaw.toFixed(2),
        });
        setStep(5);
      } else {
        alert(`Failed to grade work sample: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Network error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 5 → 6: save application
  const handleContactSubmit = (e) => {
    e.preventDefault();
    const avgConf = profile.skills.length > 0
      ? profile.skills.reduce((s, sk) => s + (sk.confidence || 0), 0) / profile.skills.length
      : 0.5;
    const application = {
      id: `live-${Date.now()}`,
      name: contactInfo.name,
      email: contactInfo.email,
      phone: contactInfo.phone,
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      roleInput,
      skills: profile.skills,
      work_context: profile.work_context,
      goals: profile.goals,
      soft_signals: profile.soft_signals,
      red_flags: profile.red_flags,
      workSampleGrade: workSampleGrade || null,
      matchScore: compositeScore || { composite: (selectedJob.matchPct / 100).toFixed(3) },
      submittedAt: new Date().toISOString(),
      embedding_mock: [avgConf, Math.min(1, profile.skills.length / 10), 0, avgConf * 0.9],
    };
    const existing = JSON.parse(localStorage.getItem('careesOS_applications') || '[]');
    localStorage.setItem('careesOS_applications', JSON.stringify([...existing, application]));
    setStep(6);
  };

  const resetAll = () => {
    setStep(1); setRoleInput(''); setQuestions([]); setAnswers({});
    setProfile(null); setMatchedJobs([]); setSelectedJob(null);
    setContactInfo({ name: '', email: '', phone: '' });
    setWorkSampleAnswer(''); setWorkSampleGrade(null); setCompositeScore(null);
  };

  const matchColor = (pct) =>
    pct >= 75 ? 'bg-success/10 border-success/30 text-success' :
    pct >= 50 ? 'bg-accent/10 border-accent/30 text-accent' :
    'bg-elevated border-highlight text-text-muted';

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 py-3 border-b border-accent/10 flex-shrink-0 bg-surface/30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-xs text-text-muted hover:text-text transition-colors">← Home</button>
          <span className="text-text-muted text-xs">|</span>
          <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent">[T] Career OS V2</span>
          <span className="text-text-muted text-xs">·</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-accent/10 text-accent border border-accent/30">PREMIUM</span>
          <span className="text-xs text-text-secondary">Applicant</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-bg p-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Role Input ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 1 · Get Started</span>
                  <h2 className="font-display text-2xl text-text mt-1">What role are you looking for?</h2>
                  <p className="text-text-secondary text-sm mt-1">
                    Tell us the role you're targeting. We'll generate 6 tailored questions to build your verified skills profile — then match you to the top 3 relevant jobs.
                  </p>
                </div>

                <form onSubmit={handleRoleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Target Role <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={roleInput}
                      onChange={e => setRoleInput(e.target.value)}
                      placeholder="e.g. DevOps Engineer, HR Business Partner, Operations Manager..."
                      className="w-full bg-surface border border-accent/20 rounded-lg px-4 py-3 text-text text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted"
                    />
                    <p className="text-[10px] text-text-muted mt-1.5">Be specific — the more detail you give, the better your questions will be.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={!roleInput.trim()}
                    className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Generate My Questions →
                  </button>
                </form>

                <div className="p-4 rounded-lg bg-surface border border-accent/10 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-accent">How this works</div>
                  {[
                    { n: '01', t: 'Answer 6 narrative questions tailored to your exact role' },
                    { n: '02', t: 'AI extracts a verified skills profile from your answers (Layer 1)' },
                    { n: '03', t: 'See your top 3 matching jobs with a Layer 1 match score' },
                    { n: '04', t: 'Complete a role-specific work sample task — graded by AI (Layer 2)' },
                    { n: '05', t: 'Submit contact details — final composite score (L1 + L2) is saved' },
                  ].map(item => (
                    <div key={item.n} className="flex items-start gap-3">
                      <span className="font-mono text-[10px] text-accent/40 mt-0.5 w-5 flex-shrink-0">{item.n}</span>
                      <span className="text-xs text-text-secondary">{item.t}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Dynamic Questions ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div>
                  <button onClick={() => setStep(1)} className="text-xs text-accent hover:text-accent-hover mb-4 flex items-center gap-1">← Back</button>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 2 · Profile Questions</span>
                  <h2 className="font-display text-2xl text-text mt-1">Your {roleInput} Profile</h2>
                  <p className="text-text-secondary text-sm mt-1">
                    Answer honestly and specifically. The AI extracts only what is directly evidenced — vague answers produce a weaker match score.
                  </p>
                </div>

                <form onSubmit={handleAnswersSubmit} className="space-y-5">
                  {questions.map((q, i) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <label className="block text-sm font-medium text-text mb-2">
                        <span className="text-accent/50 font-mono text-[10px] mr-2">{String(i + 1).padStart(2, '0')}</span>
                        {q.question} <span className="text-danger">*</span>
                      </label>
                      <textarea
                        required
                        minLength={30}
                        className="w-full h-24 bg-surface border border-accent/20 rounded-lg p-3 text-text text-sm focus:outline-none focus:border-accent transition-colors resize-none"
                        placeholder="Be specific — describe what you actually did, not what you know in theory..."
                        value={answers[q.id] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      />
                      <p className="text-[10px] text-text-muted mt-1">Min. 30 characters required.</p>
                    </motion.div>
                  ))}

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? 'Finding your best matches...' : 'Find My Job Matches →'}
                  </button>
                  {isProcessing && (
                    <div className="p-3 rounded bg-bg/50 border border-accent/20 font-mono text-xs text-accent animate-pulse text-center">
                      {processingLog}
                    </div>
                  )}
                </form>
              </motion.div>
            )}

            {/* ── STEP 3: Matched Jobs ── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-success">Step 3 · Your Matches</span>
                  <h2 className="font-display text-2xl text-text mt-1">Top 3 Jobs For You</h2>
                  <p className="text-text-secondary text-sm mt-1">
                    Matched against your AI-extracted profile for <span className="text-accent font-medium">{roleInput}</span>. Click Apply on any role to proceed.
                  </p>
                </div>

                <div className="space-y-3">
                  {matchedJobs.map((j, i) => (
                    <motion.div
                      key={j.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-5 rounded-xl bg-surface border border-accent/15 hover:border-accent/35 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-accent">{j.department}</span>
                            {j.premium
                              ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-accent/10 text-accent border border-accent/30">PREMIUM</span>
                              : <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-elevated text-text-muted">Standard</span>
                            }
                          </div>
                          <h3 className="text-base font-medium text-text">{j.title}</h3>
                          <p className="text-xs text-text-secondary mt-0.5">{j.type}</p>
                          {j.required_skills && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {j.required_skills.filter(s => s.non_negotiable).slice(0, 3).map(s => (
                                <span key={s.name} className="px-2 py-0.5 rounded text-[10px] bg-accent/10 text-accent">{s.name}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg border ${matchColor(j.matchPct)}`}>
                            <span className="text-lg font-bold leading-none">{j.matchPct}%</span>
                            <span className="text-[9px] font-mono uppercase tracking-wider opacity-80">match</span>
                          </div>
                          <button
                            onClick={() => { setSelectedJob(j); setWorkSampleAnswer(''); setWorkSampleGrade(null); setCompositeScore(null); setStep(j.work_sample ? 4 : 5); }}
                            className="px-4 py-1.5 rounded-lg bg-accent text-bg text-xs font-medium hover:bg-accent-hover transition-colors"
                          >
                            Apply →
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {profile?.skills?.length > 0 && (
                  <div className="p-4 rounded-lg bg-surface border border-accent/10">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Your Extracted Profile</div>
                    <div className="space-y-1.5">
                      {profile.skills.slice(0, 5).map((skill, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-accent/5 last:border-0">
                          <span className="text-text capitalize">{skill.name}</span>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-text-muted capitalize">{skill.inferred_level}</span>
                            <span className="font-mono text-accent">{(skill.confidence * 100).toFixed(0)}% conf</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {profile.red_flags?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-danger/10 space-y-1">
                        {profile.red_flags.map((f, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[10px] text-danger">
                            <span>⚠</span><span>{f.detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 4: Work Sample ── */}
            {step === 4 && selectedJob?.work_sample && (
              <motion.div key="s4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div>
                  <button onClick={() => setStep(3)} className="text-xs text-accent hover:text-accent-hover mb-4 flex items-center gap-1">← Back to matches</button>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 4 · Work Sample</span>
                  <h2 className="font-display text-2xl text-text mt-1">Verify Your Skills</h2>
                  <p className="text-text-secondary text-sm mt-1">
                    Complete this task for <span className="text-accent font-medium">{selectedJob.title}</span>. Your answer is graded by AI — this becomes your Layer 2 verification score and boosts your composite match.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-surface border border-accent/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text">{selectedJob.work_sample.title}</span>
                    <span className="text-[10px] font-mono text-text-muted bg-elevated px-2 py-0.5 rounded">{selectedJob.work_sample.time_limit}</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{selectedJob.work_sample.context}</p>
                  <ol className="space-y-1.5">
                    {selectedJob.work_sample.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                        <span className="text-accent font-mono text-[10px] mt-0.5 flex-shrink-0">{i + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {selectedJob.work_sample.artifact && (
                  <div className="rounded-lg bg-bg border border-accent/10 overflow-hidden">
                    <div className="px-3 py-2 border-b border-accent/10 flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Reference Material</span>
                      <span className="text-[10px] font-mono text-accent">{selectedJob.work_sample.artifact_type}</span>
                    </div>
                    <pre className="p-3 text-xs text-text-secondary font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">{selectedJob.work_sample.artifact}</pre>
                  </div>
                )}

                <form onSubmit={handleWorkSampleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Your Answer <span className="text-danger">*</span></label>
                    <textarea
                      required
                      minLength={50}
                      rows={8}
                      className="w-full bg-surface border border-accent/20 rounded-lg p-3 text-text text-sm focus:outline-none focus:border-accent transition-colors resize-none"
                      placeholder={selectedJob.work_sample.placeholder || 'Write your detailed answer here...'}
                      value={workSampleAnswer}
                      onChange={e => setWorkSampleAnswer(e.target.value)}
                    />
                    <p className="text-[10px] text-text-muted mt-1">Min. 50 characters. Be specific — this is graded by AI.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing || workSampleAnswer.length < 50}
                    className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? 'Grading your submission...' : 'Submit Work Sample →'}
                  </button>
                  {isProcessing && (
                    <div className="p-3 rounded bg-bg/50 border border-accent/20 font-mono text-xs text-accent animate-pulse text-center">
                      {processingLog}
                    </div>
                  )}
                </form>
              </motion.div>
            )}

            {/* ── STEP 5: Contact Details ── */}
            {step === 5 && selectedJob && (
              <motion.div key="s5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div>
                  <button onClick={() => setStep(selectedJob.work_sample ? 4 : 3)} className="text-xs text-accent hover:text-accent-hover mb-4 flex items-center gap-1">← Back</button>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Final Step · Your Details</span>
                  <h2 className="font-display text-2xl text-text mt-1">Applying for {selectedJob.title}</h2>
                  <p className="text-text-secondary text-sm mt-1">
                    Your contact details will only be shared with the hiring team if you're shortlisted.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-surface border border-accent/10">
                  <div>
                    <div className="text-[10px] text-text-muted font-mono uppercase mb-0.5">{selectedJob.department}</div>
                    <div className="text-sm font-medium text-text">{selectedJob.title}</div>
                    <div className="text-xs text-text-secondary">{selectedJob.type}</div>
                  </div>
                  {compositeScore ? (
                    <div className="flex flex-col items-center px-3 py-1.5 rounded-lg border bg-success/10 border-success/30 text-success">
                      <span className="text-xl font-bold leading-none">{(Number(compositeScore.composite) * 100).toFixed(0)}%</span>
                      <span className="text-[9px] font-mono uppercase tracking-wider opacity-80">composite</span>
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg border ${matchColor(selectedJob.matchPct)}`}>
                      <span className="text-xl font-bold leading-none">{selectedJob.matchPct}%</span>
                      <span className="text-[9px] font-mono uppercase tracking-wider opacity-80">match</span>
                    </div>
                  )}
                </div>

                {compositeScore && (
                  <div className="p-4 rounded-lg bg-surface border border-accent/10 space-y-2">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-accent mb-1">Layer 1 + Layer 2 Score Breakdown</div>
                    {[
                      { label: 'Semantic (×0.40)', raw: compositeScore.semanticRaw, weighted: compositeScore.semantic },
                      { label: 'Skill Coverage (×0.25)', raw: compositeScore.skillCoverageRaw, weighted: compositeScore.skillCoverage },
                      { label: 'Verification (×0.20)', raw: compositeScore.verificationRaw, weighted: compositeScore.verification },
                      { label: 'Context Fit (×0.15)', raw: compositeScore.contextFitRaw, weighted: compositeScore.contextFit },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between text-xs py-1 border-b border-accent/5 last:border-0">
                        <span className="text-text-secondary">{row.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-text-muted">{(row.raw * 100).toFixed(0)}%</span>
                          <span className="font-mono text-accent w-12 text-right">{row.weighted}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-accent/10">
                      <span className="text-sm font-medium text-text">Composite Score</span>
                      <span className="font-mono text-success text-lg font-bold">{(Number(compositeScore.composite) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Full Name <span className="text-danger">*</span></label>
                    <input
                      type="text" required autoFocus
                      value={contactInfo.name}
                      onChange={e => setContactInfo(p => ({ ...p, name: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full bg-surface border border-accent/20 rounded-lg px-3 py-2.5 text-text text-sm focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Email Address <span className="text-danger">*</span></label>
                    <input
                      type="email" required
                      value={contactInfo.email}
                      onChange={e => setContactInfo(p => ({ ...p, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full bg-surface border border-accent/20 rounded-lg px-3 py-2.5 text-text text-sm focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Phone Number <span className="text-danger">*</span></label>
                    <input
                      type="tel" required
                      value={contactInfo.phone}
                      onChange={e => setContactInfo(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+60 12-345 6789"
                      className="w-full bg-surface border border-accent/20 rounded-lg px-3 py-2.5 text-text text-sm focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!contactInfo.name || !contactInfo.email || !contactInfo.phone}
                    className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit Application →
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── STEP 6: Submitted ── */}
            {step === 6 && (
              <motion.div key="s6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 text-center py-12">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                  <span className="text-3xl">✓</span>
                </div>
                <div>
                  <h2 className="font-display text-3xl text-text mb-2">Application Submitted</h2>
                  <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
                    Your AI-extracted profile is now in the reviewer queue for{' '}
                    <span className="text-accent font-medium">{selectedJob?.title}</span>.
                  </p>
                </div>

                <div className="p-5 rounded-lg bg-surface border border-accent/10 max-w-sm mx-auto text-left space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-accent mb-2">What happens next</div>
                  {[
                    'The hiring manager reviews your AI-extracted skills profile.',
                    'If shortlisted, they will contact you at the email you provided.',
                    'Your answers — not a resume — determined your match score.',
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-accent text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                      <p className="text-xs text-text-secondary">{text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={resetAll} className="px-6 py-2.5 rounded-lg bg-elevated text-text text-sm font-medium hover:bg-highlight transition-colors">
                    Start New Application
                  </button>
                  <button onClick={() => navigate('/')} className="px-6 py-2.5 rounded-lg bg-elevated text-text text-sm font-medium hover:bg-highlight transition-colors">
                    Back to Home
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}