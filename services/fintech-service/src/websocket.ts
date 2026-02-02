import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

let wss: WebSocketServer | null = null;

interface Client {
  ws: WebSocket;
  country?: string;
  subscriptions: Set<string>;
}

const clients: Map<string, Client> = new Map();

/**
 * Setup WebSocket server for real-time price updates
 */
export function setupWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const clientId = generateClientId();
    const client: Client = {
      ws,
      subscriptions: new Set(['prices']), // Default subscription
    };
    clients.set(clientId, client);

    logger.info({ clientId }, 'WebSocket client connected');

    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      message: 'Connected to GrandGold price feed',
      timestamp: new Date().toISOString(),
    }));

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(clientId, message);
      } catch (error) {
        logger.error({ clientId, error }, 'Invalid WebSocket message');
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      clients.delete(clientId);
      logger.info({ clientId }, 'WebSocket client disconnected');
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error({ clientId, error }, 'WebSocket error');
      clients.delete(clientId);
    });

    // Heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(heartbeat);
      }
    }, 30000);
  });

  logger.info('WebSocket server initialized');
}

/**
 * Handle incoming client messages
 */
function handleClientMessage(clientId: string, message: any): void {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'subscribe':
      // Subscribe to specific topics
      if (message.topics && Array.isArray(message.topics)) {
        message.topics.forEach((topic: string) => client.subscriptions.add(topic));
      }
      if (message.country) {
        client.country = message.country;
      }
      client.ws.send(JSON.stringify({
        type: 'subscribed',
        topics: Array.from(client.subscriptions),
        country: client.country,
      }));
      break;

    case 'unsubscribe':
      // Unsubscribe from topics
      if (message.topics && Array.isArray(message.topics)) {
        message.topics.forEach((topic: string) => client.subscriptions.delete(topic));
      }
      client.ws.send(JSON.stringify({
        type: 'unsubscribed',
        topics: message.topics,
      }));
      break;

    case 'ping':
      // Respond to ping
      client.ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;

    case 'setCountry':
      // Set client's country for filtered updates
      client.country = message.country;
      client.ws.send(JSON.stringify({
        type: 'countrySet',
        country: message.country,
      }));
      break;

    default:
      logger.warn({ clientId, messageType: message.type }, 'Unknown message type');
  }
}

/**
 * Broadcast price update to all connected clients
 */
export function broadcastPriceUpdate(data: {
  type: string;
  country: string;
  prices: Record<string, number>;
  currency: string;
  spotPriceUsd: number;
  timestamp: string;
}): void {
  const message = JSON.stringify(data);

  clients.forEach((client, clientId) => {
    // Check if client is subscribed to prices and country matches
    if (
      client.ws.readyState === WebSocket.OPEN &&
      client.subscriptions.has('prices') &&
      (!client.country || client.country === data.country)
    ) {
      try {
        client.ws.send(message);
      } catch (error) {
        logger.error({ clientId, error }, 'Failed to send price update');
      }
    }
  });
}

/**
 * Broadcast price lock expiry warning
 */
export function broadcastPriceLockWarning(userId: string, priceLockId: string, expiresIn: number): void {
  const message = JSON.stringify({
    type: 'price_lock_warning',
    priceLockId,
    expiresIn,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((client, clientId) => {
    if (
      client.ws.readyState === WebSocket.OPEN &&
      client.subscriptions.has('price_lock')
    ) {
      try {
        client.ws.send(message);
      } catch (error) {
        logger.error({ clientId, error }, 'Failed to send price lock warning');
      }
    }
  });
}

/**
 * Send message to specific user
 */
export function sendToUser(userId: string, message: object): void {
  // In production, you'd map user IDs to client IDs
  const messageStr = JSON.stringify(message);

  clients.forEach((client, clientId) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(messageStr);
      } catch (error) {
        logger.error({ clientId, error }, 'Failed to send message to user');
      }
    }
  });
}

/**
 * Get connected client count
 */
export function getClientCount(): number {
  return clients.size;
}

/**
 * Generate unique client ID
 */
function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
