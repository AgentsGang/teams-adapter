interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...context
    });
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('INFO', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('ERROR', message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }

  // Security-specific logging
  security(event: string, details: LogContext): void {
    this.warn(`SECURITY EVENT: ${event}`, details);
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`PERFORMANCE: ${operation}`, { 
      duration: `${duration}ms`,
      ...context 
    });
  }
}

export const logger = new Logger();