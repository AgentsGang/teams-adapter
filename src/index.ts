import express from 'express';
import { config } from './config/environment';
import { adapter } from './config/bot';
import { MessageProcessor } from './services/messageProcessor';
import { logger } from './utils/logger';

// Create Express server
const app = express();

// Middleware
app.use(express.json({ limit: config.limits.requestSizeLimit }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.server.environment
  });
});

app.post('/api/messages', async (req, res) => {
  const startTime = Date.now();
  
  logger.info('Incoming bot request', {
    userAgent: req.headers['user-agent'],
    contentLength: req.headers['content-length'],
    ip: req.ip
  });

  try {
    await adapter.process(req, res, async (context) => {
      await MessageProcessor.processMessage(context);
    });

    logger.performance('Request completed', Date.now() - startTime);

  } catch (error) {
    const err = error as any;
    logger.error('Adapter process error', {
      error: err && err.message ? err.message : String(error),
      stack: err && err.stack ? err.stack : undefined,
      duration: Date.now() - startTime
    });

    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Graceful shutdown handlers
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise)
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Start server
app.listen(config.server.port, () => {
  logger.info('Bot server started', {
    port: config.server.port,
    environment: config.server.environment,
    nodeVersion: process.version
  });
});

export default app;