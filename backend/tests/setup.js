// Set test environment variables before any modules load
process.env.JWT_SECRET = 'test_jwt_secret_eira_2024';
process.env.NODE_ENV = 'test';
// MONGO_URI is mocked via jest.mock('../config/db') in each test file
// but we set a dummy value so db.js doesn't throw during static analysis
process.env.MONGO_URI = 'mongodb://localhost:27017/test_db';
