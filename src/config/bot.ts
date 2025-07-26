import { CloudAdapter, ConfigurationBotFrameworkAuthentication, ConfigurationServiceClientCredentialFactory } from 'botbuilder';
import { config } from './environment';
import { logger } from '../utils/logger';

// Bot Framework configuration
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: config.microsoft.appId,
  MicrosoftAppPassword: config.microsoft.appPassword,
  MicrosoftAppType: config.microsoft.appType,
  MicrosoftAppTenantId: config.microsoft.appTenantId
});

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(
  {},
  credentialsFactory
);

export const adapter = new CloudAdapter(botFrameworkAuthentication);

// Enhanced error handler
adapter.onTurnError = async (context, error) => {
  logger.error('Bot turn error', {
    error: error.message,
    stack: error.stack,
    userId: context.activity.from?.aadObjectId,
    activityId: context.activity.id,
    timestamp: new Date().toISOString()
  });
  
  try {
    await context.sendActivity('I encountered an error processing your request. Please try again.');
  } catch (sendError) {
    logger.error('Failed to send error message', { error: sendError });
  }
};