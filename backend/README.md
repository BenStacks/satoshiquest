# Satoshi's Quest Backend API

Enterprise-grade backend service for Satoshi's Quest - a blockchain-based RPG game built on the Stacks blockchain. This backend handles real-time game events, chainhook integrations, player state management, and tombstone NFT processing.

## 🏗️ Architecture

```
├── src/
│   ├── config/           # Environment and service configurations
│   ├── controllers/      # Request handlers and business logic
│   ├── middleware/       # Express middleware (auth, validation, error handling)
│   ├── models/           # MongoDB data models (Player, Tombstone)
│   ├── routes/           # API route definitions
│   ├── services/         # Business services (WebSocket, Chainhook, Game State)
│   └── utils/            # Utilities and helpers
├── tests/                # Comprehensive test suite
├── docker/               # Docker configuration
└── docs/                 # API documentation
```

## 🚀 Features

### Core Features

- **Real-time WebSocket** communication for multiplayer gameplay
- **MongoDB** for persistent game data and player statistics
- **Redis** for caching and session management
- **Chainhook** integration for blockchain event processing
- **Swagger** API documentation
- **Enterprise logging** with Winston
- **Rate limiting** and security middleware

### Game Features

- Player state management (position, health, level, score)
- Death handling and tombstone creation
- Leaderboards (score, level, tombstones)
- Global game statistics
- Real-time event broadcasting

### Technical Features

- TypeScript for type safety
- Comprehensive test suite with Jest
- Docker containerization
- Environment-based configuration
- Error handling and validation
- API versioning

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- MongoDB 5.0+
- Redis 6.0+
- Docker (optional)

### Environment Setup

1. **Clone and Install**

```bash
git clone <repository-url>
cd backend
npm install
```

2. **Environment Configuration**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Required Environment Variables**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/satoshi-quest
REDIS_URL=redis://localhost:6379

# Server
NODE_ENV=development
PORT=3001
API_PREFIX=/api/v1

# Security
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000

# Chainhook
CHAINHOOK_URL=http://localhost:20456
CHAINHOOK_AUTH_TOKEN=your-auth-token

# External APIs
DIA_ORACLE_URL=https://api.diadata.org
BTC_PRICE_THRESHOLD=50000
```

### Development Setup

1. **Start Dependencies**

```bash
# Using Docker (recommended)
docker-compose up -d mongodb redis

# Or install locally
# MongoDB: https://docs.mongodb.com/manual/installation/
# Redis: https://redis.io/docs/getting-started/installation/
```

2. **Run Development Server**

```bash
npm run dev
```

3. **Available Endpoints**

- API: http://localhost:3001/api/v1
- Documentation: http://localhost:3001/api-docs
- Health: http://localhost:3001/health

## 📚 API Documentation

### Core Endpoints

#### Game Management

- `GET /api/v1/game/stats` - Global game statistics
- `GET /api/v1/game/leaderboard/:type` - Leaderboards (score, level, tombstones)
- `GET /api/v1/game/player/:address` - Get player data
- `POST /api/v1/game/player/:address/update` - Update player state
- `POST /api/v1/game/player/:address/death` - Handle player death
- `GET /api/v1/game/tombstones` - List tombstones (paginated)
- `GET /api/v1/game/tombstone/:tokenId` - Get specific tombstone

#### Player Management

- `GET /api/v1/players/:address` - Get player profile
- `GET /api/v1/players/:address/tombstones` - Get player's tombstones

#### Leaderboards

- `GET /api/v1/leaderboard/players` - Player leaderboard
- `GET /api/v1/leaderboard/tombstones` - Tombstone leaderboard

#### Admin

- `GET /api/v1/admin/stats` - System statistics
- `GET /api/v1/admin/players/top` - Top players
- `GET /api/v1/admin/tombstones/recent` - Recent deaths

#### System

- `GET /health` - Health check endpoint
- `POST /webhooks/chainhook` - Blockchain event webhook

### WebSocket Events

#### Client → Server

```typescript
// Join player room
socket.emit("join", { address: "SP..." });

// Update position
socket.emit("playerMove", {
  address: "SP...",
  position: { x: 100, y: 200 },
});
```

#### Server → Client

```typescript
// Player updates
socket.on("playerUpdate", (data) => {
  // Handle player state changes
});

// Death events
socket.on("playerDeath", (data) => {
  // Handle player death notifications
});

// Game events
socket.on("gameEvent", (data) => {
  // Handle general game events
});
```

## 🧪 Testing

### Test Suite Structure

```
tests/
├── setup.ts              # Test configuration and utilities
├── globalSetup.ts         # Global test setup
├── globalTeardown.ts      # Global test cleanup
├── game.test.ts          # Game API endpoint tests
├── models/               # Model unit tests
├── services/             # Service unit tests
└── integration/          # Integration tests
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# CI mode
npm run test:ci
```

### Test Configuration

- **Framework**: Jest with TypeScript
- **Database**: MongoDB Memory Server (in-memory)
- **HTTP Testing**: Supertest
- **Coverage**: Comprehensive coverage reporting

## 🐳 Docker

### Development

```bash
# Build image
docker build -t satoshiquest-backend .

# Run container
docker run -p 3001:3001 satoshiquest-backend

# Or use docker-compose
docker-compose up
```

### Production

```bash
# Build production image
docker build -f Dockerfile.prod -t satoshiquest-backend:prod .

# Run with environment
docker run -p 3001:3001 --env-file .env.prod satoshiquest-backend:prod
```

## 🔧 Configuration

### Database Models

#### Player Schema

```typescript
{
  walletAddress: string; // Stacks wallet address
  currentLevel: number; // Current game level
  currentScore: number; // Current session score
  currentPosition: {
    // Player position
    x: number;
    y: number;
  }
  currentHealth: number; // Current health (0-100)
  highestLevel: number; // Best level achieved
  totalScore: number; // Lifetime score
  deathCount: number; // Number of deaths
  lastActiveAt: Date; // Last activity timestamp
}
```

#### Tombstone Schema

```typescript
{
  playerAddress: string; // Player's wallet address
  tokenId: string; // NFT token ID (when minted)
  finalScore: number; // Score at death
  finalLevel: number; // Level at death
  deathPosition: {
    // Death location
    x: number;
    y: number;
  }
  killedBy: string; // What killed the player
  epitaph: string; // Tombstone inscription
  createdAt: Date; // Death timestamp
}
```

### Service Configuration

#### WebSocket Service

- Real-time event broadcasting
- Room-based messaging
- Connection management
- Automatic reconnection handling

#### Chainhook Service

- Blockchain event processing
- Transaction monitoring
- NFT mint detection
- Event validation and processing

#### Game State Service

- Cached statistics management
- Leaderboard updates
- Performance optimization
- Background data processing

## 📊 Monitoring & Logging

### Logging Configuration

```typescript
// Winston logger with structured logging
logger.info("Player action", {
  action: "levelUp",
  player: address,
  level: newLevel,
  timestamp: new Date(),
});
```

### Health Checks

- Database connectivity
- Redis connectivity
- External service availability
- System resource monitoring

### Metrics Collection

- API response times
- Error rates
- Active connections
- Database performance

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis configured
- [ ] SSL certificates installed
- [ ] Load balancer configured
- [ ] Monitoring enabled
- [ ] Backup strategy implemented

### Environment-Specific Configurations

#### Development

- Debug logging enabled
- Hot reloading
- Mock external services
- Local database

#### Staging

- Production-like environment
- Limited external service calls
- Performance testing
- Integration testing

#### Production

- Optimized logging
- External service integration
- Performance monitoring
- High availability

## 🔐 Security

### Security Features

- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- SQL injection prevention
- XSS protection

### Best Practices

- Environment variable management
- Secure session handling
- API key rotation
- Regular security audits
- Dependency vulnerability scanning

## 🤝 Contributing

### Development Workflow

1. Fork repository
2. Create feature branch
3. Implement changes with tests
4. Run test suite
5. Submit pull request

### Code Standards

- TypeScript strict mode
- ESLint + Prettier formatting
- Comprehensive test coverage
- JSDoc documentation
- Semantic versioning

### Commit Guidelines

```
feat: add player death handling
fix: resolve tombstone creation bug
docs: update API documentation
test: add leaderboard endpoint tests
```

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:

- Create GitHub issue
- Check documentation
- Review test examples
- Contact development team

---

**Built with ❤️ for the Stacks ecosystem**
