require('dotenv').config();
const express = require('express');
const cors = require('cors');
const generateRoutes = require('./routes/generate');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    service: 'FLUX.2 AI Image Generation API',
    version: '1.0.0',
    model: '@cf/black-forest-labs/flux-2-dev',
    endpoints: {
      text_to_image: 'POST /api/generate',
      multi_reference: 'POST /api/generate/multi',
      json_prompt: 'POST /api/generate/json'
    },
    features: [
      'Text-to-Image Generation',
      'Multi-Reference Images (up to 4)',
      'JSON Precise Control',
      'Multi-language Support',
      'Hex Color Code Support'
    ]
  });
});

// Routes
app.use('/api', generateRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: err.message,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
});
