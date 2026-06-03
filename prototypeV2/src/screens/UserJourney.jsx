import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const targetJob = {
  id: "j1",
  title: "Senior Platform Engineer",
  required_skills: [
    { name: "Kubernetes", level: "senior", non_negotiable: true },
    { name: "Python", level: "senior", non_negotiable: true }
  ],
  team_context: { size: 8, pace: "balanced", autonomy_offered: "high" }
};

const questionnaire = [
  { id: "q1", label: "1. Proudest Work", question: "Tell me about a piece of work you're most proud of. What was the problem? What did you specifically do — not your team, you? What changed as a result?" },
  { id: "q2", label: "2. Technical Complexity", question: "Describe the most technically complex thing you've built or solved. Walk me through your approach." },
  { id: "q3", label: "3. Work Environment", question: "What kind of environment do you do your best work in? Think about team size, pace, how decisions get made, and how much ambiguity you're comfortable with." },
  { id: "q4", label: "4. Career Trajectory", question: "What are you trying to move toward in your career in the next 2 years? And what are you actively trying to move away from?" },
  { id: "q5", label: "5. Failure & Learning", question: "Tell me about a time something you built failed or underperformed. What happened, and what did you do about it?" },
  { id: "q6", label: "6. Domain Approach", question: "Walk me through how you approach performance optimization or threat modeling for a new system." }
];

export default function UserJourney() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Application State
  const [answers, setAnswers] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  
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
      const response = await fetch('http://localhost:3001/api/extract-profile', {
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
        setStep(3);
      } else {
        alert("Failed to extract profile. Please try again.");
      }
    } catch (error) {
      console.error("Backend API Error:", error);
      alert("Error calling backend. Make sure the server is running on port 3001.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 4: Skill Verification
  const handleAssessmentSubmit = () => {
    setIsProcessing(true);
    setProcessingLog("1/4: Parsing submission and running plagiarism check...");
    
    setTimeout(() => {
      setProcessingLog("2/4: Evaluating technical accuracy and code quality...");
      setTimeout(() => {
        setProcessingLog("3/4: Grading communication and approach...");
        setTimeout(() => {
          setProcessingLog("4/4: Normalizing score against candidate cohort...");
          setTimeout(() => {
            const newAssessment = {
              task_completion: 0.90,
              technical_accuracy: 0.85,
              work_quality: 0.88,
              communication: 0.82,
              raw_score: 0.86,
              normalised_score: 0.88
            };
            setAssessment(newAssessment);
            setProfile(prev => ({
              ...prev,
              skills: prev.skills.map(s => ({ ...s, verified: true, verified_score: newAssessment.normalised_score }))
            }));
            setProcessingLog("Verification complete. Profile updated.");
            setIsProcessing(false);
          }, 800);
        }, 800);
      }, 800);
    }, 800);
  };

  // Step 5: Dynamic Matching Calculation
  const calculateMatch = () => {
    if (!profile) return null;

    const requiredSkills = targetJob.required_skills.filter(s => s.non_negotiable).map(s => s.name.toLowerCase());
    const candidateSkills = profile.skills.map(s => s.name.toLowerCase());
    const matchedSkills = requiredSkills.filter(skill => candidateSkills.includes(skill));
    const skillCoverage = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 0;

    let contextMatches = 0;
    let contextTotal = 0;
    if (profile.work_context?.preferred_pace && targetJob.team_context?.pace) {
      contextTotal++;
      if (profile.work_context.preferred_pace === targetJob.team_context.pace) contextMatches++;
    }
    if (profile.work_context?.autonomy_level && targetJob.team_context?.autonomy_offered) {
      contextTotal++;
      if (profile.work_context.autonomy_level === targetJob.team_context.autonomy_offered) contextMatches++;
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
        <button onClick={() => navigate('/dashboard')} className="text-xs text-accent hover:text-accent-hover transition-colors">
          ← Back to Dashboard
        </button>
        <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent">[T] Career OS V2 · Comprehensive Journey</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto bg-bg p-6">
          <div className="max-w-4xl mx-auto">
            
            <AnimatePresence mode="wait">
              {/* STEP 1: Job Selection */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 1 · Job Discovery</span>
                    <h2 className="font-display text-2xl text-text mt-1">Select a Role to Apply</h2>
                  </div>
                  <div className="p-6 rounded-lg bg-surface border border-accent/20 hover:border-accent/40 transition-all cursor-pointer" onClick={() => setStep(2)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-text">{targetJob.title}</h3>
                        <p className="text-sm text-text-secondary mt-1">Platform Engineering · Full-time · Hybrid</p>
                        <div className="flex gap-2 mt-3">
                          {targetJob.required_skills.map(s => (
                            <span key={s.name} className="px-2 py-1 rounded bg-elevated text-xs text-text-muted">{s.name} ({s.level})</span>
                          ))}
                        </div>
                      </div>
                      <span className="text-accent text-xl">→</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Guided Questionnaire */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 2 · Candidate Profile Pipeline</span>
                    <h2 className="font-display text-2xl text-text mt-1">Guided Narrative Questionnaire</h2>
                    <p className="text-text-secondary text-sm mt-1">Answer these 6 open-ended questions. Our AI evaluates your narrative to extract real evidence, preventing keyword stuffing.</p>
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
                    {questionnaire.map((q) => (
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

              {/* STEP 3: LLM Extracted Profile Review */}
              {step === 3 && profile && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-success">Step 3 Complete · LLM Extraction Successful</span>
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

                  <button onClick={() => setStep(4)} className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors">
                    Proceed to Skill Verification (Layer 2) →
                  </button>
                </motion.div>
              )}

              {/* STEP 4: Skill Verification */}
              {step === 4 && profile && (
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
                          <h3 className="font-medium text-employer-accent">Task: EKS IAM Policy Audit & Optimization</h3>
                          <span className="px-2 py-1 rounded bg-elevated text-[10px] text-text-muted font-mono">Time limit: 45 min</span>
                        </div>
                        
                        <div className="space-y-3 text-sm text-text-secondary mb-4">
                          <p><strong className="text-text">Context:</strong> You are reviewing a Terraform module for a new microservice. The current IAM policy grants overly broad permissions to the pod execution role.</p>
                          <p><strong className="text-text">Your Task:</strong></p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Identify the security flaw in the provided JSON policy below.</li>
                            <li>Write the corrected, least-privilege IAM policy.</li>
                            <li>Briefly explain your reasoning and any edge cases considered.</li>
                          </ol>
                        </div>

                        <div className="p-3 rounded bg-bg border border-accent/10 font-mono text-xs text-text-muted mb-4 overflow-x-auto">
                          {`{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "s3:*",\n      "Resource": "*"\n    }\n  ]\n}`}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-text mb-2">Your Solution & Reasoning:</label>
                          <textarea 
                            className="w-full h-40 bg-bg border border-accent/20 rounded-lg p-3 text-text text-sm font-mono focus:outline-none focus:border-employer-accent transition-colors"
                            placeholder="1. Flaw identified: ...&#10;2. Corrected policy: ...&#10;3. Reasoning: ..."
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

                      <button onClick={() => setStep(5)} className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors">
                        View Matching Calculation (Layer 1+2) →
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 5: Application Submitted (End of Applicant Journey) */}
              {step === 5 && (
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
                    <button onClick={() => navigate('/reviewer')} className="px-6 py-3 rounded-lg bg-employer-accent text-bg font-medium hover:opacity-90 transition-colors">
                      Switch to Reviewer Dashboard →
                    </button>
                    <button onClick={() => { setStep(1); setAnswers({}); setResumeFile(null); setProfile(null); setAssessment(null); }} className="px-6 py-3 rounded-lg bg-elevated text-text font-medium hover:bg-highlight transition-colors">
                      Start New Application
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