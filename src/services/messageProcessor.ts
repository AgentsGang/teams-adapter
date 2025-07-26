import { TurnContext, ActivityTypes } from 'botbuilder';
import { logger } from '../utils/logger';
import { InputValidator } from '../middleware/validation';
import { AgentService } from './agentService';
import { config } from '../config/environment';

export interface ConversationContext {
  type: string;
  isDirectMessage: boolean;
  isGroupChat: boolean;
  isChannel: boolean;
}

export class MessageProcessor {
  static getConversationContext(context: TurnContext): ConversationContext {
    const conversationType = context.activity.conversation?.conversationType;
    
    return {
      type: conversationType || 'unknown',
      isDirectMessage: conversationType === 'personal',
      isGroupChat: conversationType === 'groupChat',
      isChannel: conversationType === 'channel'
    };
  }

  static shouldProcessMessage(context: TurnContext, conversationContext: ConversationContext): { shouldProcess: boolean; cleanInput: string } {
    const message = context.activity.text?.trim() || '';

    if (conversationContext.isDirectMessage) {
      // In 1-1 chat, always process the message
      logger.debug('Direct message detected, processing');
      return {
        shouldProcess: true,
        cleanInput: message
      };
    }

    // In group chats/channels, only process if bot is mentioned
    const mentioned = context.activity.entities?.some(e => 
      e.type === 'mention' && 
      (e.mentioned?.name === 'Agent' || e.mentioned?.id === config.microsoft.appId)
    );

    if (mentioned) {
      logger.debug('Bot mentioned in group chat, processing');
      const input = TurnContext.removeRecipientMention(context.activity);
      return {
        shouldProcess: true,
        cleanInput: input?.trim() || ''
      };
    }

    logger.debug('Bot not mentioned in group chat, ignoring message');
    return {
      shouldProcess: false,
      cleanInput: ''
    };
  }

  static async processMessage(context: TurnContext): Promise<void> {
    const startTime = Date.now();

    try {
      // Only handle message activities
      if (context.activity.type !== ActivityTypes.Message) {
        logger.debug('Ignoring non-message activity', { 
          activityType: context.activity.type 
        });
        return;
      }

      const userId = context.activity.from?.aadObjectId;
      const userName = context.activity.from?.name;
      const conversationContext = this.getConversationContext(context);

      logger.info('Processing message', {
        userId,
        userName,
        conversationType: conversationContext.type,
        activityId: context.activity.id
      });

      // Check if we should process this message
      const { shouldProcess, cleanInput } = this.shouldProcessMessage(context, conversationContext);

      if (!shouldProcess) {
        return;
      }

      // Input validation
      const validationResult = InputValidator.validateMessage(cleanInput);
      if (!validationResult.isValid) {
        await context.sendActivity(validationResult.error || 'Invalid message format.');
        return;
      }

      logger.info('Processing user input', {
        userId,
        inputLength: cleanInput.length,
        conversationType: conversationContext.type
      });

      // Send typing indicator
      await context.sendActivity({ type: 'typing' });

      // Get AI response
      const agentResponse = await AgentService.getResponse({
        input: cleanInput,
        agentId: AgentService.extractAgentId(context.activity),
        userId,
        conversationType: conversationContext.type
      });

      if (agentResponse.success && agentResponse.response) {
        await context.sendActivity(agentResponse.response);
        
        logger.performance('Message processed successfully', Date.now() - startTime, {
          userId,
          responseLength: agentResponse.response.length
        });
      } else {
        await context.sendActivity(agentResponse.response || 'Sorry, I encountered an error.');
        
        logger.error('Agent response failed', {
          userId,
          error: agentResponse.error,
          duration: Date.now() - startTime
        });
      }

    } catch (error) {
      const err = error as any;
      logger.error('Message processing error', {
        error: err && err.message ? err.message : String(error),
        stack: err && err.stack ? err.stack : undefined,
        userId: context.activity.from?.aadObjectId,
        duration: Date.now() - startTime
      });

      try {
        await context.sendActivity('Sorry, I encountered an error processing your request. Please try again.');
      } catch (sendError) {
        logger.error('Failed to send error message', { error: sendError });
      }
    }
  }
}