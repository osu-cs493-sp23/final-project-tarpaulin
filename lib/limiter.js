const redis = require('redis');
const rateLimiter = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const { endpointUri, password } = require('../config').redis;

// const redisClient = redis.createClient(`redis://${endpointUri}`, { password });

const limiter = rateLimiter({
    max: 2,
    windowMs: 30000,
    message: "Too many attempts. Global limiter."
});

const authLimiter = rateLimiter({
    max: 5,
    windowMs: 30000,
    message: "Too many attempts. Authentication limiter."
});


module.exports = {
    limiter,
    authLimiter
}