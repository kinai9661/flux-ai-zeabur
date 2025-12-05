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

    console.log(`Generating image: "${prompt}"`);
    const imageBuffer = await generateImage(prompt, { width, height, guidance });
    
    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
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

    console.log(`Multi-ref generation with ${images.length} images: "${prompt}"`);
    const imageBuffer = await generateWithMultiRef(prompt, images);
    
    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Multi-ref generation error:', error);
    res.status(500).json({ error: error.message });
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

    console.log('JSON generation:', JSON.stringify(jsonPrompt));
    const imageBuffer = await generateWithJSON(jsonPrompt);
    
    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (error) {
    console.error('JSON generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
