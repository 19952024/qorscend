const WebSocket = require('ws');
const logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.heartbeatInterval = null;
    this.metricsInterval = null;
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', (ws, req) => {
      logger.info('WebSocket client connected');
      this.clients.add(ws);

      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to QORSCEND real-time service',
        timestamp: new Date().toISOString()
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          logger.error('WebSocket message parsing error:', error);
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    // Start heartbeat to keep connections alive
    this.startHeartbeat();
    
    // Start metrics broadcasting
    this.startMetricsBroadcast();
    
    // Start provider updates broadcasting
    this.startProviderUpdatesBroadcast();
    
    // Start simulated real-time updates for more dynamic data
    this.startSimulatedRealTimeUpdates();

    logger.info('WebSocket service initialized');
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        ws.subscriptions = data.subscriptions || [];
        ws.send(JSON.stringify({
          type: 'subscribed',
          subscriptions: ws.subscriptions,
          timestamp: new Date().toISOString()
        }));
        break;
      
      case 'unsubscribe':
        ws.subscriptions = [];
        ws.send(JSON.stringify({
          type: 'unsubscribed',
          timestamp: new Date().toISOString()
        }));
        break;
      
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;
      
      default:
        logger.warn('Unknown WebSocket message type:', data.type);
    }
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.broadcast({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      });
    }, 30000); // 30 seconds
  }

  startMetricsBroadcast() {
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.getLiveMetrics();
        this.broadcast({
          type: 'metrics_update',
          data: metrics,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error broadcasting metrics:', error);
      }
    }, 5000); // Increased frequency: every 5 seconds instead of 10
  }

  startProviderUpdatesBroadcast() {
    this.providerUpdatesInterval = setInterval(async () => {
      try {
        const { fetchProviderMetrics } = require('./providerService');
        const ProviderMetrics = require('../models/ProviderMetrics');
        
        // Fetch latest provider data
        const providers = await ProviderMetrics.find().sort({ lastUpdated: -1 }).limit(20);
        
        if (providers.length > 0) {
          this.broadcast({
            type: 'providers_update',
            data: { providers },
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        logger.error('Error broadcasting provider updates:', error);
      }
    }, 8000); // Every 8 seconds
  }

  startSimulatedRealTimeUpdates() {
    this.simulationInterval = setInterval(async () => {
      try {
        const ProviderMetrics = require('../models/ProviderMetrics');
        
        // Simulate real-time changes in queue times and availability
        const onlineBackends = await ProviderMetrics.find({ status: 'online' });
        
        for (const backend of onlineBackends) {
          // Simulate realistic queue time fluctuations based on current queue time
          let queueTimeChange = 0;
          if (backend.metrics.queueTime < 60) {
            // Short queues: small variations (±5 seconds)
            queueTimeChange = Math.floor(Math.random() * 10) - 5;
          } else if (backend.metrics.queueTime < 300) {
            // Medium queues: moderate variations (±15 seconds)
            queueTimeChange = Math.floor(Math.random() * 30) - 15;
          } else {
            // Long queues: larger variations (±30 seconds)
            queueTimeChange = Math.floor(Math.random() * 60) - 30;
          }
          
          const newQueueTime = Math.max(0, backend.metrics.queueTime + queueTimeChange);
          
          // Simulate realistic availability fluctuations (±1-3%)
          const availabilityChange = (Math.random() * 6) - 3;
          const newAvailability = Math.max(0, Math.min(100, backend.metrics.availability + availabilityChange));
          
          // Simulate small error rate variations (±0.1%)
          const errorRateChange = (Math.random() * 0.002) - 0.001;
          const newErrorRate = Math.max(0.001, Math.min(0.05, backend.metrics.errorRate + errorRateChange));
          
          // Update the metrics
          await ProviderMetrics.updateOne(
            { _id: backend._id },
            { 
              $set: {
                'metrics.queueTime': newQueueTime,
                'metrics.availability': newAvailability,
                'metrics.errorRate': newErrorRate,
                lastUpdated: new Date()
              }
            }
          );
        }
        
        // Broadcast the updated metrics
        const metrics = await this.getLiveMetrics();
        this.broadcast({
          type: 'metrics_update',
          data: metrics,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Error in simulated real-time updates:', error);
      }
    }, 4000); // Every 4 seconds for more responsive updates
  }

  async getLiveMetrics() {
    const { fetchProviderMetrics } = require('./providerService');
    const ProviderMetrics = require('../models/ProviderMetrics');

    try {
      // Fetch real metrics from database
      const totalBackends = await ProviderMetrics.countDocuments();
      const onlineBackends = await ProviderMetrics.countDocuments({ status: 'online' });
      
      const averageQueueTime = await ProviderMetrics.aggregate([
        { $match: { status: 'online' } },
        { $group: { _id: null, avg: { $avg: '$metrics.queueTime' } } }
      ]);

      const averageCost = await ProviderMetrics.aggregate([
        { $match: { status: 'online' } },
        { $group: { _id: null, avg: { $avg: '$metrics.costPerShot' } } }
      ]);

      const averageErrorRate = await ProviderMetrics.aggregate([
        { $match: { status: 'online' } },
        { $group: { _id: null, avg: { $avg: '$metrics.errorRate' } } }
      ]);

      return {
        avgQueueTime: averageQueueTime[0]?.avg || 0,
        avgCostPerShot: averageCost[0]?.avg || 0,
        avgErrorRate: averageErrorRate[0]?.avg || 0,
        totalBackends,
        activeBackends: onlineBackends,
        systemStatus: 'operational'
      };
    } catch (error) {
      logger.error('Error fetching live metrics:', error);
      // Return fallback data if database query fails
      return {
        avgQueueTime: Math.floor(Math.random() * 300) + 60,
        avgCostPerShot: Math.random() * 0.05 + 0.01,
        avgErrorRate: Math.random() * 0.02 + 0.001,
        totalBackends: 8,
        activeBackends: Math.floor(Math.random() * 3) + 15,
        systemStatus: 'operational'
      };
    }
  }

  broadcast(data) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(data));
        } catch (error) {
          logger.error('Error broadcasting to client:', error);
          this.clients.delete(client);
        }
      }
    });
  }

  broadcastToSubscribers(type, data) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && 
          client.subscriptions && 
          client.subscriptions.includes(type)) {
        try {
          client.send(JSON.stringify({
            type,
            data,
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          logger.error('Error broadcasting to subscriber:', error);
          this.clients.delete(client);
        }
      }
    });
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.providerUpdatesInterval) {
      clearInterval(this.providerUpdatesInterval);
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    if (this.wss) {
      this.wss.close();
    }
    logger.info('WebSocket service shutdown');
  }
}

module.exports = new WebSocketService(); 