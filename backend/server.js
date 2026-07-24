const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load env vars BEFORE any module that uses them
dotenv.config();

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Routes imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Connect to Database
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all in development; tighten in production if needed
  },
  credentials: true
}));
app.use(express.json());

// Root API Welcome Route
app.get('/', (req, res) => {
  res.json({
    message: 'AI-Powered Manufacturing Quality Assistant API is running',
    health: '/api/health'
  });
});

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
