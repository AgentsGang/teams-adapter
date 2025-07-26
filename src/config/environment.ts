import dotenv from 'dotenv';

dotenv.config();

interface AppConfig {
  microsoft: {
    appId: string;
    appPassword: string;
    appTenantId: string;
    appType: string;
  };
  agent: {
    apiKey: string;
    engineUrl: string;
    timeout: number;
  };
  server: {
    port: number;
    environment: string;
  };
  limits: {
    maxMessageLength: number;
    maxResponseLength: number;
    requestSizeLimit: string;
  };
}

// Validate required environment variables
const requiredEnvVars = [
  'MicrosoftAppId',
  'MicrosoftAppPassword', 
  'MicrosoftAppTenantId',
  'AGENTSGANG_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

export const config: AppConfig = {
  microsoft: {
    appId: process.env.MicrosoftAppId!,
    appPassword: process.env.MicrosoftAppPassword!,
    appTenantId: process.env.MicrosoftAppTenantId!,
    appType: 'SingleTenant'
  },
  agent: {
    apiKey: process.env.AGENTSGANG_API_KEY!,
    engineUrl: process.env.AGENT_ENGINE_URL || 'http://localhost:3000',
    timeout: parseInt(process.env.AGENT_TIMEOUT || '30000')
  },
  server: {
    port: parseInt(process.env.PORT || '3978'),
    environment: process.env.NODE_ENV || 'development'
  },
  limits: {
    maxMessageLength: 4000,
    maxResponseLength: 28000,
    requestSizeLimit: '100kb'
  }
};

export default config;