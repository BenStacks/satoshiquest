/**
 * Environment Configuration
 * Centralized configuration management for all environment variables
 */

interface Config {
  nodeEnv: string;
  port: number;
  database: {
    uri: string;
    testUri: string;
    maxConnections: number;
    timeout: number;
  };
  redis: {
    url: string;
    password?: string;
    db: number;
  };
  stacks: {
    network: string;
    apiUrl: string;
    websocketUrl: string;
  };
  contracts: {
    tombstone: string;
    core: string;
    loot: string;
    resurrection: string;
  };
  chainhook: {
    endpoint: string;
    apiKey: string;
    webhookSecret: string;
  };
  diaOracle: {
    url: string;
    apiKey?: string;
  };
  security: {
    jwtSecret: string;
    jwtExpiry: string;
    bcryptRounds: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origin: string;
    credentials: boolean;
  };
  logging: {
    level: string;
    filePath: string;
    maxSize: string;
    maxFiles: number;
  };
  websocket: {
    pingTimeout: number;
    pingInterval: number;
    maxConnections: number;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
  };
  game: {
    maxTombstonesPerCharacter: number;
    resurrectionCooldownHours: number;
    leaderboardCacheTtl: number;
    statsUpdateInterval: number;
  };
  apiDocs: {
    enabled: boolean;
  };
  debug: {
    enabled: boolean;
    mockEvents: boolean;
  };
}

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
];

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/satoshiquest',
    testUri: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/satoshiquest_test',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    timeout: parseInt(process.env.DB_TIMEOUT || '30000', 10),
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  
  stacks: {
    network: process.env.STACKS_NETWORK || 'testnet',
    apiUrl: process.env.STACKS_API_URL || 'https://api.testnet.hiro.so',
    websocketUrl: process.env.STACKS_WEBSOCKET_URL || 'wss://api.testnet.hiro.so',
  },
  
  contracts: {
    tombstone: process.env.TOMBSTONE_CONTRACT_ADDRESS || 'ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.satoshi-quest-tombstone',
    core: process.env.CORE_CONTRACT_ADDRESS || 'ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.satoshi-quest-core',
    loot: process.env.LOOT_CONTRACT_ADDRESS || 'ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.satoshi-quest-loot',
    resurrection: process.env.RESURRECTION_CONTRACT_ADDRESS || 'ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.satoshi-quest-resurrection',
  },
  
  chainhook: {
    endpoint: process.env.CHAINHOOK_ENDPOINT || 'https://api.testnet.chainhook.xyz',
    apiKey: process.env.CHAINHOOK_API_KEY || '',
    webhookSecret: process.env.CHAINHOOK_WEBHOOK_SECRET || '',
  },
  
  diaOracle: {
    url: process.env.DIA_ORACLE_URL || 'https://api.diadata.org',
    apiKey: process.env.DIA_API_KEY,
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'development_secret',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '14', 10),
  },
  
  websocket: {
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '20000', 10),
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000', 10),
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || '1000', 10),
  },
  
  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp'],
  },
  
  game: {
    maxTombstonesPerCharacter: parseInt(process.env.MAX_TOMBSTONES_PER_CHARACTER || '10', 10),
    resurrectionCooldownHours: parseInt(process.env.RESURRECTION_COOLDOWN_HOURS || '24', 10),
    leaderboardCacheTtl: parseInt(process.env.LEADERBOARD_CACHE_TTL || '300', 10), // 5 minutes
    statsUpdateInterval: parseInt(process.env.STATS_UPDATE_INTERVAL || '60000', 10), // 1 minute
  },
  
  apiDocs: {
    enabled: process.env.API_DOCS_ENABLED === 'true',
  },
  
  debug: {
    enabled: process.env.DEBUG_MODE === 'true',
    mockEvents: process.env.MOCK_BLOCKCHAIN_EVENTS === 'true',
  },
};

// Validate configuration
if (config.nodeEnv === 'production') {
  if (!config.contracts.tombstone) {
    console.warn('⚠️  Warning: Tombstone contract address not set in production');
  }
  if (!config.chainhook.apiKey) {
    console.warn('⚠️  Warning: Chainhook API key not set in production');
  }
  if (config.security.jwtSecret === 'development_secret') {
    throw new Error('JWT secret must be set to a secure value in production');
  }
}
