import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { config } from '@/config/environment';

// In-memory MongoDB for testing
let mongoServer: MongoMemoryServer;

// Test database setup
export const setupTestDatabase = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
};

// Test database cleanup
export const teardownTestDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
};

// Clear all collections between tests
export const clearDatabase = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

// Mock data generators
export const mockPlayerData = {
  walletAddress: 'SP1234567890ABCDEF1234567890ABCDEF12345678',
  currentLevel: 5,
  currentScore: 1500,
  currentPosition: { x: 100, y: 200 },
  currentHealth: 80,
  highestLevel: 5,
  totalScore: 1500,
  deathCount: 0,
  createdAt: new Date(),
  lastActiveAt: new Date(),
};

export const mockTombstoneData = {
  playerAddress: 'SP1234567890ABCDEF1234567890ABCDEF12345678',
  tokenId: 'tombstone-1',
  finalScore: 1500,
  finalLevel: 5,
  deathPosition: { x: 100, y: 200 },
  killedBy: 'dragon',
  epitaph: 'Here lies a brave adventurer',
  createdAt: new Date(),
};

// Test environment configuration
export const testConfig = {
  ...config,
  database: {
    ...config.database,
    uri: 'mongodb://localhost:27017/satoshi-quest-test',
  },
  redis: {
    ...config.redis,
    url: 'redis://localhost:6379/1', // Use different database for tests
  },
  environment: 'test',
  port: 0, // Use random port for tests
};
