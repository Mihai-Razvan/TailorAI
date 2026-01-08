const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Google GenAI SDK for Nano Banana
const { GoogleGenAI } = require('@google/genai');

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
  
  return `Edit ONLY the clothing in the provided image. The person must remain in the EXACT same position, pose, and location. Do NOT move, reposition, or change the person's position in any way.

CRITICAL REQUIREMENTS - DO NOT VIOLATE:
- Keep the person in the EXACT same position and pose as in the original image
- Do NOT add any body parts that are not visible in the original image (if legs are not visible, do NOT add legs)
- Do NOT reposition the person to show hidden body parts
- Preserve the EXACT same background - pixel by pixel identical except for clothing
- Keep the person's face, facial features, and expression exactly as shown
- Maintain the EXACT same body proportions and visible body parts
- Keep the EXACT same camera angle and perspective
- Preserve the EXACT same lighting conditions and shadows
- Do NOT change the person's position, stance, or location in the frame
- Do NOT rotate, move, or adjust the person in any way

ONLY CHANGE:
- Replace the clothing with a ${style} outfit. ${styleInfo.description}
- Clothing should be photorealistic with natural folds, realistic fabric texture, and accurate colors
- Clothing should fit naturally on the visible body parts only

FORBIDDEN:
- Do NOT add missing body parts
- Do NOT reposition the person
- Do NOT change the background
- Do NOT change the camera angle
- Do NOT add or remove people
- Do NOT change facial features
- Do NOT change body proportions
- Do NOT move the person to show hidden parts

The result must be the exact same image with only the clothing changed. Everything else must remain identical.`;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TailorAI API is running' });
});

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

    // Check for API key
    if (!process.env.GOOGLE_NANO_BANANA_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Google Nano Banana API key not configured. Please set GOOGLE_NANO_BANANA_API_KEY in your .env file.' 
      });
    }

    console.log(`🎨 Generating ${style} outfit using Google Nano Banana...`);

    const prompt = generatePrompt(style);

    // Extract base64 data from data URL if present
    let base64ImageData = image;
    if (image.startsWith('data:')) {
      base64ImageData = image.split(',')[1];
    }

    try {
      // Initialize Google GenAI client
      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_NANO_BANANA_API_KEY });

      // Use Nano Banana Pro for better quality (gemini-3-pro-image-preview)
      // Or use Nano Banana (gemini-2.5-flash-image) for faster generation
      const modelName = process.env.NANO_BANANA_MODEL || 'gemini-3-pro-image-preview';

      // Generate image using Nano Banana
      // Send image and text as separate parts for better image editing
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            parts: [
              // Send image first as a separate part
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64ImageData
                }
              },
              // Then send the text prompt as a separate part
              {
                text: `Based on the image provided above, ${prompt}`
              }
            ]
          }
        ]
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:118',message:'API response received',data:{hypothesisId:'A',hasResponse:!!response,responseType:typeof response,responseKeys:response?Object.keys(response):[],responseStringified:JSON.stringify(response).substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix'})}).catch(()=>{});
      // #endregion
      
      console.log("RESPONSE TYPE:", typeof response);
      console.log("RESPONSE KEYS:", response ? Object.keys(response) : 'null');
      console.log("RESPONSE FULL:", JSON.stringify(response, null, 2).substring(0, 1000));
      
      // Extract generated image from response
      // Response format may vary - check multiple possible structures
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:130',message:'Checking response.parts',data:{hypothesisId:'B',hasResponse:!!response,hasParts:!!(response&&response.parts),partsType:response?.parts?typeof response.parts:'N/A',partsLength:response?.parts?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix'})}).catch(()=>{});
      // #endregion
      
      if (response && response.parts) {
        console.log("CHECKING response.parts, length:", response.parts.length);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:135',message:'Iterating response.parts',data:{hypothesisId:'B',partsLength:response.parts.length,firstPartKeys:response.parts[0]?Object.keys(response.parts[0]):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix'})}).catch(()=>{});
        // #endregion
        
        for (const part of response.parts) {
          console.log("PART:", JSON.stringify(part, null, 2).substring(0, 500));
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:140',message:'Checking part for inlineData (camelCase)',data:{hypothesisId:'B',partKeys:Object.keys(part),hasInlineData:!!part.inlineData,hasInlineDataSnake:!!part.inline_data},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix'})}).catch(()=>{});
          // #endregion
          
          // FIX: Google GenAI SDK uses camelCase (inlineData), not snake_case (inline_data)
          if (part.inlineData && part.inlineData.data) {
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/jpeg';
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:147',message:'Found image in response.parts using camelCase',data:{hypothesisId:'B',imageDataLength:imageData?.length,mimeType},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix'})}).catch(()=>{});
            // #endregion
            
            return res.json({
              success: true,
              generatedImage: `data:${mimeType};base64,${imageData}`,
            });
          }
        }
      }

      // Alternative response format (Gemini API standard format)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:160',message:'Checking response.candidates',data:{hypothesisId:'C',hasResponse:!!response,hasCandidates:!!(response&&response.candidates),candidatesLength:response?.candidates?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix'})}).catch(()=>{});
      // #endregion
      
      if (response && response.candidates && response.candidates.length > 0) {
        console.log("CHECKING response.candidates, length:", response.candidates.length);
        const candidate = response.candidates[0];
        console.log("CANDIDATE:", JSON.stringify(candidate, null, 2).substring(0, 500));
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:165',message:'Checking candidate.content.parts',data:{hypothesisId:'C',candidateKeys:Object.keys(candidate),hasContent:!!candidate.content,hasParts:!!(candidate.content&&candidate.content.parts),partsLength:candidate.content?.parts?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix'})}).catch(()=>{});
        // #endregion
        
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            console.log("CANDIDATE PART:", JSON.stringify(part, null, 2).substring(0, 500));
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:170',message:'Checking candidate part for inlineData (camelCase)',data:{hypothesisId:'C',partKeys:Object.keys(part),hasInlineData:!!part.inlineData,hasInlineDataSnake:!!part.inline_data},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix'})}).catch(()=>{});
            // #endregion
            
            // FIX: Google GenAI SDK uses camelCase (inlineData), not snake_case (inline_data)
            if (part.inlineData && part.inlineData.data) {
              const imageData = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || 'image/jpeg';
              
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:177',message:'Found image in response.candidates using camelCase',data:{hypothesisId:'C',imageDataLength:imageData?.length,mimeType},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix'})}).catch(()=>{});
              // #endregion
              
              console.log("SUCCESS: Found image data, length:", imageData.length);
              return res.json({
                success: true,
                generatedImage: `data:${mimeType};base64,${imageData}`,
              });
            }
          }
        }
      }
      
      // Check if response has data property
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:188',message:'Checking response.data',data:{hypothesisId:'D',hasResponse:!!response,hasData:!!(response&&response.data),dataKeys:response?.data?Object.keys(response.data):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix'})}).catch(()=>{});
      // #endregion
      
      if (response && response.data) {
        console.log("CHECKING response.data.candidates");
        if (response.data.candidates && response.data.candidates.length > 0) {
          const candidate = response.data.candidates[0];
          console.log("DATA CANDIDATE:", JSON.stringify(candidate, null, 2).substring(0, 500));
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:195',message:'Checking response.data.candidates',data:{hypothesisId:'D',candidatesLength:response.data.candidates.length,candidateKeys:Object.keys(candidate)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix'})}).catch(()=>{});
          // #endregion
          
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              console.log("DATA CANDIDATE PART:", JSON.stringify(part, null, 2).substring(0, 500));
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:200',message:'Checking data candidate part for inlineData (camelCase)',data:{hypothesisId:'D',partKeys:Object.keys(part),hasInlineData:!!part.inlineData,hasInlineDataSnake:!!part.inline_data},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix'})}).catch(()=>{});
              // #endregion
              
              // FIX: Google GenAI SDK uses camelCase (inlineData), not snake_case (inline_data)
              if (part.inlineData && part.inlineData.data) {
                const imageData = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/jpeg';
                
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:207',message:'Found image in response.data.candidates using camelCase',data:{hypothesisId:'D',imageDataLength:imageData?.length,mimeType},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix'})}).catch(()=>{});
                // #endregion
                
                return res.json({
                  success: true,
                  generatedImage: `data:${mimeType};base64,${imageData}`,
                });
              }
            }
          }
        }
      }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7e234fe2-17b0-4447-aefd-3f878cebfe78',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:218',message:'No image found in any response format',data:{hypothesisId:'E',responseSummary:JSON.stringify(response).substring(0,1000)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix'})}).catch(()=>{});
    // #endregion
    
    console.log("ERROR: No image data found. Full response structure:", JSON.stringify(response, null, 2));
    return res.status(500).json({ 
      success: false, 
      error: 'No image data in API response. Please check the API response format.',
      debug: {
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : null,
        responsePreview: JSON.stringify(response).substring(0, 500)
      }
    });

    } catch (apiError) {
      console.error('Google Nano Banana API error:', apiError.response?.data || apiError.message);
      
      // Return helpful error messages
      if (apiError.response?.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Invalid API key. Please check your GOOGLE_NANO_BANANA_API_KEY in the .env file.'
        });
      }
      
      if (apiError.response?.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        });
      }

      if (apiError.response?.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Model not found. Please check that the model name is correct (gemini-2.5-flash-image or gemini-3-pro-image-preview).'
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        error: apiError.message || 'Failed to generate image with Google Nano Banana API. Please check your API key and try again.' 
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 TailorAI API server running on http://localhost:${PORT}`);
  if (process.env.GOOGLE_NANO_BANANA_API_KEY) {
    const modelName = process.env.NANO_BANANA_MODEL || 'gemini-3-pro-image-preview';
    console.log(`✅ Google Nano Banana API configured`);
    console.log(`📌 Model: ${modelName}`);
  } else {
    console.log(`⚠️  Google Nano Banana API key not set`);
  }
  console.log(`📝 Set GOOGLE_NANO_BANANA_API_KEY in your .env file`);
  console.log(`📚 Get your API key from: https://aistudio.google.com/app/apikey`);
  console.log(`📖 Documentation: https://ai.google.dev/gemini-api/docs/nanobanana`);
});