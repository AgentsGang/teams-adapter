import { config } from '../config/environment';
import { logger } from '../utils/logger';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class InputValidator {
  static validateMessage(message: string): ValidationResult {
    if (!message || message.trim().length === 0) {
      return { isValid: false, error: 'Empty message' };
    }

    if (message.length > config.limits.maxMessageLength) {
      logger.warn('Message too long', { 
        length: message.length, 
        maxLength: config.limits.maxMessageLength 
      });
      return { 
        isValid: false, 
        error: `Message is too long. Please keep it under ${config.limits.maxMessageLength} characters.` 
      };
    }

    return { isValid: true };
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove HTML-like content
      .trim()
      .substring(0, config.limits.maxMessageLength);
  }

  static validateUserId(userId?: string): boolean {
    return Boolean(userId && userId.length > 0);
  }

  static truncateResponse(response: string): string {
    if (response.length <= config.limits.maxResponseLength) {
      return response;
    }

    logger.warn('Response truncated', { 
      originalLength: response.length,
      maxLength: config.limits.maxResponseLength 
    });

    return response.substring(0, config.limits.maxResponseLength) + '\n\n[Response truncated]';
  }
}