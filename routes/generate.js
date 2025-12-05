const express = require('express');
const router = express.Router();
const multer = require('multer');
const { generateImage, generateWithMultiRef, generateWithJSON } = require('../utils/cloudflare');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

// Basic text-to-image generation
router.post('/generate', async (req, res) => {
  try {
    const { prompt, width = 1024, height = 1024, guidance = 3.5 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`🎨 Generating image: "${prompt}" (${width}x${height})`);
    const imageBuffer = await generateImage(prompt, { width, height, guidance });
    
    // Validate buffer
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Received empty image buffer from API');
    }
    
    console.log(`✅ Image generated successfully (${imageBuffer.length} bytes)`);
    
    // Set proper headers
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'no-cache'
    });
    res.send(imageBuffer);
  } catch (error) {
    console.error('❌ Generation error:', error);
    
    // Make sure we send JSON error, not buffer
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Multi-reference image generation
router.post('/generate/multi', upload.array('images', 4), async (req, res) => {
  try {
    const { prompt } = req.body;
    const images = req.files;

    if (!prompt || !images || images.length === 0) {
      return res.status(400).json({ 
        error: 'Prompt and at least one image required',
        usage: 'Send multipart/form-data with prompt and images field'
      });
    }

    if (images.length > 4) {
      return res.status(400).json({ error: 'Maximum 4 images allowed' });
    }

    console.log(`🖼️ Multi-ref generation with ${images.length} images: "${prompt}"`);
    const imageBuffer = await generateWithMultiRef(prompt, images);
    
    // Validate buffer
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Received empty image buffer from API');
    }
    
    console.log(`✅ Multi-ref image generated successfully (${imageBuffer.length} bytes)`);
    
    // Set proper headers
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'no-cache'
    });
    res.send(imageBuffer);
  } catch (error) {
    console.error('❌ Multi-ref generation error:', error);
    
    // Make sure we send JSON error, not buffer
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// JSON-controlled generation
router.post('/generate/json', async (req, res) => {
  try {
    const { jsonPrompt } = req.body;

    if (!jsonPrompt) {
      return res.status(400).json({ 
        error: 'JSON prompt is required',
        example: {
          jsonPrompt: {
            description: "modern website landing page",
            color_scheme: "#2ECC71",
            style: "minimalist"
          }
        }
      });
    }

    console.log('⚙️ JSON generation:', JSON.stringify(jsonPrompt));
    const imageBuffer = await generateWithJSON(jsonPrompt);
    
    // Validate buffer
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Received empty image buffer from API');
    }
    
    console.log(`✅ JSON image generated successfully (${imageBuffer.length} bytes)`);
    
    // Set proper headers
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'no-cache'
    });
    res.send(imageBuffer);
  } catch (error) {
    console.error('❌ JSON generation error:', error);
    
    // Make sure we send JSON error, not buffer
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Multer error handling
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large (max 5MB)' });
    }
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

module.exports = router;
