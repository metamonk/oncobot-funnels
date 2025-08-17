/**
 * Centralized logging configuration
 * Reduces log verbosity while maintaining useful information
 */

// Log levels
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5
}

// Get current log level from environment
const LOG_LEVEL = (process.env.LOG_LEVEL?.toUpperCase() as keyof typeof LogLevel) || 'INFO';
const currentLogLevel = LogLevel[LOG_LEVEL] ?? LogLevel.INFO;

// Static assets that should not be logged
const STATIC_ASSETS = [
  '/favicon.ico',
  '/manifest.webmanifest',
  '/apple-icon.png',
  '/robots.txt',
  '/sitemap.xml',
  '/_next',
  '/static'
];

// Sensitive patterns to mask
const SENSITIVE_PATTERNS = [
  /session[_-]?cookie[s]?\s*[:=]\s*([^\s]+)/gi,
  /authorization:\s*bearer\s+([^\s]+)/gi,
  /api[_-]?key[s]?\s*[:=]\s*([^\s]+)/gi,
  /token[s]?\s*[:=]\s*([^\s]+)/gi,
];

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Check if a path is a static asset
   */
  static isStaticAsset(path: string): boolean {
    return STATIC_ASSETS.some(asset => path.startsWith(asset));
  }

  /**
   * Mask sensitive data in logs
   */
  static maskSensitive(message: string): string {
    let masked = message;
    SENSITIVE_PATTERNS.forEach(pattern => {
      masked = masked.replace(pattern, (match, value) => {
        const key = match.substring(0, match.indexOf(value));
        return `${key}[MASKED]`;
      });
    });
    return masked;
  }

  /**
   * Truncate long strings
   */
  static truncate(str: string, maxLength: number = 100): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  }

  /**
   * Format duration for display
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * Log methods
   */
  trace(message: string, ...args: any[]): void {
    if (currentLogLevel <= LogLevel.TRACE) {
      console.log(`[TRACE] [${this.context}] ${Logger.maskSensitive(message)}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.log(`[DEBUG] [${this.context}] ${Logger.maskSensitive(message)}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (currentLogLevel <= LogLevel.INFO) {
      console.log(`[${this.context}] ${Logger.maskSensitive(message)}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(`[WARN] [${this.context}] ${Logger.maskSensitive(message)}`, ...args);
    }
  }

  error(message: string, error?: Error | unknown): void {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] [${this.context}] ${Logger.maskSensitive(message)}`, error);
    }
  }

  /**
   * Log HTTP request
   */
  static logRequest(method: string, path: string, status: number, duration: number): void {
    // Skip static assets unless in debug mode
    if (Logger.isStaticAsset(path) && currentLogLevel > LogLevel.DEBUG) {
      return;
    }

    const level = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    if (currentLogLevel <= level) {
      const message = `${method} ${path} ${status} in ${Logger.formatDuration(duration)}`;
      
      if (level === LogLevel.ERROR) {
        console.error(message);
      } else if (level === LogLevel.WARN) {
        console.warn(message);
      } else {
        console.log(message);
      }
    }
  }

  /**
   * Log feature toggles efficiently
   */
  static logFeatureToggles(enabledModes: string[], allModes?: string[]): void {
    if (currentLogLevel <= LogLevel.INFO) {
      if (enabledModes.length === 0) {
        console.log('[Feature Toggle] All modes disabled');
      } else if (allModes && enabledModes.length === allModes.length) {
        console.log('[Feature Toggle] All modes enabled');
      } else {
        console.log(`[Feature Toggle] Enabled: ${enabledModes.join(', ')}`);
      }
    }
  }

  /**
   * Log database query
   */
  static logDbQuery(query: string, params?: any[]): void {
    if (currentLogLevel <= LogLevel.DEBUG) {
      const truncatedQuery = Logger.truncate(query.replace(/\s+/g, ' ').trim(), 80);
      console.log(`[DB] ${truncatedQuery}`);
      
      if (currentLogLevel <= LogLevel.TRACE && params) {
        console.log('[DB] Params:', params);
      }
    }
  }
}

// Export singleton loggers for common contexts
export const middleware = new Logger('Middleware');
export const auth = new Logger('Auth');
export const api = new Logger('API');
export const db = new Logger('DB');
export const featureToggle = new Logger('FeatureToggle');