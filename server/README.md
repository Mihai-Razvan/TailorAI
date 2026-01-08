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
# Google Nano Banana API (Required)
# Official Google API for image generation using Gemini models
# Get your API key from: https://aistudio.google.com/app/apikey
GOOGLE_NANO_BANANA_API_KEY=your_google_nano_banana_api_key_here

# Nano Banana Model (Optional)
# Options: 'gemini-2.5-flash-image' (faster) or 'gemini-3-pro-image-preview' (better quality)
# Default: 'gemini-3-pro-image-preview'
NANO_BANANA_MODEL=gemini-3-pro-image-preview

# Server Port (optional, defaults to 3001)
PORT=3001
```

**Note:** Google Nano Banana API key is required. This is the official Google API for image generation.

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

## API Provider

### Google Nano Banana (Official Google API)
- **Official Google API for image generation**
- Uses Gemini models for image generation and editing
- Models available:
  - `gemini-2.5-flash-image`: Faster generation, optimized for speed
  - `gemini-3-pro-image-preview`: Better quality, high-fidelity results (default)
- Supports image editing via prompt guidance
- Preserves face and background while changing clothing based on prompt instructions
- Get API key: https://aistudio.google.com/app/apikey
- Documentation: https://ai.google.dev/gemini-api/docs/nanobanana
- Pricing: $30 per 1,000,000 output tokens (~$0.039 per image)

## How It Works

1. **Image Generation Process:**
   - Accepts original image (base64 encoded) + prompt for editing
   - Uses Google Nano Banana API with selected Gemini model
   - Prompt instructs AI to preserve face/pose/background/lighting, only change clothing
   - Returns photorealistic edited image in base64 format

2. **Model Selection:**
   - Default: `gemini-3-pro-image-preview` (better quality)
   - Alternative: `gemini-2.5-flash-image` (faster generation)
   - Set via `NANO_BANANA_MODEL` environment variable

## Error Handling

The server provides helpful error messages:
- **400 Bad Request:** Missing image or invalid style
- **401 Unauthorized:** Invalid API key
- **404 Not Found:** Model not found (check model name)
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** API generation failed

Check server logs for detailed error information.
