const pathKeywords = {
  'student-software': {
    fields: ['Computer Science', 'Software Engineering', 'IT', 'Information Systems', 'Computer Engineering'],
    interests: ['coding', 'building apps', 'solving tech problems', 'programming', 'creating tools'],
    subjects: ['Programming', 'Math', 'Physics', 'Computer Science', 'Algorithms'],
    style: ['build', 'create'],
    label: 'Software Engineering',
  },
  'student-data': {
    fields: ['Data Science', 'Statistics', 'Mathematics', 'Computer Science', 'Business Analytics'],
    interests: ['patterns in data', 'predicting trends', 'AI', 'numbers', 'machine learning'],
    subjects: ['Statistics', 'Math', 'Data Analysis', 'Programming', 'Research Methods'],
    style: ['discover', 'analyze'],
    label: 'Data & AI',
  },
  'student-cloud': {
    fields: ['Computer Science', 'IT', 'Network Engineering', 'Software Engineering', 'Information Systems'],
    interests: ['large-scale systems', 'keeping things running', 'automation', 'infrastructure'],
    subjects: ['Networking', 'Operating Systems', 'Programming', 'Computer Architecture'],
    style: ['build', 'optimize'],
    label: 'Cloud & Infrastructure',
  },
  'student-business': {
    fields: ['Business', 'Economics', 'Management', 'Finance', 'Marketing', 'International Business'],
    interests: ['strategy', 'leading teams', 'solving business problems', 'entrepreneurship'],
    subjects: ['Business Studies', 'Economics', 'Management', 'Communication'],
    style: ['lead', 'strategize'],
    label: 'Business & Strategy',
  },
  'student-design': {
    fields: ['Design', 'Multimedia', 'HCI', 'Psychology', 'Fine Arts', 'Communication'],
    interests: ['design', 'user experience', 'visual', 'creating beautiful things', 'human behavior'],
    subjects: ['Design', 'Art', 'Psychology', 'Communication', 'Multimedia'],
    style: ['create', 'understand'],
    label: 'Design & UX',
  },
  'student-marketing': {
    fields: ['Marketing', 'Communication', 'Business', 'Media Studies', 'English', 'Psychology'],
    interests: ['social media', 'storytelling', 'growing audiences', 'brands', 'content'],
    subjects: ['English', 'Media Studies', 'Business', 'Communication', 'Psychology'],
    style: ['create', 'strategize'],
    label: 'Digital Marketing',
  },
  'student-cybersec': {
    fields: ['Computer Science', 'Cybersecurity', 'IT', 'Network Engineering', 'Forensics'],
    interests: ['security', 'protecting systems', 'ethical hacking', 'solving puzzles', 'defending'],
    subjects: ['Networking', 'Programming', 'Math', 'Computer Science', 'Cryptography'],
    style: ['defend', 'solve'],
    label: 'Cybersecurity',
  },
  'student-hr': {
    fields: ['Human Resources', 'Psychology', 'Business', 'Sociology', 'Communication'],
    interests: ['helping people', 'understanding people', 'workplace culture', 'talent'],
    subjects: ['Psychology', 'Sociology', 'Business', 'Communication'],
    style: ['lead', 'understand'],
    label: 'HR & People',
  },
  'student-fintech': {
    fields: ['Finance', 'Computer Science', 'Economics', 'Mathematics', 'Business Analytics'],
    interests: ['finance', 'banking', 'investing', 'payment systems', 'economic systems'],
    subjects: ['Economics', 'Math', 'Finance', 'Programming', 'Statistics'],
    style: ['analyze', 'strategize'],
    label: 'Fintech & Banking',
  },
};

function scorePath(path, studentInput) {
  let score = 0;
  const kw = pathKeywords[path.id];
  if (!kw) return 0;

  const field = (studentInput.fieldOfStudy || '').toLowerCase();
  if (kw.fields.some(f => field.includes(f.toLowerCase()))) score += 3;

  const interests = Array.isArray(studentInput.interests)
    ? studentInput.interests.map(i => i.toLowerCase()).join(' ')
    : (studentInput.interests || '').toLowerCase();
  kw.interests.forEach(k => {
    if (interests.includes(k.toLowerCase())) score += 2;
  });

  const subjects = Array.isArray(studentInput.subjects)
    ? studentInput.subjects
    : [];
  kw.subjects.forEach(s => {
    if (subjects.some(sub => sub.toLowerCase().includes(s.toLowerCase()))) score += 1.5;
  });

  const style = (studentInput.workStyle || '').toLowerCase();
  kw.style.forEach(s => {
    if (style.includes(s.toLowerCase())) score += 1;
  });

  return score;
}

export function getRecommendedPaths(studentInput) {
  if (!studentInput || !studentInput.fieldOfStudy) return [];

  const studentNodes = [
    'student-software', 'student-data', 'student-cloud',
    'student-business', 'student-design', 'student-marketing',
    'student-cybersec', 'student-hr', 'student-fintech',
  ];

  const scored = studentNodes.map(id => ({
    id,
    label: pathKeywords[id]?.label || id,
    score: scorePath({ id }, studentInput),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.filter(s => s.score > 0);
}

export const educationFields = [
  'Computer Science', 'Software Engineering', 'Information Technology',
  'Data Science', 'Statistics', 'Mathematics',
  'Business Administration', 'Economics', 'Finance', 'Accounting',
  'Psychology', 'Human Resources', 'Sociology',
  'Marketing', 'Communication', 'Media Studies',
  'Design', 'Multimedia', 'Fine Arts',
  'Engineering', 'Computer Engineering', 'Network Engineering',
  'Cybersecurity', 'Forensics',
  'Biology', 'Chemistry', 'Physics',
  'Law', 'English', 'International Business',
  'Other',
];

export const interestOptions = [
  'coding and building apps',
  'solving complex math problems',
  'understanding how people think',
  'design and visual creativity',
  'leading and organizing teams',
  'helping and developing people',
  'protecting systems from threats',
  'analyzing data and finding patterns',
  'building and fixing things',
  'storytelling and content creation',
  'business strategy and growth',
  'working with numbers and finance',
  'understanding technology and infrastructure',
  'research and discovery',
];

export const subjectOptions = [
  'Programming', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English', 'History', 'Economics', 'Business Studies', 'Accounting',
  'Computer Science', 'Design & Technology', 'Art', 'Psychology',
  'Sociology', 'Media Studies', 'Statistics', 'Data Analysis',
  'Networking', 'Operating Systems', 'Communication',
];

export const workStyles = [
  { id: 'build', label: 'Building & creating things' },
  { id: 'analyze', label: 'Analyzing data & patterns' },
  { id: 'lead', label: 'Leading teams & projects' },
  { id: 'create', label: 'Creative expression & design' },
  { id: 'solve', label: 'Solving puzzles & problems' },
  { id: 'understand', label: 'Understanding people & behavior' },
  { id: 'defend', label: 'Defending & protecting' },
  { id: 'strategize', label: 'Strategic thinking & planning' },
  { id: 'discover', label: 'Research & discovery' },
  { id: 'optimize', label: 'Optimizing & improving systems' },
];
