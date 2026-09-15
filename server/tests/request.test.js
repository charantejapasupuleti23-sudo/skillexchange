const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('../models');
const { app } = require('../server');
const User = require('../models/User');
const Skill = require('../models/Skill');
const ExchangeRequest = require('../models/ExchangeRequest');
const Connection = require('../models/Connection');
const Notification = require('../models/Notification');

let mongoServer;
let user1, user2;
let token1, token2;
let skill1, skill2;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create Skills
  skill1 = await Skill.create({ name: 'Node.js', category: 'Programming' });
  skill2 = await Skill.create({ name: 'UI/UX', category: 'Design' });

  // Create User 1
  const res1 = await request(app).post('/api/auth/register').send({
    name: 'Alice Cooper',
    username: 'alicecooper',
    email: 'alice@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  });
  token1 = res1.body.token;
  user1 = res1.body.user;

  // Create User 2
  const res2 = await request(app).post('/api/auth/register').send({
    name: 'Bob Martin',
    username: 'bobmartin',
    email: 'bob@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  });
  token2 = res2.body.token;
  user2 = res2.body.user;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Exchange Requests & Connections APIs', () => {
  let createdRequestId;

  describe('POST /api/requests', () => {
    it('should allow user1 to send a skill exchange request to user2', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          receiverId: user2._id,
          teachSkillId: skill1._id,
          learnSkillId: skill2._id,
          message: 'Hi Bob! I can teach you Node.js if you can guide me in UI/UX.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Pending');
      createdRequestId = res.body.data._id;

      // Check notification created for user2
      const notif = await Notification.findOne({ recipient: user2._id });
      expect(notif).toBeDefined();
      expect(notif.type).toBe('exchange_request_received');
    });

    it('should reject duplicate pending requests between the same users', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          receiverId: user2._id,
          teachSkillId: skill1._id,
          learnSkillId: skill2._id,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/requests/sent and /received', () => {
    it('should list sent requests for sender', async () => {
      const res = await request(app)
        .get('/api/requests/sent')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should list received requests for receiver', async () => {
      const res = await request(app)
        .get('/api/requests/received')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PUT /api/requests/:id/accept', () => {
    it('should allow receiver (user2) to accept request and establish Connection', async () => {
      const res = await request(app)
        .put(`/api/requests/${createdRequestId}/accept`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.request.status).toBe('Accepted');
      expect(res.body.data.connectionId).toBeDefined();

      // Check connection exists
      const connection = await Connection.findById(res.body.data.connectionId);
      expect(connection).toBeDefined();
      expect(connection.status).toBe('active');
      expect(connection.users.map((u) => u.toString())).toContain(user1._id);
      expect(connection.users.map((u) => u.toString())).toContain(user2._id);
    });
  });

  describe('GET /api/connections', () => {
    it('should return active connections for user1', async () => {
      const res = await request(app)
        .get('/api/connections')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].peer._id).toBe(user2._id);
    });
  });
});
