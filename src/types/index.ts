// Common type definitions for the Teams Bot

export interface BotActivity {
  type: string;
  id: string;
  timestamp: string;
  channelId: string;
  from: {
    id: string;
    name?: string;
    aadObjectId?: string;
  };
  recipient: {
    id: string;
    name?: string;
  };
  conversation: {
    id: string;
    conversationType?: 'personal' | 'groupChat' | 'channel';
  };
  text?: string;
  entities?: Array<{
    type: string;
    mentioned?: {
      id: string;
      name?: string;
    };
  }>;
  channelData?: {
    tenant?: {
      id: string;
    };
  };
}

export interface UserContext {
  userId: string;
  userName?: string;
  conversationType: string;
  isDirectMessage: boolean;
}

export interface ProcessingMetrics {
  startTime: number;
  duration?: number;
  success: boolean;
  error?: string;
}

export interface SecurityEvent {
  type: 'rate_limit' | 'invalid_input' | 'auth_failure' | 'suspicious_activity';
  userId?: string;
  ip?: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}