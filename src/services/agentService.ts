import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { InputValidator } from '../middleware/validation';

export interface AgentRequest {
  input: string;
  agentId?: string;
  userId?: string;
  conversationType?: string;
}

export interface AgentResponse {
  response: string;
  success: boolean;
  error?: string;
}

export class AgentService {
  private static async makeRequest(payload: AgentRequest): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.agent.timeout);

    try {
      const response = await fetch(`${config.agent.engineUrl}/api/agents/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Api-Key ${config.agent.apiKey}`,
          'User-Agent': 'Teams-Bot/1.0'
        },
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  static async getResponse(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      // Validate and sanitize input
      const sanitizedInput = InputValidator.sanitizeInput(request.input);
      const validationResult = InputValidator.validateMessage(sanitizedInput);

      if (!validationResult.isValid) {
        return {
          success: false,
          response: validationResult.error || 'Invalid input',
          error: validationResult.error
        };
      }

      logger.info('Calling agent engine', {
        inputLength: sanitizedInput.length,
        agentId: request.agentId,
        userId: request.userId,
        conversationType: request.conversationType
      });

      const response = await this.makeRequest({
        ...request,
        input: sanitizedInput
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        logger.error('Agent engine error', {
          status: response.status,
          error: errorText,
          duration,
          userId: request.userId
        });

        return {
          success: false,
          response: this.getErrorMessage(response.status),
          error: `HTTP ${response.status}: ${errorText}`
        };
      }

      const responseData = await response.json();
      const data = responseData as any;
      const agentResponse = data.response;

      if (!agentResponse || typeof agentResponse !== 'string') {
        logger.error('Invalid agent response', { responseData: data, userId: request.userId });
        return {
          success: false,
          response: "I received an invalid response. Please try again.",
          error: 'Invalid response format'
        };
      }

      logger.performance('Agent request completed', duration, {
        responseLength: agentResponse.length,
        userId: request.userId
      });

      return {
        success: true,
        response: InputValidator.truncateResponse(agentResponse)
      };

    } catch (error) {
      const err = error as any;
      const duration = Date.now() - startTime;
      
      if (err && err.name === 'AbortError') {
        logger.warn('Agent request timeout', {
          duration,
          userId: request.userId,
          inputPreview: request.input.substring(0, 100)
        });
        return {
          success: false,
          response: "Your request is taking too long to process. Please try a simpler question.",
          error: 'Request timeout'
        };
      }

      logger.error('Agent service error', {
        error: err && err.message ? err.message : String(error),
        stack: err && err.stack ? err.stack : undefined,
        duration,
        userId: request.userId
      });

      return {
        success: false,
        response: "Sorry, I couldn't process your request due to a technical issue.",
        error: err && err.message ? err.message : String(error)
      };
    }
  }

  private static getErrorMessage(status: number): string {
    switch (status) {
      case 429:
        return "I'm currently handling too many requests. Please try again in a moment.";
      case 500:
      case 502:
      case 503:
        return "The AI service is temporarily unavailable. Please try again later.";
      case 401:
      case 403:
        return "I don't have permission to access the AI service right now.";
      default:
        return "I couldn't process your request right now. Please try again.";
    }
  }

  static extractAgentId(activity: any): string | undefined {
    if (!activity?.entities) return undefined;

    const mention = activity.entities.find((e: any) => 
      e.type === 'mention' && e.mentioned?.id
    );

    return mention?.mentioned?.id;
  }
}