import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../store/AppContext';
import { getPersonaFeedback } from '../data/feedback';

export default function FeedbackLoop() {
  const { state } = useApp();
  const persona = state.currentPersona;
  const [showLogForm, setShowLogForm] = useState(false);
  const [newApp, setNewApp] = useState({ roleTitle: '', companyType: '', stage: 'Applied' });
  const [logged, setLogged] = useState([]);

  if (!persona) return null;

  const fb = getPersonaFeedback(persona.id, persona.chapter);

  const handleLog = () => {
    if (!newApp.roleTitle.trim()) return;
    setLogged(prev => [{
      id: `log-${Date.now()}`,
      roleTitle: newApp.roleTitle,
      companyType: newApp.companyType || 'Other',
      stage: `${newApp.stage} ⏳`,
      outcome: 'pending',
      appliedAt: new Date().toISOString().split('T')[0],
    }, ...prev]);
    setNewApp({ roleTitle: '', companyType: '', stage: 'Applied' });
    setShowLogForm(false);
  };

  const allApps = [...logged, ...fb.applications];

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-accent mb-1">04 · Feedback</div>
        <h3 className="font-display text-xl">Application Tracker</h3>
        <p className="text-sm text-text-secondary">{persona.name}'s outcomes drive smarter recommendations</p>
      </div>

      <div className="bg-surface rounded-xl border border-accent/10 overflow-hidden">
        <div className="grid grid-cols-4 text-[10px] font-mono uppercase tracking-wider text-text-muted bg-elevated px-4 py-3">
          <span>Role</span>
          <span>Company</span>
          <span>Stage</span>
          <span>Outcome</span>
        </div>
        {allApps.map(app => (
          <div key={app.id} className="grid grid-cols-4 px-4 py-3 border-t border-accent/5 text-sm">
            <span className="text-text">{app.roleTitle}</span>
            <span className="text-text-secondary">{app.companyType}</span>
            <span className="text-text-secondary">{app.stage}</span>
            <span className={app.outcome === 'positive' ? 'text-success' : app.outcome === 'negative' ? 'text-danger' : 'text-accent'}>
              {app.outcome === 'positive' ? '✓ Positive' : app.outcome === 'negative' ? '✗ Negative' : '○ Pending'}
            </span>
          </div>
        ))}
        {allApps.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-text-muted">No applications logged yet.</div>
        )}
      </div>

      <AnimatePresence>
        {showLogForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-surface rounded-xl p-4 border border-accent/10 space-y-3 overflow-hidden"
          >
            <div className="font-mono text-[10px] uppercase tracking-wider text-accent">Log New Application</div>
            <input
              value={newApp.roleTitle}
              onChange={e => setNewApp({ ...newApp, roleTitle: e.target.value })}
              placeholder="Role title"
              className="w-full bg-bg border border-accent/10 rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted outline-none focus:border-accent/40"
            />
            <select
              value={newApp.companyType}
              onChange={e => setNewApp({ ...newApp, companyType: e.target.value })}
              className="w-full bg-bg border border-accent/10 rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-accent/40"
            >
              <option value="">Company type</option>
              <option>MNC</option>
              <option>MNC Fin</option>
              <option>MNC Tech</option>
              <option>Startup</option>
              <option>SME</option>
              <option>GLC</option>
              <option>Consulting</option>
            </select>
            <select
              value={newApp.stage}
              onChange={e => setNewApp({ ...newApp, stage: e.target.value })}
              className="w-full bg-bg border border-accent/10 rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-accent/40"
            >
              <option>Applied</option>
              <option>Interview</option>
              <option>Offer received</option>
              <option>Rejected</option>
              <option>Accepted</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowLogForm(false)} className="flex-1 py-2 rounded-lg bg-elevated text-text-muted text-sm hover:text-text transition-colors">
                Cancel
              </button>
              <button onClick={handleLog} className="flex-1 py-2 rounded-lg bg-accent text-[#0d1f1a] font-semibold text-sm hover:bg-accent-hover transition-all">
                Log Application
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-surface rounded-xl p-4 border border-accent/10">
        <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-3">
          Insights for {persona.name || 'you'}
        </div>
        <div className="space-y-3">
          {fb.insights.map((insight, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="mt-0.5 flex-shrink-0">💡</span>
              <span className="text-text-secondary">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowLogForm(!showLogForm)}
        className="w-full py-3 rounded-lg bg-accent text-[#0d1f1a] font-semibold text-sm hover:bg-accent-hover transition-all"
      >
        {showLogForm ? '✕ Cancel' : '+ Log New Application'}
      </button>
    </div>
  );
}
