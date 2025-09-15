/**
 * Price Oracle Integration Example
 * 
 * This file shows how to integrate the price oracle service
 * into your main application to automatically feed DIA Oracle
 * price data to the resurrection smart contract.
 */

import express from 'express';
import { priceOracleService, createPriceRoutes } from './services/priceOracle';

const app = express();
app.use(express.json());

// Add price oracle routes
createPriceRoutes(app);

// Start the price oracle service when the server starts
const startServer = async () => {
  try {
    console.log('🚀 Starting Satoshi Quest Backend with Price Oracle...');
    
    // Start automatic price updates
    priceOracleService.startPriceUpdates();
    
    // Start Express server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📊 Price oracle active - feeding DIA Oracle data to smart contract`);
      console.log(`📡 Contract: ${process.env.RESURRECTION_CONTRACT_ADDRESS}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down gracefully...');
      priceOracleService.stopPriceUpdates();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const stats = await priceOracleService.getPriceStats();
    const isHealthy = stats.isRunning && (Date.now() - stats.lastUpdate) < 600000; // 10 minutes
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      priceOracle: {
        running: stats.isRunning,
        lastUpdate: new Date(stats.lastUpdate).toISOString(),
        currentPrice: stats.currentPrice
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// Start the server
startServer();

export default app;