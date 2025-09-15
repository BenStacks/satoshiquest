import mongoose, { Document, Schema } from 'mongoose';

/**
 * Tombstone Model
 * Represents a tombstone NFT with game data and blockchain information
 */

export interface ITombstoneMetadata {
  characterName: string;
  finalLevel: number;
  finalScore: number;
  deepestFloor: number;
  deathCause: string;
  totalExperience: number;
  playTime: number; // in seconds
  burnedItemsCount: number;
  deathBlock: number;
  mintBlock: number;
  ownerAtDeath: string;
}

export interface ITombstone extends Document {
  tokenId: number;
  owner: string;
  metadata: ITombstoneMetadata;
  txId: string;
  blockHeight: number;
  contractAddress: string;
  mintedAt: Date;
  transferHistory: Array<{
    from: string;
    to: string;
    txId: string;
    blockHeight: number;
    timestamp: Date;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TombstoneMetadataSchema = new Schema({
  characterName: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 32,
    index: true,
  },
  finalLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    index: true,
  },
  finalScore: {
    type: Number,
    required: true,
    min: 0,
    index: true,
  },
  deepestFloor: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    index: true,
  },
  deathCause: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 128,
  },
  totalExperience: {
    type: Number,
    required: true,
    min: 0,
  },
  playTime: {
    type: Number,
    required: true,
    min: 0,
  },
  burnedItemsCount: {
    type: Number,
    required: true,
    min: 0,
  },
  deathBlock: {
    type: Number,
    required: true,
    min: 0,
  },
  mintBlock: {
    type: Number,
    required: true,
    min: 0,
  },
  ownerAtDeath: {
    type: String,
    required: true,
    match: /^S[TP][A-Z0-9]{39}$/,
    uppercase: true,
  },
}, { _id: false });

const TransferHistorySchema = new Schema({
  from: {
    type: String,
    required: true,
    match: /^S[TP][A-Z0-9]{39}$/,
    uppercase: true,
  },
  to: {
    type: String,
    required: true,
    match: /^S[TP][A-Z0-9]{39}$/,
    uppercase: true,
  },
  txId: {
    type: String,
    required: true,
    match: /^0x[0-9a-fA-F]{64}$/,
  },
  blockHeight: {
    type: Number,
    required: true,
    min: 0,
  },
  timestamp: {
    type: Date,
    required: true,
  },
}, { _id: false });

const TombstoneSchema = new Schema<ITombstone>({
  tokenId: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    index: true,
  },
  owner: {
    type: String,
    required: true,
    match: /^S[TP][A-Z0-9]{39}$/,
    uppercase: true,
    index: true,
  },
  metadata: {
    type: TombstoneMetadataSchema,
    required: true,
  },
  txId: {
    type: String,
    required: true,
    match: /^0x[0-9a-fA-F]{64}$/,
    index: true,
  },
  blockHeight: {
    type: Number,
    required: true,
    min: 0,
    index: true,
  },
  contractAddress: {
    type: String,
    required: true,
    match: /^S[TP][A-Z0-9]{39}$/,
    uppercase: true,
    index: true,
  },
  mintedAt: {
    type: Date,
    required: true,
    index: true,
  },
  transferHistory: [TransferHistorySchema],
  isActive: {
    type: Boolean,
    default: true,
    index: true,
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

// Compound indexes for efficient queries
TombstoneSchema.index({ owner: 1, 'metadata.characterName': 1 });
TombstoneSchema.index({ 'metadata.finalScore': -1, 'metadata.finalLevel': -1 });
TombstoneSchema.index({ 'metadata.characterName': 1, tokenId: 1 });
TombstoneSchema.index({ blockHeight: -1, mintedAt: -1 });
TombstoneSchema.index({ contractAddress: 1, tokenId: 1 });
TombstoneSchema.index({ isActive: 1, 'metadata.finalScore': -1 });

// Virtual for tombstone age
TombstoneSchema.virtual('age').get(function() {
  return Date.now() - this.mintedAt.getTime();
});

// Virtual for character tombstone rank
TombstoneSchema.virtual('characterRank').get(function() {
  return (this as any)._characterRank || null;
});

// Virtual for global rank
TombstoneSchema.virtual('globalRank').get(function() {
  return (this as any)._globalRank || null;
});

// Static methods
TombstoneSchema.statics.findByTokenId = function(tokenId: number) {
  return this.findOne({ tokenId, isActive: true });
};

TombstoneSchema.statics.findByOwner = function(owner: string, limit: number = 50) {
  return this.find({ owner: owner.toUpperCase(), isActive: true })
    .sort({ mintedAt: -1 })
    .limit(limit);
};

TombstoneSchema.statics.findByCharacter = function(characterName: string, limit: number = 10) {
  return this.find({ 
    'metadata.characterName': new RegExp(characterName, 'i'), 
    isActive: true 
  })
    .sort({ 'metadata.finalScore': -1 })
    .limit(limit);
};

TombstoneSchema.statics.getLeaderboard = function(limit: number = 100, sortBy: string = 'finalScore') {
  const sortField = `metadata.${sortBy}`;
  const sortOptions: { [key: string]: 1 | -1 } = {};
  sortOptions[sortField] = -1;
  
  return this.find({ isActive: true })
    .sort(sortOptions)
    .limit(limit);
};

TombstoneSchema.statics.getGlobalStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        totalTombstones: { $sum: 1 },
        highestLevel: { $max: '$metadata.finalLevel' },
        highestScore: { $max: '$metadata.finalScore' },
        deepestFloor: { $max: '$metadata.deepestFloor' },
        averageLevel: { $avg: '$metadata.finalLevel' },
        averageScore: { $avg: '$metadata.finalScore' },
        totalPlayTime: { $sum: '$metadata.playTime' },
        totalExperience: { $sum: '$metadata.totalExperience' },
        uniqueCharacters: { $addToSet: '$metadata.characterName' },
      }
    },
    {
      $project: {
        _id: 0,
        totalTombstones: 1,
        highestLevel: 1,
        highestScore: 1,
        deepestFloor: 1,
        averageLevel: { $round: ['$averageLevel', 2] },
        averageScore: { $round: ['$averageScore', 0] },
        totalPlayTime: 1,
        totalExperience: 1,
        uniqueCharacterCount: { $size: '$uniqueCharacters' },
      }
    }
  ]);
  
  return stats[0] || {};
};

TombstoneSchema.statics.getCharacterStats = function(characterName: string) {
  return this.aggregate([
    {
      $match: { 
        'metadata.characterName': new RegExp(characterName, 'i'),
        isActive: true 
      }
    },
    {
      $group: {
        _id: '$metadata.characterName',
        totalDeaths: { $sum: 1 },
        highestLevel: { $max: '$metadata.finalLevel' },
        highestScore: { $max: '$metadata.finalScore' },
        deepestFloor: { $max: '$metadata.deepestFloor' },
        averageLevel: { $avg: '$metadata.finalLevel' },
        averageScore: { $avg: '$metadata.finalScore' },
        totalPlayTime: { $sum: '$metadata.playTime' },
        totalExperience: { $sum: '$metadata.totalExperience' },
        owners: { $addToSet: '$owner' },
        tombstones: { $push: '$tokenId' },
      }
    },
    {
      $project: {
        _id: 0,
        characterName: '$_id',
        totalDeaths: 1,
        highestLevel: 1,
        highestScore: 1,
        deepestFloor: 1,
        averageLevel: { $round: ['$averageLevel', 2] },
        averageScore: { $round: ['$averageScore', 0] },
        totalPlayTime: 1,
        totalExperience: 1,
        uniqueOwnerCount: { $size: '$owners' },
        tombstoneIds: '$tombstones',
      }
    }
  ]);
};

TombstoneSchema.statics.getRecentTombstones = function(limit: number = 20) {
  return this.find({ isActive: true })
    .sort({ mintedAt: -1 })
    .limit(limit)
    .select('tokenId owner metadata.characterName metadata.finalLevel metadata.finalScore metadata.deathCause mintedAt');
};

// Instance methods
TombstoneSchema.methods.addTransfer = function(transfer: {
  from: string;
  to: string;
  txId: string;
  blockHeight: number;
  timestamp: Date;
}) {
  this.transferHistory.push({
    ...transfer,
    from: transfer.from.toUpperCase(),
    to: transfer.to.toUpperCase(),
  });
  
  this.owner = transfer.to.toUpperCase();
  return this.save();
};

TombstoneSchema.methods.getCharacterRank = async function() {
  const rank = await this.constructor.countDocuments({
    'metadata.characterName': this.metadata.characterName,
    'metadata.finalScore': { $gt: this.metadata.finalScore },
    isActive: true,
  });
  
  return rank + 1;
};

TombstoneSchema.methods.getGlobalRank = async function() {
  const rank = await this.constructor.countDocuments({
    'metadata.finalScore': { $gt: this.metadata.finalScore },
    isActive: true,
  });
  
  return rank + 1;
};

// Pre-save middleware
TombstoneSchema.pre('save', function(next) {
  // Ensure addresses are uppercase
  if (this.owner) {
    this.owner = this.owner.toUpperCase();
  }
  
  if (this.contractAddress) {
    this.contractAddress = this.contractAddress.toUpperCase();
  }
  
  if (this.metadata?.ownerAtDeath) {
    this.metadata.ownerAtDeath = this.metadata.ownerAtDeath.toUpperCase();
  }
  
  next();
});

/**
 * Static methods
 */
TombstoneSchema.statics.findByTokenId = function(tokenId: string) {
  return this.findOne({ tokenId });
};

TombstoneSchema.statics.findByAddress = function(address: string) {
  return this.find({ playerAddress: address }).sort({ createdAt: -1 });
};

TombstoneSchema.statics.getLeaderboard = function(limit: number = 100, sortBy: string = 'finalScore') {
  const sortField: any = {};
  sortField[sortBy] = -1;
  
  return this.find()
    .sort(sortField)
    .limit(limit)
    .select('playerAddress tokenId finalScore finalLevel epitaph createdAt')
    .exec();
};

TombstoneSchema.statics.getGlobalStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalTombstones: { $sum: 1 },
        averageFinalScore: { $avg: '$finalScore' },
        averageFinalLevel: { $avg: '$finalLevel' },
        highestScore: { $max: '$finalScore' },
        highestLevel: { $max: '$finalLevel' },
        recentDeaths: {
          $sum: {
            $cond: [
              {
                $gte: [
                  '$createdAt',
                  new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

TombstoneSchema.statics.getRecentTombstones = function(limit: number = 10) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('playerAddress tokenId finalScore finalLevel epitaph createdAt')
    .exec();
};

export const Tombstone = mongoose.model<ITombstone>('Tombstone', TombstoneSchema);
