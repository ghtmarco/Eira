# Eira - AI Chat Assistant

Eira adalah aplikasi mobile chat assistant yang dibangun dengan React Native dan didukung oleh Google Generative AI (Gemini). Aplikasi ini memungkinkan pengguna untuk berinteraksi dengan AI assistant yang cerdas dengan antarmuka yang modern dan responsif.

## 📱 Fitur Utama

- **AI Chat Interface**: Percakapan real-time dengan Google Gemini AI
- **User Authentication**: Sistem login, registrasi, dan forgot password
- **Chat History**: Menyimpan dan mengelola riwayat percakapan
- **Dark/Light Theme**: Tema dapat disesuaikan dengan preferensi pengguna
- **Responsive Design**: Desain yang optimal untuk berbagai ukuran layar
- **Real-time Messaging**: Pengiriman pesan yang cepat dan responsif
- **Navigation Drawer**: Menu navigasi yang mudah digunakan
- **Toast Notifications**: Notifikasi untuk feedback pengguna

## 🏗️ Arsitektur Project

```
softeng/
├── backend/                 # Server Express.js
│   ├── config/             # Konfigurasi database
│   ├── routes/             # API routes
│   ├── package.json        # Dependencies backend
│   └── server.js           # Entry point server
│
└── frontend/               # Aplikasi React Native
    ├── assets/             # Font, gambar, dan assets
    ├── contexts/           # React Context (Theme)
    ├── screens/            # Screen components
    ├── App.js              # Entry point aplikasi
    └── package.json        # Dependencies frontend
```

## 🚀 Tech Stack

### Frontend
- **React Native** 0.79.2 - Framework mobile development
- **React** 19.0.0 - Library UI
- **Expo** 53.0.0 - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Navigasi dalam aplikasi
- **Google Generative AI** - Integrasi dengan Gemini AI
- **Formik & Yup** - Form validation
- **React Native Reanimated** - Animasi yang smooth
- **React Native Vector Icons** - Icon library
- **AsyncStorage** - Local storage
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Web framework
- **MongoDB** - Database NoSQL
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

## ⚙️ Instalasi dan Setup

### Prerequisites
- Node.js (v16 atau lebih tinggi)
- npm atau yarn
- Expo CLI
- MongoDB database
- Android Studio / Xcode (untuk testing di device)

### 1. Clone Repository
```bash
git clone <repository-url>
cd softeng
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Buat file `.env` di folder backend:
```env
MONGO_URI=your_mongodb_connection_string
PORT=3000
```

Jalankan server:
```bash
npm run dev  # untuk development
npm start    # untuk production
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

Buat file `.env` di folder frontend:
```env
API_KEY=your_google_gemini_api_key
SERVER_URL=http://localhost:3000
PHONE_NUMBER=your_support_phone_number
```

Jalankan aplikasi:
```bash
npm start        # Expo development server
npm run android  # Run di Android
npm run ios      # Run di iOS
npm run web      # Run di web browser
```

## 🔧 Konfigurasi

### Environment Variables

**Backend (.env)**
- `MONGO_URI`: Connection string MongoDB
- `PORT`: Port server (default: 3000)

**Frontend (.env)**
- `API_KEY`: Google Gemini API key
- `SERVER_URL`: URL backend server
- `PHONE_NUMBER`: Nomor telepon untuk support

### Database Schema

**Users Collection**
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  createdAt: Date
}
```

**Chats Collection**
```javascript
{
  userId: ObjectId,
  title: String,
  messages: [
    {
      text: String,
      sender: String, // "user" | "bot"
      timestamp: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## 📖 API Endpoints

### Authentication
- `POST /api/users/register` - Registrasi user baru
- `POST /api/users/login` - Login user
- `POST /api/users/change-password` - Ubah password

### Chats
- `POST /api/users/chats` - Buat chat baru
- `GET /api/users/chats/user/:userId` - Ambil semua chat user
- `GET /api/users/chats/:chatId` - Ambil detail chat
- `DELETE /api/users/chats/:chatId` - Hapus chat

### Health Check
- `GET /health` - Status server

## 🎨 UI/UX Features

- **Modern Design**: Interface yang clean dan modern
- **Smooth Animations**: Menggunakan React Native Reanimated
- **Gesture Support**: Navigasi dengan gesture yang intuitif
- **Responsive Layout**: Adaptif terhadap berbagai ukuran layar
- **Custom Font**: Menggunakan font Alata untuk branding
- **Theme System**: Light dan dark mode yang konsisten

## 📝 Struktur Screen

1. **LoginScreen** - Halaman login pengguna
2. **SignupScreen** - Halaman registrasi
3. **ForgotPassword** - Reset password
4. **MainScreen** - Container dengan navigation drawer
5. **HomeScreen** - Chat interface utama
6. **HistoryScreen** - Riwayat percakapan
7. **SettingsScreen** - Pengaturan aplikasi

## 🔒 Security Features

- Password hashing dengan bcryptjs
- JWT token untuk authentication
- Input validation dengan Yup
- CORS configuration
- Environment variables untuk sensitive data

## 🚧 Development

### Scripts Available

**Backend**
```bash
npm start     # Production server
npm run dev   # Development dengan nodemon
```

**Frontend**
```bash
npm start           # Expo development server
npm run android     # Android build
npm run ios         # iOS build
npm run web         # Web version
npm run reset-cache # Clear Expo cache
```

### Code Style
- TypeScript untuk type safety
- ESLint untuk code quality
- Consistent naming conventions
- Component-based architecture

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📞 Support

Untuk support dan pertanyaan:
- Email: [email-support]
- Phone: [nomor-telepon-support]
- Issues: Gunakan GitHub Issues untuk bug reports

## 📄 License

Project ini menggunakan ISC License. Lihat file `LICENSE` untuk detail lebih lanjut.

## 🙏 Acknowledgments

- Google Generative AI untuk AI capabilities
- Expo team untuk development platform
- React Native community untuk ecosystem yang luar biasa
- MongoDB untuk database solution

---

**Eira** - Your Intelligent Chat Assistant 🤖
