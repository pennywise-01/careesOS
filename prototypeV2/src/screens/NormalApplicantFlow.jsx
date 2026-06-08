import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { normalJobs, genericQuestionPresets } from '../data/mockData';

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function filterJobsByRole(jobs, roleInput) {
  const words = roleInput.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return jobs;
  const scored = jobs.map(j => {
    // Primary: exact token match in title + department only
    const titleDeptTokens = `${j.title} ${j.department || ''}`.toLowerCase().split(/\W+/).filter(Boolean);
    const titleMatched = words.filter(w => titleDeptTokens.some(t => t === w || t.startsWith(w))).length;
    // Secondary: loose match in description/requirements (tiebreaker only, not a gate)
    const descText = `${j.description || ''} ${(j.requirements || []).join(' ')}`.toLowerCase();
    const descMatched = words.filter(w => descText.includes(w)).length;
    // Job must have at least one word in its title/department to qualify
    const relevance = titleMatched > 0
      ? (titleMatched / words.length) + (descMatched / words.length) * 0.2
      : 0;
    return { ...j, _relevance: relevance };
  });
  return scored.filter(j => j._relevance > 0).sort((a, b) => b._relevance - a._relevance);
}

export default function NormalApplicantFlow() {
  const navigate = useNavigate();
  const location = useLocation();

  // Support pre-selection when premium applicant navigates here with a normal job
  const preselectedJob = location.state?.preselectedJob || null;

  const [step, setStep] = useState(preselectedJob ? 3 : 1);
  const [roleInput, setRoleInput] = useState('');
  const [selectedJob, setSelectedJob] = useState(preselectedJob);
  const [answers, setAnswers] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });

  // Merge seed normal jobs + locally posted normal jobs from localStorage
  const postedNormalJobs = JSON.parse(localStorage.getItem('careesOS_normal_jobs') || '[]');
  const allNormalJobs = [...normalJobs, ...postedNormalJobs];
  const filteredJobs = filterJobsByRole(allNormalJobs, roleInput);

  const activeQuestions = selectedJob
    ? (selectedJob.generic_questions || []).map(id => genericQuestionPresets.find(q => q.id === id)).filter(Boolean)
    : [];

  const handleAnswerChange = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const allAnswered = activeQuestions.every(q => answers[q.id] && answers[q.id].toString().trim() !== '');

  const handleSubmit = () => {
    const application = {
      id: `normal-${Date.now()}`,
      name: contactInfo.name,
      email: contactInfo.email,
      phone: contactInfo.phone,
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      resumeFile,
      answers,
      submittedAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem('careesOS_normal_applications') || '[]');
    localStorage.setItem('careesOS_normal_applications', JSON.stringify([...existing, application]));
    setStep(6);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="flex items-center justify-between px-5 py-3 border-b border-accent/10 flex-shrink-0 bg-surface/30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-xs text-text-muted hover:text-text transition-colors">← Home</button>
          <span className="text-text-muted text-xs">|</span>
          <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent">[T] Career OS V2</span>
          <span className="text-text-muted text-xs">·</span>
          <span className="text-xs text-text-secondary">Standard Applicant</span>
        </div>
        <button onClick={() => navigate('/reviewer/normal')} className="text-xs text-text-muted hover:text-text transition-colors border border-accent/20 px-3 py-1 rounded-full">
          Recruiter View →
        </button>
      </header>

      {/* Step indicator */}
      {step < 6 && (
        <div className="flex items-center justify-center gap-2 py-3 border-b border-accent/5">
          {['Role', 'Jobs', 'Details', 'Questions', 'Contact'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono transition-colors
                ${step === i + 1 ? 'bg-accent text-bg' : step > i + 1 ? 'bg-success/30 text-success' : 'bg-elevated text-text-muted'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-mono hidden sm:inline ${step === i + 1 ? 'text-accent' : 'text-text-muted'}`}>{label}</span>
              {i < 4 && <span className="text-text-muted/30 text-xs">—</span>}
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">

            {/* STEP 1: Role Input */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 1 · Get Started</span>
                  <h2 className="font-display text-2xl text-text mt-1">What role are you looking for?</h2>
                  <p className="text-text-secondary text-sm mt-1">Tell us the role you're targeting and we'll show only the relevant listings.</p>
                </div>

                <form onSubmit={e => { e.preventDefault(); if (roleInput.trim()) setStep(2); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Target Role <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={roleInput}
                      onChange={e => setRoleInput(e.target.value)}
                      placeholder="e.g. HR Executive, Operations Manager, Customer Service..."
                      className="w-full bg-surface border border-accent/20 rounded-lg px-4 py-3 text-text text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-text-muted"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!roleInput.trim()}
                    className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Show Matching Jobs →
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 2: Filtered Job Listing */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div>
                  <button onClick={() => setStep(1)} className="text-xs text-accent hover:text-accent-hover mb-4 flex items-center gap-1">← Change role</button>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 2 · Job Discovery</span>
                  <h2 className="font-display text-2xl text-text mt-1">Jobs matching <span className="text-accent">"{roleInput}"</span></h2>
                  <p className="text-text-secondary text-sm mt-1">{filteredJobs.length} listing{filteredJobs.length !== 1 ? 's' : ''} found. Click any role to view details and apply.</p>
                </div>

                {filteredJobs.length === 0 ? (
                  <div className="p-8 text-center space-y-3 border border-accent/10 rounded-lg bg-surface">
                    <p className="text-text-muted text-sm">No listings found matching <span className="text-text">"{roleInput}"</span>.</p>
                    <button onClick={() => setStep(1)} className="text-xs text-accent hover:text-accent-hover underline">Try a different role</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredJobs.map(j => (
                      <div
                        key={j.id}
                        onClick={() => { setSelectedJob(j); setStep(3); }}
                        className="p-5 rounded-lg bg-surface border border-accent/20 hover:border-accent/40 transition-all cursor-pointer group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1">{j.department}</div>
                            <h3 className="text-base font-medium text-text">{j.title}</h3>
                            <p className="text-xs text-text-secondary mt-0.5">{j.type}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-elevated text-text-muted font-mono">Standard</span>
                              <span className="text-[10px] text-text-muted">{j.generic_questions?.length || 0} screening questions</span>
                            </div>
                          </div>
                          <span className="text-accent text-xl group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: Job Detail */}
            {step === 3 && selectedJob && (
              <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                {!preselectedJob && (
                  <button onClick={() => setStep(2)} className="text-xs text-accent hover:text-accent-hover transition-colors flex items-center gap-1">← Back to listings</button>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{selectedJob.department} · {selectedJob.type}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-elevated text-text-muted font-mono uppercase">Standard</span>
                  </div>
                  <h2 className="font-display text-3xl text-text">{selectedJob.title}</h2>
                </div>

                <div className="p-5 rounded-lg bg-surface border border-accent/10 space-y-4">
                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-wider text-accent mb-2">About the Role</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{selectedJob.description}</p>
                  </div>
                  <div className="border-t border-accent/10 pt-4">
                    <h3 className="font-mono text-[10px] uppercase tracking-wider text-accent mb-3">Requirements</h3>
                    <ul className="space-y-2">
                      {selectedJob.requirements?.map((r, i) => (
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

                <div className="p-4 rounded-lg bg-surface border border-accent/10 text-sm text-text-secondary">
                  <span className="text-text font-medium">How this application works: </span>
                  Answer {activeQuestions.length} short screening questions and upload your resume. No AI scoring — a recruiter will review your application directly.
                </div>

                <button onClick={() => setStep(4)} className="w-full py-3 rounded-lg bg-accent text-bg font-medium text-base hover:bg-accent-hover transition-colors">
                  Apply for {selectedJob.title} →
                </button>
              </motion.div>
            )}

            {/* STEP 4: Generic Questions + Resume */}
            {step === 4 && selectedJob && (
              <motion.div key="s4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 4 · Screening Questions</span>
                  <h2 className="font-display text-2xl text-text mt-1">Quick Application</h2>
                  <p className="text-text-secondary text-sm mt-1">Answer the following questions for <strong className="text-accent">{selectedJob.title}</strong>. These are reviewed directly by the recruiter.</p>
                </div>

                <div className="space-y-5">
                  {activeQuestions.map(q => (
                    <div key={q.id}>
                      <label className="block text-sm font-medium text-text mb-2">
                        {q.question} <span className="text-danger">*</span>
                      </label>
                      {q.type === 'select' ? (
                        <select
                          value={answers[q.id] || ''}
                          onChange={e => handleAnswerChange(q.id, e.target.value)}
                          className="w-full bg-surface border border-accent/20 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent transition-colors"
                        >
                          <option value="">Select an option…</option>
                          {q.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={answers[q.id] || ''}
                          onChange={e => handleAnswerChange(q.id, e.target.value)}
                          placeholder={q.placeholder}
                          className="w-full bg-surface border border-accent/20 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent transition-colors"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-surface border border-accent/10">
                  <label className="block text-sm font-medium text-text mb-2">Attach Resume <span className="text-danger">*</span></label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={e => e.target.files[0] && setResumeFile(e.target.files[0].name)}
                    className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-elevated file:text-accent hover:file:bg-highlight"
                  />
                  {resumeFile && <p className="text-xs text-success mt-2">✓ {resumeFile} attached.</p>}
                </div>

                <button
                  onClick={() => setStep(5)}
                  disabled={!allAnswered || !resumeFile}
                  className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue →
                </button>
              </motion.div>
            )}

            {/* STEP 5: Contact Info */}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 5 · Contact Details</span>
                  <h2 className="font-display text-2xl text-text mt-1">Your Contact Information</h2>
                  <p className="text-text-secondary text-sm mt-1">Shared with the recruiter only if you are shortlisted.</p>
                </div>

                <div className="p-5 rounded-lg bg-surface border border-accent/10 space-y-4">
                  {[
                    { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your full name' },
                    { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@example.com' },
                    { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+60 12-345 6789' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-text mb-2">{field.label} <span className="text-danger">*</span></label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={contactInfo[field.key]}
                        onChange={e => setContactInfo(p => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full bg-bg border border-accent/20 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  ))}
                </div>

                <button
                  disabled={!contactInfo.name || !contactInfo.email || !contactInfo.phone}
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit Application →
                </button>
              </motion.div>
            )}

            {/* STEP 6: Confirmation */}
            {step === 6 && (
              <motion.div key="s6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 text-center py-12">
                <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✓</span>
                </div>
                <h2 className="font-display text-3xl text-text">Application Submitted</h2>
                <p className="text-text-secondary max-w-lg mx-auto text-sm">
                  Your answers and resume have been sent to the recruiter for review. You will be contacted if shortlisted.
                </p>

                <div className="p-6 rounded-lg bg-surface border border-accent/10 max-w-md mx-auto text-left space-y-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-2">What happens next?</h3>
                  <div className="flex items-start gap-3">
                    <span className="text-accent mt-1">1.</span>
                    <p className="text-sm text-text-secondary">The recruiter reviews your answers and attached resume.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent mt-1">2.</span>
                    <p className="text-sm text-text-secondary">If your profile is a good match, they will reach out for the next steps.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                  <button
                    onClick={() => { setStep(1); setRoleInput(''); setAnswers({}); setResumeFile(null); setContactInfo({ name: '', email: '', phone: '' }); setSelectedJob(null); }}
                    className="px-6 py-3 rounded-lg bg-elevated text-text font-medium hover:bg-highlight transition-colors"
                  >
                    Browse More Jobs
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
  );
}
