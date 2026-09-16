const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');

const ROADMAPS = [
  {
    id: 'fullstack-dev',
    title: 'Full-Stack Web Development',
    category: 'Engineering',
    icon: 'Code2',
    description: 'Master modern frontend and backend development from React to Node.js & cloud deployment.',
    topics: [
      'HTML/CSS Fundamentals & Tailwind',
      'Modern JavaScript ES6+ & Async/Await',
      'React Components, Hooks & State',
      'REST APIs with Node.js & Express',
      'MongoDB & Mongoose Schema Design',
      'JWT Authentication & Security',
      'WebSockets & Real-time Data',
      'Cloud Deployment & CI/CD',
    ],
  },
  {
    id: 'dsa-interviews',
    title: 'Data Structures & Algorithms',
    category: 'Computer Science',
    icon: 'Binary',
    description: 'Ace technical coding interviews with deep algorithm fundamentals and problem solving.',
    topics: [
      'Time & Space Complexity (Big-O)',
      'Arrays, Strings & Two Pointers',
      'Hash Maps & Sliding Window',
      'Linked Lists, Stacks & Queues',
      'Binary Trees & Tree Traversals',
      'Graph Algorithms (BFS & DFS)',
      'Dynamic Programming Fundamentals',
      'System Coding & Mock Interviews',
    ],
  },
  {
    id: 'ai-machine-learning',
    title: 'AI & Machine Learning',
    category: 'Artificial Intelligence',
    icon: 'Cpu',
    description: 'Learn applied machine learning, neural networks, LLM prompting, and RAG architectures.',
    topics: [
      'Python for Data Science (NumPy/Pandas)',
      'Exploratory Data Analysis & Viz',
      'Supervised Learning & Regression',
      'Deep Learning & PyTorch Basics',
      'NLP & Transformer Architecture',
      'LLM Prompt Engineering & LangChain',
      'Vector Databases & Embeddings',
      'Fine-tuning & Model Deployment',
    ],
  },
  {
    id: 'system-design',
    title: 'System Design & Scalability',
    category: 'Architecture',
    icon: 'Server',
    description: 'Design distributed high-throughput applications that scale to millions of active users.',
    topics: [
      'Client-Server & Microservices Overview',
      'Load Balancing & Reverse Proxies',
      'Distributed Caching (Redis/Memcached)',
      'Database Sharding & Replication',
      'Message Queues (Kafka/RabbitMQ)',
      'Rate Limiting & API Gateways',
      'CAP Theorem & Consistency Models',
      'End-to-End System Design Interviews',
    ],
  },
  {
    id: 'ui-ux-design',
    title: 'UI/UX & Product Design',
    category: 'Design',
    icon: 'Palette',
    description: 'Create intuitive, accessible, and delightful digital user experiences using Figma.',
    topics: [
      'Design Thinking & User Research',
      'Wireframing & Information Architecture',
      'Figma Component Systems & Auto Layout',
      'Color Theory & Typography Hierarchies',
      'Interactive Prototyping & Usability Tests',
      'Design Tokens & Design System Handoff',
    ],
  },
];

const BADGE_DEFINITIONS = [
  {
    id: 'first-session',
    name: 'Pioneer Learner',
    icon: '🚀',
    description: 'Completed your first 1:1 learning session on SkillLoop',
    check: (user) => (user.completedSessions || 0) >= 1,
  },
  {
    id: 'mentor-5',
    name: 'Master Mentor',
    icon: '🎓',
    description: 'Helped 5+ peers master new skills',
    check: (user) => (user.learnersHelped || 0) >= 5,
  },
  {
    id: 'credit-pro',
    name: 'Time-Bank Pro',
    icon: '🪙',
    description: 'Accumulated 10+ time banking credits through teaching',
    check: (user) => (user.timeCredits || 0) >= 10,
  },
  {
    id: 'streak-3',
    name: 'Consistency Champ',
    icon: '🔥',
    description: 'Active learner with a 3+ session streak',
    check: (user) => (user.streak?.current || 0) >= 3,
  },
  {
    id: 'endorsed-expert',
    name: 'Peer Endorsed',
    icon: '⭐',
    description: 'Received positive skill endorsements from other members',
    check: (user) =>
      user.skillsToTeach?.some((s) => s.endorsementsCount && s.endorsementsCount > 0),
  },
];

/**
 * Checks and awards badges based on user activity
 */
const evaluateUserBadges = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const existingBadgeIds = (user.badges || []).map((b) => b.id);
    let newlyEarned = [];

    for (const def of BADGE_DEFINITIONS) {
      if (!existingBadgeIds.includes(def.id) && def.check(user)) {
        const badgeObj = {
          id: def.id,
          name: def.name,
          icon: def.icon,
          description: def.description,
          earnedAt: new Date(),
        };
        user.badges.push(badgeObj);
        newlyEarned.push(badgeObj);
      }
    }

    if (newlyEarned.length > 0) {
      await user.save();
    }
    return newlyEarned;
  } catch (err) {
    console.error('[evaluateUserBadges Error]', err);
    return [];
  }
};

/**
 * Manages atomic credit transfers & escrow transactions
 */
const recordCreditTransaction = async ({
  userId,
  type,
  amount,
  description,
  sessionId = null,
  peerId = null,
}) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (type === 'session_hold') {
      // Hold 1 credit in escrow from learner
      if (user.timeCredits < amount) {
        throw new Error('Insufficient time credits to book session');
      }
      user.timeCredits -= amount;
      user.escrowCredits = (user.escrowCredits || 0) + amount;
    } else if (type === 'session_earned') {
      // Deposit credit to mentor upon mutual completion
      user.timeCredits += amount;
    } else if (type === 'session_refund') {
      // Refund escrowed credit to learner upon cancellation
      user.timeCredits += amount;
      user.escrowCredits = Math.max(0, (user.escrowCredits || 0) - amount);
    }

    await user.save();

    const transaction = await CreditTransaction.create({
      user: userId,
      type,
      amount,
      balanceAfter: user.timeCredits,
      description,
      session: sessionId,
      peer: peerId,
    });

    return { user, transaction };
  } catch (err) {
    console.error('[recordCreditTransaction Error]', err);
    throw err;
  }
};

module.exports = {
  ROADMAPS,
  BADGE_DEFINITIONS,
  evaluateUserBadges,
  recordCreditTransaction,
};
