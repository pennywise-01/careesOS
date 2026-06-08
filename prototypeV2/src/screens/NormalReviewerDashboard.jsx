import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { normalCandidates, normalJobs, genericQuestionPresets } from '../data/mockData';

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const FILTER_SALARY_OPTIONS = ['Any', 'Up to 3,000', 'Up to 4,000', 'Up to 5,000', 'Up to 6,000'];
const FILTER_RELOCATE_OPTIONS = ['Any', 'Yes', 'No', 'Open to discussion'];
const FILTER_AVAIL_OPTIONS = ['Any', 'Immediately available', 'Serving notice period', 'Currently employed'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'exp_asc', label: 'Experience (Low → High)' },
  { value: 'exp_desc', label: 'Experience (High → Low)' },
];

const EXP_ORDER = ['Less than 1 year', '1–2 years', '3–5 years', '5–8 years', '8+ years'];

function parseSalaryCap(label) {
  const match = label.match(/\d+,\d+/);
  return match ? parseInt(match[0].replace(',', '')) : Infinity;
}

function maxSalaryFromAnswer(answer) {
  if (!answer) return Infinity;
  const nums = answer.match(/\d[\d,]*/g);
  if (!nums) return Infinity;
  return Math.max(...nums.map(n => parseInt(n.replace(/,/g, ''))));
}

export default function NormalReviewerDashboard() {
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [filterSalary, setFilterSalary] = useState('Any');
  const [filterRelocate, setFilterRelocate] = useState('Any');
  const [filterAvail, setFilterAvail] = useState('Any');
  const [filterJobId, setFilterJobId] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const liveApplications = JSON.parse(localStorage.getItem('careesOS_normal_applications') || '[]');
  const postedNormalJobs = JSON.parse(localStorage.getItem('careesOS_normal_jobs') || '[]');
  const allNormalJobs = [...normalJobs, ...postedNormalJobs];

  const allCandidates = [...normalCandidates, ...liveApplications];

  // Apply filters
  let filtered = allCandidates.filter(c => {
    if (filterJobId !== 'all' && c.jobId !== filterJobId) return false;
    if (filterRelocate !== 'Any' && c.answers?.gq_relocate !== filterRelocate) return false;
    if (filterAvail !== 'Any' && c.answers?.gq_status !== filterAvail) return false;
    if (filterSalary !== 'Any') {
      const cap = parseSalaryCap(filterSalary);
      const max = maxSalaryFromAnswer(c.answers?.gq_salary);
      if (max > cap) return false;
    }
    return true;
  });

  // Apply sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.submittedAt) - new Date(a.submittedAt);
    if (sortBy === 'oldest') return new Date(a.submittedAt) - new Date(b.submittedAt);
    const aExp = EXP_ORDER.indexOf(a.answers?.gq_experience || '');
    const bExp = EXP_ORDER.indexOf(b.answers?.gq_experience || '');
    if (sortBy === 'exp_asc') return aExp - bExp;
    if (sortBy === 'exp_desc') return bExp - aExp;
    return 0;
  });

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 py-3 border-b border-accent/10 flex-shrink-0 bg-surface/30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-xs text-text-muted hover:text-text transition-colors">← Home</button>
          <span className="text-text-muted text-xs">|</span>
          <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent">[T] Career OS V2</span>
          <span className="text-text-muted text-xs">·</span>
          <span className="text-xs text-text-secondary">Standard Recruiter Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/post/normal')} className="text-xs text-text-secondary hover:text-text border border-accent/20 px-3 py-1 rounded-full transition-colors">
            + Post Job
          </button>
          <button onClick={() => navigate('/reviewer/premium')} className="text-xs text-employer-accent hover:text-employer-accent/80 border border-employer-accent/30 px-3 py-1 rounded-full transition-colors">
            Premium Dashboard →
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-bg p-6">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {!selectedCandidate ? (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Standard Recruiter · Applicant List</span>
                  <h2 className="font-display text-2xl text-text mt-1">All Applicants</h2>
                  <p className="text-text-secondary text-sm mt-1">Filter and sort by screening question answers. Click an applicant to view their full submission.</p>
                </div>

                {/* Filters */}
                <div className="p-4 rounded-lg bg-surface border border-accent/10 space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-accent mb-2">Filters & Sorting</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Job Listing</label>
                      <select
                        value={filterJobId}
                        onChange={e => setFilterJobId(e.target.value)}
                        className="w-full bg-bg border border-accent/20 rounded px-2 py-1.5 text-text text-xs focus:outline-none focus:border-accent"
                      >
                        <option value="all">All Jobs</option>
                        {allNormalJobs.map(j => (
                          <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Salary Cap</label>
                      <select
                        value={filterSalary}
                        onChange={e => setFilterSalary(e.target.value)}
                        className="w-full bg-bg border border-accent/20 rounded px-2 py-1.5 text-text text-xs focus:outline-none focus:border-accent"
                      >
                        {FILTER_SALARY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Relocation</label>
                      <select
                        value={filterRelocate}
                        onChange={e => setFilterRelocate(e.target.value)}
                        className="w-full bg-bg border border-accent/20 rounded px-2 py-1.5 text-text text-xs focus:outline-none focus:border-accent"
                      >
                        {FILTER_RELOCATE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-muted uppercase tracking-wider mb-1">Availability</label>
                      <select
                        value={filterAvail}
                        onChange={e => setFilterAvail(e.target.value)}
                        className="w-full bg-bg border border-accent/20 rounded px-2 py-1.5 text-text text-xs focus:outline-none focus:border-accent"
                      >
                        {FILTER_AVAIL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-text-muted uppercase tracking-wider">Sort by:</label>
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="bg-bg border border-accent/20 rounded px-2 py-1 text-text text-xs focus:outline-none focus:border-accent"
                      >
                        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <span className="text-xs text-text-muted">{filtered.length} of {allCandidates.length} applicants shown</span>
                  </div>
                </div>

                {/* Applicant List */}
                {filtered.length === 0 ? (
                  <div className="p-8 text-center text-text-muted text-sm border border-accent/10 rounded-lg">
                    No applicants match the current filters.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((c, idx) => {
                      const jobData = allNormalJobs.find(j => j.id === c.jobId);
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCandidate(c)}
                          className="p-4 rounded-lg bg-surface border border-accent/10 hover:border-accent/30 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center text-accent font-mono text-xs">
                                {idx + 1}
                              </div>
                              <div>
                                <div className="text-text font-medium">{c.name}</div>
                                <div className="text-xs text-text-muted">
                                  {jobData && <span className="text-accent/70 mr-2">{jobData.title}</span>}
                                  Applied {timeAgo(c.submittedAt)}
                                  {c.email && <span className="text-text-muted"> · {c.email}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {c.resumeFile && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-success/10 text-success border border-success/20">
                                  📎 Resume
                                </span>
                              )}
                              <span className="text-accent text-lg group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                          </div>

                          {/* Key answer pills */}
                          <div className="flex flex-wrap gap-2">
                            {c.answers?.gq_salary && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-elevated text-text-secondary">
                                💰 {c.answers.gq_salary}
                              </span>
                            )}
                            {c.answers?.gq_experience && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-elevated text-text-secondary">
                                🕐 {c.answers.gq_experience}
                              </span>
                            )}
                            {c.answers?.gq_status && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${c.answers.gq_status === 'Immediately available' ? 'bg-success/10 text-success border border-success/20' : 'bg-elevated text-text-secondary'}`}>
                                {c.answers.gq_status === 'Immediately available' ? '✓ ' : ''}{c.answers.gq_status}
                              </span>
                            )}
                            {c.answers?.gq_relocate && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-elevated text-text-secondary">
                                📍 Relocate: {c.answers.gq_relocate}
                              </span>
                            )}
                            {c.answers?.gq_arrangement && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-elevated text-text-secondary">
                                🏢 {c.answers.gq_arrangement}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              /* CANDIDATE DETAIL VIEW */
              <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <button onClick={() => setSelectedCandidate(null)} className="text-xs text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
                  ← Back to Applicant List
                </button>

                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-3xl text-text">{selectedCandidate.name}</h2>
                    <div className="flex gap-4 text-xs text-text-muted mt-1">
                      {selectedCandidate.email && <span>✉ {selectedCandidate.email}</span>}
                      {selectedCandidate.phone && <span>✆ {selectedCandidate.phone}</span>}
                      <span>Applied {timeAgo(selectedCandidate.submittedAt)}</span>
                    </div>
                    {selectedCandidate.jobTitle && (
                      <div className="mt-1 text-xs text-accent/80">Applying for: {selectedCandidate.jobTitle}</div>
                    )}
                  </div>
                  {selectedCandidate.resumeFile && (
                    <div className="text-right">
                      <div className="text-xs text-text-muted mb-1">Resume Attached</div>
                      <span className="px-3 py-1.5 rounded-lg bg-success/10 border border-success/30 text-success text-xs font-medium">
                        📎 {selectedCandidate.resumeFile}
                      </span>
                    </div>
                  )}
                </div>

                {/* All screening question answers */}
                <div className="p-5 rounded-lg bg-surface border border-accent/10">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-accent mb-4">Screening Question Answers</h3>
                  <div className="space-y-3">
                    {genericQuestionPresets
                      .filter(q => selectedCandidate.answers?.[q.id] !== undefined)
                      .map(q => (
                        <div key={q.id} className="flex items-start gap-4 py-2 border-b border-accent/5 last:border-0">
                          <div className="flex-shrink-0 w-36 text-[10px] text-text-muted uppercase tracking-wider pt-0.5">{q.label}</div>
                          <div className="text-sm text-text">{selectedCandidate.answers[q.id]}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Reviewer Actions */}
                <div className="p-4 rounded-lg bg-employer-surface border border-employer-accent/20">
                  <h4 className="text-sm font-medium text-employer-accent mb-3">Reviewer Actions</h4>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded bg-employer-accent text-bg text-sm font-medium hover:opacity-90 transition-colors">Shortlist for Interview</button>
                    <button className="flex-1 py-2 rounded bg-elevated text-text-secondary text-sm font-medium hover:bg-highlight transition-colors">Reject</button>
                  </div>
                  <p className="text-[10px] text-text-muted mt-2 text-center">
                    Resume available above for human review.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
