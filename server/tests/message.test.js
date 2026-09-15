const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('../models');
const { app } = require('../server');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

let mongoServer;
let user1, user2;
let token1, token2;
let connection;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create User 1
  const res1 = await request(app).post('/api/auth/register').send({
    name: 'Chloe Zhang',
    username: 'chloezhang',
    email: 'chloe@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  });
  token1 = res1.body.token;
  user1 = res1.body.user;

  // Create User 2
  const res2 = await request(app).post('/api/auth/register').send({
    name: 'Daniel Cruz',
    username: 'danielcruz',
    email: 'daniel@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  });
  token2 = res2.body.token;
  user2 = res2.body.user;

  // Establish active Connection
  connection = await Connection.create({
    users: [user1._id, user2._id],
    status: 'active',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Chat Messaging & Notifications APIs', () => {
  let createdMessageId;

  describe('POST /api/messages', () => {
    it('should allow user1 to send message to user2 in active connection', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          connectionId: connection._id,
          receiverId: user2._id,
          text: 'Hey Daniel! When are you free for our first practice session?',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.text).toContain('first practice session');
      expect(res.body.data.read).toBe(false);
      createdMessageId = res.body.data._id;

      // Check notification created
      const notif = await Notification.findOne({
        recipient: user2._id,
        type: 'new_message',
      });
      expect(notif).toBeDefined();
    });
  });

  describe('GET /api/messages/:connectionId', () => {
    it('should retrieve conversation history and mark unread messages as read for receiver (user2)', async () => {
      const res = await request(app)
        .get(`/api/messages/${connection._id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      // Verify that message was marked read
      const updatedMessage = await Message.findById(createdMessageId);
      expect(updatedMessage.read).toBe(true);
    });
  });

  describe('GET and PUT /api/notifications', () => {
    it('should return notifications with unread count for user2', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
    });

    it('should mark all notifications as read', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token2}`);

      expect(checkRes.body.unreadCount).toBe(0);
    });
  });
});
