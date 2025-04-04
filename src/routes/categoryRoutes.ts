import express from 'express';
import { protect } from '../middleware/auth';
import { createCategory, getCategories, updateCategory, deleteCategory } from '../controllers/categoryController';

const router = express.Router();

router.use(protect);
router.post('/', createCategory);
router.get('/', getCategories);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;