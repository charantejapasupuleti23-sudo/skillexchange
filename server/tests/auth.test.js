const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('../models');
const { app } = require('../server');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Authentication API Endpoints', () => {
  const mockUser = {
    name: 'Alex Morgan',
    username: 'alexmorgan',
    email: 'alex@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user and set auth cookie & return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(mockUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(mockUser.email);
      expect(res.body.user.password).toBeUndefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject registration if email is already taken', async () => {
      await request(app).post('/api/auth/register').send(mockUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          username: 'anotheruser',
          email: mockUser.email,
          password: 'password123',
          confirmPassword: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject registration if password confirmation does not match', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...mockUser,
          confirmPassword: 'mismatchpassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(mockUser);
    });

    it('should log in existing user with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.username).toBe(mockUser.username);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated with Bearer token', async () => {
      const registerRes = await request(app).post('/api/auth/register').send(mockUser);
      const token = registerRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(mockUser.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user bio and location', async () => {
      const reg = await request(app).post('/api/auth/register').send(mockUser);
      const token = reg.body.token;

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bio: 'Full-stack software engineer and open-source enthusiast.',
          location: 'San Francisco, CA',
          occupation: 'Senior Engineer',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bio).toBe('Full-stack software engineer and open-source enthusiast.');
      expect(res.body.data.location).toBe('San Francisco, CA');
      expect(res.body.data.occupation).toBe('Senior Engineer');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 200 and clear the token cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie'][0]).toContain('token=none');
    });
  });
});
