export const candidates = [
  {
    id: "c1",
    name: "Alice Chen",
    skills: [
      { name: "Kubernetes", evidence_quote: "migrated 3-node cluster to EKS, reduced deploy time from 45 min to 8 min", inferred_level: "senior", confidence: 0.87, verified: true, verified_score: 0.85 },
      { name: "Python", evidence_quote: "wrote async microservices handling 10k req/s", inferred_level: "senior", confidence: 0.90, verified: true, verified_score: 0.92 }
    ],
    work_context: { preferred_team_size: "5-15", preferred_pace: "balanced", autonomy_level: "high" },
    goals: { direction: "technical leadership", anti_preferences: ["pure management"] },
    embedding_mock: [0.1, 0.8, 0.3, 0.9]
  },
  {
    id: "c2",
    name: "Bob Smith",
    skills: [
      { name: "AWS", evidence_quote: "used AWS for hosting", inferred_level: "mid", confidence: 0.60, verified: false, verified_score: null },
      { name: "Python", evidence_quote: "built scripts for data processing", inferred_level: "mid", confidence: 0.65, verified: false, verified_score: null }
    ],
    work_context: { preferred_team_size: "20+", preferred_pace: "execution-focused", autonomy_level: "medium" },
    goals: { direction: "stable corporate role", anti_preferences: ["startups"] },
    embedding_mock: [0.2, 0.5, 0.4, 0.6]
  },
  {
    id: "c3",
    name: "Charlie Davis",
    skills: [
      { name: "Kubernetes", evidence_quote: "read documentation about Kubernetes", inferred_level: "junior", confidence: 0.40, verified: false, verified_score: null },
      { name: "Python", evidence_quote: "completed a Python tutorial", inferred_level: "junior", confidence: 0.50, verified: false, verified_score: null }
    ],
    work_context: { preferred_team_size: "5-15", preferred_pace: "balanced", autonomy_level: "low" },
    goals: { direction: "learning and growth", anti_preferences: ["high pressure"] },
    embedding_mock: [0.15, 0.7, 0.3, 0.8]
  }
];

export const job = {
  id: "j1",
  title: "Senior Platform Engineer",
  required_skills: [
    { name: "Kubernetes", level: "senior", non_negotiable: true },
    { name: "Python", level: "senior", non_negotiable: true }
  ],
  team_context: { size: 8, pace: "balanced", autonomy_offered: "high" },
  embedding_mock: [0.15, 0.85, 0.35, 0.88]
};

export const outcomes = [
  {
    match_id: "m1",
    candidate_id: "c1",
    job_id: "j1",
    manager_rating_90d: 5,
    hire_satisfaction_90d: 5,
    retained_180d: true,
    label: "successful",
    verification_score_at_hire: 0.85
  },
  {
    match_id: "m2",
    candidate_id: "c2",
    job_id: "j1",
    manager_rating_90d: 2,
    hire_satisfaction_90d: 3,
    retained_180d: false,
    label: "poor",
    verification_score_at_hire: 0.30
  }
];