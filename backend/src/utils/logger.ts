import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const errorStack = stack ? `\n${stack}` : '';
  return `[${timestamp}] ${level}: ${message}${metaString}${errorStack}`;
});

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    isProduction ? json() : combine(colorize({ all: true }), consoleFormat)
  ),
  defaultMeta: { service: 'restaurant-api' },
  transports: [
    new winston.transports.Console(),
  ],
});
