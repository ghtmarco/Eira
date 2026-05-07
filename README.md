<div align="center">
  <img src="frontend/assets/images/Logo.png" alt="Eira Logo" width="120" />
  <h1>Eira — Your Mental Well-being Companion</h1>
  <p><em>An intuitive mobile application dedicated to mental wellness, powered by Google's Gemini AI.</em></p>
</div>

Eira is designed to provide secure, context-aware conversational support. We built it with a modern React Native (Expo) frontend and a hardened Express.js backend backed by MongoDB.

## 📱 Screenshots

| Login | Chat | Drawer | History |
|-------|------|--------|---------|
| ![Login](docs/screenshots/01-login.png) | ![Chat](docs/screenshots/02-chat-home.png) | ![Drawer](docs/screenshots/03-drawer.png) | ![History](docs/screenshots/04-history.png) |

## ✨ Core Features

- **Context-Aware Conversations**: Eira remembers your chat history seamlessly within each session.
- **Secure Authentication**: We use JWT with HS256 algorithm pinning and bcrypt password hashing to keep your data safe.
- **Privacy-First AI**: All Gemini API requests are proxied through our backend. Your API keys never leave the server, and every call is authenticated.
- **Theme Personalization**: Native dark and light mode support with persisted preferences.
- **Session History**: Easily browse and resume past conversations at any time.
- **Rich Text Support**: AI responses are fully rendered with Markdown, supporting code blocks, lists, and formatting.

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native 0.81, Expo SDK 54, TypeScript |
| **Navigation** | React Navigation v7 (Drawer + Stack) |
| **Animations** | react-native-reanimated 4.1.1, react-native-worklets 0.5.1 |
| **Backend** | Node.js, Express.js, MongoDB (Atlas) |
| **AI Integration**| Google Gemini (via `@google/generative-ai` on the backend) |
| **Authentication**| JWT (jsonwebtoken), bcryptjs |
| **Testing** | Jest + Supertest (37 backend tests) |

## 📁 Project Architecture

```text
Eira/
├── backend/
│   ├── config/db.js          # MongoDB connection (promise singleton)
│   ├── middleware/auth.js    # JWT verification with algorithm pinning
│   ├── routes/userRoutes.js  # API routes (auth, chat, and AI proxy)
│   ├── server.js             # Express application and graceful shutdown
│   ├── tests/                # Comprehensive test suite (TDD)
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── screens/              # Core application screens
    ├── components/chat/      # Specialized chat UI components
    ├── hooks/useChatLogic.ts # Centralized chat state management
    ├── contexts/ThemeContext # Theme provider
    ├── app.config.js
    ├── .env.example
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following:
- **Node.js 18+**
- **Android Studio** (with an AVD) or a physical Android device.
- **MongoDB Atlas account** (or a local MongoDB instance).
- **Google Gemini API key** — available for free at [Google AI Studio](https://aistudio.google.com).

### 1. Clone the Repository

```bash
git clone https://github.com/ghtmarco/Eira.git
cd Eira
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Update `backend/.env` with your credentials:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/eira
JWT_SECRET=<random-64-char-hex>
GEMINI_API_KEY=<your-gemini-api-key>
ALLOWED_ORIGINS=http://localhost:19006,exp://192.168.x.x:8081
NODE_ENV=development
```

Start the development server:

```bash
npm run dev   # Starts nodemon on port 5000
```

### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install
cp .env.example .env
```

Configure `frontend/.env` based on your testing environment:

```env
# Android emulator → 10.0.2.2 | Physical device → your machine's LAN IP
SERVER_URL=http://10.0.2.2:5000/api
PHONE_NUMBER=628123456789
```

Launch the Expo server:

```bash
npx expo start
# Press 'a' to open the app on your Android emulator
```

#### Connection Guide

| Environment | SERVER_URL |
|-------------|-----------|
| **Android Emulator** | `http://10.0.2.2:5000/api` |
| **Physical Device (USB/WiFi)** | `http://192.168.x.x:5000/api` |
| **iOS Simulator** | `http://localhost:5000/api` |

## 🧪 Testing

We believe in reliable code. Eira's backend is covered by 37 comprehensive tests.

```bash
cd backend
npm test
```

**Our test coverage includes:**
- Registration, login, and password management.
- Strict JWT algorithm pinning (rejecting `alg:none`).
- Robust ObjectId validation (returning 400 instead of 500 for invalid IDs).
- Chat ownership enforcement (403 for unauthorized access).
- AI proxy edge cases (handling 401/403/400/503 errors gracefully).
- Complete prevention of internal error message leakage.

## 📡 API Reference

All routes are prefixed with `/api/users`.

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/register` | Public | Create a new account |
| `POST` | `/login` | Public | Authenticate and retrieve a JWT |
| `POST` | `/change-password` | Bearer | Update account password |
| `POST` | `/chat/ai` | Bearer | Dispatch a message to Gemini AI |
| `POST` | `/chats` | Bearer | Create or update a chat session |
| `GET`  | `/chats/user/:userId` | Bearer | Retrieve all user chat sessions |
| `GET`  | `/chats/:chatId` | Bearer | Fetch a specific chat session |
| `DELETE`| `/chats/:chatId` | Bearer | Remove a chat session |

## 🛡️ Security Highlights

We take security seriously. Here is how we protect our users:
- **JWT Algorithm Pinning**: We strictly enforce `algorithms: ['HS256']` to prevent algorithm confusion attacks.
- **Server-Side AI Proxy**: The Gemini API key remains securely on the backend; it is never exposed in the mobile bundle.
- **Input Validation**: All MongoDB ID parameters undergo strict validation before any database queries.
- **Rate Limiting**: Request body sizes are capped at 100kb to mitigate abuse.
- **Data Isolation**: Users are strictly isolated to reading and writing their own chat data.
- **Error Obfuscation**: Internal system errors (`error.message`) are never leaked to the client.
- **ReDoS Prevention**: We use exact string matching for email lookups rather than vulnerable regular expressions.

## 🛠️ Troubleshooting

**Red screen: `installTurboModule` TurboModule error**  
This occurs if the `react-native-worklets` JS version mismatches the compiled binary in Expo Go. Reinstall the exact versions bundled with Expo SDK 54:
```bash
npm install react-native-reanimated@4.1.1 react-native-worklets@0.5.1 --save-exact --legacy-peer-deps
```

**Cannot connect to the backend from the emulator**  
Ensure you are using `10.0.2.2` (and not `localhost`) for the `SERVER_URL`. Android emulators map `10.0.2.2` directly to the host machine.

**AI returns a "technical difficulties" message**  
Verify that your `GEMINI_API_KEY` is set in `backend/.env` and restart the backend server.

**Port 5000 is already in use**  
On Windows, you can terminate the conflicting process using:
```powershell
(Get-NetTCPConnection -LocalPort 5000).OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

**Expo starts on port 8081, but the emulator won't connect**  
Try manually triggering the intent via ADB:
```bash
adb shell am start -a android.intent.action.VIEW -d "exp://10.0.2.2:8081"
```

## 🌐 Environment Variables Reference

This section outlines the environment variables required to run Eira locally.

<!-- AUTO-GENERATED: backend env -->
### Backend Configuration (`backend/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Port for the Express server (default: 5000) | `5000` |
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb+srv://<user>:<password>@cluster.mongodb.net/eira` |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens | `your_jwt_secret_key_here` |
| `GEMINI_API_KEY` | Yes | Google Gemini API key | `your_gemini_api_key_here` |
| `ALLOWED_ORIGINS`| Yes | CORS allowed origins | `http://localhost:19006,exp://your-ip:19000` |
| `NODE_ENV` | No | Application environment | `development` |
<!-- /AUTO-GENERATED: backend env -->

<!-- AUTO-GENERATED: frontend env -->
### Frontend Configuration (`frontend/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SERVER_URL` | Yes | Backend API base URL | `http://10.0.2.2:5000/api` |
| `PHONE_NUMBER`| No | Support or test phone number | `628123456789` |
<!-- /AUTO-GENERATED: frontend env -->

## 📋 Operations Runbook

This section outlines standard procedures for deploying, operating, and troubleshooting the Eira application in a production environment.

### Deployment Procedures

#### Backend Deployment
1. Ensure all environment variables are properly configured in your production environment (e.g., Heroku, Render, AWS).
2. Set `NODE_ENV=production`.
3. Verify that the `MONGO_URI` points to your production database.
4. Ensure `ALLOWED_ORIGINS` strictly contains your production frontend URLs.
5. Deploy the application. The startup command is:
   ```bash
   npm start
   ```

#### Frontend Deployment
1. Update `SERVER_URL` in your production environment or build configuration to point to your live backend.
2. Build the application using EAS (Expo Application Services):
   ```bash
   eas build --profile production
   ```
3. Submit the build to the App Store / Google Play Store:
   ```bash
   eas submit --profile production
   ```

### Monitoring & Health Checks

- Monitor the backend process uptime. Ensure that the service restarts automatically on failure.
- Track MongoDB connection stability and latency via the MongoDB Atlas dashboard.
- Monitor Gemini API quotas and usage to prevent service interruptions.

### Runbook: Common Issues & Remediation

#### 1. Database Connection Failures
**Symptoms**: Users cannot log in or send messages; backend logs show Mongoose connection errors.
**Fix**:
- Verify the `MONGO_URI` is correct and the database cluster is active.
- Ensure the backend's IP address is whitelisted in MongoDB Atlas.

#### 2. AI Proxy Outages
**Symptoms**: AI responses fail with "technical difficulties" messages.
**Fix**:
- Check if the `GEMINI_API_KEY` is valid and hasn't exceeded quota limits.
- Review backend logs for specific error codes returned by the Google Generative AI SDK.

#### 3. Authentication Errors
**Symptoms**: Users receive 401 Unauthorized errors randomly.
**Fix**:
- Ensure `JWT_SECRET` is consistent across instances.
- Check if token expiration times are configured correctly and that tokens are being refreshed as expected.

## 📄 License

This project is licensed under the MIT License.
