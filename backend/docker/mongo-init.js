// MongoDB initialization script
db = db.getSiblingDB('satoshi-quest');

// Create collections
db.createCollection('players');
db.createCollection('tombstones');

// Create indexes for better performance
db.players.createIndex({ "walletAddress": 1 }, { unique: true });
db.players.createIndex({ "totalScore": -1 });
db.players.createIndex({ "highestLevel": -1 });
db.players.createIndex({ "lastActiveAt": -1 });

db.tombstones.createIndex({ "tokenId": 1 }, { unique: true, sparse: true });
db.tombstones.createIndex({ "playerAddress": 1 });
db.tombstones.createIndex({ "finalScore": -1 });
db.tombstones.createIndex({ "finalLevel": -1 });
db.tombstones.createIndex({ "createdAt": -1 });

print('✅ MongoDB initialization completed for Satoshi Quest');
