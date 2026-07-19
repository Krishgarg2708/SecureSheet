require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const fileRoutes = require('./routes/fileRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const logRoutes = require('./routes/logRoutes');

connectDB();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api', limiter);

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', time: new Date() }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/logs', logRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SecureSheet Pro API running on port ${PORT}`));
