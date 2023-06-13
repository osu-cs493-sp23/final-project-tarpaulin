const express = require('express');
const redis = require("redis");
const morgan = require('morgan');
const { verifyAuthTokenExists } = require('./auth.js')

const app = express();
// const port = process.env.PORT || 8000;

/*
 * Morgan is a popular request logger.
 */
app.use(morgan('redis'));

app.use(express.json());
app.use(express.static('public'));

const redisHost = process.env.REDIS_HOST || 'localhost'
const redisPort = process.env.REDIS_PORT || 6379
const redisClient = redis.createClient({
  url: `redis://${redisHost}:${redisPort}`
})
const rateLimitWindowMillis = 30000
const rateLimitUnauth = 10
const rateLimitAuth = 30

/*
  For requests made without a valid authentication token, your API should permit 10 requests/minute.  These requests should be rate-limited on a per-IP address basis.
  For requests made with a valid authentication token, your API should permit 30 requests per minute.  These requests should be rate-limited on a per-user basis.
*/

async function rateLimit(req, res, next) {
  console.log("=========== REDIS ==============")
  let tokenBucket
  try {

    tokenBucket = await redisClient.hGetAll(req.ip)
  } catch (e) {
    next()
    return
  }

  const rateLimitMaxRequests = verifyAuthTokenExists(req) ?
    rateLimitAuth : rateLimitUnauth
  const rateLimitRefreshRate = rateLimitMaxRequests/ rateLimitWindowMillis


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
exports.rateLimit = rateLimit

app.use(rateLimit)


// app.get('/', (req, res) => {
//   res.status(200).json({
//     timestamp: new Date().toString()
//   });
// });

// app.use('*', (req, res, next) => {
//   res.status(404).json({
//     err: "Path " + req.originalUrl + " does not exist"
//   });
// });

redisClient.connect()
redisClient.on('connect', function () {
  console.log(`== REDIS CONNECTED: host: ${redisHost} port: ${redisPort}`)
})


