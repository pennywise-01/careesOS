import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const paths = [
  {
    role: 'applicant',
    tier: 'normal',
    route: '/apply/normal',
    label: 'Job Seeker',
    sublabel: 'Standard',
    badge: null,
    description: 'Browse standard job listings and apply with your resume and a few quick questions.',
    features: ['Upload your resume', 'Answer short screening questions', 'Apply to standard job listings'],
    cta: 'Browse Jobs',
    accentClass: 'border-accent/30 hover:border-accent/60',
    badgeClass: '',
    ctaClass: 'bg-elevated text-text hover:bg-highlight',
    iconLabel: '◈',
  },
  {
    role: 'applicant',
    tier: 'premium',
    route: '/apply/premium',
    label: 'Job Seeker',
    sublabel: 'Premium',
    badge: 'PREMIUM',
    description: 'Stand out with an AI-verified skills profile. Complete work samples that prove your abilities — not just claim them.',
    features: [
      'AI-extracted evidence-based skill profile',
      'Work sample assessment graded by AI',
      'Job match % score for premium listings',
      'Access to all job listings',
    ],
    cta: 'Get Started',
    accentClass: 'border-accent/60 hover:border-accent ring-1 ring-accent/20',
    badgeClass: 'bg-accent/10 text-accent border border-accent/30',
    ctaClass: 'bg-accent text-bg hover:bg-accent-hover',
    iconLabel: '◆',
  },
  {
    role: 'recruiter',
    tier: 'normal',
    route: '/post/normal',
    label: 'Recruiter',
    sublabel: 'Standard',
    badge: null,
    description: 'Post standard job listings with customizable screening questions. Review applicants and their resume at your own pace.',
    features: ['Post standard job listings', 'Choose generic screening questions', 'View applicant answers and resumes', 'Filter by availability, salary, relocation'],
    cta: 'Post a Job',
    accentClass: 'border-employer-accent/30 hover:border-employer-accent/60',
    badgeClass: '',
    ctaClass: 'bg-elevated text-text hover:bg-highlight',
    iconLabel: '◈',
  },
  {
    role: 'recruiter',
    tier: 'premium',
    route: '/post/premium',
    label: 'Recruiter',
    sublabel: 'Premium',
    badge: 'PREMIUM',
    description: 'Use AI screening to rank applicants by verified skills — not just keywords. Let the work sample do the shortlisting.',
    features: [
      'Premium-tagged job listings',
      'Custom open-ended narrative questions',
      'AI-graded work sample assessments',
      'Composite match score per applicant',
      'Post-hire feedback loop & weight retraining',
    ],
    cta: 'Post a Premium Job',
    accentClass: 'border-employer-accent/60 hover:border-employer-accent ring-1 ring-employer-accent/20',
    badgeClass: 'bg-employer-accent/10 text-employer-accent border border-employer-accent/30',
    ctaClass: 'bg-employer-accent text-bg hover:opacity-90',
    iconLabel: '◆',
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-accent/10">
        <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent">[T] Career OS V2</span>
        <span className="text-xs text-text-muted">Prototype · Select your path</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-4xl text-text mb-3">Welcome to CareerOS</h1>
          <p className="text-text-secondary max-w-lg mx-auto text-sm leading-relaxed">
            A next-generation talent platform built on verified skills, not keywords.
            Choose your role and tier below.
          </p>
        </motion.div>

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Group label — Applicants */}
          <div className="md:col-span-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-3 text-center">Job Seekers</div>
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
              {paths.filter(p => p.role === 'applicant').map(path => (
                <PathCard key={path.route} path={path} onNavigate={() => navigate(path.route)} />
              ))}
            </motion.div>
          </div>

          {/* Group label — Recruiters */}
          <div className="md:col-span-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-3 text-center">Recruiters</div>
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
              {paths.filter(p => p.role === 'recruiter').map(path => (
                <PathCard key={path.route} path={path} onNavigate={() => navigate(path.route)} />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Reviewer shortcut */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex gap-6 text-xs text-text-muted"
        >
          <button onClick={() => navigate('/reviewer/normal')} className="hover:text-text transition-colors underline underline-offset-2">
            Normal Reviewer Dashboard →
          </button>
          <button onClick={() => navigate('/reviewer/premium')} className="hover:text-accent transition-colors underline underline-offset-2">
            Premium Reviewer Dashboard →
          </button>
        </motion.div>
      </main>
    </div>
  );
}

function PathCard({ path, onNavigate }) {
  return (
    <motion.div
      variants={cardVariants}
      onClick={onNavigate}
      className={`p-5 rounded-xl bg-surface border cursor-pointer transition-all group ${path.accentClass}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg ${path.tier === 'premium' ? 'text-accent' : 'text-text-muted'}`}>{path.iconLabel}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-text font-medium text-sm">{path.label}</span>
              {path.badge && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${path.badgeClass}`}>
                  {path.badge}
                </span>
              )}
            </div>
            <div className="text-[10px] text-text-muted font-mono uppercase tracking-wider">{path.sublabel}</div>
          </div>
        </div>
        <span className="text-text-muted group-hover:text-text text-lg transition-transform group-hover:translate-x-0.5">→</span>
      </div>

      <p className="text-text-secondary text-xs leading-relaxed mb-4">{path.description}</p>

      <ul className="space-y-1 mb-4">
        {path.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px] text-text-secondary">
            <span className="text-accent/60 mt-0.5 flex-shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={e => { e.stopPropagation(); onNavigate(); }}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${path.ctaClass}`}
      >
        {path.cta}
      </button>
    </motion.div>
  );
}
