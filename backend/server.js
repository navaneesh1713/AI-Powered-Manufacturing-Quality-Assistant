const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Routes imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const aiRoutes = require('./routes/aiRoutes');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'AI-Powered Manufacturing Quality Assistant',
    timestamp: new Date().toISOString(),
    gemini_key_configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE')
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/ai', aiRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] AI Quality Assistant Backend running on port ${PORT}`);
});
