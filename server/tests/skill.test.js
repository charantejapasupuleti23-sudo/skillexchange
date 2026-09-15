const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('../models');
const { app } = require('../server');
const User = require('../models/User');
const Skill = require('../models/Skill');

let mongoServer;
let authToken;
let testUser;
let testSkill;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create test user and get auth token
  const res = await request(app).post('/api/auth/register').send({
    name: 'Jordan Lee',
    username: 'jordanlee',
    email: 'jordan@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  });
  authToken = res.body.token;
  testUser = res.body.user;

  // Create test skill
  testSkill = await Skill.create({
    name: 'TypeScript',
    category: 'Programming',
    description: 'Typed superset of JavaScript',
    icon: 'Code',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Skill Management API Endpoints', () => {
  describe('GET /api/skills', () => {
    it('should retrieve list of all skills', async () => {
      const res = await request(app).get('/api/skills');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(1);
    });

    it('should filter skills by category', async () => {
      const res = await request(app).get('/api/skills?category=Programming');
      expect(res.status).toBe(200);
      expect(res.body.data[0].category).toBe('Programming');
    });
  });

  describe('POST /api/skills', () => {
    it('should allow authenticated user to create a new skill', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'GraphQL',
          category: 'Programming',
          description: 'Query language for APIs',
          icon: 'Share2',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('GraphQL');
    });

    it('should prevent creating duplicate skill names', async () => {
      const res = await request(app)
        .post('/api/skills')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'GraphQL',
          category: 'Programming',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('User Skills Management', () => {
    it('should add a skill to user teaching list', async () => {
      const res = await request(app)
        .post('/api/users/skills/teach')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skillId: testSkill._id.toString(),
          level: 'Advanced',
          yearsOfExperience: 3,
          description: 'Built production TypeScript backends and frontend SDKs.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].level).toBe('Advanced');
    });

    it('should add a skill to user learning list', async () => {
      const res = await request(app)
        .post('/api/users/skills/learn')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skillId: testSkill._id.toString(),
          level: 'Beginner',
          desiredOutcome: 'Write clean type interfaces and generics.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].level).toBe('Beginner');
    });

    it('should update learning progress for a skill', async () => {
      const res = await request(app)
        .put('/api/users/skills/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skillId: testSkill._id.toString(),
          progress: 55,
          sessionsCompleted: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.progress).toBe(55);
      expect(res.body.data.sessionsCompleted).toBe(2);
    });

    it('should update user availability schedule', async () => {
      const res = await request(app)
        .put('/api/users/availability')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          availability: [
            {
              day: 'Monday',
              slots: [{ startTime: '18:00', endTime: '20:00' }],
            },
            {
              day: 'Saturday',
              slots: [{ startTime: '10:00', endTime: '12:00' }],
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should remove a teaching skill from user profile', async () => {
      const res = await request(app)
        .delete(`/api/users/skills/teach/${testSkill._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });
});
