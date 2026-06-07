import { Queue } from 'bullmq';
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // required by BullMQ
});

const connection = redis;

export const screenshotQueue = new Queue('screenshots', { connection });