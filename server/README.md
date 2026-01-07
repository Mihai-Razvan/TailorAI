# TailorAI Backend Server

Backend API server for TailorAI image generation.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create a `.env` file:
```bash
# Choose one of the following API providers:

# Option 1: Replicate (Recommended - supports image-to-image)
REPLICATE_API_TOKEN=your_replicate_api_token_here
AI_API_PROVIDER=replicate

# Option 2: Nano Banana
# NANO_BANANA_API_KEY=your_nano_banana_api_key_here
# AI_API_PROVIDER=nanobanana

# Option 3: OpenAI (Note: DALL-E doesn't support image editing natively)
# OPENAI_API_KEY=your_openai_api_key_here
# AI_API_PROVIDER=openai

# Server Port (optional, defaults to 3001)
PORT=3001
```

3. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### POST /api/generate-outfit

Generate an outfit style based on an uploaded image.

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "style": "casual" | "modern" | "edgy"
}
```

**Response:**
```json
{
  "success": true,
  "generatedImage": "data:image/png;base64,..."
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "TailorAI API is running"
}
```

## API Providers

### Replicate (Recommended)
- Supports image-to-image generation
- Good quality results
- Get API key: https://replicate.com

### Nano Banana
- Specialized image generation API
- Get API key from Nano Banana documentation

### OpenAI
- Note: DALL-E doesn't natively support image editing
- Would require additional setup with Replicate or similar service
