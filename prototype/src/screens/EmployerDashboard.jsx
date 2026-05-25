import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppContext';
import { employerKPIs as staticKPIs, employerJobs, matchedCandidates } from '../data/employer';
import { allSkills } from '../data/skills';
import SkillAutocomplete from '../components/SkillAutocomplete';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';

function CandidateProfilePanel({ candidate, onClose }) {
  if (!candidate) return null;

  const techSkills = ['React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'Python', 'Linux', 'Terraform', 'Azure', 'CI/CD', 'Jenkins', 'Git', 'SQL', 'TypeScript', 'System Design', 'Networking', 'Windows Server', 'Active Directory', 'Troubleshooting', 'AWS Cloud Practitioner', 'SIEM', 'Incident Response', 'Monitoring', 'Security', 'Architecture'];
  const leaderSkills = ['Leadership', 'People Management', 'Mentoring', 'Strategy', 'Team Leadership', 'Stakeholder Management'];
  const domainSkillsPerCat = ['ITIL', 'HRIS', 'Recruitment', 'HR Analytics', 'Risk Management', 'Compliance', 'GDPR'];

  const techCount = candidate.skills.filter(s => techSkills.includes(s)).length;
  const leadCount = candidate.skills.filter(s => leaderSkills.includes(s)).length;
  const domainCount = candidate.skills.filter(s => domainSkillsPerCat.includes(s)).length;
  const certCount = candidate.skills.filter(s => ['AWS Cloud Practitioner', 'ITIL'].includes(s)).length;

  const radarData = [
    { category: 'Technical', user: techCount || 0, max: 8 },
    { category: 'Leadership', user: leadCount || 0, max: 5 },
    { category: 'Domain', user: domainCount || 0, max: 4 },
    { category: 'Certs', user: certCount || 0, max: 2 },
    { category: 'Soft', user: candidate.skills.includes('Communication') ? 1 : 0, max: 2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed right-0 top-0 h-full w-[420px] max-w-[90vw] bg-[#0a1a24] border-l border-employer-accent/10 shadow-2xl z-50 overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-employer-accent mb-1">Candidate Profile</div>
            <h3 className="font-display text-2xl">{candidate.name}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#112d3a] border border-employer-accent/10 text-text-secondary hover:text-text transition-colors flex items-center justify-center">
            ✕
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-employer-accent/20 flex items-center justify-center text-employer-accent font-medium text-xl">
            {candidate.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="text-text">{candidate.currentRole}</div>
            <div className="text-sm text-text-secondary">{candidate.city} · {candidate.chapter} · {candidate.years} yrs</div>
          </div>
          <div className="ml-auto text-right">
            <div className="font-mono text-2xl text-employer-accent">{candidate.matchScore}%</div>
            <div className="text-[10px] text-text-muted">match</div>
          </div>
        </div>

        <div className="bg-[#112d3a] rounded-xl p-4 border border-employer-accent/10 mb-4">
          <div className="text-sm text-text-secondary leading-relaxed">{candidate.bio}</div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#112d3a] rounded-lg p-3 border border-employer-accent/5">
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Education</div>
              <div className="text-xs text-text mt-1">{candidate.education}</div>
            </div>
            <div className="bg-[#112d3a] rounded-lg p-3 border border-employer-accent/5">
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Languages</div>
              <div className="text-xs text-text mt-1">{candidate.languages.join(', ')}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#112d3a] rounded-lg p-3 border border-employer-accent/5">
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Availability</div>
              <div className="text-xs text-text mt-1">{candidate.availability}</div>
            </div>
            <div className="bg-[#112d3a] rounded-lg p-3 border border-employer-accent/5">
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Industry</div>
              <div className="text-xs text-text mt-1">{candidate.industry}</div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2">Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {candidate.skills.map(s => (
              <span key={s} className="px-2 py-0.5 rounded-full bg-employer-accent/10 text-employer-accent text-[10px]">{s}</span>
            ))}
          </div>
        </div>

        <div className="bg-[#112d3a] rounded-xl p-4 border border-employer-accent/10 mb-4">
          <div className="text-[10px] uppercase tracking-wider text-text-muted mb-2">Skill Profile</div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(61,214,200,0.1)" />
              <PolarAngleAxis dataKey="category" tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
              <PolarRadiusAxis angle={90} domain={[0, 8]} tick={false} axisLine={false} />
              <Radar name="Candidate" dataKey="user" stroke="var(--color-employer-accent)" fill="var(--color-employer-accent)" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Target Max" dataKey="max" stroke="rgba(255,255,255,0.15)" fill="rgba(255,255,255,0.03)" strokeWidth={1} strokeDasharray="4 4" />
              <Legend wrapperStyle={{ fontSize: 10, color: 'var(--color-text-muted)' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className={`text-xs ${candidate.active ? 'text-success' : 'text-accent'}`}>
            {candidate.active ? '● Actively looking' : '● Passive candidate'}
          </div>
          <div className="text-xs text-success">
            Retention est: {candidate.retention}% (&gt;2yr)
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-lg bg-employer-accent text-[#0f242f] font-semibold text-sm hover:brightness-110 transition-all">
            Schedule Interview
          </button>
          <button className="flex-1 py-3 rounded-lg bg-[#112d3a] border border-employer-accent/20 text-employer-accent text-sm hover:border-employer-accent/50 transition-all">
            Save Candidate
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function PostJobForm({ onClose }) {
  const [form, setForm] = useState({ title: '', industry: 'Technology', city: 'KL', skills: [], salaryMin: '', salaryMax: '' });

  const addSkill = (s) => {
    if (form.skills.length >= 8 || form.skills.includes(s)) return;
    setForm(prev => ({ ...prev, skills: [...prev.skills, s] }));
  };

  const removeSkill = (s) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(x => x !== s) }));
  };

  const handlePost = () => {
    onClose();
    alert("Job posted! (Prototype — not persisted)\n\n" + JSON.stringify(form, null, 2));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-6 mb-6 bg-[#0d2533] border border-employer-accent/20 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-employer-accent mb-1">Post New Role</div>
          <h3 className="font-medium text-text">Create Job Listing</h3>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text text-sm">Cancel</button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted block mb-1">Role Title</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full bg-[#112d3a] border border-employer-accent/10 rounded-lg px-4 py-2.5 text-text text-sm placeholder-text-muted outline-none focus:border-employer-accent/40"
            placeholder="e.g. Cloud Engineer" />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted block mb-1">Industry</label>
          <select value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })}
            className="w-full bg-[#112d3a] border border-employer-accent/10 rounded-lg px-4 py-2.5 text-text text-sm outline-none focus:border-employer-accent/40">
            {['Technology', 'Financial Services', 'Healthcare', 'E-commerce / Retail', 'Manufacturing', 'Consulting', 'Government / GLC', 'Energy / Utilities'].map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted block mb-1">City</label>
          <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
            className="w-full bg-[#112d3a] border border-employer-accent/10 rounded-lg px-4 py-2.5 text-text text-sm outline-none focus:border-employer-accent/40">
            {['KL', 'JB', 'Penang', 'SG', 'JKT', 'MNL', 'BKK'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted block mb-1">Min Salary (MYR)</label>
            <input type="number" value={form.salaryMin} onChange={e => setForm({ ...form, salaryMin: e.target.value })}
              className="w-full bg-[#112d3a] border border-employer-accent/10 rounded-lg px-4 py-2.5 text-text text-sm outline-none focus:border-employer-accent/40"
              placeholder="5000" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted block mb-1">Max Salary (MYR)</label>
            <input type="number" value={form.salaryMax} onChange={e => setForm({ ...form, salaryMax: e.target.value })}
              className="w-full bg-[#112d3a] border border-employer-accent/10 rounded-lg px-4 py-2.5 text-text text-sm outline-none focus:border-employer-accent/40"
              placeholder="12000" />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted block mb-1">Required Skills <span className="text-text-muted">(pick up to 8)</span></label>
        <SkillAutocomplete
          skills={allSkills}
          selectedSkills={form.skills}
          onAdd={addSkill}
          onRemove={removeSkill}
          maxSkills={8}
          placeholder="e.g. AWS, Kubernetes, Leadership..."
        />
      </div>

      <button onClick={handlePost}
        disabled={!form.title}
        className="px-6 py-3 rounded-lg bg-employer-accent text-[#0f242f] font-semibold text-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
        Post Job & Start Matching
      </button>
    </motion.div>
  );
}

export default function EmployerDashboard() {
  const { dispatch } = useApp();
  const [selectedJob, setSelectedJob] = useState(employerJobs[0].id);
  const [viewingCandidate, setViewingCandidate] = useState(null);
  const [showPostJob, setShowPostJob] = useState(false);
  const [signalSent, setSignalSent] = useState(null);

  const filteredCandidates = matchedCandidates.filter(c => c.forJob === selectedJob);
  const selectedJobData = employerJobs.find(j => j.id === selectedJob);

  const kpis = {
    activeRoles: employerJobs.filter(j => j.active).length,
    candidatesMatched: filteredCandidates.length,
    avgMatchScore: Math.round(filteredCandidates.reduce((sum, c) => sum + c.matchScore, 0) / (filteredCandidates.length || 1)),
    retentionRisks: filteredCandidates.filter(c => c.retention < 75).length,
  };

  const handleSendSignal = (candidateName) => {
    setSignalSent(candidateName);
    setTimeout(() => setSignalSent(null), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f242f' }}>
      <header className="flex items-center justify-between px-5 py-3 border-b border-employer-accent/10 flex-shrink-0 bg-[#0a1a24]/50">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-employer-accent">[T] Career OS</span>
          <span className="text-text-muted text-xs">|</span>
          <span className="text-sm text-text-secondary">Employer Dashboard</span>
          <span className="text-text-muted text-xs">|</span>
          <span className="text-sm text-text">{selectedJobData?.company || 'All Jobs'}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_EMPLOYER' })}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            ← Candidate View
          </button>
        </div>
      </header>

      <div className="px-6 py-4 flex gap-4 flex-wrap">
        <div className="bg-[#112d3a] border border-employer-accent/10 rounded-xl p-4 flex-1 min-w-[160px]">
          <div className="font-mono text-[10px] uppercase tracking-wider text-employer-accent mb-1">Active Roles</div>
          <div className="font-mono text-3xl text-text">{kpis.activeRoles}</div>
        </div>
        <div className="bg-[#112d3a] border border-employer-accent/10 rounded-xl p-4 flex-1 min-w-[160px]">
          <div className="font-mono text-[10px] uppercase tracking-wider text-employer-accent mb-1">Matched</div>
          <div className="font-mono text-3xl text-text">{kpis.candidatesMatched}</div>
        </div>
        <div className="bg-[#112d3a] border border-employer-accent/10 rounded-xl p-4 flex-1 min-w-[160px]">
          <div className="font-mono text-[10px] uppercase tracking-wider text-employer-accent mb-1">Avg Match</div>
          <div className="font-mono text-3xl text-text">{kpis.avgMatchScore}%</div>
        </div>
        <div className="bg-[#112d3a] border border-employer-accent/10 rounded-xl p-4 flex-1 min-w-[160px]">
          <div className="font-mono text-[10px] uppercase tracking-wider text-employer-accent mb-1">Retention Risks</div>
          <div className="font-mono text-3xl text-[#e05555]">{kpis.retentionRisks}</div>
        </div>
      </div>

      {signalSent && (
        <div className="mx-6 px-4 py-3 bg-employer-accent/15 border border-employer-accent/30 rounded-xl text-sm text-employer-accent mb-2">
          ✓ Signal sent to <span className="font-medium">{signalSent}</span> — they'll see your interest in their Career OS dashboard.
        </div>
      )}

      <div className="px-6 py-2">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-employer-accent">Job Postings</span>
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {employerJobs.map(job => (
            <button
              key={job.id}
              onClick={() => setSelectedJob(job.id)}
              className={`px-4 py-2.5 rounded-lg text-sm transition-all ${
                selectedJob === job.id
                  ? 'bg-employer-accent/15 border border-employer-accent/40 text-employer-accent font-medium'
                  : 'bg-[#112d3a] border border-employer-accent/10 text-text-secondary hover:border-employer-accent/30'
              }`}
            >
              <span>{job.title}</span>
              <span className="ml-2 text-[10px] text-text-muted">{job.totalCandidates} candidates</span>
            </button>
          ))}
          <button
            onClick={() => setShowPostJob(!showPostJob)}
            className={`px-4 py-2.5 rounded-lg text-sm transition-all ${
              showPostJob
                ? 'bg-employer-accent text-[#0f242f] font-medium'
                : 'bg-[#112d3a] border border-dashed border-employer-accent/30 text-employer-accent hover:border-employer-accent/60'
            }`}
          >
            + Post New Role
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showPostJob && <PostJobForm onClose={() => setShowPostJob(false)} />}
      </AnimatePresence>

      <div className="flex-1 px-6 pb-6 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-employer-accent">
            Top Matches — {selectedJobData?.title} · {selectedJobData?.company}
          </span>
          <span className="text-xs text-text-muted">Trajectory-ranked</span>
        </div>

        {filteredCandidates.map(c => (
          <div key={c.id} className="bg-[#112d3a] border border-employer-accent/10 rounded-xl p-5 hover:border-employer-accent/30 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-employer-accent/20 flex items-center justify-center text-employer-accent font-medium text-sm">
                  {c.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-medium text-text">{c.name}</div>
                  <div className="text-xs text-text-secondary">{c.age} · {c.chapter} · {c.city}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-lg text-employer-accent">{c.matchScore}%</div>
                <div className="text-[10px] text-text-muted">Match Score</div>
              </div>
            </div>

            <div className="text-xs text-text-secondary mb-3">
              Current: {c.currentRole}, {c.years} yrs — {c.industry}
            </div>

            <div className="flex flex-wrap gap-3 text-xs mb-4">
              <div className="flex items-center gap-1">
                <span className="text-success">✓</span>
                <span className="text-text-secondary">Trajectory: <span className="text-text">{c.trajectoryMatch}</span></span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-success">✓</span>
                <span className="text-text-secondary">Skills: <span className="text-text">{c.skillsMatch} required</span></span>
              </div>
              {!c.active && (
                <div className="flex items-center gap-1">
                  <span className="text-accent">⚠</span>
                  <span className="text-accent">Passive — proactive outreach suggested</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-text-secondary">
                Est. retention: <span className={c.retention >= 85 ? 'text-success font-medium' : c.retention >= 75 ? 'text-text font-medium' : 'text-danger font-medium'}>{c.retention}%</span> (&gt;2yr)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewingCandidate(c)}
                  className="px-3 py-1.5 rounded-lg bg-employer-accent/10 text-employer-accent text-xs hover:bg-employer-accent/20 transition-all cursor-pointer"
                >
                  View Profile
                </button>
                <button
                  onClick={() => handleSendSignal(c.name)}
                  className="px-3 py-1.5 rounded-lg bg-employer-accent text-[#0f242f] text-xs font-semibold hover:brightness-110 transition-all cursor-pointer"
                >
                  Send Signal
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredCandidates.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm">No candidates matched for this role yet.</div>
            <div className="text-xs mt-1">Try posting a new role to start matching.</div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewingCandidate && (
          <CandidateProfilePanel
            candidate={viewingCandidate}
            onClose={() => setViewingCandidate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
