import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Answer, don\'t paste',
    body: 'Instead of uploading a keyword-stuffed resume, premium applicants answer 6 narrative questions about real work they\'ve done.',
  },
  {
    number: '02',
    title: 'Prove it with a task',
    body: 'Complete a short, role-specific work sample. Your actual reasoning is graded by AI — not just your word count.',
  },
  {
    number: '03',
    title: 'Get matched by evidence',
    body: 'A composite score is calculated across skill coverage, evidence quality, verification, and culture fit — visible to both you and the reviewer.',
  },
];

const comparison = [
  { label: 'Application method',     standard: 'Resume + screening Qs', premium: '6 narrative questions + work sample' },
  { label: 'AI skill extraction',    standard: '—',                      premium: 'Evidence-based, confidence-scored' },
  { label: 'Skill verification',     standard: '—',                      premium: 'Graded practical task' },
  { label: 'Match score',            standard: '—',                      premium: 'Composite score (4 factors)' },
  { label: 'Match % on listings',    standard: '—',                      premium: 'Visible before you apply' },
  { label: 'Reviewer ranking',       standard: 'Manual',                 premium: 'AI-ranked by composite score' },
];

const pathButtons = [
  {
    route: '/apply/normal',
    label: 'Job Seeker',
    sublabel: 'Standard',
    description: 'Resume + screening questions.',
    badge: null,
    cardClass: 'border-accent/15 hover:border-accent/40 hover:bg-surface',
    sublabelClass: 'text-text-muted',
  },
  {
    route: '/apply/premium',
    label: 'Job Seeker',
    sublabel: 'Premium',
    description: 'AI profile + work sample + match score.',
    badge: 'PREMIUM',
    cardClass: 'border-accent/40 hover:border-accent bg-accent/5 hover:bg-accent/10',
    sublabelClass: 'text-accent',
    badgeClass: 'bg-accent/10 text-accent border border-accent/30',
  },
  {
    route: '/post/normal',
    label: 'Job Advertiser',
    sublabel: 'Standard',
    description: 'Post a listing with screening questions.',
    badge: null,
    cardClass: 'border-employer-accent/15 hover:border-employer-accent/40 hover:bg-surface',
    sublabelClass: 'text-text-muted',
  },
  {
    route: '/advertiser/premium',
    label: 'Job Advertiser',
    sublabel: 'Premium',
    description: 'Post jobs or review AI-ranked applicants.',
    badge: 'PREMIUM',
    cardClass: 'border-employer-accent/40 hover:border-employer-accent bg-employer-accent/5 hover:bg-employer-accent/10',
    sublabelClass: 'text-employer-accent',
    badgeClass: 'bg-employer-accent/10 text-employer-accent border border-employer-accent/30',
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, delay },
});

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-accent/10 bg-bg/80 backdrop-blur-sm">
        <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent">Career OS V2</span>
        <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider px-2 py-1 rounded border border-accent/20">Prototype</span>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 max-w-3xl mx-auto">
          <motion.div {...fadeUp(0)}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-mono uppercase tracking-widest mb-6">
              Verified skills · not keywords
            </div>
            <h1 className="font-display text-5xl md:text-6xl text-text leading-tight mb-5">
              Hiring that rewards<br />what you can actually do
            </h1>
            <p className="text-text-secondary text-base max-w-xl mx-auto leading-relaxed">
              CareerOS replaces keyword-matching with an AI pipeline that extracts evidence
              from how you describe your work — then verifies it with a real task.
            </p>
          </motion.div>
        </section>

        {/* ── The Problem ── */}
        <section className="border-t border-accent/10 py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeUp(0)} className="mb-12 text-center">
              <div className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">The Problem</div>
              <h2 className="font-display text-3xl text-text mb-4">Resumes reward writers,<br />not workers</h2>
              <p className="text-text-secondary text-sm max-w-lg mx-auto leading-relaxed">
                Most hiring tools rank candidates by how many keywords they fit into a PDF.
                This creates a race to optimise language — not demonstrate competence.
                The best candidate rarely has the best-formatted resume.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { stat: '72%', label: 'of qualified candidates are filtered out by ATS before a human sees their application' },
                { stat: '3×', label: 'more predictive work sample assessments are vs. resume screening alone' },
                { stat: '0', label: 'resume keywords are parsed by CareerOS — only your narrative and your work' },
              ].map((item, i) => (
                <motion.div key={i} {...fadeUp(i * 0.08)} className="p-5 rounded-xl bg-surface border border-accent/10 text-center">
                  <div className="font-display text-4xl text-accent mb-2">{item.stat}</div>
                  <p className="text-xs text-text-secondary leading-relaxed">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="border-t border-accent/10 py-20 px-6 bg-surface/30">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeUp(0)} className="mb-12 text-center">
              <div className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">How It Works</div>
              <h2 className="font-display text-3xl text-text">Three layers. One honest score.</h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                <motion.div key={i} {...fadeUp(i * 0.1)} className="flex flex-col gap-3">
                  <div className="text-3xl font-mono text-accent/30 font-bold">{step.number}</div>
                  <h3 className="text-base font-medium text-text">{step.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{step.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Standard vs Premium ── */}
        <section className="border-t border-accent/10 py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeUp(0)} className="mb-10 text-center">
              <div className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Tiers</div>
              <h2 className="font-display text-3xl text-text">Standard or Premium?</h2>
            </motion.div>
            <motion.div {...fadeUp(0.1)} className="rounded-xl bg-surface border border-accent/10 overflow-hidden">
              <div className="grid grid-cols-3 bg-elevated px-5 py-3 text-[10px] font-mono uppercase tracking-wider">
                <div className="text-text-muted">Feature</div>
                <div className="text-text-muted text-center">Standard</div>
                <div className="text-accent text-center">Premium</div>
              </div>
              {comparison.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 px-5 py-3.5 text-sm border-t border-accent/5 ${i % 2 === 0 ? '' : 'bg-bg/30'}`}
                >
                  <div className="text-text-secondary text-xs">{row.label}</div>
                  <div className="text-center text-xs text-text-muted">{row.standard}</div>
                  <div className="text-center text-xs text-accent font-medium">{row.premium}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="border-t border-accent/10 py-20 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <motion.div {...fadeUp(0)}>
              <h2 className="font-display text-3xl text-text mb-4">Ready to try it?</h2>
              <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                Pick your path below. The full premium flow — from narrative extraction to composite score — takes about 20 minutes.
              </p>
            </motion.div>
            <motion.div {...fadeUp(0.1)} className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {pathButtons.map((btn, i) => (
                <button
                  key={btn.route}
                  onClick={() => navigate(btn.route)}
                  className={`group text-left p-5 rounded-xl bg-surface border transition-all ${btn.cardClass}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-text">{btn.label}</span>
                        {btn.badge && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${btn.badgeClass}`}>
                            {btn.badge}
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] font-mono uppercase tracking-wider ${btn.sublabelClass}`}>{btn.sublabel}</div>
                    </div>
                    <span className="text-text-muted group-hover:text-text text-sm transition-all group-hover:translate-x-0.5 mt-0.5">→</span>
                  </div>
                  <p className="text-xs text-text-secondary">{btn.description}</p>
                </button>
              ))}
            </motion.div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-accent/10 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Career OS V2 · Prototype</span>
        <div className="flex gap-5 text-xs text-text-muted">
          <button onClick={() => navigate('/reviewer/normal')} className="hover:text-text transition-colors underline underline-offset-2">
            Reviewer (Standard)
          </button>
          <button onClick={() => navigate('/reviewer/premium')} className="hover:text-accent transition-colors underline underline-offset-2">
            Reviewer (Premium)
          </button>
        </div>
      </footer>
    </div>
  );
}
