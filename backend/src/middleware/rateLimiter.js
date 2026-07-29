import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../services/queue.js';

export const snapshotRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 10,

  keyGenerator: (req) => req.user.id,

  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),

  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many snapshot requests. You can take up to 10 screenshots per hour.',
    });
  },

  standardHeaders: true,
  legacyHeaders: false,
});

export const inviteRateLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: 30, // max 30 invites per user per hour
  keyGenerator: (req) => req.user.id,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many invite requests. Please try again in an hour.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});