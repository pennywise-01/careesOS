import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jobs, normalJobs } from '../data/mockData';

export default function UserJourney() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Merge premium seed jobs + locally posted premium jobs from localStorage
  const postedPremiumJobs = JSON.parse(localStorage.getItem('careesOS_premium_jobs') || '[]');
  const allJobs = [...jobs, ...normalJobs, ...postedPremiumJobs];
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Application State
  const [answers, setAnswers] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  const [assessmentAnswer, setAssessmentAnswer] = useState('');
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });
  
  // Backend/AI State
  const [profile, setProfile] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [weights, setWeights] = useState({ semantic: 0.40, skill_coverage: 0.25, verification: 0.20, context_fit: 0.15 });
  const [outcome, setOutcome] = useState(null);
  const [processingLog, setProcessingLog] = useState("");

  const handleAnswerChange = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setResumeFile(e.target.files[0].name);
    }
  };

  // Step 2 -> 3: LLM Extraction
  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setProcessingLog("Sending narrative to DeepSeek LLM for structured extraction...");

    try {
      const response = await fetch('/api/extract-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });

      const result = await response.json();
      if (result.success && result.data) {
        setProfile({
          name: "Candidate",
          skills: result.data.skills.map(s => ({ ...s, verified: false, verified_score: null })),
          work_context: result.data.work_context || {},
          goals: result.data.goals || {},
          soft_signals: result.data.soft_signals || {},
          red_flags: result.data.red_flags || []
        });
        setStep(4);
      } else {
        alert("Failed to extract profile. Please try again.");
      }
    } catch (error) {
      console.error("Backend API Error:", error);
      alert("Error calling backend. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 4: Skill Verification
  const handleAssessmentSubmit = async () => {
    setIsProcessing(true);
    setProcessingLog("Sending submission to DeepSeek for grading...");
    try {
      const task = selectedJob.work_sample_task;
      const response = await fetch('/api/grade-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: assessmentAnswer, task })
      });
      const result = await response.json();
      if (result.success && result.data) {
        const g = result.data;
        const newAssessment = {
          task_completion: g.task_completion,
          technical_accuracy: g.technical_accuracy,
          work_quality: g.work_quality,
          communication: g.communication,
          raw_score: ((g.task_completion + g.technical_accuracy + g.work_quality + g.communication) / 4),
          normalised_score: g.normalised_score,
          feedback: g.feedback
        };
        setAssessment(newAssessment);
        setProfile(prev => ({
          ...prev,
          skills: prev.skills.map(s => ({ ...s, verified: true, verified_score: g.normalised_score }))
        }));
        setProcessingLog("Grading complete. Profile updated.");
      } else {
        alert("Failed to grade assessment. Please try again.");
      }
    } catch (error) {
      console.error('Assessment grading error:', error);
      alert("Error grading assessment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 5: Dynamic Matching Calculation
  const calculateMatch = () => {
    if (!profile) return null;

    const requiredSkills = selectedJob.required_skills.filter(s => s.non_negotiable).map(s => s.name.toLowerCase());
    const candidateSkills = profile.skills.map(s => s.name.toLowerCase());
    const skillMatches = (req, extracted) => {
      const words = req.split(/\s+/).filter(w => w.length > 3);
      return words.some(w => extracted.some(s => s.includes(w))) || extracted.some(s => s.includes(req));
    };
    const matchedSkills = requiredSkills.filter(req => skillMatches(req, candidateSkills));
    const skillCoverage = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 0;

    let contextMatches = 0;
    let contextTotal = 0;
    if (profile.work_context?.preferred_pace && selectedJob.team_context?.pace) {
      contextTotal++;
      if (profile.work_context.preferred_pace === selectedJob.team_context.pace) contextMatches++;
    }
    if (profile.work_context?.autonomy_level && selectedJob.team_context?.autonomy_offered) {
      contextTotal++;
      if (profile.work_context.autonomy_level === selectedJob.team_context.autonomy_offered) contextMatches++;
    }
    const contextFit = contextTotal > 0 ? contextMatches / contextTotal : 0.5;

    const verification = assessment ? assessment.normalised_score : 0.0;

    const avgConfidence = profile.skills.length > 0 
      ? profile.skills.reduce((sum, s) => sum + s.confidence, 0) / profile.skills.length 
      : 0.5;
    const semantic = Math.min(0.99, (avgConfidence * 0.8) + 0.15);

    return {
      semanticRaw: semantic.toFixed(2),
      skillCoverageRaw: skillCoverage.toFixed(2),
      verificationRaw: verification.toFixed(2),
      contextFitRaw: contextFit.toFixed(2),
      semantic: (semantic * weights.semantic).toFixed(3),
      skillCoverage: (skillCoverage * weights.skill_coverage).toFixed(3),
      verification: (verification * weights.verification).toFixed(3),
      contextFit: (contextFit * weights.context_fit).toFixed(3),
      composite: (
        (semantic * weights.semantic) +
        (skillCoverage * weights.skill_coverage) +
        (verification * weights.verification) +
        (contextFit * weights.context_fit)
      ).toFixed(3)
    };
  };

  const matchScore = calculateMatch();

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
        <button onClick={() => navigate('/reviewer/premium')} className="text-sm font-medium px-4 py-2 rounded-lg bg-employer-accent text-bg hover:opacity-90 transition-colors">
          Reviewer Dashboard →
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-bg p-6">
          <div className="max-w-4xl mx-auto">
            
            <AnimatePresence mode="wait">
              {/* STEP 1: Job Selection */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 1 · Job Discovery</span>
                    <h2 className="font-display text-2xl text-text mt-1">All Available Roles</h2>
                    <p className="text-text-secondary text-sm mt-1">Premium jobs use AI-graded work samples. Standard jobs use a quick questions-and-resume flow.</p>
                  </div>
                  <div className="space-y-3">
                    {allJobs.map(j => (
                      <div
                        key={j.id}
                        className="p-6 rounded-lg bg-surface border border-accent/20 hover:border-accent/40 transition-all cursor-pointer group"
                        onClick={() => {
                          if (!j.premium) {
                            navigate('/apply/normal', { state: { preselectedJob: j } });
                          } else {
                            setSelectedJob(j);
                            setStep(2);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-[10px] font-mono uppercase tracking-wider text-accent">{j.department}</div>
                              {j.premium
                                ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-accent/10 text-accent border border-accent/30">PREMIUM</span>
                                : <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-elevated text-text-muted">Standard</span>
                              }
                            </div>
                            <h3 className="text-lg font-medium text-text">{j.title}</h3>
                            <p className="text-sm text-text-secondary mt-1">{j.type}</p>
                            {j.premium && j.required_skills && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {j.required_skills.map(s => (
                                  <span key={s.name} className={`px-2 py-1 rounded text-xs ${s.non_negotiable ? 'bg-accent/10 text-accent' : 'bg-elevated text-text-muted'}`}>
                                    {s.name} ({s.level}){s.non_negotiable && ' ✱'}
                                  </span>
                                ))}
                              </div>
                            )}
                            {!j.premium && (
                              <p className="text-xs text-text-muted mt-2 italic">Quick apply — resume + {j.generic_questions?.length || 0} screening questions</p>
                            )}
                          </div>
                          <span className="text-accent text-xl group-hover:translate-x-1 transition-transform ml-4">→</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Job Detail */}
              {step === 2 && selectedJob && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <button onClick={() => setStep(1)} className="text-xs text-accent hover:text-accent-hover transition-colors flex items-center gap-1">← Back to all roles</button>
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent">{selectedJob.department} · {selectedJob.type}</span>
                    <h2 className="font-display text-3xl text-text mt-1">{selectedJob.title}</h2>
                  </div>

                  <div className="p-5 rounded-lg bg-surface border border-accent/10 space-y-4">
                    <div>
                      <h3 className="font-mono text-[10px] uppercase tracking-wider text-accent mb-2">About the Role</h3>
                      <p className="text-text-secondary text-sm leading-relaxed">{selectedJob.description}</p>
                    </div>
                    <div className="border-t border-accent/10 pt-4">
                      <h3 className="font-mono text-[10px] uppercase tracking-wider text-accent mb-3">Requirements</h3>
                      <ul className="space-y-2">
                        {selectedJob.requirements.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                            <span className="text-accent mt-0.5 flex-shrink-0">→</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border-t border-accent/10 pt-4">
                      <h3 className="font-mono text-[10px] uppercase tracking-wider text-accent mb-2">About the Company</h3>
                      <p className="text-text-secondary text-sm leading-relaxed">{selectedJob.about_company}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-employer-surface border border-employer-accent/20 text-sm text-text-secondary">
                    <span className="text-employer-accent font-medium">How this application works: </span>
                    You will answer 6 narrative questions, complete a short work sample task, and our AI will build a verified skills profile — no keyword-matching against your resume.
                  </div>

                  <button onClick={() => setStep(3)} className="w-full py-4 rounded-lg bg-accent text-bg font-medium text-base hover:bg-accent-hover transition-colors">
                    Apply for {selectedJob.title} →
                  </button>
                </motion.div>
              )}

              {/* STEP 3: Guided Questionnaire */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 3 · Candidate Profile Pipeline</span>
                    <h2 className="font-display text-2xl text-text mt-1">Guided Narrative Questionnaire</h2>
                    <p className="text-text-secondary text-sm mt-1">Answer these 6 open-ended questions for the <strong className="text-accent">{selectedJob?.title}</strong> role. Our AI evaluates your narrative to extract real evidence, preventing keyword stuffing.</p>
                  </div>

                  {/* Evaluation Legend */}
                  <div className="p-4 rounded-lg bg-surface border border-accent/10">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-3">How Your Application is Evaluated</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-text mb-1">What the AI Looks For:</div>
                        <ul className="list-disc list-inside text-text-secondary space-y-1 text-xs">
                          <li><strong className="text-text">Concrete Evidence:</strong> Verbatim quotes of what you actually built or solved.</li>
                          <li><strong className="text-text">Work Context:</strong> Team size, pace, and autonomy preferences.</li>
                          <li><strong className="text-text">Career Goals:</strong> Direction you're heading and what you want to avoid.</li>
                          <li><strong className="text-danger">Red Flags:</strong> Vague answers, keyword stuffing, or inconsistencies.</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium text-text mb-1">Composite Score Ranges:</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-success"></span><span className="text-text"><strong>0.75 – 1.00 (Strong):</strong> Fast-track to interview.</span></div>
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-accent"></span><span className="text-text"><strong>0.60 – 0.74 (Marginal):</strong> Manual review or assessment required.</span></div>
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-danger"></span><span className="text-text"><strong>&lt; 0.60 (Reject):</strong> Significant skill or context gaps.</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitApplication} className="space-y-6">
                    {selectedJob?.questionnaire.map((q) => (
                      <div key={q.id}>
                        <label className="block text-sm font-medium text-text mb-2">
                          {q.question} <span className="text-danger">*</span>
                        </label>
                        <textarea 
                          required
                          minLength={30}
                          name={q.id}
                          className="w-full h-24 bg-surface border border-accent/20 rounded-lg p-3 text-text text-sm focus:outline-none focus:border-accent transition-colors"
                          placeholder="Provide specific details, outcomes, and your personal contribution..."
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        />
                        <p className="text-[10px] text-text-muted mt-1">Minimum 30 characters required to ensure meaningful context.</p>
                      </div>
                    ))}

                    <div className="p-4 rounded-lg bg-employer-surface border border-employer-accent/20">
                      <label className="block text-sm font-medium text-employer-accent mb-2">Attach Resume (Optional)</label>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-elevated file:text-employer-accent hover:file:bg-highlight" />
                      {resumeFile && <p className="text-xs text-success mt-2">✓ {resumeFile} attached.</p>}
                      <p className="text-[10px] text-text-muted mt-2 italic">
                        Note: This resume is forwarded to the hiring manager for human review only. It is <strong>NOT</strong> parsed by our matching AI to prevent keyword bias and ensure fair evaluation based on your narrative answers.
                      </p>
                    </div>

                    <button type="submit" disabled={isProcessing} className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-50">
                      {isProcessing ? 'Processing with DeepSeek LLM...' : 'Submit Application & Extract Profile →'}
                    </button>
                    {isProcessing && (
                      <div className="p-3 rounded bg-bg/50 border border-accent/20 font-mono text-xs text-accent animate-pulse text-center">
                        {processingLog}
                      </div>
                    )}
                  </form>
                </motion.div>
              )}

              {/* STEP 4: LLM Extracted Profile Review */}
              {step === 4 && profile && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-success">Step 4 Complete · LLM Extraction Successful</span>
                    <h2 className="font-display text-2xl text-text mt-1">Your Structured Profile</h2>
                    <p className="text-text-secondary text-sm mt-1">This is exactly what the hiring system sees. No keywords were stuffed; only evidence-based claims were extracted.</p>
                  </div>

                  <div className="p-4 rounded-lg bg-surface border border-accent/10 space-y-4">
                    <div>
                      <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-2">Extracted Skills & Evidence</h3>
                      {profile.skills.map((skill, idx) => (
                        <div key={idx} className="p-3 rounded bg-bg/50 border border-accent/5 mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-text font-medium capitalize">{skill.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-elevated text-text-muted text-[10px] font-medium uppercase">
                              {skill.inferred_level} · {(skill.confidence * 100).toFixed(0)}% Confidence
                            </span>
                          </div>
                          <div className="text-xs text-text-secondary italic">"{skill.evidence_quote}"</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded bg-bg/50 border border-accent/5">
                        <h4 className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-1">Work Context</h4>
                        <p className="text-sm text-text">Pace: {profile.work_context.preferred_pace || 'N/A'}</p>
                        <p className="text-sm text-text">Autonomy: {profile.work_context.autonomy_level || 'N/A'}</p>
                      </div>
                      <div className="p-3 rounded bg-bg/50 border border-accent/5">
                        <h4 className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-1">Career Goals</h4>
                        <p className="text-sm text-text">Direction: {profile.goals.direction || 'N/A'}</p>
                        <p className="text-sm text-danger">Avoids: {profile.goals.anti_preferences?.join(', ') || 'None'}</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setStep(5)} className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors">
                    Proceed to Skill Verification (Layer 2) →
                  </button>
                </motion.div>
              )}

              {/* STEP 5: Skill Verification */}
              {step === 5 && profile && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-employer-accent">Layer 2 · Skill Verification</span>
                    <h2 className="font-display text-2xl text-text mt-1">Work Sample Assessment</h2>
                    <p className="text-text-secondary text-sm mt-1">To verify your claims, complete this parameterized task. Your approach and reasoning are graded, not just the final output.</p>
                  </div>

                  {!assessment ? (
                    <div className="space-y-4">
                      <div className="p-5 rounded-lg bg-employer-surface border border-employer-accent/20">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium text-employer-accent">{selectedJob?.work_sample.title}</h3>
                          <span className="px-2 py-1 rounded bg-elevated text-[10px] text-text-muted font-mono">Time limit: {selectedJob?.work_sample.time_limit}</span>
                        </div>

                        <div className="space-y-3 text-sm text-text-secondary mb-4">
                          <p><strong className="text-text">Context:</strong> {selectedJob?.work_sample.context}</p>
                          <p><strong className="text-text">Your Task:</strong></p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            {selectedJob?.work_sample.steps.map((s, i) => <li key={i}>{s}</li>)}
                          </ol>
                        </div>

                        {selectedJob?.work_sample.artifact && (
                          <div className={`p-3 rounded bg-bg border border-accent/10 text-xs text-text-muted mb-4 overflow-x-auto whitespace-pre-wrap ${selectedJob.work_sample.artifact_type === 'code' ? 'font-mono' : 'font-sans'}`}>
                            {selectedJob.work_sample.artifact}
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-text mb-2">Your Solution & Reasoning:</label>
                          <textarea
                            className="w-full h-40 bg-bg border border-accent/20 rounded-lg p-3 text-text text-sm font-mono focus:outline-none focus:border-employer-accent transition-colors"
                            placeholder={selectedJob?.work_sample.placeholder}
                            value={assessmentAnswer}
                            onChange={(e) => setAssessmentAnswer(e.target.value)}
                          ></textarea>
                        </div>
                      </div>

                      <button onClick={handleAssessmentSubmit} disabled={isProcessing} className="w-full py-3 rounded-lg bg-employer-accent text-bg font-medium hover:opacity-90 transition-colors disabled:opacity-50">
                        {isProcessing ? 'Processing...' : 'Submit Assessment for Grading →'}
                      </button>
                      
                      {isProcessing && (
                        <div className="p-3 rounded bg-bg/50 border border-employer-accent/20 font-mono text-xs text-employer-accent animate-pulse text-center">
                          {`> ${processingLog}`}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded bg-bg/50"><div className="text-[10px] text-text-muted">Completion</div><div className="font-mono text-success">{(assessment.task_completion * 100).toFixed(0)}%</div></div>
                        <div className="p-2 rounded bg-bg/50"><div className="text-[10px] text-text-muted">Accuracy</div><div className="font-mono text-success">{(assessment.technical_accuracy * 100).toFixed(0)}%</div></div>
                        <div className="p-2 rounded bg-bg/50"><div className="text-[10px] text-text-muted">Quality</div><div className="font-mono text-success">{(assessment.work_quality * 100).toFixed(0)}%</div></div>
                        <div className="p-2 rounded bg-bg/50"><div className="text-[10px] text-text-muted">Communication</div><div className="font-mono text-success">{(assessment.communication * 100).toFixed(0)}%</div></div>
                      </div>
                      <div className="p-3 rounded bg-success/10 border border-success/30 text-center">
                        <div className="text-xs text-success font-medium uppercase tracking-wider">Normalised Score: {(assessment.normalised_score * 100).toFixed(0)}th Percentile</div>
                        {assessment.feedback && <div className="text-xs text-text-secondary mt-1 italic">"{assessment.feedback}"</div>}
                      </div>
                      
                      <div className="p-3 rounded bg-bg/50 border border-success/20">
                        <div className="text-[10px] text-text-muted uppercase mb-2">Profile Automatically Updated:</div>
                        {profile.skills.map((skill, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs mb-1">
                            <span className="text-text">{skill.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-[10px] font-medium">
                              Verified ({(skill.verified_score * 100).toFixed(0)}%)
                            </span>
                          </div>
                        ))}
                      </div>

                      <button onClick={() => setStep(6)} className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors">
                        View Matching Calculation (Layer 1+2) →
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 6: Matching Calculation */}
              {step === 6 && matchScore && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Layer 1+2 · Composite Match Score</span>
                    <h2 className="font-display text-2xl text-text mt-1">Matching Calculation</h2>
                    <p className="text-text-secondary text-sm mt-1">Here is how your profile scores against the role requirements before you submit.</p>
                  </div>

                  <div className="p-5 rounded-lg bg-surface border border-accent/10 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded bg-bg/50 border border-accent/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-text-muted">Semantic Match</span>
                          <span className="font-mono text-xs text-accent">×{weights.semantic}</span>
                        </div>
                        <div className="text-lg font-mono text-text">{(matchScore.semanticRaw * 100).toFixed(0)}%</div>
                        <div className="text-[10px] text-text-muted">Weighted: <span className="text-accent">{matchScore.semantic}</span></div>
                      </div>
                      <div className="p-3 rounded bg-bg/50 border border-accent/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-text-muted">Skill Coverage</span>
                          <span className="font-mono text-xs text-accent">×{weights.skill_coverage}</span>
                        </div>
                        <div className="text-lg font-mono text-text">{(matchScore.skillCoverageRaw * 100).toFixed(0)}%</div>
                        <div className="text-[10px] text-text-muted">Weighted: <span className="text-accent">{matchScore.skillCoverage}</span></div>
                      </div>
                      <div className="p-3 rounded bg-bg/50 border border-employer-accent/20 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-text-muted">Verification Score</span>
                          <span className="font-mono text-xs text-employer-accent">×{weights.verification}</span>
                        </div>
                        <div className="text-lg font-mono text-text">{(matchScore.verificationRaw * 100).toFixed(0)}%</div>
                        <div className="text-[10px] text-text-muted">Weighted: <span className="text-employer-accent">{matchScore.verification}</span></div>
                      </div>
                      <div className="p-3 rounded bg-bg/50 border border-accent/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-text-muted">Context Fit</span>
                          <span className="font-mono text-xs text-accent">×{weights.context_fit}</span>
                        </div>
                        <div className="text-lg font-mono text-text">{(matchScore.contextFitRaw * 100).toFixed(0)}%</div>
                        <div className="text-[10px] text-text-muted">Weighted: <span className="text-accent">{matchScore.contextFit}</span></div>
                      </div>
                    </div>

                    <div className="p-4 rounded bg-success/10 border border-success/30 text-center">
                      <div className="text-[10px] text-success font-mono uppercase tracking-wider mb-1">Composite Score</div>
                      <div className="font-display text-4xl text-success">{matchScore.composite}</div>
                      <div className="text-xs text-text-secondary mt-1">
                        {parseFloat(matchScore.composite) >= 0.75 ? '✓ Strong Match — Fast-track to interview' :
                         parseFloat(matchScore.composite) >= 0.60 ? '~ Marginal — Manual review required' :
                         '✗ Significant gaps detected'}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-surface border border-accent/10">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-3">How Your Application is Evaluated</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-text mb-1">What the AI Looks For:</div>
                        <ul className="list-disc list-inside text-text-secondary space-y-1 text-xs">
                          <li><strong className="text-text">Concrete Evidence:</strong> Verbatim quotes of what you actually built or solved.</li>
                          <li><strong className="text-text">Work Context:</strong> Team size, pace, and autonomy preferences.</li>
                          <li><strong className="text-text">Career Goals:</strong> Direction you're heading and what you want to avoid.</li>
                          <li><strong className="text-danger">Red Flags:</strong> Vague answers, keyword stuffing, or inconsistencies.</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium text-text mb-1">Composite Score Ranges:</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-success"></span><span className="text-text"><strong>0.75 – 1.00 (Strong):</strong> Fast-track to interview.</span></div>
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-accent"></span><span className="text-text"><strong>0.60 – 0.74 (Marginal):</strong> Manual review or assessment required.</span></div>
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-danger"></span><span className="text-text"><strong>&lt; 0.60 (Reject):</strong> Significant skill or context gaps.</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setStep(7)} className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors">
                    Continue to Submit →
                  </button>
                </motion.div>
              )}

              {/* STEP 7: Contact Info */}
              {step === 7 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Final Step · Contact Details</span>

                    <h2 className="font-display text-2xl text-text mt-1">Your Contact Information</h2>
                    <p className="text-text-secondary text-sm mt-1">This is only shared with the hiring team if you are shortlisted. It is not used in AI scoring.</p>
                  </div>

                  <div className="p-5 rounded-lg bg-surface border border-accent/10 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Full Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        required
                        className="w-full bg-bg border border-accent/20 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent transition-colors"
                        placeholder="Your full name"
                        value={contactInfo.name}
                        onChange={e => setContactInfo(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Email Address <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        required
                        className="w-full bg-bg border border-accent/20 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent transition-colors"
                        placeholder="you@example.com"
                        value={contactInfo.email}
                        onChange={e => setContactInfo(p => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">Phone Number <span className="text-danger">*</span></label>
                      <input
                        type="tel"
                        required
                        className="w-full bg-bg border border-accent/20 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent transition-colors"
                        placeholder="+1 234 567 8900"
                        value={contactInfo.phone}
                        onChange={e => setContactInfo(p => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <button
                    disabled={!contactInfo.name || !contactInfo.email || !contactInfo.phone}
                    onClick={() => {
                      const avgConf = profile.skills.length > 0 ? profile.skills.reduce((s, sk) => s + sk.confidence, 0) / profile.skills.length : 0.5;
                      const verScore = assessment ? assessment.normalised_score : 0;
                      const application = {
                        id: `live-${Date.now()}`,
                        name: contactInfo.name,
                        email: contactInfo.email,
                        phone: contactInfo.phone,
                        jobId: selectedJob.id,
                        jobTitle: selectedJob.title,
                        skills: profile.skills,
                        work_context: profile.work_context,
                        goals: profile.goals,
                        soft_signals: profile.soft_signals,
                        red_flags: profile.red_flags,
                        assessment,
                        matchScore,
                        submittedAt: new Date().toISOString(),
                        embedding_mock: [avgConf, Math.min(1, profile.skills.length / 10), verScore, avgConf * 0.9]
                      };
                      const existing = JSON.parse(localStorage.getItem('careesOS_applications') || '[]');
                      localStorage.setItem('careesOS_applications', JSON.stringify([...existing, application]));
                      setStep(8);
                    }}
                    className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit Application →
                  </button>
                </motion.div>
              )}

              {/* STEP 8: Application Submitted (End of Applicant Journey) */}
              {step === 8 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">✓</span>
                  </div>
                  <h2 className="font-display text-3xl text-text">Application Submitted Successfully</h2>
                  <p className="text-text-secondary max-w-lg mx-auto">
                    Your narrative has been extracted by our AI, and your work sample assessment has been securely graded. 
                    Your profile is now in the reviewer queue, ranked by our composite matching engine.
                  </p>
                  
                  <div className="p-6 rounded-lg bg-surface border border-accent/10 max-w-md mx-auto text-left space-y-3">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-2">What happens next?</h3>
                    <div className="flex items-start gap-3">
                      <span className="text-accent mt-1">1.</span>
                      <p className="text-sm text-text-secondary">The hiring manager reviews your AI-extracted profile and verification badges.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-accent mt-1">2.</span>
                      <p className="text-sm text-text-secondary">Your resume (attached earlier) is available for their human context, but did not influence the AI score.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-accent mt-1">3.</span>
                      <p className="text-sm text-text-secondary">If shortlisted, you will be contacted for a final culture-fit interview.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    <button onClick={() => { setStep(1); setAnswers({}); setResumeFile(null); setProfile(null); setAssessment(null); setAssessmentAnswer(''); setContactInfo({ name: '', email: '', phone: '' }); setSelectedJob(null); }} className="px-6 py-3 rounded-lg bg-elevated text-text font-medium hover:bg-highlight transition-colors">
                      Start New Application
                    </button>
                    <button onClick={() => navigate('/')} className="px-6 py-3 rounded-lg bg-elevated text-text font-medium hover:bg-highlight transition-colors">
                      Back to Home
                    </button>
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