const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// Try to load Replicate if available
let Replicate;
try {
  Replicate = require('replicate');
} catch (e) {
  console.warn('Replicate not installed. Install with: npm install replicate');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Style prompt mapping
const stylePrompts = {
  casual: {
    description: 'comfortable, relaxed, everyday casual clothing like t-shirts, jeans, sneakers, hoodies',
    keywords: 'casual wear, comfortable, relaxed, everyday style, t-shirt, jeans, sneakers, hoodie'
  },
  modern: {
    description: 'sleek, contemporary, professional-modern clothing like blazers, tailored pants, modern dresses, minimalist design',
    keywords: 'modern fashion, contemporary, sleek, professional-modern, blazer, tailored, minimalist, chic'
  },
  edgy: {
    description: 'bold, alternative, street-style clothing with dark colors, leather, unique patterns, statement pieces',
    keywords: 'edgy style, alternative fashion, bold, street style, leather, dark colors, statement pieces, unique'
  }
};

// Generate prompt for AI image generation
function generatePrompt(style) {
  const styleInfo = stylePrompts[style] || stylePrompts.casual;
  
  return `Keep the person's face, pose, body structure, lighting, and background exactly the same as in the original image. Only replace the clothing with a ${style} outfit. ${styleInfo.description}. 

Requirements:
- Preserve the exact face, facial features, and expression
- Keep the same body pose and proportions
- Maintain the same background and environment
- Keep the same lighting conditions and shadows
- Only modify the clothing to match the ${style} style
- Clothing should be photorealistic with natural folds, realistic fabric texture, and accurate colors
- Ensure the clothing fits naturally on the body
- No extra people, no face distortion, no background changes
- Natural clothing shadows and realistic fabric behavior
- High quality, professional photography look`;
}

// API Route: Generate Outfit
app.post('/api/generate-outfit', async (req, res) => {
  try {
    const { image, style } = req.body;

    if (!image) {
      return res.status(400).json({ 
        success: false, 
        error: 'Image is required' 
      });
    }

    if (!style || !['casual', 'modern', 'edgy'].includes(style)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid style is required (casual, modern, or edgy)' 
      });
    }

    // Check for API key based on provider
    const apiProvider = process.env.AI_API_PROVIDER || 'replicate';
    let API_KEY;
    
    if (apiProvider === 'replicate' || !process.env.AI_API_PROVIDER) {
      API_KEY = process.env.REPLICATE_API_TOKEN;
    } else if (apiProvider === 'nanobanana') {
      API_KEY = process.env.NANO_BANANA_API_KEY;
    }
    
    if (!API_KEY) {
      console.error(`API key not found. Please set ${apiProvider === 'replicate' ? 'REPLICATE_API_TOKEN' : 'NANO_BANANA_API_KEY'} in .env file`);
      return res.status(500).json({ 
        success: false, 
        error: `API key not configured. Please set ${apiProvider === 'replicate' ? 'REPLICATE_API_TOKEN' : 'NANO_BANANA_API_KEY'} in your .env file.` 
      });
    }

    const prompt = generatePrompt(style);

    // Extract base64 data from data URL if present
    let base64ImageData = image;
    if (image.startsWith('data:')) {
      base64ImageData = image.split(',')[1];
    }

    // Try different AI image generation APIs
    try {
      if ((apiProvider === 'replicate' || !process.env.AI_API_PROVIDER) && Replicate) {
        // Replicate API (using Stable Diffusion for image-to-image generation)
        const replicate = new Replicate({ auth: API_KEY });
        
        // Using a Stable Diffusion model that supports image-to-image
        // This creates photorealistic images based on input image and prompt
        const output = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          {
            input: {
              image: image,
              prompt: prompt,
              num_inference_steps: 50,
              guidance_scale: 7.5,
              strength: 0.75, // Controls how much to change the image
            }
          }
        );
        
        if (output && (Array.isArray(output) ? output[0] : output)) {
          const resultImage = Array.isArray(output) ? output[0] : output;
          return res.json({
            success: true,
            generatedImage: resultImage,
          });
        }
      } else if (apiProvider === 'nanobanana') {
        // Nano Banana API (example structure - adjust based on actual API)
        const nanoBananaResponse = await axios.post(
          'https://api.nanobanana.ai/v1/images/generations',
          {
            model: 'nano-1',
            prompt: prompt,
            image: base64ImageData,
            num_images: 1,
            size: '1024x1024',
            response_format: 'b64_json',
          },
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (nanoBananaResponse.data && nanoBananaResponse.data.data && nanoBananaResponse.data.data[0]) {
          const generatedImage = `data:image/png;base64,${nanoBananaResponse.data.data[0].b64_json}`;
          
          return res.json({
            success: true,
            generatedImage: generatedImage,
          });
        }
      } else {
        return res.status(500).json({
          success: false,
          error: `API provider '${apiProvider}' not configured or Replicate package not installed. Please install: npm install replicate`
        });
      }
    } catch (apiError) {
      console.error(`${apiProvider} API error:`, apiError.response?.data || apiError.message);
      
      // Return a helpful error message
      if (apiError.response?.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Invalid API key. Please check your API credentials in the .env file.'
        });
      }
      
      if (apiError.response?.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        });
      }
      
      // Re-throw to be caught by outer catch for generic error handling
      throw apiError;
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TailorAI API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 TailorAI API server running on http://localhost:${PORT}`);
  const apiProvider = process.env.AI_API_PROVIDER || 'replicate';
  const envVarName = apiProvider === 'replicate' ? 'REPLICATE_API_TOKEN' : 'NANO_BANANA_API_KEY';
  console.log(`📝 Make sure to set ${envVarName} in your .env file`);
});
