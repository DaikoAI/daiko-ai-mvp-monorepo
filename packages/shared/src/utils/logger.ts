// ログレベルの定義
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  HTTP = 3,
  DEBUG = 4,
}

// メタデータの型定義
export interface LogMetadata {
  [key: string]: any;
}

// ログエントリの型定義
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  service: string;
  message: string;
  metadata?: LogMetadata;
}

// ロガーの設定
export interface LoggerConfig {
  level?: LogLevel;
  service: string;
  enableTimestamp?: boolean;
  enableColors?: boolean;
  logToFile?: boolean;
  logPath?: string;
}

export class Logger {
  private config: Required<Omit<LoggerConfig, "logPath">>;
  private logPath?: string;

  constructor(config: LoggerConfig) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      service: config.service,
      enableTimestamp: config.enableTimestamp ?? true,
      enableColors: config.enableColors ?? true,
      logToFile: config.logToFile ?? false,
    };
    this.logPath = config.logPath;
  }

  private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
    if (level > this.config.level) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      service: this.config.service,
      message,
      metadata,
    };

    const formatted = this.formatLogEntry(entry);

    if (this.config.enableColors) {
      console.log(this.colorize(formatted, level));
    } else {
      console.log(formatted);
    }

    if (this.config.logToFile) {
      this.writeToFile(formatted);
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const parts: string[] = [];

    if (this.config.enableTimestamp) {
      parts.push(`[${entry.timestamp.toISOString()}]`);
    }

    parts.push(`[${LogLevel[entry.level]}]`);
    parts.push(`[${entry.service}]`);
    parts.push(entry.message);

    if (entry.metadata) {
      parts.push(JSON.stringify(entry.metadata, null, 2));
    }

    return parts.join(" ");
  }

  private colorize(message: string, level: LogLevel): string {
    const colors = {
      [LogLevel.ERROR]: "\x1b[31m", // Red
      [LogLevel.WARN]: "\x1b[33m", // Yellow
      [LogLevel.INFO]: "\x1b[36m", // Cyan
      [LogLevel.HTTP]: "\x1b[35m", // Magenta
      [LogLevel.DEBUG]: "\x1b[32m", // Green
    };

    const reset = "\x1b[0m";
    return `${colors[level]}${message}${reset}`;
  }

  private writeToFile(message: string): void {
    if (!this.logPath) return;

    try {
      const fs = require("fs");
      const path = require("path");
      const logFile = path.join(this.logPath, `${this.config.service}.log`);

      fs.appendFileSync(logFile, message + "\n");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  error(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  http(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.HTTP, message, metadata);
  }

  debug(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }
}

// シングルトンインスタンスを作成するファクトリ関数
const loggers: { [key: string]: Logger } = {};

export function createLogger(service: string, config?: Partial<Omit<LoggerConfig, "service">>): Logger {
  if (!loggers[service]) {
    loggers[service] = new Logger({
      service,
      ...config,
    });
  }
  return loggers[service];
}

// デフォルトのロガーインスタンス
export const defaultLogger = createLogger("default");
