const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../models/User');
const Skill = require('../models/Skill');
const Connection = require('../models/Connection');
const ExchangeRequest = require('../models/ExchangeRequest');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const { connectDB } = require('../config/db');

const initialSkills = require('./initialSkills');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Clearing existing data...');

    await Promise.all([
      User.deleteMany({}),
      Skill.deleteMany({}),
      ExchangeRequest.deleteMany({}),
      Connection.deleteMany({}),
      Session.deleteMany({}),
      Message.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('[Seed] Inserting skills taxonomy...');
    const insertedSkills = await Skill.insertMany(initialSkills);

    const skillMap = {};
    insertedSkills.forEach((s) => {
      skillMap[s.name] = s._id;
    });

    console.log('[Seed] Inserting realistic demo users...');
    const defaultHashedPassword = await bcrypt.hash('password123', 10);

    const usersData = [
      {
        name: 'Alex Chen',
        username: 'alexchen',
        email: 'alex.chen@skillloop.dev',
        password: defaultHashedPassword,
        bio: 'Senior Frontend Engineer with 5+ years of production experience. Passionate about teaching modern React & JavaScript and eager to pick up Python for automation.',
        location: 'San Francisco, CA',
        occupation: 'Senior Frontend Engineer',
        education: 'B.S. in Computer Science',
        experience: '5+ years building distributed web apps, mentoring junior engineers, and contributing to open source.',
        profileImage: {
          url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        },
        skillsToTeach: [
          {
            skill: skillMap['React'],
            level: 'Expert',
            yearsOfExperience: 5,
            description: 'Advanced patterns, custom hooks, performance tuning, and scalable architecture.',
          },
          {
            skill: skillMap['JavaScript'],
            level: 'Expert',
            yearsOfExperience: 6,
            description: 'Core concepts, async/await, event loop, prototypes, and clean code principles.',
          },
        ],
        skillsToLearn: [
          {
            skill: skillMap['Python'],
            level: 'Beginner',
            desiredOutcome: 'Automate data workflows, build CLI tools, and learn basic script architecture.',
            progress: 35,
            sessionsCompleted: 3,
            lastLearned: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            skill: skillMap['Docker & Containerization'],
            level: 'Beginner',
            desiredOutcome: 'Set up multi-container local dev environments and build lean image pipelines.',
            progress: 20,
            sessionsCompleted: 1,
            lastLearned: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        ],
        availability: [
          {
            day: 'Monday',
            slots: [{ startTime: '18:00', endTime: '21:00' }],
          },
          {
            day: 'Wednesday',
            slots: [{ startTime: '18:00', endTime: '21:00' }],
          },
          {
            day: 'Saturday',
            slots: [{ startTime: '10:00', endTime: '14:00' }],
          },
        ],
        rating: 4.9,
        reviewCount: 14,
        completedSessions: 18,
        learnersHelped: 12,
        skillsLearnedCount: 1,
      },
      {
        name: 'Elena Rostova',
        username: 'elenarostova',
        email: 'elena.rostova@skillloop.dev',
        password: defaultHashedPassword,
        bio: 'Python backend developer and data engineering enthusiast. Looking to master React component systems and improve frontend UX.',
        location: 'Seattle, WA',
        occupation: 'Backend Developer',
        education: 'M.S. in Software Systems',
        experience: '4 years backend engineering in Python, FastAPI, Django, and cloud data pipelines.',
        profileImage: {
          url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
        },
        skillsToTeach: [
          {
            skill: skillMap['Python'],
            level: 'Expert',
            yearsOfExperience: 5,
            description: 'Idiomatic Python, backend web development with Django and FastAPI, data structures.',
          },
          {
            skill: skillMap['SQL & PostgreSQL'],
            level: 'Advanced',
            yearsOfExperience: 4,
            description: 'Relational design, query optimization, indexing strategies, and migrations.',
          },
        ],
        skillsToLearn: [
          {
            skill: skillMap['React'],
            level: 'Beginner',
            desiredOutcome: 'Build modern dashboards for my Python backend APIs from scratch.',
            progress: 50,
            sessionsCompleted: 4,
            lastLearned: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            skill: skillMap['UI/UX Design'],
            level: 'Beginner',
            desiredOutcome: 'Understand clean spacing, typography, and accessible UI layout patterns.',
            progress: 15,
            sessionsCompleted: 1,
            lastLearned: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          },
        ],
        availability: [
          {
            day: 'Monday',
            slots: [{ startTime: '18:00', endTime: '21:00' }],
          },
          {
            day: 'Thursday',
            slots: [{ startTime: '19:00', endTime: '21:30' }],
          },
          {
            day: 'Saturday',
            slots: [{ startTime: '11:00', endTime: '15:00' }],
          },
        ],
        rating: 4.95,
        reviewCount: 19,
        completedSessions: 22,
        learnersHelped: 16,
        skillsLearnedCount: 2,
      },
      {
        name: 'Marcus Rivera',
        username: 'marcusrivera',
        email: 'marcus.rivera@skillloop.dev',
        password: defaultHashedPassword,
        bio: 'Lead Product Designer crafting intuitive digital interfaces. I teach Figma systems and UX research, and want to learn JavaScript to build interactive prototypes.',
        location: 'Austin, TX',
        occupation: 'Lead Product Designer',
        education: 'B.A. in Interaction Design',
        experience: '6 years designing enterprise SaaS, leading user research studies, and building design systems.',
        profileImage: {
          url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        },
        skillsToTeach: [
          {
            skill: skillMap['Figma'],
            level: 'Expert',
            yearsOfExperience: 6,
            description: 'Advanced auto-layout, atomic design systems, interactive component prototypes.',
          },
          {
            skill: skillMap['UI/UX Design'],
            level: 'Expert',
            yearsOfExperience: 6,
            description: 'User interviews, journey mapping, information architecture, wireframing, and usability testing.',
          },
        ],
        skillsToLearn: [
          {
            skill: skillMap['JavaScript'],
            level: 'Beginner',
            desiredOutcome: 'Write vanilla JS scripts and understand code logic behind UI components.',
            progress: 25,
            sessionsCompleted: 2,
            lastLearned: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            skill: skillMap['Public Speaking'],
            level: 'Intermediate',
            desiredOutcome: 'Confidently pitch designs to executive leadership and speak at design conferences.',
            progress: 40,
            sessionsCompleted: 3,
            lastLearned: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          },
        ],
        availability: [
          {
            day: 'Tuesday',
            slots: [{ startTime: '17:00', endTime: '20:00' }],
          },
          {
            day: 'Thursday',
            slots: [{ startTime: '17:00', endTime: '20:00' }],
          },
          {
            day: 'Sunday',
            slots: [{ startTime: '13:00', endTime: '17:00' }],
          },
        ],
        rating: 4.85,
        reviewCount: 11,
        completedSessions: 15,
        learnersHelped: 10,
        skillsLearnedCount: 1,
      },
      {
        name: 'Sarah Jenkins',
        username: 'sarahjenkins',
        email: 'sarah.jenkins@skillloop.dev',
        password: defaultHashedPassword,
        bio: 'Professional photographer & content creator. I teach digital camera mastery and photo lighting, and want to master cinematic video editing.',
        location: 'New York, NY',
        occupation: 'Commercial Photographer',
        education: 'B.F.A. in Photography',
        experience: '7 years in commercial editorial photography, portraiture, and studio lighting setups.',
        profileImage: {
          url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        },
        skillsToTeach: [
          {
            skill: skillMap['Photography'],
            level: 'Expert',
            yearsOfExperience: 7,
            description: 'Studio flash, manual camera control, composition, color temperature, and location scouting.',
          },
          {
            skill: skillMap['Photoshop'],
            level: 'Advanced',
            yearsOfExperience: 6,
            description: 'High-end portrait retouching, frequency separation, and color grading.',
          },
        ],
        skillsToLearn: [
          {
            skill: skillMap['Video Editing'],
            level: 'Intermediate',
            desiredOutcome: 'Produce cinematic YouTube video essays, pacing, and dynamic multi-cam cuts.',
            progress: 60,
            sessionsCompleted: 5,
            lastLearned: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
        availability: [
          {
            day: 'Wednesday',
            slots: [{ startTime: '14:00', endTime: '18:00' }],
          },
          {
            day: 'Friday',
            slots: [{ startTime: '14:00', endTime: '18:00' }],
          },
          {
            day: 'Saturday',
            slots: [{ startTime: '10:00', endTime: '14:00' }],
          },
        ],
        rating: 4.9,
        reviewCount: 16,
        completedSessions: 20,
        learnersHelped: 14,
        skillsLearnedCount: 2,
      },
      {
        name: 'David Kim',
        username: 'davidkim',
        email: 'david.kim@skillloop.dev',
        password: defaultHashedPassword,
        bio: 'Video producer and motion designer. I teach narrative video editing and pacing, and I am learning Photography to improve my frame composition.',
        location: 'Los Angeles, CA',
        occupation: 'Video Producer & Editor',
        education: 'B.A. in Film and Media Arts',
        experience: '5 years editing short films, music videos, and commercial brand campaigns.',
        profileImage: {
          url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        },
        skillsToTeach: [
          {
            skill: skillMap['Video Editing'],
            level: 'Expert',
            yearsOfExperience: 5,
            description: 'Narrative cutting, sound design, rhythm, DaVinci Resolve color correction, and export optimization.',
          },
        ],
        skillsToLearn: [
          {
            skill: skillMap['Photography'],
            level: 'Beginner',
            desiredOutcome: 'Master framing, prime lenses, and ambient light portraits.',
            progress: 45,
            sessionsCompleted: 4,
            lastLearned: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          },
        ],
        availability: [
          {
            day: 'Wednesday',
            slots: [{ startTime: '14:00', endTime: '18:00' }],
          },
          {
            day: 'Saturday',
            slots: [{ startTime: '10:00', endTime: '14:00' }],
          },
        ],
        rating: 4.8,
        reviewCount: 9,
        completedSessions: 12,
        learnersHelped: 8,
        skillsLearnedCount: 1,
      },
    ];

    const insertedUsers = await User.insertMany(usersData);
    console.log(`[Seed] Seeded ${insertedUsers.length} users successfully!`);

    // Demo users:
    const alex = insertedUsers[0];
    const elena = insertedUsers[1];
    const marcus = insertedUsers[2];
    const priya = insertedUsers[3];
    const david = insertedUsers[4];

    // 1. Connections
    console.log('[Seed] Creating connections...');
    const demoConnection = await Connection.create({
      users: [alex._id, elena._id],
      sharedSkills: [skillMap['React'], skillMap['Python']],
      status: 'active',
      lastActivityAt: new Date(),
    });

    const demoConnection2 = await Connection.create({
      users: [marcus._id, david._id],
      sharedSkills: [skillMap['Photography'], skillMap['Video Editing']],
      status: 'active',
      lastActivityAt: new Date(),
    });

    // 2. Exchange Requests
    console.log('[Seed] Creating exchange requests...');
    const request1 = await ExchangeRequest.create({
      sender: priya._id,
      receiver: alex._id,
      teachSkill: skillMap['UI/UX Design'],
      learnSkill: skillMap['JavaScript'],
      message: 'Hi Alex! I saw your profile and would love to exchange my UI/UX Design knowledge for your JavaScript expertise.',
      status: 'Pending',
    });

    const request2 = await ExchangeRequest.create({
      sender: marcus._id,
      receiver: alex._id,
      teachSkill: skillMap['Photography'],
      learnSkill: skillMap['React'],
      message: 'Hey Alex, looking to learn React for a personal photography portfolio. Happy to teach composition and lighting in exchange!',
      status: 'Pending',
    });

    // 3. Sessions (Past Completed & Upcoming Scheduled)
    console.log('[Seed] Creating sessions...');
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const demoSession = await Session.create({
      connection: demoConnection._id,
      teacher: alex._id,
      learner: elena._id,
      skill: skillMap['React'],
      date: pastDate,
      startTime: '18:00',
      endTime: '19:00',
      meetingLink: 'https://meet.skillloop.dev/alex-elena-react',
      notes: 'Reviewed React custom hooks and state management with useReducer.',
      status: 'Completed',
      progressUpdated: true,
      isReviewed: true,
    });

    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const upcomingSession = await Session.create({
      connection: demoConnection._id,
      teacher: elena._id,
      learner: alex._id,
      skill: skillMap['Python'],
      date: futureDate,
      startTime: '19:00',
      endTime: '20:00',
      meetingLink: 'https://meet.skillloop.dev/elena-alex-python',
      notes: 'Introduction to Python FastAPI routers and dependency injection.',
      status: 'Confirmed',
      progressUpdated: false,
      isReviewed: false,
    });

    // 4. Reviews
    console.log('[Seed] Creating reviews...');
    await Review.create({
      session: demoSession._id,
      reviewer: elena._id,
      reviewedUser: alex._id,
      skill: skillMap['React'],
      rating: 5,
      comment: 'Alex was an incredible mentor! He explained tricky React hook re-rendering concepts clearly with code examples.',
    });

    // 5. Messages
    console.log('[Seed] Creating messages...');
    await Message.create({
      conversation: demoConnection._id,
      sender: alex._id,
      receiver: elena._id,
      text: 'Hi Elena! Great to connect with you. Looking forward to our React and Python exchange.',
      read: true,
      readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    await Message.create({
      conversation: demoConnection._id,
      sender: elena._id,
      receiver: alex._id,
      text: 'Thanks for the great session Alex! Looking forward to our next one on Python.',
      read: true,
      readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    await Message.create({
      conversation: demoConnection._id,
      sender: alex._id,
      receiver: elena._id,
      text: "Sounds great! I've prepped our session notes and setup the repo link.",
      read: false,
    });

    // 6. Notifications
    console.log('[Seed] Creating notifications...');
    await Notification.create({
      recipient: alex._id,
      sender: priya._id,
      type: 'exchange_request_received',
      title: 'New Exchange Request',
      message: 'Priya Sharma wants to exchange UI/UX Design for JavaScript.',
      referenceId: request1._id,
      referenceType: 'ExchangeRequest',
      read: false,
    });

    await Notification.create({
      recipient: alex._id,
      sender: marcus._id,
      type: 'exchange_request_received',
      title: 'New Exchange Request',
      message: 'Marcus Vance sent you a skill exchange request.',
      referenceId: request2._id,
      referenceType: 'ExchangeRequest',
      read: false,
    });

    await Notification.create({
      recipient: alex._id,
      sender: elena._id,
      type: 'new_review',
      title: 'New Review Received',
      message: 'Elena Rostova left you a 5-star review for React!',
      referenceId: demoSession._id,
      referenceType: 'Session',
      read: true,
    });

    await Notification.create({
      recipient: elena._id,
      sender: alex._id,
      type: 'session_scheduled',
      title: 'Upcoming Session Scheduled',
      message: 'Python session scheduled for in 3 days.',
      referenceId: upcomingSession._id,
      referenceType: 'Session',
      read: false,
    });

    console.log('[Seed] All 8 collections populated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
