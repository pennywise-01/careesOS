import { motion } from 'framer-motion';
import { useApp } from '../store/AppContext';
import { personas, chapters } from '../data/personas';

const bubbleVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: i => ({
    opacity: 1, y: 0,
    transition: { delay: 0.1 + i * 0.1, duration: 0.5 }
  }),
};

export default function Landing() {
  const { dispatch } = useApp();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl w-full"
      >
        <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-accent mb-6">
          [T] Career OS by Talentbank
        </div>

        <h1 className="font-display text-4xl md:text-5xl text-text leading-tight mb-4">
          &ldquo;For most of us,<br />no one tells us what&apos;s next.&rdquo;
        </h1>

        <p className="text-text-secondary text-lg mb-12">
          Career OS is the co-pilot you never had.
        </p>

        {/* CHAPTER SELECTION — creates blank profile */}
        <div className="border border-accent/10 rounded-2xl p-6 bg-surface/40 mb-8 max-w-lg mx-auto">
          <div className="font-mono text-[10px] uppercase tracking-wider text-accent mb-1">Start Fresh</div>
          <h2 className="font-display text-xl mb-1">Where are you in your career?</h2>
          <p className="text-sm text-text-secondary mb-5">
            Pick your stage and tell us about yourself — we&apos;ll map your paths from scratch.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {chapters.map((ch, i) => (
              <motion.button
                key={ch.id}
                custom={i}
                variants={bubbleVariants}
                initial="hidden"
                animate="visible"
                onClick={() => dispatch({ type: 'SELECT_CHAPTER', chapterId: ch.id })}
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl bg-surface border border-accent/10 hover:border-accent/30 hover:bg-elevated transition-all duration-200 cursor-pointer"
              >
                <span className="font-mono text-xs text-accent mb-1">{ch.age}</span>
                <span className="text-sm font-medium text-text">{ch.label}</span>
                <span className="text-[10px] text-text-muted mt-1 text-center leading-tight">{ch.desc}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* DEMO PERSONAS — loads pre-filled data */}
        <div className="border border-accent/10 rounded-2xl p-6 bg-surface/40 mb-8 max-w-lg mx-auto">
          <div className="font-mono text-[10px] uppercase tracking-wider text-accent mb-1">Quick Demo</div>
          <h2 className="font-display text-xl mb-1">See it in action</h2>
          <p className="text-sm text-text-secondary mb-5">
            Jump into a pre-filled profile to explore the full experience with realistic data.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {personas.map(p => (
              <button
                key={p.id}
                onClick={() => dispatch({ type: 'SELECT_PERSONA', id: p.id })}
                className="px-4 py-2 rounded-lg bg-surface border border-accent/10 hover:border-accent/30 hover:bg-elevated transition-all text-sm text-text-secondary hover:text-text"
              >
                {p.name} · {p.chapterLabel}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => dispatch({ type: 'TOGGLE_EMPLOYER' })}
          className="px-4 py-2 rounded-lg bg-surface border border-employer-accent/20 hover:border-employer-accent/50 text-employer-accent text-sm font-medium transition-all"
        >
          Switch to Employer View →
        </button>
      </motion.div>
    </div>
  );
}
