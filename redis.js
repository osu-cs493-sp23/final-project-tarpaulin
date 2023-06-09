const express = require('express');
const redis = require("redis");
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 7000;


/*
 * Morgan is a popular request logger.
 */
app.use(morgan('redis'));

app.use(express.json());
app.use(express.static('public'));

const redisHost = process.env.REDIS_HOST || "localhost"
const redisPort = process.env.REDIS_PORT || "6379"
// const redisClient = redis.createClient({
//   url: `redis://${redisHost}:${redisPort}`
// })
const redisClient = redis.createClient(redisHost, redisPort)
const rateLimitWindowMillis = 60000
const rateLimitMaxRequests = 5
const rateLimitRefreshRate = rateLimitMaxRequests / rateLimitWindowMillis

async function rateLimit(req, res, next) {
  let tokenBucket
  try {
    tokenBucket = await redisClient.hGetAll(req.ip)
  } catch (e) {
    next()
    return
  }

  tokenBucket = {
    tokens: parseFloat(tokenBucket.tokens) || rateLimitMaxRequests,
    last: parseInt(tokenBucket.last) || Date.now()
  }

  const timestamp = Date.now()
  const ellapsedMillis = timestamp - tokenBucket.last
  tokenBucket.tokens += ellapsedMillis * rateLimitRefreshRate
  tokenBucket.tokens = Math.min(tokenBucket.tokens, rateLimitMaxRequests)
  tokenBucket.last = timestamp

  if (tokenBucket.tokens >= 1) {
    tokenBucket.tokens -= 1
    await redisClient.hSet(req.ip, [
      [ "tokens", tokenBucket.tokens ],
      [ "last", tokenBucket.last ]
    ])
    next()
  } else {
    await redisClient.hSet(req.ip, [
      [ "tokens", tokenBucket.tokens ],
      [ "last", tokenBucket.last ]
    ])
    res.status(429).send({
      error: "Too many requests per minute"
    })
  }
}

app.use(rateLimit)

app.get('/', (req, res) => {
  res.status(200).json({
    timestamp: new Date().toString()
  });
});

app.use('*', (req, res, next) => {
  res.status(404).json({
    err: "Path " + req.originalUrl + " does not exist"
  });
});

redisClient.connect().then(function () {
  app.listen(port, () => {
    console.log("== Server is running on port", port);
  });
})