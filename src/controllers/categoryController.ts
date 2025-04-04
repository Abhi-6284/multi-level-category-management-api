import { Request, Response } from 'express';
import Category, { ICategory } from '../models/Category';

interface AuthRequest extends Request {
  user?: { id: string };
}

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, parent } = req.body;

  if (!name) {
    res.status(400).json({ message: 'Name is required' });
    return;
  }

  try {
    const category = new Category({ name, parent: parent || null });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await Category.find();

    const buildTree = (parentId: string | null): any[] => {
      return categories
        .filter((cat) => (parentId ? cat.parent?.toString() === parentId : !cat.parent))
        .map((cat) => ({
          _id: cat._id,
          name: cat.name,
          status: cat.status,
          subcategories: buildTree(cat._id.toString()),
        }));
    };

    const tree = buildTree(null);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, status } = req.body;

  try {
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    if (name) category.name = name;
    if (status) {
      category.status = status;
      if (status === 'inactive') {
        await Category.updateMany({ parent: id }, { status: 'inactive' });
      }
    }

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const parentId = category.parent;
    await Category.updateMany({ parent: id }, { parent: parentId });
    await Category.deleteOne({ _id: id });

    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};