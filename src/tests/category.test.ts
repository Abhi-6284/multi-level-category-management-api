import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app';
import Category from '../models/Category';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

let mongoServer: MongoMemoryServer;
let token: string;
let rootCategoryId: string;
let parentCategoryId: string;
let subCategoryId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const user = await new User({ email: 'test@example.com', password: 'password123' }).save();
  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string || 'test_secret');
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
  await Category.deleteMany({});
  const rootCat = await new Category({ name: 'Root' }).save();
  rootCategoryId = rootCat._id.toString();

  const parentCat = await new Category({ name: 'Electronics', parent: rootCategoryId }).save();
  parentCategoryId = parentCat._id.toString();

  const subCat = await new Category({ name: 'Smartphones', parent: parentCategoryId }).save();
  subCategoryId = subCat._id.toString();
});

describe('Category API', () => {
  it('should create a root category', async () => {
    const res = await request(app)
      .post('/api/category')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Appliances' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Appliances');
    expect(res.body.parent).toBeNull();
    expect(res.body.status).toBe('active');
  });

  it('should create a subcategory with a parent', async () => {
    const res = await request(app)
      .post('/api/category')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Laptops', parent: parentCategoryId });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Laptops');
    expect(res.body.parent).toBe(parentCategoryId);
    expect(res.body.status).toBe('active');
  });

  it('should return 400 if name is missing', async () => {
    const res = await request(app)
      .post('/api/category')
      .set('Authorization', `Bearer ${token}`)
      .send({ parent: parentCategoryId });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Name is required');
  });

  it('should fetch categories as a tree', async () => {
    const res = await request(app)
      .get('/api/category')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toContainEqual(
      expect.objectContaining({
        _id: rootCategoryId,
        name: 'Root',
        subcategories: expect.arrayContaining([
          expect.objectContaining({
            _id: parentCategoryId,
            name: 'Electronics',
            subcategories: expect.arrayContaining([
              expect.objectContaining({
                _id: subCategoryId,
                name: 'Smartphones',
              }),
            ]),
          }),
        ]),
      })
    );
  });

  it('should update category name', async () => {
    const res = await request(app)
      .put(`/api/category/${subCategoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Phones' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Phones');
    expect(res.body._id).toBe(subCategoryId);

    const updatedCategory = await Category.findById(subCategoryId);
    expect(updatedCategory?.name).toBe('Phones');
  });

  it('should update category**.status to inactive and cascade to subcategories', async () => {
    const res = await request(app)
      .put(`/api/category/${parentCategoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'inactive' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('inactive');

    const parentCat = await Category.findById(parentCategoryId);
    const subCat = await Category.findById(subCategoryId);
    expect(parentCat?.status).toBe('inactive');
    expect(subCat?.status).toBe('inactive');
  });

  it('should delete a category and reassign subcategories to grandparent', async () => {
    const res = await request(app)
      .delete(`/api/category/${parentCategoryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Category deleted');

    const deletedCategory = await Category.findById(parentCategoryId);
    expect(deletedCategory).toBeNull();

    const subCat = await Category.findById(subCategoryId);
    expect(subCat?.parent?.toString()).toBe(rootCategoryId);
  });

  it('should delete a category with no subcategories', async () => {
    const newCat = await new Category({ name: 'Accessories' }).save();
    const newCatId = newCat._id.toString();

    const res = await request(app)
      .delete(`/api/category/${newCatId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Category deleted');

    const deletedCategory = await Category.findById(newCatId);
    expect(deletedCategory).toBeNull();
  });

  it('should return 404 when deleting a non-existent category', async () => {
    const res = await request(app)
      .delete('/api/category/123456789012345678901234')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Category not found');
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app)
      .post('/api/category')
      .send({ name: 'Test' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });
});