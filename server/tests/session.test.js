const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('../models');
const { app } = require('../server');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Connection = require('../models/Connection');
const Session = require('../models/Session');
const Review = require('../models/Review');

let mongoServer;
let teacher, learner;
let teacherToken, learnerToken;
let skill;
let connection;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  skill = await Skill.create({ name: 'Docker', category: 'Programming' });

  // Create Teacher
  const tRes = await request(app).post('/api/auth/register').send({
    name: 'Eva Green',
    username: 'evagreen',
    email: 'eva@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  });
  teacherToken = tRes.body.token;
  teacher = tRes.body.user;

  // Create Learner
  const lRes = await request(app).post('/api/auth/register').send({
    name: 'Liam Vance',
    username: 'liamvance',
    email: 'liam@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  });
  learnerToken = lRes.body.token;
  learner = lRes.body.user;

  // Add skill to learner's skillsToLearn
  await request(app)
    .post('/api/users/skills/learn')
    .set('Authorization', `Bearer ${learnerToken}`)
    .send({
      skillId: skill._id.toString(),
      level: 'Beginner',
      desiredOutcome: 'Learn Docker containerization',
    });

  // Create connection
  connection = await Connection.create({
    users: [teacher._id, learner._id],
    status: 'active',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Session Scheduling & Reviews APIs', () => {
  let sessionId;

  describe('POST /api/sessions', () => {
    it('should schedule a new session for a future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          connectionId: connection._id,
          teacherId: teacher._id,
          learnerId: learner._id,
          skillId: skill._id,
          date: futureDate.toISOString(),
          startTime: '14:00',
          endTime: '15:00',
          notes: 'Covering container volumes and multi-stage builds.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Pending');
      sessionId = res.body.data._id;
    });

    it('should reject scheduling for a date in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);

      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          connectionId: connection._id,
          teacherId: teacher._id,
          learnerId: learner._id,
          skillId: skill._id,
          date: pastDate.toISOString(),
          startTime: '14:00',
          endTime: '15:00',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/sessions/:id/accept and complete', () => {
    it('should allow teacher to accept session', async () => {
      const res = await request(app)
        .put(`/api/sessions/${sessionId}/accept`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Confirmed');
    });

    it('should mark session completed and update learner progress', async () => {
      const res = await request(app)
        .put(`/api/sessions/${sessionId}/complete`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Completed');

      // Verify learner skill progress incremented
      const updatedLearner = await User.findById(learner._id);
      const learnedSkill = updatedLearner.skillsToLearn.find(
        (s) => s.skill.toString() === skill._id.toString()
      );
      expect(learnedSkill.sessionsCompleted).toBe(1);
      expect(learnedSkill.progress).toBeGreaterThan(0);
    });
  });

  describe('POST /api/reviews and GET /api/reviews/user/:userId', () => {
    it('should allow learner to submit a review for completed session', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          sessionId,
          rating: 5,
          comment: 'Eva was extremely knowledgeable and patient while explaining Docker concepts!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);

      // Verify teacher average rating recalculation
      const updatedTeacher = await User.findById(teacher._id);
      expect(updatedTeacher.rating).toBe(5.0);
      expect(updatedTeacher.reviewCount).toBe(1);
    });

    it('should prevent reviewing the same session twice', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          sessionId,
          rating: 4,
          comment: 'Another review attempt.',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should retrieve all reviews for the teacher', async () => {
      const res = await request(app).get(`/api/reviews/user/${teacher._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].comment).toContain('knowledgeable and patient');
    });
  });
});
