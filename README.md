# Eira: Your Mental Well-being AI Companion

Eira is more than just a chatbot. It's a supportive mobile companion designed to help with mental well-being, powered by Google's Gemini AI. We've built it to be secure, snappy, and actually helpful in day-to-day life.

## Features that matter
- **Context-Aware Conversations**: Eira remembers what you said earlier in the chat, making for a much more natural conversation.
- **Privacy First**: Secure JWT authentication ensures your private thoughts stay private.
- **Modern UI**: A clean, responsive design that supports both light and dark modes.
- **Reliable Backend**: A hardened Express.js server with built-in rate limiting and security headers.

## Tech Stack
- **Frontend**: React Native (Expo), TypeScript, Reanimated.
- **AI**: Google Gemini (via `@google/generative-ai`).
- **Backend**: Node.js, Express, MongoDB.
- **Testing**: Jest & Supertest for TDD.

## Quick Setup

### 1. The Basics
Make sure you have Node.js (v18+) and a MongoDB instance ready.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your MONGO_URI and a random string for JWT_SECRET
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Add your Gemini API_KEY
npx expo start
```

## Security & Reliability
We don't play around with security. Every chat request is authenticated via JWT, and we've implemented strict ownership checks so users can only access their own data. The backend is also hardened against common attacks like ReDoS.

## Testing
We use a Test-Driven Development (TDD) workflow. You can run the full backend suite to verify everything is working correctly:
```bash
cd backend
npm test
```

## Support
If you run into issues or have questions, feel free to open an issue on GitHub.

---
**Eira** - Support in your pocket. 🤖
