// Generic question preset library — used by normal job advertisers to configure job ads
export const genericQuestionPresets = [
  { id: "gq_salary",      label: "Expected Salary",         question: "What is your expected monthly salary (MYR)?",                         type: "text",   placeholder: "e.g. 5,000 – 7,000" },
  { id: "gq_relocate",    label: "Willingness to Relocate", question: "Are you willing to relocate for this role?",                          type: "select", options: ["Yes", "No", "Open to discussion"] },
  { id: "gq_startdate",   label: "Earliest Start Date",     question: "What is your earliest available start date?",                         type: "text",   placeholder: "e.g. Immediately, 1 month notice" },
  { id: "gq_experience",  label: "Years of Experience",     question: "How many years of relevant experience do you have?",                  type: "select", options: ["Less than 1 year", "1–2 years", "3–5 years", "5–8 years", "8+ years"] },
  { id: "gq_status",      label: "Current Employment",      question: "What is your current employment status?",                             type: "select", options: ["Currently employed", "Serving notice period", "Immediately available", "Freelancing"] },
  { id: "gq_arrangement", label: "Work Arrangement",        question: "What is your preferred work arrangement?",                            type: "select", options: ["Remote", "Hybrid", "On-site", "No preference"] },
  { id: "gq_education",   label: "Highest Education",       question: "What is your highest level of education?",                           type: "select", options: ["SPM / O-Level", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Professional Certification"] },
  { id: "gq_industry",    label: "Industry Experience",     question: "Have you worked in this industry before?",                           type: "select", options: ["Yes, extensively", "Yes, briefly", "No, but in adjacent industry", "No, this would be new"] },
  { id: "gq_notice",      label: "Notice Period",           question: "What is your current notice period?",                                type: "select", options: ["No notice required", "1 week", "2 weeks", "1 month", "2 months", "3 months"] },
  { id: "gq_languages",   label: "Languages Spoken",        question: "What languages are you fluent in (spoken and written)?",             type: "text",   placeholder: "e.g. English, Bahasa Malaysia, Mandarin" },
];

// Premium applicant seed data (AI-extracted profiles)
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

// Normal applicant seed data (generic question answers only)
export const normalCandidates = [
  {
    id: "nc1",
    name: "Diana Lim",
    email: "diana@example.com",
    phone: "+60 12-345 6789",
    jobId: "nj1",
    jobTitle: "Customer Service Executive",
    resumeFile: "diana_lim_cv.pdf",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    answers: {
      gq_salary: "3,500 – 4,500",
      gq_relocate: "Yes",
      gq_startdate: "2 weeks notice",
      gq_experience: "3–5 years",
      gq_status: "Currently employed",
      gq_arrangement: "Hybrid",
      gq_education: "Bachelor's Degree",
      gq_languages: "English, Bahasa Malaysia, Mandarin"
    }
  },
  {
    id: "nc2",
    name: "Farid Hassan",
    email: "farid@example.com",
    phone: "+60 11-234 5678",
    jobId: "nj1",
    jobTitle: "Customer Service Executive",
    resumeFile: "farid_hassan_resume.pdf",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    answers: {
      gq_salary: "3,000 – 3,800",
      gq_relocate: "No",
      gq_startdate: "Immediately",
      gq_experience: "1–2 years",
      gq_status: "Immediately available",
      gq_arrangement: "On-site",
      gq_education: "Diploma",
      gq_languages: "English, Bahasa Malaysia"
    }
  },
  {
    id: "nc3",
    name: "Grace Tan",
    email: "grace@example.com",
    phone: "+60 16-789 0123",
    jobId: "nj2",
    jobTitle: "Marketing Coordinator",
    resumeFile: "grace_tan_cv.pdf",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    answers: {
      gq_salary: "4,000 – 5,000",
      gq_relocate: "Open to discussion",
      gq_startdate: "1 month notice",
      gq_experience: "3–5 years",
      gq_status: "Currently employed",
      gq_arrangement: "Hybrid",
      gq_education: "Bachelor's Degree",
      gq_industry: "Yes, extensively",
      gq_languages: "English, Mandarin"
    }
  }
];

export const job = {
  id: "j1",
  title: "Senior Platform Engineer",
  premium: true,
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
    premium: true,
    department: "Platform Engineering",
    type: "Full-time · Hybrid",
    required_skills: [
      { name: "Kubernetes", level: "senior", non_negotiable: true },
      { name: "Python", level: "senior", non_negotiable: true }
    ],
    team_context: { size: 8, pace: "balanced", autonomy_offered: "high" },
    embedding_mock: [0.15, 0.85, 0.35, 0.88],
    mock_match: 78,
    questionnaire: [
      { id: "q1", label: "1. Proudest Work", question: "Tell me about a piece of engineering work you're most proud of. What was the problem? What did you specifically do — not your team, you? What changed as a result?" },
      { id: "q2", label: "2. Technical Complexity", question: "Describe the most technically complex system you've built or debugged. Walk me through your approach." },
      { id: "q3", label: "3. Work Environment", question: "What kind of engineering environment do you do your best work in? Think about team size, pace, on-call culture, and how much ambiguity you're comfortable with." },
      { id: "q4", label: "4. Career Trajectory", question: "What are you trying to move toward in your engineering career in the next 2 years? And what are you actively trying to move away from?" },
      { id: "q5", label: "5. Failure & Learning", question: "Tell me about a system or infrastructure change you made that failed or caused an incident. What happened, and what did you do about it?" },
      { id: "q6", label: "6. Domain Approach", question: "Walk me through how you approach reliability and security hardening for a new cloud-native system." }
    ],
    description: "We are looking for a Senior Platform Engineer to own and evolve our cloud infrastructure. You will lead the design and operation of our Kubernetes-based platform, define reliability standards, and work closely with product engineering teams to enable fast, safe deployments.",
    requirements: [
      "5+ years in platform, infrastructure, or site reliability engineering",
      "Expert-level Kubernetes — production cluster management, not just deployment",
      "Strong Python for tooling, automation, and internal developer tooling",
      "Experience with cloud security, IAM, and least-privilege access design",
      "Comfort owning on-call rotations and postmortem processes"
    ],
    about_company: "CareerOS is building the next generation of talent infrastructure. We are a team of 40, Series A, operating across Southeast Asia. Engineering culture is high-autonomy, high-ownership — you ship directly to production and own what you build.",
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
    premium: true,
    department: "People & Culture",
    type: "Full-time · On-site",
    required_skills: [
      { name: "Employee Relations", level: "senior", non_negotiable: true },
      { name: "Talent Management", level: "mid", non_negotiable: true }
    ],
    team_context: { size: 5, pace: "balanced", autonomy_offered: "medium" },
    embedding_mock: [0.20, 0.60, 0.40, 0.70],
    mock_match: 62,
    questionnaire: [
      { id: "q1", label: "1. Proudest HR Initiative", question: "Tell me about an HR initiative or program you're most proud of driving. What was the business problem? What specifically did you design or implement? What changed as a result?" },
      { id: "q2", label: "2. Difficult Employee Situation", question: "Describe the most complex or sensitive employee relations case you've handled. Walk me through how you approached it and the outcome." },
      { id: "q3", label: "3. Work Style", question: "What kind of organisation do you do your best HR work in? Think about company size, leadership culture, pace of change, and how much autonomy you're given." },
      { id: "q4", label: "4. Career Trajectory", question: "Where are you trying to take your HR career in the next 2 years? What kinds of work or environments are you actively stepping away from?" },
      { id: "q5", label: "5. When a Policy Failed", question: "Tell me about a time an HR policy, process, or programme you led underperformed or backfired. What happened and what did you learn?" },
      { id: "q6", label: "6. Approach to Talent Strategy", question: "Walk me through how you approach building a talent pipeline and retention strategy for a fast-growing team." }
    ],
    description: "We are hiring an HR Business Partner to support two of our fastest-growing departments. You will be the first dedicated HRBP at CareerOS — responsible for employee relations, manager coaching, talent planning, and building people processes that scale from 40 to 150 staff over the next 18 months.",
    requirements: [
      "4+ years as an HR Business Partner or Senior HR Generalist",
      "Proven experience handling complex employee relations cases independently",
      "Experience designing performance management or compensation frameworks",
      "Comfortable influencing senior managers without direct authority",
      "Experience in high-growth startups or tech companies preferred"
    ],
    about_company: "CareerOS is building the next generation of talent infrastructure. We are a team of 40, Series A, operating across Southeast Asia. We are at an inflection point — scaling from startup to structured organisation — and this role will shape how we grow.",
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
    premium: true,
    department: "Operations",
    type: "Full-time · On-site",
    required_skills: [
      { name: "Process Management", level: "mid", non_negotiable: true },
      { name: "Stakeholder Coordination", level: "mid", non_negotiable: false }
    ],
    team_context: { size: 12, pace: "execution-focused", autonomy_offered: "medium" },
    embedding_mock: [0.18, 0.55, 0.30, 0.65],
    mock_match: 85,
    questionnaire: [
      { id: "q1", label: "1. Process You Improved", question: "Tell me about an operational process you improved or built from scratch. What was broken or missing? What exactly did you change? What was the measurable outcome?" },
      { id: "q2", label: "2. Most Complex Coordination", question: "Describe the most complex cross-functional or multi-stakeholder project you've managed. How did you keep it on track?" },
      { id: "q3", label: "3. Work Environment", question: "What kind of operational environment do you thrive in? Think about team structure, pace, how decisions get made, and how you handle shifting priorities." },
      { id: "q4", label: "4. Career Trajectory", question: "What are you aiming to grow into in operations over the next 2 years? What types of tasks or environments are you looking to move beyond?" },
      { id: "q5", label: "5. When Operations Broke Down", question: "Tell me about a time an operational process or project you were responsible for went off the rails. What happened and what did you do?" },
      { id: "q6", label: "6. Approach to Efficiency", question: "Walk me through how you would audit and improve a team's day-to-day operational workflows when joining a new organisation." }
    ],
    description: "We are looking for an Operations Administrator to keep CareerOS running smoothly as we scale. You will own vendor management, cross-functional coordination, internal process documentation, and be the connective tissue between teams when nothing else exists.",
    requirements: [
      "2+ years in an operations, office management, or project coordination role",
      "Track record of identifying and improving broken processes without being asked",
      "Strong written communication — you document things so others can follow",
      "Experience coordinating across 4+ teams or departments simultaneously",
      "Proficiency with productivity tools: Notion, Slack, Google Workspace, or equivalent"
    ],
    about_company: "CareerOS is building the next generation of talent infrastructure. We are a team of 40, Series A, operating across Southeast Asia. Operations here means building the scaffolding for a company that is growing fast — you will have real ownership and visibility from day one.",
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
  },
  {
    id: "j4",
    title: "Site Reliability Engineer",
    premium: true,
    department: "Infrastructure & Reliability",
    type: "Full-time · Remote",
    required_skills: [
      { name: "Linux", level: "senior", non_negotiable: true },
      { name: "Kubernetes", level: "mid", non_negotiable: true },
      { name: "Terraform", level: "mid", non_negotiable: true }
    ],
    team_context: { size: 6, pace: "execution-focused", autonomy_offered: "high" },
    embedding_mock: [0.12, 0.88, 0.40, 0.82],
    mock_match: 80,
    questionnaire: [
      { id: "q1", label: "1. Proudest Reliability Work", question: "Tell me about a reliability improvement you led. What broke, what did you build, and what changed?" },
      { id: "q2", label: "2. Incident You Owned", question: "Describe the most complex incident you have managed end-to-end. Walk through your response and the postmortem." },
      { id: "q3", label: "3. Work Environment", question: "What kind of engineering environment brings out your best SRE work? Think about on-call culture, autonomy, and tooling." },
      { id: "q4", label: "4. Career Trajectory", question: "Where are you taking your SRE or infrastructure career in the next 2 years?" },
      { id: "q5", label: "5. When Something Broke", question: "Tell me about a change you made that caused an outage or degradation. What happened and what did you do?" },
      { id: "q6", label: "6. Observability Approach", question: "Walk me through how you would set up observability for a new microservice hitting production for the first time." }
    ],
    description: "We are hiring a Site Reliability Engineer to own the reliability and scalability of our production infrastructure. You will manage Kubernetes clusters on AWS, define SLOs, drive incident response, and build internal tooling that improves platform stability across all engineering teams.",
    requirements: [
      "4+ years in SRE, infrastructure, or platform engineering roles",
      "Deep Linux administration and troubleshooting skills",
      "Production Kubernetes experience — cluster lifecycle, networking, autoscaling",
      "Infrastructure-as-code with Terraform in multi-environment setups",
      "Experience defining and owning SLOs, error budgets, and runbooks"
    ],
    about_company: "FinOps Sdn Bhd is a B2B SaaS company serving 200+ enterprise clients across Southeast Asia. Uptime is our product — our SRE team directly impacts customer trust and revenue.",
    work_sample_task: "Task: SLO Definition & Alert Design\nGiven a payment processing microservice, define meaningful SLOs, write a Prometheus alerting rule, and explain your error budget policy.",
    work_sample: {
      title: "Task: SLO Definition & Alert Design",
      time_limit: "40 min",
      context: "A payment processing microservice has been running in production for 3 months with no formal SLOs. P99 latency is currently 320ms. Error rate is 0.3%. The business requires 99.9% availability.",
      steps: [
        "Define 3 meaningful SLOs for this service with specific targets.",
        "Write a Prometheus alerting rule (PromQL) for one of your SLOs.",
        "Explain your error budget policy and when you would freeze deployments."
      ],
      artifact: "Service: payment-processor\nCurrent P99 latency: 320ms\nCurrent error rate: 0.3%\nRequired availability: 99.9%\nDeployment frequency: 8x per week",
      artifact_type: "text",
      placeholder: "1. SLOs defined:\n   - Availability SLO: ...\n   - Latency SLO: ...\n   - Error rate SLO: ...\n\n2. Prometheus alert rule:\n...\n\n3. Error budget policy: ..."
    }
  }
];

// Normal job listings (no AI screening, generic questions only)
export const normalJobs = [
  {
    id: "nj1",
    title: "Customer Service Executive",
    premium: false,
    department: "Customer Experience",
    type: "Full-time · On-site",
    mock_match: 45,
    description: "We are looking for a friendly and reliable Customer Service Executive to handle inbound enquiries, resolve customer issues, and maintain high satisfaction scores across our support channels.",
    requirements: [
      "Minimum 1 year in a customer-facing role",
      "Strong communication skills in English and Bahasa Malaysia",
      "Comfortable working rotating shifts including weekends",
      "Experience with CRM tools is an advantage"
    ],
    about_company: "RetailCo is a fast-growing e-commerce platform serving 500,000 customers across Malaysia. Our customer service team is the backbone of our brand reputation.",
    generic_questions: ["gq_salary", "gq_relocate", "gq_startdate", "gq_experience", "gq_status", "gq_arrangement", "gq_languages"]
  },
  {
    id: "nj2",
    title: "Marketing Coordinator",
    premium: false,
    department: "Marketing",
    type: "Full-time · Hybrid",
    mock_match: 58,
    description: "We need a Marketing Coordinator to support campaign execution, manage social media calendars, coordinate with vendors, and track campaign performance metrics across digital and offline channels.",
    requirements: [
      "Diploma or Degree in Marketing, Communications, or related field",
      "1–3 years of marketing or content coordination experience",
      "Familiarity with social media platforms and basic analytics tools",
      "Organised with strong attention to detail"
    ],
    about_company: "BrandSpace Agency is a boutique marketing agency working with regional consumer brands. We offer a fast-paced, collaborative environment with exposure to diverse client portfolios.",
    generic_questions: ["gq_salary", "gq_relocate", "gq_experience", "gq_status", "gq_arrangement", "gq_education", "gq_industry", "gq_languages"]
  },
  {
    id: "nj3",
    title: "DevOps Engineer",
    premium: false,
    department: "Engineering",
    type: "Full-time · Hybrid",
    required_skills: [
      { name: "Docker", level: "mid", non_negotiable: true },
      { name: "CI/CD", level: "mid", non_negotiable: true },
      { name: "Linux", level: "mid", non_negotiable: true }
    ],
    mock_match: 72,
    description: "We are looking for a DevOps Engineer to manage our CI/CD pipelines, containerised workloads, and cloud deployment processes. You will work closely with software engineering teams to automate build, test, and release workflows across AWS-hosted environments.",
    requirements: [
      "2+ years in a DevOps or infrastructure role",
      "Hands-on Docker and container orchestration experience",
      "CI/CD pipeline ownership — Jenkins, GitHub Actions, or GitLab CI",
      "Linux system administration and shell scripting",
      "Familiarity with cloud platforms (AWS, GCP, or Azure)"
    ],
    about_company: "TechFlow Sdn Bhd is a product-led software company building logistics management tools for Southeast Asian enterprises. Engineering team of 25, growing to 50 by end of year.",
    generic_questions: ["gq_salary", "gq_experience", "gq_startdate", "gq_notice", "gq_portfolio"]
  },
  {
    id: "nj4",
    title: "Cloud Infrastructure Engineer",
    premium: false,
    department: "Cloud & Infrastructure",
    type: "Full-time · Remote",
    required_skills: [
      { name: "AWS", level: "mid", non_negotiable: true },
      { name: "Terraform", level: "mid", non_negotiable: true }
    ],
    mock_match: 68,
    description: "We are hiring a Cloud Infrastructure Engineer to design, deploy, and maintain our AWS-based cloud infrastructure. You will manage environments using Terraform, enforce cloud security best practices, and work with engineering teams to optimise cost and performance.",
    requirements: [
      "3+ years working with AWS infrastructure",
      "Terraform for infrastructure-as-code at scale",
      "Understanding of VPC networking, IAM, and cloud security",
      "Experience with cloud cost optimisation and tagging strategies",
      "Scripting ability in Python or Bash"
    ],
    about_company: "CloudBase Technologies is a cloud consulting firm helping mid-market companies in Malaysia migrate and modernise their infrastructure. We are a remote-first team of 30 engineers.",
    generic_questions: ["gq_salary", "gq_experience", "gq_startdate", "gq_portfolio", "gq_relocate"]
  },
  {
    id: "nj5",
    title: "Data Analyst",
    premium: false,
    department: "Data & Analytics",
    type: "Full-time · Hybrid",
    required_skills: [
      { name: "SQL", level: "mid", non_negotiable: true },
      { name: "Python", level: "junior", non_negotiable: false },
      { name: "Data Visualisation", level: "mid", non_negotiable: true }
    ],
    mock_match: 55,
    description: "We are looking for a Data Analyst to transform business data into actionable insights. You will query production databases, build dashboards, and work with product and operations teams to define and track key metrics.",
    requirements: [
      "2+ years in a data analyst or business intelligence role",
      "Strong SQL — complex joins, window functions, query optimisation",
      "Experience with BI tools: Tableau, Power BI, Looker, or Metabase",
      "Python for data wrangling is a plus",
      "Ability to translate data findings into business recommendations"
    ],
    about_company: "Datasphere Analytics is a data consultancy serving e-commerce and fintech clients across Southeast Asia. We run lean, embedded analyst teams inside our clients' product organisations.",
    generic_questions: ["gq_salary", "gq_experience", "gq_education", "gq_startdate", "gq_portfolio"]
  },
  {
    id: "nj6",
    title: "Full Stack Developer",
    premium: false,
    department: "Product Engineering",
    type: "Full-time · Hybrid",
    required_skills: [
      { name: "React", level: "mid", non_negotiable: true },
      { name: "Node.js", level: "mid", non_negotiable: true },
      { name: "PostgreSQL", level: "junior", non_negotiable: false }
    ],
    mock_match: 60,
    description: "We are hiring a Full Stack Developer to build and maintain web applications across the full product stack. You will own features end-to-end — from React frontends to Node.js APIs and PostgreSQL databases.",
    requirements: [
      "2+ years building production web applications",
      "React for frontend, Node.js or Express for backend",
      "Relational databases — PostgreSQL or MySQL",
      "Git-based workflows, code review culture",
      "REST or GraphQL API design experience"
    ],
    about_company: "BuildFast Studio is a venture-backed product studio in Kuala Lumpur building SaaS tools for the SME market. We move fast, ship often, and give engineers direct product ownership.",
    generic_questions: ["gq_salary", "gq_experience", "gq_startdate", "gq_portfolio", "gq_notice"]
  },
  {
    id: "nj7",
    title: "Talent Acquisition Specialist",
    premium: false,
    department: "People & Culture",
    type: "Full-time · On-site",
    mock_match: 50,
    description: "We are hiring a Talent Acquisition Specialist to manage end-to-end recruitment across technical and non-technical roles. You will own job briefings, sourcing, candidate experience, and offer management.",
    requirements: [
      "2+ years in talent acquisition or technical recruiting",
      "Experience sourcing passive candidates via LinkedIn and other channels",
      "Strong candidate communication and interview coordination skills",
      "Familiarity with ATS platforms (Workday, Greenhouse, or similar)",
      "Ability to manage 10–15 open roles simultaneously"
    ],
    about_company: "GrowthHire is a regional recruitment agency specialising in placing tech and operations professionals across Malaysia, Singapore, and Indonesia.",
    generic_questions: ["gq_salary", "gq_experience", "gq_startdate", "gq_notice", "gq_availability"]
  },
  {
    id: "nj8",
    title: "Finance Executive",
    premium: false,
    department: "Finance",
    type: "Full-time · On-site",
    mock_match: 42,
    description: "We are looking for a Finance Executive to support day-to-day accounting operations including AP/AR processing, month-end close, and financial reporting. You will work alongside the Finance Manager to ensure accurate and timely books.",
    requirements: [
      "Diploma or Degree in Accounting, Finance, or related field",
      "1–3 years of accounting or finance experience",
      "Proficiency in accounting software (SQL, AutoCount, or Xero)",
      "Understanding of Malaysian tax compliance and GST/SST",
      "Detail-oriented with strong numerical accuracy"
    ],
    about_company: "PrimeLedger Sdn Bhd is a shared services company providing finance and accounting support to a portfolio of SMEs across Malaysia.",
    generic_questions: ["gq_salary", "gq_experience", "gq_education", "gq_startdate", "gq_notice"]
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