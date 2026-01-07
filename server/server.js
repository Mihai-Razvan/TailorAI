const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sharp = require('sharp'); 
const { GoogleAuth } = require('google-auth-library');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const auth = new GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

async function getProjectId() {
  const client = await auth.getClient();
  return client.projectId;
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/generate-outfit', async (req, res) => {
  try {
    const { image, style } = req.body;
    console.log(`🎨 Generating ${style} outfit...`);

    // 1. Setup Auth & Endpoint
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    const projectId = await getProjectId();
    const location = 'us-central1'; 

    // ⚠️ WE USE IMAGEN 2 (@006) BECAUSE IT SUPPORTS EDITING PUBLICLY
    // If @006 still 404s after enabling, try 'image-generation@005'
    const modelId = 'imagen-3.0-inpaint-001'; 
    
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;

    // 2. Prepare Buffers
    let imageBuffer;
    if (image.startsWith('data:')) {
      imageBuffer = Buffer.from(image.split(',')[1], 'base64');
    } else {
      imageBuffer = Buffer.from(image, 'base64');
    }

    // 3. AUTO-MASKING (Required for Editing Mode)
    // Create a mask: Black top (keep face), White bottom (change outfit)
    const metadata = await sharp(imageBuffer).metadata();
    const splitPoint = Math.floor(metadata.height * 0.20); // Top 20% protected

    const maskBuffer = await sharp({
      create: {
        width: metadata.width,
        height: metadata.height,
        channels: 3,
        background: { r: 0, g: 0, b: 0 } // Black (Protected)
      }
    })
    .composite([{
      input: Buffer.from(`<svg><rect x="0" y="${splitPoint}" width="${metadata.width}" height="${metadata.height - splitPoint}" fill="white"/></svg>`),
      blend: 'over'
    }])
    .png()
    .toBuffer();

    // 4. Send Request
    const response = await axios.post(
      endpoint,
      {
        instances: [
          {
            prompt: `A photorealistic high-quality photo of a person wearing a ${style} outfit.`,
            image: { bytesBase64Encoded: imageBuffer.toString('base64') }, 
            mask: { bytesBase64Encoded: maskBuffer.toString('base64') } 
          }
        ],
        parameters: {
          sampleCount: 1,
          personGeneration: "allow_adult",
          aspectRatio: "1:1"
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.predictions && response.data.predictions[0]) {
      const generatedBase64 = response.data.predictions[0].bytesBase64Encoded;
      return res.json({ success: true, generatedImage: `data:image/png;base64,${generatedBase64}` });
    }

  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    
    // Custom error help
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: "Model not found. Please go to Google Cloud Console > Vertex AI > Model Garden and ENABLE 'Imagen 2'." 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});