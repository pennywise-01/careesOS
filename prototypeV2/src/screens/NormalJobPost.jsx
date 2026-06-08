import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { genericQuestionPresets } from '../data/mockData';

const DEPARTMENTS = ['Customer Experience', 'Marketing', 'Sales', 'Finance', 'Human Resources', 'Operations', 'Administration', 'Logistics', 'Legal', 'IT Support'];
const JOB_TYPES = ['Full-time · On-site', 'Full-time · Hybrid', 'Full-time · Remote', 'Part-time · On-site', 'Contract', 'Internship'];

export default function NormalJobPost() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    department: '',
    type: '',
    description: '',
    requirements: '',
    about_company: '',
  });
  const [selectedQuestions, setSelectedQuestions] = useState(['gq_salary', 'gq_relocate', 'gq_startdate', 'gq_experience', 'gq_status']);
  const [submitted, setSubmitted] = useState(false);

  const handleField = (key, value) => setForm(p => ({ ...p, [key]: value }));

  const toggleQuestion = (id) => {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  };

  const step1Valid = form.title && form.department && form.type;
  const step2Valid = form.description && form.requirements && form.about_company;
  const step3Valid = selectedQuestions.length >= 1;

  const handlePost = () => {
    const newJob = {
      id: `nj-${Date.now()}`,
      title: form.title,
      premium: false,
      department: form.department,
      type: form.type,
      description: form.description,
      requirements: form.requirements.split('\n').map(r => r.trim()).filter(Boolean),
      about_company: form.about_company,
      generic_questions: selectedQuestions,
      postedAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem('careesOS_normal_jobs') || '[]');
    localStorage.setItem('careesOS_normal_jobs', JSON.stringify([...existing, newJob]));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h2 className="font-display text-3xl text-text mb-3">Job Posted Successfully</h2>
        <p className="text-text-secondary text-sm max-w-md text-center mb-8">
          Your standard job listing for <strong className="text-text">{form.title}</strong> is now live. Applicants can start submitting their resumes and screening answers.
        </p>
        <div className="flex gap-4">
          <button onClick={() => navigate('/reviewer/normal')} className="px-6 py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors">
            View Applicants →
          </button>
          <button onClick={() => navigate('/')} className="px-6 py-3 rounded-lg bg-elevated text-text font-medium hover:bg-highlight transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="flex items-center justify-between px-5 py-3 border-b border-accent/10 bg-surface/30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-xs text-text-muted hover:text-text transition-colors">← Home</button>
          <span className="text-text-muted text-xs">|</span>
          <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent">[T] Career OS V2</span>
          <span className="text-text-muted text-xs">·</span>
          <span className="text-xs text-text-secondary">Post Standard Job</span>
        </div>
      </header>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-3 border-b border-accent/5">
        {['Job Details', 'Description', 'Questions'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono transition-colors
              ${step === i + 1 ? 'bg-accent text-bg' : step > i + 1 ? 'bg-success/30 text-success' : 'bg-elevated text-text-muted'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] uppercase tracking-wider font-mono hidden sm:inline ${step === i + 1 ? 'text-accent' : 'text-text-muted'}`}>{label}</span>
            {i < 2 && <span className="text-text-muted/30 text-xs">—</span>}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 1 · Job Details</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-elevated text-text-muted">Standard</span>
                </div>
                <h2 className="font-display text-2xl text-text">Basic Job Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Job Title <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => handleField('title', e.target.value)}
                    placeholder="e.g. Customer Service Executive"
                    className="w-full bg-surface border border-accent/20 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Department <span className="text-danger">*</span></label>
                  <select
                    value={form.department}
                    onChange={e => handleField('department', e.target.value)}
                    className="w-full bg-surface border border-accent/20 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="">Select department…</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Employment Type <span className="text-danger">*</span></label>
                  <select
                    value={form.type}
                    onChange={e => handleField('type', e.target.value)}
                    className="w-full bg-surface border border-accent/20 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="">Select type…</option>
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <button
                disabled={!step1Valid}
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </motion.div>
          )}

          {/* STEP 2: Description */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <button onClick={() => setStep(1)} className="text-xs text-accent hover:text-accent-hover mb-3 flex items-center gap-1">← Back</button>
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 2 · Description</span>
                <h2 className="font-display text-2xl text-text mt-1">Role Description</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Role Description <span className="text-danger">*</span></label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={e => handleField('description', e.target.value)}
                    placeholder="Describe the day-to-day responsibilities and what the role involves…"
                    className="w-full bg-surface border border-accent/20 rounded-lg p-3 text-text text-sm focus:outline-none focus:border-accent transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Requirements <span className="text-danger">*</span></label>
                  <textarea
                    rows={4}
                    value={form.requirements}
                    onChange={e => handleField('requirements', e.target.value)}
                    placeholder="Enter each requirement on a new line…"
                    className="w-full bg-surface border border-accent/20 rounded-lg p-3 text-text text-sm focus:outline-none focus:border-accent transition-colors resize-none font-mono"
                  />
                  <p className="text-[10px] text-text-muted mt-1">One requirement per line.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">About the Company <span className="text-danger">*</span></label>
                  <textarea
                    rows={3}
                    value={form.about_company}
                    onChange={e => handleField('about_company', e.target.value)}
                    placeholder="Brief description of your company and culture…"
                    className="w-full bg-surface border border-accent/20 rounded-lg p-3 text-text text-sm focus:outline-none focus:border-accent transition-colors resize-none"
                  />
                </div>
              </div>

              <button
                disabled={!step2Valid}
                onClick={() => setStep(3)}
                className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </motion.div>
          )}

          {/* STEP 3: Pick Screening Questions */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <button onClick={() => setStep(2)} className="text-xs text-accent hover:text-accent-hover mb-3 flex items-center gap-1">← Back</button>
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 3 · Screening Questions</span>
                <h2 className="font-display text-2xl text-text mt-1">Choose Screening Questions</h2>
                <p className="text-text-secondary text-sm mt-1">Select which questions applicants must answer. Applicants will also upload their resume.</p>
              </div>

              <div className="space-y-2">
                {genericQuestionPresets.map(q => (
                  <div
                    key={q.id}
                    onClick={() => toggleQuestion(q.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedQuestions.includes(q.id)
                        ? 'bg-accent/5 border-accent/50'
                        : 'bg-surface border-accent/10 hover:border-accent/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            selectedQuestions.includes(q.id) ? 'bg-accent border-accent' : 'border-accent/30'
                          }`}>
                            {selectedQuestions.includes(q.id) && <span className="text-bg text-[10px]">✓</span>}
                          </div>
                          <span className="text-sm font-medium text-text">{q.label}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${q.type === 'select' ? 'bg-elevated text-text-muted' : 'bg-elevated text-text-muted'}`}>
                            {q.type}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1 ml-6">{q.question}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-surface border border-accent/10 text-xs text-text-secondary">
                <strong className="text-accent">{selectedQuestions.length}</strong> question{selectedQuestions.length !== 1 ? 's' : ''} selected.
                Applicants will also be required to upload their resume.
              </div>

              <button
                disabled={!step3Valid}
                onClick={handlePost}
                className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Post Job →
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
