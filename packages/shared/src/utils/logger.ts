import path from "path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

// ログレベルの定義
export type LogLevel = "error" | "warn" | "info" | "http" | "debug";

// メタデータの型定義
export interface LogMetadata {
  service?: string;
  correlationId?: string;
  userId?: string;
  [key: string]: any;
}

// ログフォーマットの設定
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// 開発環境用のコンソールフォーマット
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, correlationId, ...metadata } = info;
    let msg = `${timestamp || ""} [${level}]`;
    if (service) msg += ` [${service}]`;
    if (correlationId) msg += ` [${correlationId}]`;
    msg += `: ${message}`;

    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  }),
);

class Logger {
  private logger: winston.Logger;
  private defaultMetadata: LogMetadata;

  constructor(service: string) {
    this.defaultMetadata = { service };

    // ログファイルの保存先設定
    const logDir = process.env.LOG_DIR || "logs";
    const maxSize = process.env.LOG_MAX_SIZE || "10m";
    const maxFiles = process.env.LOG_MAX_FILES || "14d";

    // トランスポートの設定
    const transports: winston.transport[] = [
      // 開発環境用のコンソール出力
      new winston.transports.Console({
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        format: process.env.NODE_ENV === "production" ? logFormat : consoleFormat,
      }),
    ];

    // 本番環境の場合、ファイル出力を追加
    if (process.env.NODE_ENV === "production") {
      // 通常ログ
      transports.push(
        new DailyRotateFile({
          dirname: path.join(logDir, "app"),
          filename: "%DATE%.log",
          datePattern: "YYYY-MM-DD",
          maxSize,
          maxFiles,
          level: "info",
          format: logFormat,
        }),
      );

      // エラーログ
      transports.push(
        new DailyRotateFile({
          dirname: path.join(logDir, "error"),
          filename: "%DATE%.error.log",
          datePattern: "YYYY-MM-DD",
          maxSize,
          maxFiles,
          level: "error",
          format: logFormat,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      defaultMeta: this.defaultMetadata,
      transports,
    });
  }

  private log(level: LogLevel, message: string, metadata: LogMetadata = {}) {
    this.logger.log(level, message, {
      ...this.defaultMetadata,
      ...metadata,
    });
  }

  error(message: string, metadata: LogMetadata = {}) {
    this.log("error", message, metadata);
  }

  warn(message: string, metadata: LogMetadata = {}) {
    this.log("warn", message, metadata);
  }

  info(message: string, metadata: LogMetadata = {}) {
    this.log("info", message, metadata);
  }

  http(message: string, metadata: LogMetadata = {}) {
    this.log("http", message, metadata);
  }

  debug(message: string, metadata: LogMetadata = {}) {
    this.log("debug", message, metadata);
  }
}

// シングルトンインスタンスを作成するファクトリ関数
const loggers: { [key: string]: Logger } = {};

export function createLogger(service: string): Logger {
  if (!loggers[service]) {
    loggers[service] = new Logger(service);
  }
  return loggers[service];
}

// デフォルトのロガーインスタンス
export const defaultLogger = createLogger("default");

// 使用例:
/*
const logger = createLogger('UserService');

logger.info('User logged in', { userId: '123', action: 'login' });
logger.error('Failed to process payment', {
  userId: '123',
  error: new Error('Payment declined'),
  orderId: 'ORDER123'
});
*/
