const fetch = require('node-fetch');
const FormData = require('form-data');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const MODEL_NAME = '@cf/black-forest-labs/flux-2-dev';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.error('⚠️  Missing Cloudflare credentials!');
  console.error('Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in environment variables');
}

// Helper function for retry with exponential backoff
async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      
      // If rate limited (429) or capacity exceeded (3040), retry with exponential backoff
      if ((response.status === 429 || response.status === 500) && i < retries) {
        const errorText = await response.text();
        
        // Check if it's a capacity error
        if (errorText.includes('Capacity temporarily exceeded') || errorText.includes('3040')) {
          const delay = RETRY_DELAY * Math.pow(2, i);
          console.log(`⏳ Capacity exceeded. Retrying in ${delay}ms... (attempt ${i + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Other 429 errors
        if (response.status === 429) {
          const delay = RETRY_DELAY * Math.pow(2, i);
          console.log(`⏳ Rate limited. Retrying in ${delay}ms... (attempt ${i + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // If success or non-retryable error, return
      return response;
    } catch (error) {
      if (i === retries) throw error;
      
      const delay = RETRY_DELAY * Math.pow(2, i);
      console.log(`⚠️  Request failed. Retrying in ${delay}ms... (attempt ${i + 1}/${retries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function generateImage(prompt, options = {}) {
  const form = new FormData();
  form.append('prompt', prompt);
  
  if (options.width) form.append('width', options.width);
  if (options.height) form.append('height', options.height);
  if (options.guidance) form.append('guidance', options.guidance);
  if (options.num_steps) form.append('num_steps', options.num_steps);

  const response = await fetchWithRetry(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${MODEL_NAME}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        ...form.getHeaders()
      },
      body: form
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudflare API error (${response.status}): ${error}`);
  }

  return await response.buffer();
}

async function generateWithMultiRef(prompt, images) {
  const form = new FormData();
  form.append('prompt', prompt);

  // Add images with proper naming convention: input_image_0, input_image_1, etc.
  images.forEach((image, index) => {
    form.append(`input_image_${index}`, image.buffer, {
      filename: image.originalname || `image_${index}.jpg`,
      contentType: image.mimetype
    });
  });

  const response = await fetchWithRetry(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${MODEL_NAME}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        ...form.getHeaders()
      },
      body: form
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudflare API error (${response.status}): ${error}`);
  }

  return await response.buffer();
}

async function generateWithJSON(jsonPrompt) {
  const form = new FormData();
  // Pass JSON as string in the prompt field
  form.append('prompt', JSON.stringify(jsonPrompt));

  const response = await fetchWithRetry(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${MODEL_NAME}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        ...form.getHeaders()
      },
      body: form
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudflare API error (${response.status}): ${error}`);
  }

  return await response.buffer();
}

module.exports = { generateImage, generateWithMultiRef, generateWithJSON };
