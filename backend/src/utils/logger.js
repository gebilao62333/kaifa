const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const logDir = process.env.LOGS_PATH || config.paths.logs;

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'eudazi-peer-backend' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// 非生产环境 或 设置了 LOG_TO_CONSOLE=true（Docker 场景）时输出控制台
const logToConsole = config.nodeEnv !== 'production' || process.env.LOG_TO_CONSOLE === 'true';

if (logToConsole) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const ts = timestamp ? `[${timestamp}]` : '';
        const metaStr = Object.keys(meta).length > 1
          ? ' ' + JSON.stringify({ ...meta, service: undefined, timestamp: undefined })
          : '';
        return `${ts} ${level}: ${stack || message}${metaStr}`;
      })
    )
  }));
}

module.exports = logger;
