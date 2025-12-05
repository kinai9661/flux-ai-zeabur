# FLUX.2 AI Image Generation API

🚀 AI Image Generation API powered by Cloudflare Workers AI FLUX.2 [dev] model, deployed on Zeabur.

## Features

- 🎨 **Text-to-Image Generation**: Generate high-fidelity images from text prompts
- 🖼️ **Multi-Reference Images**: Combine up to 4 reference images (512x512 each)
- 🎯 **JSON Precise Control**: Granular control with JSON prompting
- 🌍 **Multi-language Support**: Chinese, English, and other languages
- 🎨 **Color Code Support**: Direct hex color control (e.g., #2ECC71)
- ⚡ **Fast Deployment**: One-click deploy to Zeabur

## Tech Stack

- **Backend**: Node.js + Express.js
- **AI Model**: Cloudflare Workers AI - FLUX.2 [dev]
- **Deployment**: Zeabur
- **Image Processing**: Multer + FormData

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/kinai9661/flux-ai-zeabur.git
cd flux-ai-zeabur
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create `.env` file:

```env
PORT=3000
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

### 4. Run Locally

```bash
npm start
```

Visit `http://localhost:3000` for health check.

## Deploy to Zeabur

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates)

1. Click the button above or visit [Zeabur Dashboard](https://zeabur.com)
2. Connect your GitHub repository
3. Add environment variables:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
4. Deploy automatically

## API Endpoints

### Health Check

```bash
GET /
```

### Text-to-Image Generation

```bash
POST /api/generate
Content-Type: application/json

{
  "prompt": "a majestic dragon flying over mountains at sunset",
  "width": 1024,
  "height": 1024
}
```

### Multi-Reference Image Generation

```bash
POST /api/generate/multi
Content-Type: multipart/form-data

prompt: "take the subject of image 1 and style it like image 0"
images: [file1.jpg, file2.jpg]
```

### JSON Precise Control

```bash
POST /api/generate/json
Content-Type: application/json

{
  "jsonPrompt": {
    "description": "modern website landing page",
    "color_scheme": "#2ECC71",
    "style": "minimalist"
  }
}
```

## Usage Examples

### cURL

```bash
# Basic generation
curl -X POST https://your-app.zeabur.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "beautiful sunset over ocean"}' \
  --output image.png

# Multi-reference
curl -X POST https://your-app.zeabur.app/api/generate/multi \
  -F "prompt=combine these images" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg" \
  --output result.png
```

### JavaScript

```javascript
// Text-to-Image
const response = await fetch('https://your-app.zeabur.app/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'a futuristic city at night',
    width: 1024,
    height: 1024
  })
});

const blob = await response.blob();
const imageUrl = URL.createObjectURL(blob);
```

### Python

```python
import requests

# Text-to-Image
response = requests.post(
    'https://your-app.zeabur.app/api/generate',
    json={'prompt': 'beautiful landscape painting'},
)

with open('image.png', 'wb') as f:
    f.write(response.content)
```

## Get Cloudflare Credentials

1. Visit [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → **AI**
3. Copy your **Account ID**
4. Create **API Token** with Workers AI permissions

## Project Structure

```
flux-ai-zeabur/
├── package.json          # Dependencies
├── server.js             # Express server
├── routes/
│   └── generate.js       # API routes
├── utils/
│   └── cloudflare.js     # Cloudflare AI integration
├── .env.example          # Environment template
├── zbpack.json           # Zeabur config
└── README.md             # Documentation
```

## Model Capabilities

- **High-fidelity image generation**
- **Physical world grounding**
- **Multi-language prompts**
- **Digital asset creation** (landing pages, comics, infographics)
- **Style transfer and composition**
- **Precise color control**

## Notes

- Input images must be ≤ 512x512 pixels
- Maximum 4 reference images per request
- Model supports Latin and non-Latin characters
- Response time varies based on complexity

## License

MIT License

## Links

- [Cloudflare FLUX.2 Announcement](https://blog.cloudflare.com/flux-2-workers-ai/)
- [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Zeabur Documentation](https://zeabur.com/docs)

---

Built with ❤️ using Cloudflare Workers AI & Zeabur
