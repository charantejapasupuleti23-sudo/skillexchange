/**
 * Skill Taxonomy, Synonyms, and Semantic Similarity Engine
 * Maps skills to canonical taxonomy, aliases, and computes similarity distance.
 */

// Canonical alias dictionary: maps lowercase synonyms/aliases to canonical skill names
const SYNONYM_MAP = {
  // Web & Frontend
  'react': 'React',
  'react.js': 'React',
  'reactjs': 'React',
  'react native': 'React',
  'frontend': 'React',
  'front-end': 'React',
  'web development': 'JavaScript',
  'web dev': 'JavaScript',
  'javascript': 'JavaScript',
  'js': 'JavaScript',
  'es6': 'JavaScript',
  'typescript': 'TypeScript',
  'ts': 'TypeScript',
  'next.js': 'Next.js',
  'nextjs': 'Next.js',
  'vue': 'Vue.js',
  'vue.js': 'Vue.js',
  'vuejs': 'Vue.js',
  'angular': 'Angular',
  'html': 'HTML5 & CSS3 / Tailwind CSS',
  'css': 'HTML5 & CSS3 / Tailwind CSS',
  'tailwind': 'HTML5 & CSS3 / Tailwind CSS',
  'tailwindcss': 'HTML5 & CSS3 / Tailwind CSS',

  // Backend & Cloud
  'node': 'Node.js & Express',
  'nodejs': 'Node.js & Express',
  'express': 'Node.js & Express',
  'express.js': 'Node.js & Express',
  'backend': 'Node.js & Express',
  'back-end': 'Node.js & Express',
  'python': 'Python',
  'python3': 'Python',
  'django': 'Django & FastAPI',
  'fastapi': 'Django & FastAPI',
  'flask': 'Django & FastAPI',
  'java': 'Java & Spring Boot',
  'spring': 'Java & Spring Boot',
  'spring boot': 'Java & Spring Boot',
  'c#': 'C# & .NET Core',
  '.net': 'C# & .NET Core',
  'dotnet': 'C# & .NET Core',
  'c++': 'C / C++',
  'cpp': 'C / C++',
  'docker': 'Docker & Containerization',
  'devops': 'Docker & Containerization',
  'containerization': 'Docker & Containerization',
  'kubernetes': 'Docker & Containerization',
  'k8s': 'Docker & Containerization',
  'aws': 'Docker & Containerization',
  'cloud': 'Docker & Containerization',

  // Databases
  'sql': 'SQL & PostgreSQL',
  'postgres': 'SQL & PostgreSQL',
  'postgresql': 'SQL & PostgreSQL',
  'mysql': 'SQL & PostgreSQL',
  'database': 'SQL & PostgreSQL',
  'mongodb': 'SQL & PostgreSQL',
  'nosql': 'SQL & PostgreSQL',

  // Design
  'ui/ux': 'UI/UX Design',
  'ui/ux design': 'UI/UX Design',
  'ux': 'UI/UX Design',
  'ui': 'UI/UX Design',
  'product design': 'UI/UX Design',
  'user experience': 'UI/UX Design',
  'figma': 'Figma',
  'prototyping': 'Figma',
  'wireframing': 'Figma',

  // Creative & Media
  'photography': 'Photography',
  'photos': 'Photography',
  'camera': 'Photography',
  'lighting': 'Photography',
  'photoshop': 'Photoshop',
  'photo editing': 'Photoshop',
  'lightroom': 'Photoshop',
  'video editing': 'Video Editing',
  'video': 'Video Editing',
  'premiere': 'Video Editing',
  'premiere pro': 'Video Editing',
  'after effects': 'Video Editing',
  'videography': 'Video Editing',
  'content creation': 'Video Editing',

  // Soft Skills & Business
  'public speaking': 'Public Speaking',
  'presentation': 'Public Speaking',
  'communication': 'Public Speaking',
  'marketing': 'Digital Marketing',
  'digital marketing': 'Digital Marketing',
  'seo': 'Digital Marketing',
};

// Domain Cluster Affinity: related skills that share conceptual overlap
const CLUSTER_AFFINITY = [
  // Modern JS/Web cluster
  ['React', 'Next.js', 'JavaScript', 'TypeScript', 'HTML5 & CSS3 / Tailwind CSS', 'Vue.js', 'Angular'],
  // Python & Backend cluster
  ['Python', 'Django & FastAPI', 'Node.js & Express', 'SQL & PostgreSQL', 'Docker & Containerization'],
  // Design & Prototyping cluster
  ['UI/UX Design', 'Figma', 'Photoshop', 'HTML5 & CSS3 / Tailwind CSS'],
  // Visual Media cluster
  ['Photography', 'Photoshop', 'Video Editing'],
  // Enterprise Backend cluster
  ['Java & Spring Boot', 'C# & .NET Core', 'SQL & PostgreSQL', 'Docker & Containerization'],
];

/**
 * Normalize any arbitrary skill string into its canonical taxonomy name.
 * @param {string} rawName
 * @returns {string} Canonical name or normalized string
 */
const normalizeSkillName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return '';
  const cleaned = rawName.trim().toLowerCase();
  return SYNONYM_MAP[cleaned] || rawName.trim();
};

/**
 * Compute semantic similarity score between two skill entities (0.0 to 1.0)
 * @param {Object|string} skillA - First skill object or name
 * @param {Object|string} skillB - Second skill object or name
 * @returns {number} Similarity coefficient (1.0 = exact, 0.85 = synonym, 0.6 = related cluster, 0.3 = same category, 0 = none)
 */
const computeSkillSimilarity = (skillA, skillB) => {
  if (!skillA || !skillB) return 0;

  const idA = skillA?._id?.toString() || (typeof skillA === 'string' ? skillA : '');
  const idB = skillB?._id?.toString() || (typeof skillB === 'string' ? skillB : '');

  // 1. Exact Mongo ID match
  if (idA && idB && idA === idB) {
    return 1.0;
  }

  const nameA = (skillA?.name || (typeof skillA === 'string' ? skillA : '')).trim();
  const nameB = (skillB?.name || (typeof skillB === 'string' ? skillB : '')).trim();

  if (!nameA || !nameB) return 0;

  // 2. Exact string match (case-insensitive)
  if (nameA.toLowerCase() === nameB.toLowerCase()) {
    return 1.0;
  }

  // 3. Synonym / Canonical taxonomy mapping match
  const canonicalA = normalizeSkillName(nameA);
  const canonicalB = normalizeSkillName(nameB);

  if (canonicalA.toLowerCase() === canonicalB.toLowerCase()) {
    return 0.9;
  }

  // 4. Related Domain Cluster affinity
  for (const cluster of CLUSTER_AFFINITY) {
    const hasA = cluster.some((c) => c.toLowerCase() === canonicalA.toLowerCase() || c.toLowerCase() === nameA.toLowerCase());
    const hasB = cluster.some((c) => c.toLowerCase() === canonicalB.toLowerCase() || c.toLowerCase() === nameB.toLowerCase());
    if (hasA && hasB) {
      return 0.65;
    }
  }

  // 5. Broad Category match
  const catA = skillA?.category;
  const catB = skillB?.category;
  if (catA && catB && catA === catB && catA !== 'Other') {
    return 0.3;
  }

  return 0.0;
};

module.exports = {
  normalizeSkillName,
  computeSkillSimilarity,
  SYNONYM_MAP,
  CLUSTER_AFFINITY,
};
