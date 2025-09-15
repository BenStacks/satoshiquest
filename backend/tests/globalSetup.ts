import { config } from 'dotenv';
import path from 'path';

export default async () => {
  // Load test environment variables
  config({ path: path.join(__dirname, '..', '.env.test') });
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/satoshi-quest-test';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  process.env.PORT = '0';
  process.env.LOG_LEVEL = 'error';
  
  console.log('🧪 Global test setup completed');
};
