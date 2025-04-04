import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 15000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth API', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
  };

  it('should register a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('User registered successfully');

    const user = await User.findOne({ email: testUser.email });
    expect(user).toBeTruthy();
    expect(await bcrypt.compare(testUser.password, user!.password)).toBe(true);
  });

  it('should login a user and return a valid token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send(testUser);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET as string) as { id: string };
    expect(decoded.id).toBeDefined();

    const user = await User.findById(decoded.id);
    expect(user).toBeTruthy();
    expect(user!.email).toBe(testUser.email);
  });

  it('should not allow duplicate email registration', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User already exists');
  });

  it('should not login with incorrect password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
    expect(res.body.token).toBeUndefined();
  });

  it('should return 400 if email or password is missing', async () => {
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email });

    expect(res1.status).toBe(400);
    expect(res1.body.message).toBe('Email and password are required');

    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ password: testUser.password });

    expect(res2.status).toBe(400);
    expect(res2.body.message).toBe('Email and password are required');
  });

  it('should return 400 if email or password is missing during registration', async () => {
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ email: testUser.email });

    expect(res1.status).toBe(400);
    expect(res1.body.message).toBe('Email and password are required');

    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ password: testUser.password });

    expect(res2.status).toBe(400);
    expect(res2.body.message).toBe('Email and password are required');
  });
});