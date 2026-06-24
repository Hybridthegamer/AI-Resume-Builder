// Cache service with Redis and in-memory fallback
let redisClient = null;
const memoryCache = new Map();
const memoryCacheExpiry = new Map();

const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log('REDIS_URL not set, using in-memory cache fallback');
    return;
  }
  try {
    const { createClient } = require('redis');
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => {
      console.warn('Redis client error, falling back to memory cache:', err.message);
      redisClient = null;
    });
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (err) {
    console.warn('Redis connection failed, using in-memory cache fallback:', err.message);
    redisClient = null;
  }
};

const get = async (key) => {
  try {
    if (redisClient) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    }
    // Memory fallback
    if (memoryCacheExpiry.has(key) && Date.now() > memoryCacheExpiry.get(key)) {
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
      return null;
    }
    return memoryCache.has(key) ? memoryCache.get(key) : null;
  } catch (err) {
    return null;
  }
};

const set = async (key, value, ttlSeconds = 3600) => {
  try {
    if (redisClient) {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      return;
    }
    // Memory fallback
    memoryCache.set(key, value);
    memoryCacheExpiry.set(key, Date.now() + ttlSeconds * 1000);
  } catch (err) {
    console.warn('Cache set error:', err.message);
  }
};

const del = async (key) => {
  try {
    if (redisClient) {
      await redisClient.del(key);
      return;
    }
    memoryCache.delete(key);
    memoryCacheExpiry.delete(key);
  } catch (err) {
    console.warn('Cache delete error:', err.message);
  }
};

const delPattern = async (pattern) => {
  try {
    if (redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return;
    }
    // Memory fallback: simple prefix match
    const prefix = pattern.replace('*', '');
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
        memoryCacheExpiry.delete(key);
      }
    }
  } catch (err) {
    console.warn('Cache delPattern error:', err.message);
  }
};

module.exports = { initRedis, get, set, del, delPattern };
