import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const DEPARTMENTS = ['Platform Engineering', 'Product', 'Design', 'Data & Analytics', 'People & Culture', 'Finance', 'Operations', 'Marketing', 'Sales', 'Security', 'Legal'];
const JOB_TYPES = ['Full-time · Hybrid', 'Full-time · Remote', 'Full-time · On-site', 'Contract', 'Internship'];
const PACE_OPTIONS = ['exploratory', 'balanced', 'execution-focused'];
const AUTONOMY_OPTIONS = ['low', 'medium', 'high'];
const SKILL_LEVELS = ['junior', 'mid', 'senior', 'expert'];

export default function PremiumJobPost() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1 — Basic info
  const [form, setForm] = useState({ title: '', department: '', type: '', description: '', requirements: '', about_company: '' });

  // Step 2 — Skills & team context
  const [skills, setSkills] = useState([{ name: '', level: 'mid', non_negotiable: true }]);
  const [teamContext, setTeamContext] = useState({ size: '', pace: 'balanced', autonomy_offered: 'medium' });

  const [submitted, setSubmitted] = useState(false);

  const handleField = (key, value) => setForm(p => ({ ...p, [key]: value }));

  const addSkill = () => setSkills(p => [...p, { name: '', level: 'mid', non_negotiable: false }]);
  const removeSkill = (i) => setSkills(p => p.filter((_, idx) => idx !== i));
  const updateSkill = (i, key, value) => setSkills(p => p.map((s, idx) => idx === i ? { ...s, [key]: value } : s));

  const step1Valid = form.title && form.department && form.type && form.description && form.requirements && form.about_company;
  const step2Valid = skills.some(s => s.name) && teamContext.size;

  const handlePost = () => {
    const newJob = {
      id: `pj-${Date.now()}`,
      title: form.title,
      premium: true,
      department: form.department,
      type: form.type,
      description: form.description,
      requirements: form.requirements.split('\n').map(r => r.trim()).filter(Boolean),
      about_company: form.about_company,
      required_skills: skills.filter(s => s.name),
      team_context: { size: parseInt(teamContext.size) || 0, pace: teamContext.pace, autonomy_offered: teamContext.autonomy_offered },
      embedding_mock: [0.5, 0.5, 0.5, 0.5],
      postedAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem('careesOS_premium_jobs') || '[]');
    localStorage.setItem('careesOS_premium_jobs', JSON.stringify([...existing, newJob]));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h2 className="font-display text-3xl text-text mb-2">Premium Job Posted</h2>
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-accent/10 text-accent border border-accent/30">PREMIUM</span>
          <span className="text-text-secondary text-sm">{form.title}</span>
        </div>
        <p className="text-text-secondary text-sm max-w-md text-center mb-8">
          Your premium job listing is live. Premium applicants will see it in their job board and go through the full AI-screening flow.
        </p>
        <div className="flex gap-4">
          <button onClick={() => navigate('/reviewer/premium')} className="px-6 py-3 rounded-lg bg-employer-accent text-bg font-medium hover:opacity-90 transition-colors">
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
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-accent/10 text-accent border border-accent/30">PREMIUM</span>
          <span className="text-xs text-text-secondary">Post Job</span>
        </div>
      </header>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-3 border-b border-accent/5">
        {['Details', 'Skills & Team'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono transition-colors
              ${step === i + 1 ? 'bg-accent text-bg' : step > i + 1 ? 'bg-success/30 text-success' : 'bg-elevated text-text-muted'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] uppercase tracking-wider font-mono hidden sm:inline ${step === i + 1 ? 'text-accent' : 'text-text-muted'}`}>{label}</span>
            {i < 1 && <span className="text-text-muted/30 text-xs">—</span>}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 1 · Job Details</span>
                <h2 className="font-display text-2xl text-text mt-1">Basic Information</h2>
              </div>

              {[
                { label: 'Job Title', key: 'title', type: 'input', placeholder: 'e.g. Senior Backend Engineer' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-text mb-2">{f.label} <span className="text-danger">*</span></label>
                  <input type="text" value={form[f.key]} onChange={e => handleField(f.key, e.target.value)} placeholder={f.placeholder}
                    className="w-full bg-surface border border-accent/20 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent" />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Department <span className="text-danger">*</span></label>
                  <select value={form.department} onChange={e => handleField('department', e.target.value)}
                    className="w-full bg-surface border border-accent/20 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent">
                    <option value="">Select…</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Type <span className="text-danger">*</span></label>
                  <select value={form.type} onChange={e => handleField('type', e.target.value)}
                    className="w-full bg-surface border border-accent/20 rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-accent">
                    <option value="">Select…</option>
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Role Description <span className="text-danger">*</span></label>
                <textarea rows={4} value={form.description} onChange={e => handleField('description', e.target.value)}
                  placeholder="What does this role involve day-to-day?" className="w-full bg-surface border border-accent/20 rounded-lg p-3 text-text text-sm focus:outline-none focus:border-accent resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Requirements <span className="text-danger">*</span></label>
                <textarea rows={4} value={form.requirements} onChange={e => handleField('requirements', e.target.value)}
                  placeholder="One requirement per line…" className="w-full bg-surface border border-accent/20 rounded-lg p-3 text-text text-sm focus:outline-none focus:border-accent resize-none font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">About the Company <span className="text-danger">*</span></label>
                <textarea rows={3} value={form.about_company} onChange={e => handleField('about_company', e.target.value)}
                  placeholder="Company culture, stage, mission…" className="w-full bg-surface border border-accent/20 rounded-lg p-3 text-text text-sm focus:outline-none focus:border-accent resize-none" />
              </div>

              <button disabled={!step1Valid} onClick={() => setStep(2)}
                className="w-full py-3 rounded-lg bg-accent text-bg font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Continue →
              </button>
            </motion.div>
          )}

          {/* STEP 2: Skills & Team Context */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <button onClick={() => setStep(1)} className="text-xs text-accent hover:text-accent-hover mb-3 flex items-center gap-1">← Back</button>
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Step 2 · Skills & Team</span>
                <h2 className="font-display text-2xl text-text mt-1">Required Skills & Team Context</h2>
                <p className="text-text-secondary text-sm mt-1">These are used to calculate the candidate's skill coverage and context fit scores.</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-text">Required Skills</label>
                {skills.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" value={s.name} onChange={e => updateSkill(i, 'name', e.target.value)} placeholder="Skill name"
                      className="flex-1 bg-surface border border-accent/20 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-accent" />
                    <select value={s.level} onChange={e => updateSkill(i, 'level', e.target.value)}
                      className="bg-surface border border-accent/20 rounded px-2 py-2 text-text text-xs focus:outline-none focus:border-accent">
                      {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <label className="flex items-center gap-1 text-xs text-text-secondary cursor-pointer">
                      <input type="checkbox" checked={s.non_negotiable} onChange={e => updateSkill(i, 'non_negotiable', e.target.checked)} className="accent-accent" />
                      Required
                    </label>
                    {skills.length > 1 && (
                      <button onClick={() => removeSkill(i)} className="text-danger text-xs hover:text-danger/80">✕</button>
                    )}
                  </div>
                ))}
                <button onClick={addSkill} className="text-xs text-accent hover:text-accent-hover transition-colors">+ Add skill</button>
              </div>

              <div className="p-4 rounded-lg bg-surface border border-accent/10 space-y-4">
                <h3 className="font-mono text-xs uppercase tracking-wider text-accent">Team Context</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Team Size</label>
                    <input type="number" min="1" value={teamContext.size} onChange={e => setTeamContext(p => ({ ...p, size: e.target.value }))}
                      placeholder="e.g. 8" className="w-full bg-bg border border-accent/20 rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Pace</label>
                    <select value={teamContext.pace} onChange={e => setTeamContext(p => ({ ...p, pace: e.target.value }))}
                      className="w-full bg-bg border border-accent/20 rounded px-2 py-2 text-text text-xs focus:outline-none focus:border-accent">
                      {PACE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Autonomy Offered</label>
                    <select value={teamContext.autonomy_offered} onChange={e => setTeamContext(p => ({ ...p, autonomy_offered: e.target.value }))}
                      className="w-full bg-bg border border-accent/20 rounded px-2 py-2 text-text text-xs focus:outline-none focus:border-accent">
                      {AUTONOMY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button disabled={!step2Valid} onClick={handlePost}
                className="w-full py-3 rounded-lg bg-employer-accent text-bg font-medium hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Post Premium Job →
              </button>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
