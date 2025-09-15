import mongoose, { Document, Schema } from 'mongoose';

/**
 * Player Model
 * Represents a game player with their statistics and achievements
 */

export interface IPlayer extends Document {
  address: string;
  username?: string;
  email?: string;
  totalScore: number;
  highestLevel: number;
  deepestFloor: number;
  gamesPlayed: number;
  totalPlayTime: number; // in seconds
  achievements: string[];
  tombstoneCount: number;
  resurrectionCount: number;
  isActive: boolean;
  lastActiveAt: Date;
  settings: {
    notifications: boolean;
    publicProfile: boolean;
    shareStatistics: boolean;
  };
  socialMedia?: {
    twitter?: string;
    discord?: string;
    github?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>({
  address: {
    type: String,
    required: true,
    unique: true,
    index: true,
    match: /^S[TP][A-Z0-9]{39}$/,
    uppercase: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/,
    index: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  totalScore: {
    type: Number,
    default: 0,
    min: 0,
    index: true,
  },
  highestLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true,
  },
  deepestFloor: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true,
  },
  gamesPlayed: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalPlayTime: {
    type: Number,
    default: 0,
    min: 0,
  },
  achievements: [{
    type: String,
    maxlength: 50,
  }],
  tombstoneCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  resurrectionCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true,
    },
    publicProfile: {
      type: Boolean,
      default: true,
    },
    shareStatistics: {
      type: Boolean,
      default: true,
    },
  },
  socialMedia: {
    twitter: {
      type: String,
      maxlength: 15,
      match: /^[a-zA-Z0-9_]+$/,
    },
    discord: {
      type: String,
      maxlength: 37, // Discord tag format
    },
    github: {
      type: String,
      maxlength: 39,
      match: /^[a-zA-Z0-9_-]+$/,
    },
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
  },
});

// Indexes for performance
PlayerSchema.index({ totalScore: -1 });
PlayerSchema.index({ highestLevel: -1 });
PlayerSchema.index({ gamesPlayed: -1 });
PlayerSchema.index({ createdAt: -1 });
PlayerSchema.index({ lastActiveAt: -1 });
PlayerSchema.index({ 'settings.publicProfile': 1, isActive: 1 });

// Virtual for average score
PlayerSchema.virtual('averageScore').get(function() {
  return this.gamesPlayed > 0 ? Math.round(this.totalScore / this.gamesPlayed) : 0;
});

// Virtual for rank (will be populated by aggregation queries)
PlayerSchema.virtual('rank').get(function() {
  return (this as any)._rank || null;
});

// Static methods
PlayerSchema.statics.findByAddress = function(address: string) {
  return this.findOne({ address: address.toUpperCase() });
};

PlayerSchema.statics.getLeaderboard = function(limit: number = 100, sortBy: string = 'totalScore') {
  const sortOptions: { [key: string]: 1 | -1 } = {};
  sortOptions[sortBy] = -1;
  
  return this.find({ 'settings.publicProfile': true, isActive: true })
    .sort(sortOptions)
    .limit(limit)
    .select('-email -settings.notifications -socialMedia');
};

PlayerSchema.statics.getPlayerStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        totalPlayers: { $sum: 1 },
        totalScore: { $sum: '$totalScore' },
        totalGames: { $sum: '$gamesPlayed' },
        totalPlayTime: { $sum: '$totalPlayTime' },
        averageLevel: { $avg: '$highestLevel' },
        averageScore: { $avg: '$totalScore' },
      }
    }
  ]);
  
  return stats[0] || {};
};

// Instance methods
PlayerSchema.methods.addAchievement = function(achievementId: string) {
  if (!this.achievements.includes(achievementId)) {
    this.achievements.push(achievementId);
    return this.save();
  }
  return Promise.resolve(this);
};

PlayerSchema.methods.updateGameStats = function(gameData: {
  score: number;
  level: number;
  floor: number;
  playTime: number;
}) {
  this.totalScore += gameData.score;
  this.gamesPlayed += 1;
  this.totalPlayTime += gameData.playTime;
  this.lastActiveAt = new Date();
  
  if (gameData.level > this.highestLevel) {
    this.highestLevel = gameData.level;
  }
  
  if (gameData.floor > this.deepestFloor) {
    this.deepestFloor = gameData.floor;
  }
  
  return this.save();
};

PlayerSchema.methods.incrementTombstones = function() {
  this.tombstoneCount += 1;
  return this.save();
};

PlayerSchema.methods.incrementResurrections = function() {
  this.resurrectionCount += 1;
  return this.save();
};

PlayerSchema.methods.updateActivity = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

// Pre-save middleware
PlayerSchema.pre('save', function(next) {
  // Ensure address is uppercase
  if (this.address) {
    this.address = this.address.toUpperCase();
  }
  
  // Normalize username
  if (this.username) {
    this.username = this.username.toLowerCase();
  }
  
  next();
});

// Pre-update middleware
PlayerSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function() {
  const update = this.getUpdate() as any;
  
  if (update.address) {
    update.address = update.address.toUpperCase();
  }
  
  if (update.username) {
    update.username = update.username.toLowerCase();
  }
  
  // Update lastActiveAt on any update
  update.lastActiveAt = new Date();
});

/**
 * Static methods
 */
PlayerSchema.statics.findByAddress = function(address: string) {
  return this.findOne({ walletAddress: address });
};

PlayerSchema.statics.getLeaderboard = function(limit: number = 100, sortBy: string = 'totalScore') {
  const sortField: any = {};
  sortField[sortBy] = -1;
  
  return this.find()
    .sort(sortField)
    .limit(limit)
    .select('walletAddress currentLevel totalScore highestLevel deathCount lastActiveAt')
    .exec();
};

PlayerSchema.statics.getPlayerStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalPlayers: { $sum: 1 },
        activePlayers: {
          $sum: {
            $cond: [
              {
                $gte: [
                  '$lastActiveAt',
                  new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                ]
              },
              1,
              0
            ]
          }
        },
        averageLevel: { $avg: '$currentLevel' },
        totalDeaths: { $sum: '$deathCount' },
        highestLevelReached: { $max: '$highestLevel' },
        totalScore: { $sum: '$totalScore' },
      }
    }
  ]);
};

PlayerSchema.statics.getTopPlayers = function(limit: number = 10) {
  return this.find()
    .sort({ totalScore: -1, highestLevel: -1 })
    .limit(limit)
    .select('walletAddress currentLevel totalScore highestLevel')
    .exec();
};

export const Player = mongoose.model<IPlayer>('Player', PlayerSchema);
