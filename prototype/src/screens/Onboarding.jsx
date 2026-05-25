import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppContext';
import { allSkills } from '../data/skills';
import SkillAutocomplete from '../components/SkillAutocomplete';
import { getRecommendedPaths, educationFields, interestOptions, subjectOptions, workStyles } from '../data/studentPaths';
import { trajectoryNodes } from '../data/trajectory';

const industries = ['Financial Services', 'Technology', 'Healthcare', 'E-commerce / Retail', 'Manufacturing', 'Consulting', 'Government / GLC', 'Education', 'Media / Creative', 'Logistics', 'Energy / Utilities', 'Property / Construction'];
const cities = ['KL', 'JB', 'Penang', 'SG', 'JKT', 'MNL', 'BKK', 'Other'];
const companySizes = ['Startup', 'SME', 'MNC', 'GLC'];

export default function Onboarding() {
  const { state, dispatch } = useApp();
  const persona = state.currentPersona;
  const isStudent = persona?.chapter === 'student';
  const [step, setStep] = useState(0);

  const [profile, setProfile] = useState({
    chapter: persona?.chapter || 'early_career',
    currentRole: persona?.currentRole || '',
    companySize: persona?.companySize || '',
    industry: persona?.industry || '',
    city: persona?.city || '',
    yearsExperience: persona?.yearsExperience || 0,
    skills: persona?.skills || [],
    targetRole: persona?.targetRole || '',
    linkedinUrl: '',
  });

  const [studentInput, setStudentInput] = useState({
    fieldOfStudy: '',
    interests: [],
    subjects: [],
    workStyle: '',
  });

  const [selectedPath, setSelectedPath] = useState(null);

  if (!persona) return null;


  const toggleInterest = (i) => {
    setStudentInput(prev => {
      if (prev.interests.includes(i)) return { ...prev, interests: prev.interests.filter(x => x !== i) };
      if (prev.interests.length >= 3) return prev;
      return { ...prev, interests: [...prev.interests, i] };
    });
  };

  const toggleSubject = (s) => {
    setStudentInput(prev => {
      if (prev.subjects.includes(s)) return { ...prev, subjects: prev.subjects.filter(x => x !== s) };
      if (prev.subjects.length >= 5) return prev;
      return { ...prev, subjects: [...prev.subjects, s] };
    });
  };

  const addSkill = (skill) => {
    if (profile.skills.length >= 7 || profile.skills.includes(skill)) return;
    setProfile({ ...profile, skills: [...profile.skills, skill] });
  };

  const removeSkill = (skill) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  const recommendedPaths = isStudent ? getRecommendedPaths(studentInput) : [];

  const handleComplete = () => {
    const chosenPathNode = selectedPath
      ? trajectoryNodes.find(n => n.id === selectedPath)
      : null;

    const finalProfile = isStudent && chosenPathNode
      ? {
          ...profile,
          chapter: 'student',
          currentRole: chosenPathNode.role,
          industry: profile.industry || 'Technology',
          city: profile.city || 'KL',
          yearsExperience: 0,
          skills: studentInput.subjects.length > 0
            ? [...new Set([...chosenPathNode.skills.slice(0, 3), ...studentInput.subjects.slice(0, 4)])]
            : chosenPathNode.skills.slice(0, 4),
          targetRole: chosenPathNode.role,
          personaId: persona.id,
          studentPathId: selectedPath,
        }
      : { ...profile, personaId: persona.id };

    dispatch({ type: 'SET_PROFILE', profile: finalProfile });
  };

  const totalSteps = isStudent ? 3 : 3;
  const stepLabels = isStudent
    ? ['01 · Chapter', '02 · Your Vibe', '03 · Your Path']
    : ['01 · Chapter', '02 · Profile', '03 · Target'];

  const canContinueStudentStep1 = studentInput.fieldOfStudy && studentInput.interests.length >= 1;
  const canContinueStandardStep1 = profile.currentRole && profile.industry && profile.city;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-accent/10 p-4 flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent">[T] Career OS</span>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          ← Back to landing
        </button>
      </div>

      <div className="px-6 py-4">
        <div className="max-w-md mx-auto mb-6">
          <div className="flex gap-2 mb-2">
            {Array.from({ length: totalSteps }).map((_, s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-accent' : 'bg-elevated'}`} />
            ))}
          </div>
          <div className="flex justify-between text-[11px] font-mono text-text-muted">
            {stepLabels.map((l, i) => (
              <span key={i} className={step >= i ? 'text-accent' : ''}>{l}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <AnimatePresence mode="wait">

          {/* STEP 0 — CHAPTER CONFIRMATION (same for all) */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="max-w-md w-full"
            >
              <div className="font-display text-3xl mb-2">{persona.chapterLabel}</div>
              <p className="text-text-secondary mb-6">{persona.chapterDesc}</p>
              <div className="bg-surface rounded-xl p-6 border border-accent/10 mb-6">
                {persona.name ? (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium text-lg">
                      {persona.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-text">{persona.name}</div>
                      <div className="text-sm text-text-secondary">{persona.age} years · {persona.city}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-text-secondary mb-4">
                    {isStudent
                      ? 'No pre-filled demo for students — tell us about your interests and we\'ll map your career options.'
                      : 'No pre-filled demo for this chapter — build your own profile below.'}
                  </div>
                )}
                <p className="text-sm text-text-secondary">
                  {isStudent
                    ? 'We analyse your interests, subjects, and work style to recommend career paths matched to thousands of real graduate trajectories across Asia.'
                    : 'This changes how we model your career paths — each chapter has different trajectory patterns based on real data from thousands of professionals across Asia.'}
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="w-full py-3 rounded-lg bg-accent text-[#0d1f1a] font-semibold hover:bg-accent-hover transition-all"
              >
                Continue with {persona.chapterLabel}
              </button>
            </motion.div>
          )}

          {/* STEP 1: STUDENT — Interests & Study */}
          {step === 1 && isStudent && (
            <motion.div
              key="step1-student"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="max-w-md w-full space-y-5"
            >
              <h2 className="font-display text-2xl">What makes you tick?</h2>
              <p className="text-sm text-text-secondary -mt-3">Your answers here map to real career paths across Asia.</p>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">Field of Study</label>
                <select
                  value={studentInput.fieldOfStudy}
                  onChange={e => setStudentInput({ ...studentInput, fieldOfStudy: e.target.value })}
                  className="w-full bg-surface border border-accent/10 rounded-lg px-4 py-3 text-text outline-none focus:border-accent/50 transition-colors"
                >
                  <option value="">What are you studying?</option>
                  {educationFields.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">
                  Interests <span className="text-text-muted">(pick up to 3)</span>
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                  {interestOptions.map(i => (
                    <button key={i} onClick={() => toggleInterest(i)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                        studentInput.interests.includes(i)
                          ? 'bg-accent/20 text-accent border border-accent/40'
                          : 'bg-surface border border-accent/10 text-text-secondary hover:border-accent/30'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">
                  Top Subjects <span className="text-text-muted">(pick up to 5)</span>
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {subjectOptions.map(s => (
                    <button key={s} onClick={() => toggleSubject(s)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                        studentInput.subjects.includes(s)
                          ? 'bg-accent/20 text-accent border border-accent/40'
                          : 'bg-surface border border-accent/10 text-text-secondary hover:border-accent/30'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">Work Style</label>
                <div className="flex flex-wrap gap-2">
                  {workStyles.map(s => (
                    <button key={s.id} onClick={() => setStudentInput({ ...studentInput, workStyle: s.id })}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        studentInput.workStyle === s.id
                          ? 'bg-accent text-[#0d1f1a] font-medium'
                          : 'bg-surface border border-accent/10 text-text-secondary hover:border-accent/30'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-lg bg-surface border border-accent/10 text-text-secondary hover:border-accent/30 transition-all">
                  Back
                </button>
                <button onClick={() => setStep(2)}
                  disabled={!canContinueStudentStep1}
                  className="flex-1 py-3 rounded-lg bg-accent text-[#0d1f1a] font-semibold hover:bg-accent-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  See My Paths
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1: STANDARD — Profile */}
          {step === 1 && !isStudent && (
            <motion.div
              key="step1-standard"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="max-w-md w-full space-y-5"
            >
              <h2 className="font-display text-2xl">Tell us about yourself</h2>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">Current Role</label>
                <input
                  value={profile.currentRole}
                  onChange={e => setProfile({ ...profile, currentRole: e.target.value })}
                  className="w-full bg-surface border border-accent/10 rounded-lg px-4 py-3 text-text placeholder-text-muted focus:border-accent/50 outline-none transition-colors"
                  placeholder="e.g. IT Support Specialist"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">Company Size</label>
                <div className="flex gap-2 flex-wrap">
                  {companySizes.map(size => (
                    <button key={size} onClick={() => setProfile({ ...profile, companySize: size })}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${profile.companySize === size ? 'bg-accent text-[#0d1f1a] font-medium' : 'bg-surface border border-accent/10 text-text-secondary hover:border-accent/30'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">Industry</label>
                <select
                  value={profile.industry}
                  onChange={e => setProfile({ ...profile, industry: e.target.value })}
                  className="w-full bg-surface border border-accent/10 rounded-lg px-4 py-3 text-text outline-none focus:border-accent/50 transition-colors"
                >
                  <option value="">Select industry...</option>
                  {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">City</label>
                <div className="flex gap-2 flex-wrap">
                  {cities.map(city => (
                    <button key={city} onClick={() => setProfile({ ...profile, city })}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${profile.city === city ? 'bg-accent text-[#0d1f1a] font-medium' : 'bg-surface border border-accent/10 text-text-secondary hover:border-accent/30'}`}>
                      {city}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">
                  Years Experience: <span className="text-accent font-medium">{profile.yearsExperience}</span>
                </label>
                <input
                  type="range" min="0" max="20"
                  value={profile.yearsExperience}
                  onChange={e => setProfile({ ...profile, yearsExperience: parseInt(e.target.value) })}
                  className="w-full accent-accent"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">
                  Top Skills <span className="text-text-muted">(up to 7)</span>
                </label>
                <SkillAutocomplete
                  skills={allSkills}
                  selectedSkills={profile.skills}
                  onAdd={addSkill}
                  onRemove={removeSkill}
                  maxSkills={7}
                  placeholder="e.g. Nursing, Graphic Design, Sales, Leadership..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-lg bg-surface border border-accent/10 text-text-secondary hover:border-accent/30 transition-all">
                  Back
                </button>
                <button onClick={() => setStep(2)}
                  disabled={!canContinueStandardStep1}
                  className="flex-1 py-3 rounded-lg bg-accent text-[#0d1f1a] font-semibold hover:bg-accent-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: STUDENT — Recommended Paths */}
          {step === 2 && isStudent && (
            <motion.div
              key="step2-student"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="max-w-lg w-full space-y-5"
            >
              <div>
                <h2 className="font-display text-2xl">Your Career Paths</h2>
                <p className="text-sm text-text-secondary">
                  Based on {studentInput.fieldOfStudy} and your interests
                </p>
              </div>

              {recommendedPaths.length === 0 && (
                <div className="bg-surface rounded-xl p-6 border border-accent/10 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-text-secondary text-sm">Select more interests and subjects in the previous step for better recommendations.</p>
                </div>
              )}

              {recommendedPaths.map((path, i) => {
                const node = trajectoryNodes.find(n => n.id === path.id);
                const scorePercent = Math.min(Math.round((path.score / 8) * 100), 100);
                return (
                  <button
                    key={path.id}
                    onClick={() => setSelectedPath(path.id)}
                    className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                      selectedPath === path.id
                        ? 'bg-accent/10 border-accent'
                        : 'bg-surface border-accent/10 hover:border-accent/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-text">{path.label}</div>
                        <div className="text-xs text-text-secondary">{node?.specialisation || 'Entry path'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-accent">{scorePercent}%</div>
                        <div className="text-[10px] text-text-muted">match</div>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent-muted to-accent transition-all" style={{ width: `${scorePercent}%` }} />
                    </div>
                    {node && (
                      <div className="mt-2 text-xs text-text-muted font-mono">
                        Starting salary range: RM {(node.salaryMin).toLocaleString()} – {(node.salaryMax).toLocaleString()}/mo
                      </div>
                    )}
                  </button>
                );
              })}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-lg bg-surface border border-accent/10 text-text-secondary hover:border-accent/30 transition-all">
                  Back
                </button>
                <button onClick={handleComplete}
                  disabled={!selectedPath}
                  className="flex-1 py-3 rounded-lg bg-accent text-[#0d1f1a] font-semibold hover:bg-accent-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Start Career OS →
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: STANDARD — Target */}
          {step === 2 && !isStudent && (
            <motion.div
              key="step2-standard"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="max-w-md w-full space-y-5"
            >
              <h2 className="font-display text-2xl">Where are you heading?</h2>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">Target Role</label>
                <input
                  value={profile.targetRole}
                  onChange={e => setProfile({ ...profile, targetRole: e.target.value })}
                  className="w-full bg-surface border border-accent/10 rounded-lg px-4 py-3 text-text placeholder-text-muted focus:border-accent/50 outline-none transition-colors"
                  placeholder="e.g. Cloud Engineer"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">LinkedIn URL (optional)</label>
                <input
                  value={profile.linkedinUrl}
                  onChange={e => setProfile({ ...profile, linkedinUrl: e.target.value })}
                  className="w-full bg-surface border border-accent/10 rounded-lg px-4 py-3 text-text placeholder-text-muted focus:border-accent/50 outline-none transition-colors"
                  placeholder="linkedin.com/in/your-profile"
                />
                <p className="text-xs text-text-muted mt-1">We'll pull your experience to fast-track setup.</p>
              </div>

              <div className="bg-surface rounded-xl p-5 border border-accent/10">
                <div className="font-mono text-[10px] uppercase tracking-wider text-accent mb-3">Preview</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-text-muted">Role</span><span className="text-text">{profile.currentRole}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Industry</span><span className="text-text">{profile.industry}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">City</span><span className="text-text">{profile.city}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Experience</span><span className="text-text">{profile.yearsExperience} years</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Target</span><span className="text-text">{profile.targetRole || '—'}</span></div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-lg bg-surface border border-accent/10 text-text-secondary hover:border-accent/30 transition-all">
                  Back
                </button>
                <button onClick={handleComplete}
                  className="flex-1 py-3 rounded-lg bg-accent text-[#0d1f1a] font-semibold hover:bg-accent-hover transition-all">
                  Start Career OS →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
