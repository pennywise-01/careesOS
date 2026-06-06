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

export const jobs = [
  {
    id: "j1",
    title: "Senior Platform Engineer",
    department: "Platform Engineering",
    type: "Full-time · Hybrid",
    required_skills: [
      { name: "Kubernetes", level: "senior", non_negotiable: true },
      { name: "Python", level: "senior", non_negotiable: true }
    ],
    team_context: { size: 8, pace: "balanced", autonomy_offered: "high" },
    embedding_mock: [0.15, 0.85, 0.35, 0.88],
    questionnaire: [
      { id: "q1", label: "1. Proudest Work", question: "Tell me about a piece of engineering work you're most proud of. What was the problem? What did you specifically do — not your team, you? What changed as a result?" },
      { id: "q2", label: "2. Technical Complexity", question: "Describe the most technically complex system you've built or debugged. Walk me through your approach." },
      { id: "q3", label: "3. Work Environment", question: "What kind of engineering environment do you do your best work in? Think about team size, pace, on-call culture, and how much ambiguity you're comfortable with." },
      { id: "q4", label: "4. Career Trajectory", question: "What are you trying to move toward in your engineering career in the next 2 years? And what are you actively trying to move away from?" },
      { id: "q5", label: "5. Failure & Learning", question: "Tell me about a system or infrastructure change you made that failed or caused an incident. What happened, and what did you do about it?" },
      { id: "q6", label: "6. Domain Approach", question: "Walk me through how you approach reliability and security hardening for a new cloud-native system." }
    ],
    work_sample_task: "Task: EKS IAM Policy Audit & Optimization\nThe candidate must: (1) identify the security flaw in a policy granting s3:* on *, (2) write a corrected least-privilege IAM policy, (3) explain their reasoning and any edge cases.",
    work_sample: {
      title: "Task: EKS IAM Policy Audit & Optimization",
      time_limit: "45 min",
      context: "You are reviewing a Terraform module for a new microservice. The current IAM policy grants overly broad permissions to the pod execution role.",
      steps: [
        "Identify the security flaw in the provided JSON policy below.",
        "Write the corrected, least-privilege IAM policy.",
        "Briefly explain your reasoning and any edge cases considered."
      ],
      artifact: `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "s3:*",\n      "Resource": "*"\n    }\n  ]\n}`,
      artifact_type: "code",
      placeholder: "1. Flaw identified: ...\n2. Corrected policy: ...\n3. Reasoning: ..."
    }
  },
  {
    id: "j2",
    title: "HR Business Partner",
    department: "People & Culture",
    type: "Full-time · On-site",
    required_skills: [
      { name: "Employee Relations", level: "senior", non_negotiable: true },
      { name: "Talent Management", level: "mid", non_negotiable: true }
    ],
    team_context: { size: 5, pace: "balanced", autonomy_offered: "medium" },
    embedding_mock: [0.20, 0.60, 0.40, 0.70],
    questionnaire: [
      { id: "q1", label: "1. Proudest HR Initiative", question: "Tell me about an HR initiative or program you're most proud of driving. What was the business problem? What specifically did you design or implement? What changed as a result?" },
      { id: "q2", label: "2. Difficult Employee Situation", question: "Describe the most complex or sensitive employee relations case you've handled. Walk me through how you approached it and the outcome." },
      { id: "q3", label: "3. Work Style", question: "What kind of organisation do you do your best HR work in? Think about company size, leadership culture, pace of change, and how much autonomy you're given." },
      { id: "q4", label: "4. Career Trajectory", question: "Where are you trying to take your HR career in the next 2 years? What kinds of work or environments are you actively stepping away from?" },
      { id: "q5", label: "5. When a Policy Failed", question: "Tell me about a time an HR policy, process, or programme you led underperformed or backfired. What happened and what did you learn?" },
      { id: "q6", label: "6. Approach to Talent Strategy", question: "Walk me through how you approach building a talent pipeline and retention strategy for a fast-growing team." }
    ],
    work_sample_task: "Task: Employee Retention Analysis\nA department has 35% turnover in 6 months. The candidate must: (1) identify the top 3 likely root causes based on common HR patterns, (2) propose a 90-day action plan with specific interventions, (3) explain how they would measure success.",
    work_sample: {
      title: "Task: Employee Retention Analysis",
      time_limit: "40 min",
      context: "You are the incoming HR Business Partner for the Product Engineering department. The department head has shared that 7 out of 20 employees have resigned in the last 6 months. Exit interview data is incomplete. You have access to tenure data, compensation bands, and eNPS scores by manager.",
      steps: [
        "Identify the top 3 most likely root causes of the turnover spike, based on common HR patterns.",
        "Propose a concrete 90-day action plan with specific interventions, owners, and timelines.",
        "Explain how you would measure the success of your interventions at 30, 60, and 90 days."
      ],
      artifact: "Dept size: 20 · Resignations (6 months): 7\neNPS by manager: Mgr A: +42, Mgr B: -15, Mgr C: +10\nAvg tenure of leavers: 14 months\nComp band vs market: -8% at senior level\nLast promotion cycle: 11 months ago (0 promotions in this dept)",
      artifact_type: "text",
      placeholder: "1. Root causes identified: ...\n2. 90-day action plan: ...\n3. Success metrics at 30/60/90 days: ..."
    }
  },
  {
    id: "j3",
    title: "Operations Administrator",
    department: "Operations",
    type: "Full-time · On-site",
    required_skills: [
      { name: "Process Management", level: "mid", non_negotiable: true },
      { name: "Stakeholder Coordination", level: "mid", non_negotiable: false }
    ],
    team_context: { size: 12, pace: "execution-focused", autonomy_offered: "medium" },
    embedding_mock: [0.18, 0.55, 0.30, 0.65],
    questionnaire: [
      { id: "q1", label: "1. Process You Improved", question: "Tell me about an operational process you improved or built from scratch. What was broken or missing? What exactly did you change? What was the measurable outcome?" },
      { id: "q2", label: "2. Most Complex Coordination", question: "Describe the most complex cross-functional or multi-stakeholder project you've managed. How did you keep it on track?" },
      { id: "q3", label: "3. Work Environment", question: "What kind of operational environment do you thrive in? Think about team structure, pace, how decisions get made, and how you handle shifting priorities." },
      { id: "q4", label: "4. Career Trajectory", question: "What are you aiming to grow into in operations over the next 2 years? What types of tasks or environments are you looking to move beyond?" },
      { id: "q5", label: "5. When Operations Broke Down", question: "Tell me about a time an operational process or project you were responsible for went off the rails. What happened and what did you do?" },
      { id: "q6", label: "6. Approach to Efficiency", question: "Walk me through how you would audit and improve a team's day-to-day operational workflows when joining a new organisation." }
    ],
    work_sample_task: "Task: Operations Process Audit\nThe candidate must: (1) identify 3 inefficiencies in a fictional onboarding process that takes 6 weeks and involves 8 teams, (2) propose specific fixes with owners and timelines, (3) explain how they would get buy-in from resistant stakeholders.",
    work_sample: {
      title: "Task: Operations Process Audit",
      time_limit: "40 min",
      context: "You have just joined as Operations Administrator. The CEO has flagged that new employee onboarding takes 6 weeks end-to-end and involves 8 different teams. There are frequent complaints about delays, duplicated requests, and new hires not being productive until week 7 or 8.",
      steps: [
        "Identify 3 specific operational inefficiencies in this process based on the data provided.",
        "Propose a fix for each inefficiency, including who owns it and a realistic timeline.",
        "Explain how you would get buy-in from a team that is resistant to changing their part of the process."
      ],
      artifact: "Onboarding steps (sequential):\n1. HR sends welcome email (Day 1)\n2. IT provisions laptop — avg 5 business days\n3. IT creates accounts — avg 3 business days (starts after laptop)\n4. Line manager schedules 1:1s — avg Day 8\n5. Legal sends contract addendums for review — avg Day 10\n6. Finance sets up payroll — avg Day 12\n7. Facilities issues access card — avg Day 14\n8. L&D schedules mandatory training — next available cohort, avg 3-week wait\n\nTotal avg: 6 weeks. New hire survey score: 4.1/10 for onboarding experience.",
      artifact_type: "text",
      placeholder: "1. Inefficiency #1: ...\n   Fix: ...\n   Owner: ...\n   Timeline: ...\n\n2. Inefficiency #2: ...\n\n3. Inefficiency #3: ...\n\nStakeholder buy-in approach: ..."
    }
  }
];

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