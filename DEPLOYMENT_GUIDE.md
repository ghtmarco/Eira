# Deployment Guide - Fix Cloud Server Issues

## Current Issues
1. Cloud server missing `/api/ai/generate-response` endpoint (causing 404 errors)
2. Cloud server missing DELETE `/api/users/chats/:chatId` endpoint
3. Missing environment variables on cloud server

## Files Need to be Deployed to Cloud Server

### 1. Backend Files (Required)
- `backend/routes/aiRoutes.js` - Google Gemini AI integration
- `backend/routes/userRoutes.js` - Updated with DELETE endpoint
- `backend/server.js` - Route mounting configuration
- `backend/package.json` - Dependencies including @google/generative-ai

### 2. Environment Variables (Cloud Server)
Add to cloud server environment:
```
GEMINI_API_KEY=AIzaSyCTkDfhJ0UZ8sL5WAHoVL5qSJ3jzhVIDB0
MONGO_URI=mongodb://chatbot:tugasproject@cluster0-shard-00-00.cmdhe.mongodb.net:27017,cluster0-shard-00-01.cmdhe.mongodb.net:27017,cluster0-shard-00-02.cmdhe.mongodb.net:27017/soft_eng?ssl=true&replicaSet=atlas-2fvgrl-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0
PORT=3000
```

### 3. Dependencies to Install
```bash
npm install @google/generative-ai
```

## Deployment Steps

### Step 1: Update Cloud Server Code
1. Upload updated `backend/routes/aiRoutes.js`
2. Upload updated `backend/routes/userRoutes.js` 
3. Upload updated `backend/server.js`
4. Upload updated `backend/package.json`

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Environment Variables
Add the environment variables listed above to your cloud hosting platform.

### Step 4: Restart Server
Restart the cloud server to apply changes.

## Verification

### Test AI Endpoint:
```bash
curl -X POST "https://master.tugas-software-engineering.development.c66.me/api/ai/generate-response" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "instruction": "You are a helpful assistant."}'
```

### Test Delete Endpoint:
```bash
curl -X DELETE "https://master.tugas-software-engineering.development.c66.me/api/users/chats/TEST_CHAT_ID"
```

## Expected Response After Fix

### AI Endpoint should return:
```json
{
  "generatedText": "Hello! How can I help you today?"
}
```

### Delete Endpoint should return:
```json
{
  "message": "Chat deleted successfully"
}
```

## Current Status

### ✅ Local Backend (Working)
- AI integration: ✅ Working
- Delete functionality: ✅ Working
- All routes properly configured: ✅ Working

### ❌ Cloud Server (Needs Update)
- AI integration: ❌ Missing aiRoutes
- Delete functionality: ❌ Missing DELETE endpoint
- Environment variables: ❌ Missing GEMINI_API_KEY

### ✅ Frontend (Working with Fallback)
- AI fallback implemented: ✅ Working
- Delete temporarily disabled: ✅ Working
- Error handling improved: ✅ Working

## Post-Deployment Actions

1. **Re-enable Delete Functionality**: 
   - Uncomment delete button in `HistoryScreen.tsx`
   - Remove temporary disable message

2. **Remove AI Fallback**: 
   - Remove fallback message in `HomeScreen.tsx`
   - Let AI API work normally

3. **Test Complete Flow**:
   - Test chat functionality
   - Test AI responses
   - Test delete functionality
   - Test error handling
