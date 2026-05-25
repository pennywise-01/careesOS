const personaFeedback = {
  ahmad: {
    applications: [
      { id: 'af-1', roleTitle: 'Cloud Engineer', companyType: 'MNC Fin', stage: 'Interview ✓', outcome: 'pending', appliedAt: '2025-04-05' },
      { id: 'af-2', roleTitle: 'Cloud Support Associate', companyType: 'MNC Tech', stage: 'Offer received ✓', outcome: 'positive', appliedAt: '2025-03-20' },
      { id: 'af-3', roleTitle: 'DevOps Engineer', companyType: 'Startup', stage: 'Rejected ✗', outcome: 'negative', appliedAt: '2025-02-14' },
      { id: 'af-4', roleTitle: 'Systems Administrator', companyType: 'SME', stage: 'Applied', outcome: 'pending', appliedAt: '2025-04-10' },
    ],
    insights: [
      'IT Support professionals who earned AWS/Terraform certs received 3x more Cloud Engineer interview invitations.',
      '87% of Cloud Engineers in KL who started from IT Support moved internally — internal transfers had higher success rates.',
      'Candidates matching your trajectory who included a project portfolio received 42% more responses.',
    ],
  },
  priya: {
    applications: [
      { id: 'pf-1', roleTitle: 'People Analytics Associate', companyType: 'MNC Tech', stage: 'Interview ✓', outcome: 'pending', appliedAt: '2025-04-02' },
      { id: 'pf-2', roleTitle: 'HR Operations Lead', companyType: 'MNC Fin', stage: 'Rejected ✗', outcome: 'negative', appliedAt: '2025-03-10' },
      { id: 'pf-3', roleTitle: 'Junior Data Analyst (HR)', companyType: 'Startup', stage: 'Applied', outcome: 'pending', appliedAt: '2025-04-08' },
    ],
    insights: [
      'Psychology graduates who added SQL and Python to their HR toolkit received 2.8x more analytics role offers.',
      'Companies in Singapore are scaling People Analytics teams — demand up 22% since 2024.',
      'Profiles with both HR experience and technical skills command 35% higher starting salaries in analytics roles.',
    ],
  },
  david: {
    applications: [
      { id: 'df-1', roleTitle: 'Engineering Manager', companyType: 'MNC Tech', stage: 'Interview ✓', outcome: 'pending', appliedAt: '2025-04-01' },
      { id: 'df-2', roleTitle: 'Tech Lead', companyType: 'Startup', stage: 'Offer received ✓', outcome: 'positive', appliedAt: '2025-03-15' },
      { id: 'df-3', roleTitle: 'VP Engineering', companyType: 'GLC', stage: 'Rejected ✗', outcome: 'negative', appliedAt: '2025-02-05' },
      { id: 'df-4', roleTitle: 'Solutions Architect', companyType: 'MNC', stage: 'Applied', outcome: 'pending', appliedAt: '2025-04-05' },
    ],
    insights: [
      'Senior engineers with 10+ years who formally documented mentoring experience moved into management 2x faster.',
      'GLCs tend to hire engineering managers from within — targeting MNCs or startups has better odds for external candidates.',
      '68% of Engineering Managers at your level who stayed at the same company for &gt;3 years were promoted internally first.',
    ],
  },
  siti: {
    applications: [
      { id: 'sf-1', roleTitle: 'Head of Marketing', companyType: 'MNC', stage: 'Interview ✓', outcome: 'pending', appliedAt: '2025-03-28' },
      { id: 'sf-2', roleTitle: 'CMO', companyType: 'GLC', stage: 'Applied', outcome: 'pending', appliedAt: '2025-04-01' },
      { id: 'sf-3', roleTitle: 'Marketing Consultant', companyType: 'Consulting', stage: 'Rejected ✗', outcome: 'negative', appliedAt: '2025-02-18' },
    ],
    insights: [
      'Marketing executives with 15+ years who pivoted to consulting saw 40% income growth within 2 years.',
      'Property and construction sectors in Malaysia are actively seeking board-level marketing expertise.',
      'Senior leaders who built a personal brand on LinkedIn received 3x more inbound executive role inquiries.',
    ],
  },
  student: {
    applications: [
      { id: 'stf-1', roleTitle: 'Internship Application', companyType: 'MNC', stage: 'Applied', outcome: 'pending', appliedAt: '2025-04-10' },
    ],
    insights: [
      'Students who completed 2+ internships before graduating received 60% more full-time offers.',
      'Asia-Pacific employers rank communication skills above technical skills for entry-level hires.',
      'Join industry communities early — 40% of graduate hires came through referrals.',
    ],
  },
  young_adult: {
    applications: [
      { id: 'yf-1', roleTitle: 'Junior Developer', companyType: 'Startup', stage: 'Offered', outcome: 'positive', appliedAt: '2025-04-01' },
    ],
    insights: [
      'Early career professionals who switch companies every 2–3 years see 25% higher salary growth.',
      'Your first 5 years are the highest-ROI period for skill investment — each new skill compounds.',
    ],
  },
  early_career: {
    applications: [
      { id: 'ec-1', roleTitle: 'Mid-level Role', companyType: 'MNC', stage: 'Interview ✓', outcome: 'pending', appliedAt: '2025-04-05' },
      { id: 'ec-2', roleTitle: 'Senior Role', companyType: 'Startup', stage: 'Applied', outcome: 'pending', appliedAt: '2025-04-02' },
    ],
    insights: [
      'Professionals in their 30s who specialized in one technical domain + one business domain were promoted fastest.',
      'Mid-career is the best window for MNC-to-startup or startup-to-MNC transitions.',
    ],
  },
  mid_career: {
    applications: [
      { id: 'mc-1', roleTitle: 'Senior Leadership Role', companyType: 'MNC', stage: 'Applied', outcome: 'pending', appliedAt: '2025-04-01' },
    ],
    insights: [
      'Leadership experience, not tenure, is the strongest predictor of executive promotion.',
      'At your career stage, network quality matters more than skill count for career moves.',
    ],
  },
  senior_career: {
    applications: [
      { id: 'sc-1', roleTitle: 'Executive Role', companyType: 'MNC', stage: 'Applied', outcome: 'pending', appliedAt: '2025-04-01' },
    ],
    insights: [
      'Senior professionals who mentor or advise startups report higher career satisfaction.',
      'Board positions open up 5x faster through warm introductions than cold applications.',
    ],
  },
  executive: {
    applications: [],
    insights: [
      'At the executive level, career moves are driven by network and reputation, not applications.',
      'Consider advisory board roles to expand influence across industries.',
    ],
  },
};

export function getPersonaFeedback(personaId, chapter) {
  if (personaId && personaFeedback[personaId]) return personaFeedback[personaId];
  if (chapter && personaFeedback[chapter]) return personaFeedback[chapter];
  return personaFeedback.early_career;
}
