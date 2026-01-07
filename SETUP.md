# Quick Setup Guide

Follow these steps to get TailorAI running locally:

## 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

## 2. Backend Setup

```bash
cd server

# Create .env file
cat > .env << EOF
REPLICATE_API_TOKEN=your_token_here
AI_API_PROVIDER=replicate
PORT=3001
EOF

# Get your Replicate API token from: https://replicate.com/account/api-tokens

# Start server
npm start
```

Keep the server running in this terminal.

## 3. Frontend Setup

In a new terminal (from the project root):

```bash
# Start Expo
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## 4. Test the App

1. Upload a photo
2. Select a style (Casual, Modern, or Edgy)
3. Tap "Generate Outfit"
4. Wait for AI generation (may take 30-60 seconds)
5. View your results!

## Troubleshooting

### API Connection Issues
- Make sure backend is running on port 3001
- For physical devices: Update `API_BASE_URL` in `app/index.tsx` with your computer's IP address
- Check that your API token is valid

### Permission Errors
- Grant camera roll permissions when prompted
- On iOS: Settings > Expo Go > Photos > All Photos
- On Android: Settings > Apps > Expo Go > Permissions > Photos

### Build Errors
```bash
# Clear Expo cache
npx expo start -c

# Reinstall dependencies
rm -rf node_modules
npm install
```
