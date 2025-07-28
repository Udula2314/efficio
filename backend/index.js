const express = require('express');
const cors = require('cors');
require('dotenv').config();

const notionRoutes = require('./routes/notion');

const app = express();

// Add debugging to see what environment variables are loaded
console.log('Environment variables loaded:');
console.log('NOTION_TOKEN:', process.env.NOTION_TOKEN ? 'Present' : 'Missing');
console.log('NOTION_DATABASE_ID:', process.env.NOTION_CALENDAR_DB_ID ? 'Present' : 'Missing');
console.log('NOTION_TIMEBLOCK_DB_ID:', process.env.NOTION_TIMEBLOCK_DB_ID ? 'Present' : 'Missing');
console.log('PORT:', process.env.PORT || 5000);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true
}));

app.use(express.json());

// Add a test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running!', timestamp: new Date().toISOString() });
});

// Add a health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', port: process.env.PORT || 5000 });
});

app.use('/api/notion', notionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something broke!', message: err.message });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test the server: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});