/**
 * Integration tests for /api/users routes
 * TDD: These tests define the desired behavior BEFORE implementation.
 * 
 * Tests cover:
 * - Auth routes (register, login, change-password)
 * - Protected chat routes (require JWT)
 * - Security (ReDoS-safe email handling, unauthorized access)
 */

// Must mock BEFORE requiring any module that imports config/db
jest.mock('../config/db', () => jest.fn());

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

const connectToDB = require('../config/db');

// ─────────────────────────────────────────────
// MongoDB mock chain setup
// ─────────────────────────────────────────────
const mockInsertOne  = jest.fn();
const mockFindOne    = jest.fn();
const mockUpdateOne  = jest.fn();
const mockDeleteOne  = jest.fn();
const mockToArray    = jest.fn();
const mockFind       = jest.fn(() => ({ toArray: mockToArray }));

const mockCollection = jest.fn(() => ({
  insertOne:  mockInsertOne,
  findOne:    mockFindOne,
  find:       mockFind,
  updateOne:  mockUpdateOne,
  deleteOne:  mockDeleteOne,
}));

const mockDb     = jest.fn(() => ({ collection: mockCollection }));
const mockClient = { db: mockDb };

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const TEST_SECRET = process.env.JWT_SECRET;
const VALID_USER_ID = '507f1f77bcf86cd799439011';
const VALID_CHAT_ID = '507f191e810c19729de860ea';

/** Generate a valid JWT token for test requests */
const makeToken = (userId = VALID_USER_ID, email = 'test@eira.com') =>
  jwt.sign({ userId, email }, TEST_SECRET, { expiresIn: '1h' });

/** Build the auth header */
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// ─────────────────────────────────────────────
// App setup (mirrors server.js intent, without duplications)
// ─────────────────────────────────────────────
let app;

beforeAll(() => {
  connectToDB.mockResolvedValue(mockClient);

  app = express();
  app.use(express.json());

  // Require routes AFTER mocks are in place
  const userRoutes = require('../routes/userRoutes');
  app.use('/api/users', userRoutes);
});

beforeEach(() => {
  jest.clearAllMocks();
  connectToDB.mockResolvedValue(mockClient);
});

// ═════════════════════════════════════════════
// POST /api/users/register
// ═════════════════════════════════════════════
describe('POST /api/users/register', () => {
  it('creates a new user and returns 201', async () => {
    mockFindOne.mockResolvedValue(null); // email not taken
    mockInsertOne.mockResolvedValue({ insertedId: VALID_USER_ID });

    const res = await request(app)
      .post('/api/users/register')
      .send({ username: 'TestUser', email: 'new@eira.com', password: 'Secret123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('userId');
  });

  it('returns 400 if email already registered', async () => {
    mockFindOne.mockResolvedValue({ email: 'existing@eira.com' });

    const res = await request(app)
      .post('/api/users/register')
      .send({ username: 'TestUser', email: 'existing@eira.com', password: 'Secret123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it('returns 400 if fields are missing', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'missing@eira.com' }); // no username or password

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════
// POST /api/users/login
// ═════════════════════════════════════════════
describe('POST /api/users/login', () => {
  const hashedPassword = '$2b$10$examplehashedpasswordfortesting123';

  it('returns 200 with token, name and id on success', async () => {
    mockFindOne.mockResolvedValue({
      _id: VALID_USER_ID,
      username: 'TestUser',
      email: 'test@eira.com',
      password: hashedPassword,
    });

    // We need bcrypt.compare to return true – mock it
    jest.mock('bcryptjs', () => ({
      hash: jest.fn().mockResolvedValue('hashed'),
      compare: jest.fn().mockResolvedValue(true),
    }));

    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@eira.com', password: 'Secret123' });

    // Must return 200 with a JWT token
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('id');
  });

  it('returns 401 if user is not found', async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'ghost@eira.com', password: 'anything' });

    expect(res.status).toBe(401);
  });

  it('returns 400 if email or password is missing', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'nopass@eira.com' });

    expect(res.status).toBe(400);
  });

  it('handles email with regex special characters safely (ReDoS protection)', async () => {
    // Crafted to trigger ReDoS if email is used in a RegExp
    mockFindOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/users/login')
      .send({ email: '(.*)+@evil.com', password: 'test' });

    // Should return 401 (not found), NOT 500 (crash / regex error)
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════
// POST /api/users/change-password
// ═════════════════════════════════════════════
describe('POST /api/users/change-password', () => {
  it('updates password and returns 200', async () => {
    mockFindOne.mockResolvedValue({ email: 'test@eira.com', password: 'old' });
    mockUpdateOne.mockResolvedValue({ matchedCount: 1 });

    const res = await request(app)
      .post('/api/users/change-password')
      .send({ email: 'test@eira.com', newPassword: 'NewSecret123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  it('returns 404 if user not found', async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/users/change-password')
      .send({ email: 'ghost@eira.com', newPassword: 'NewSecret123' });

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════
// POST /api/users/chats — PROTECTED
// ═════════════════════════════════════════════
describe('POST /api/users/chats (protected)', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .post('/api/users/chats')
      .send({ userId: VALID_USER_ID, message: 'Hello', sender: 'user' });

    expect(res.status).toBe(401);
  });

  it('returns 403 when an invalid token is provided', async () => {
    const res = await request(app)
      .post('/api/users/chats')
      .set('Authorization', 'Bearer invalidtoken')
      .send({ userId: VALID_USER_ID, message: 'Hello', sender: 'user' });

    expect(res.status).toBe(403);
  });

  it('creates a new chat with a valid token and returns 201', async () => {
    mockInsertOne.mockResolvedValue({ insertedId: VALID_CHAT_ID });

    const res = await request(app)
      .post('/api/users/chats')
      .set(authHeader(makeToken()))
      .send({ userId: VALID_USER_ID, message: 'Hello Eira!', sender: 'user' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('chatId');
  });

  it('updates an existing chat when chatId is provided', async () => {
    mockUpdateOne.mockResolvedValue({ matchedCount: 1 });

    const res = await request(app)
      .post('/api/users/chats')
      .set(authHeader(makeToken()))
      .send({ userId: VALID_USER_ID, chatId: VALID_CHAT_ID, message: 'Follow up', sender: 'bot' });

    expect(res.status).toBe(201);
    expect(res.body.chatId).toBe(VALID_CHAT_ID);
  });

  it('returns 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/users/chats')
      .set(authHeader(makeToken()))
      .send({ userId: VALID_USER_ID }); // missing message and sender

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════
// GET /api/users/chats/user/:userId — PROTECTED
// ═════════════════════════════════════════════
describe('GET /api/users/chats/user/:userId (protected)', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/api/users/chats/user/${VALID_USER_ID}`);
    expect(res.status).toBe(401);
  });

  it('returns chat array for a valid userId', async () => {
    const mockChats = [
      { _id: VALID_CHAT_ID, userId: VALID_USER_ID, messages: [] },
    ];
    mockToArray.mockResolvedValue(mockChats);

    const res = await request(app)
      .get(`/api/users/chats/user/${VALID_USER_ID}`)
      .set(authHeader(makeToken()));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 404 if user has no chats', async () => {
    mockToArray.mockResolvedValue([]);

    const res = await request(app)
      .get(`/api/users/chats/user/${VALID_USER_ID}`)
      .set(authHeader(makeToken()));

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════
// GET /api/users/chats/:chatId — PROTECTED
// ═════════════════════════════════════════════
describe('GET /api/users/chats/:chatId (protected)', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/api/users/chats/${VALID_CHAT_ID}`);
    expect(res.status).toBe(401);
  });

  it('returns the chat document for a valid chatId', async () => {
    mockFindOne.mockResolvedValue({
      _id: VALID_CHAT_ID,
      userId: VALID_USER_ID,
      messages: [],
    });

    const res = await request(app)
      .get(`/api/users/chats/${VALID_CHAT_ID}`)
      .set(authHeader(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(VALID_CHAT_ID);
  });

  it('returns 404 if chat is not found', async () => {
    mockFindOne.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/users/chats/${VALID_CHAT_ID}`)
      .set(authHeader(makeToken()));

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════
// DELETE /api/users/chats/:chatId — PROTECTED
// ═════════════════════════════════════════════
describe('DELETE /api/users/chats/:chatId (protected)', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).delete(`/api/users/chats/${VALID_CHAT_ID}`);
    expect(res.status).toBe(401);
  });

  it('deletes the chat and returns 200', async () => {
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 });

    const res = await request(app)
      .delete(`/api/users/chats/${VALID_CHAT_ID}`)
      .set(authHeader(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('returns 404 if chat is not found', async () => {
    mockDeleteOne.mockResolvedValue({ deletedCount: 0 });

    const res = await request(app)
      .delete(`/api/users/chats/${VALID_CHAT_ID}`)
      .set(authHeader(makeToken()));

    expect(res.status).toBe(404);
  });
});
