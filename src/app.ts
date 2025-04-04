import express from 'express';
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/category', categoryRoutes);

export default app;