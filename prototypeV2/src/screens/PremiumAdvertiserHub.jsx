import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PremiumAdvertiserHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="flex items-center justify-between px-5 py-3 border-b border-accent/10 bg-surface/30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-xs text-text-muted hover:text-text transition-colors">← Home</button>
          <span className="text-text-muted text-xs">|</span>
          <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent">[T] Career OS V2</span>
          <span className="text-text-muted text-xs">·</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-employer-accent/10 text-employer-accent border border-employer-accent/30">PREMIUM</span>
          <span className="text-xs text-text-secondary">Job Advertiser</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full space-y-8 text-center"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-employer-accent/10 border border-employer-accent/20 text-employer-accent text-[10px] font-mono uppercase tracking-widest mb-4">
              Premium Advertiser Portal
            </div>
            <h1 className="font-display text-3xl text-text mb-2">What would you like to do?</h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              Post a new role or review AI-ranked applications from premium candidates.
            </p>
          </div>

          <div className="grid gap-4">
            <button
              onClick={() => navigate('/post/premium')}
              className="group p-6 rounded-xl bg-surface border border-employer-accent/20 hover:border-employer-accent/50 hover:bg-employer-accent/5 transition-all text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-employer-accent/10 border border-employer-accent/20 flex items-center justify-center text-lg">+</div>
                <span className="text-text-muted group-hover:text-employer-accent text-sm transition-colors mt-1">→</span>
              </div>
              <h3 className="text-base font-medium text-text mb-1">Post a New Job</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Create a premium listing with required skills and team context. Premium applicants will be AI-ranked by composite match score.
              </p>
            </button>

            <button
              onClick={() => navigate('/reviewer/premium')}
              className="group p-6 rounded-xl bg-surface border border-accent/15 hover:border-accent/40 hover:bg-accent/5 transition-all text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-lg font-mono text-accent text-sm">#</div>
                <span className="text-text-muted group-hover:text-accent text-sm transition-colors mt-1">→</span>
              </div>
              <h3 className="text-base font-medium text-text mb-1">Review Applicants</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                View candidates ranked by their AI composite score — based on open-ended answers and work sample grading.
              </p>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
