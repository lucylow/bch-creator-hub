/**
 * Logger utility for consistent error and debug logging
 * Can be extended to send logs to external services in production
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.isDevelopment && level === 'debug') {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    switch (level) {
      case 'error':
        console.error(`[${timestamp}] ERROR:`, message, logEntry);
        break;
      case 'warn':
        console.warn(`[${timestamp}] WARN:`, message, logEntry);
        break;
      case 'info':
        console.info(`[${timestamp}] INFO:`, message, logEntry);
        break;
      case 'debug':
        console.debug(`[${timestamp}] DEBUG:`, message, logEntry);
        break;
    }

    // In production, you could send errors to an external service
    // if (level === 'error' && !this.isDevelopment) {
    //   this.sendToErrorTracking(logEntry);
    // }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }
}

export const logger = new Logger();



