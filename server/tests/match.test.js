const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('../models');
const { app } = require('../server');
const User = require('../models/User');
const Skill = require('../models/Skill');
const { calculateMatchScore } = require('../services/matchingService');

let mongoServer;
let userA;
let userB;
let userC;
let tokenA;
let reactSkill;
let pythonSkill;
let figmaSkill;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create Skills
  reactSkill = await Skill.create({
    name: 'React',
    category: 'Programming',
  });
  pythonSkill = await Skill.create({
    name: 'Python',
    category: 'Programming',
  });
  figmaSkill = await Skill.create({
    name: 'Figma',
    category: 'Design',
  });

  // User A: Teaches React (Expert), Wants Python (Beginner)
  userA = await User.create({
    name: 'User A',
    username: 'user_a',
    email: 'usera@example.com',
    password: 'password123',
    skillsToTeach: [
      {
        skill: reactSkill._id,
        level: 'Expert',
        yearsOfExperience: 5,
      },
    ],
    skillsToLearn: [
      {
        skill: pythonSkill._id,
        level: 'Beginner',
      },
    ],
    availability: [
      {
        day: 'Monday',
        slots: [{ startTime: '18:00', endTime: '21:00' }],
      },
    ],
    rating: 4.9,
    completedSessions: 10,
    bio: 'Experienced frontend developer teaching React.',
  });

  // User B: Teaches Python (Expert), Wants React (Beginner)
  userB = await User.create({
    name: 'User B',
    username: 'user_b',
    email: 'userb@example.com',
    password: 'password123',
    skillsToTeach: [
      {
        skill: pythonSkill._id,
        level: 'Expert',
        yearsOfExperience: 4,
      },
    ],
    skillsToLearn: [
      {
        skill: reactSkill._id,
        level: 'Beginner',
      },
    ],
    availability: [
      {
        day: 'Monday',
        slots: [{ startTime: '18:00', endTime: '21:00' }],
      },
    ],
    rating: 5.0,
    completedSessions: 8,
    bio: 'Python data engineer eager to master React.',
  });

  // User C: Teaches Figma (Expert), Wants Cooking (Unrelated)
  userC = await User.create({
    name: 'User C',
    username: 'user_c',
    email: 'userc@example.com',
    password: 'password123',
    skillsToTeach: [
      {
        skill: figmaSkill._id,
        level: 'Expert',
      },
    ],
    skillsToLearn: [],
    rating: 4.5,
    bio: 'Product designer.',
  });

  // Log in as User A to get auth token
  const res = await request(app).post('/api/auth/login').send({
    email: 'usera@example.com',
    password: 'password123',
  });
  tokenA = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Skill Matching Algorithm & APIs', () => {
  describe('calculateMatchScore unit tests', () => {
    it('should compute high score for mutual skill match with availability overlap', () => {
      const match = calculateMatchScore(userA, userB);

      expect(match.score).toBeGreaterThanOrEqual(80);
      expect(match.matchedSkills.length).toBe(2);
      expect(match.reasons.length).toBeGreaterThanOrEqual(2);
      expect(match.breakdown.mutual).toBeGreaterThanOrEqual(50);
      expect(match.breakdown.availability).toBeGreaterThan(0);
    });

    it('should compute low score for users with no mutual skills', () => {
      const match = calculateMatchScore(userA, userC);

      expect(match.score).toBeLessThanOrEqual(20);
      expect(match.matchedSkills.length).toBe(0);
    });
  });

  describe('GET /api/matches', () => {
    it('should return recommended matches sorted by match score descending', async () => {
      const res = await request(app)
        .get('/api/matches')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      if (res.body.data.length >= 2) {
        expect(res.body.data[0].matchScore).toBeGreaterThanOrEqual(res.body.data[1].matchScore);
      }
    });
  });

  describe('GET /api/matches/:userId', () => {
    it('should return full compatibility breakdown between authenticated user and target peer', async () => {
      const res = await request(app)
        .get(`/api/matches/${userB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.matchScore).toBeGreaterThanOrEqual(80);
      expect(res.body.data.reasons).toBeDefined();
      expect(res.body.data.breakdown).toBeDefined();
    });

    it('should reject match calculation with oneself', async () => {
      const res = await request(app)
        .get(`/api/matches/${userA._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
