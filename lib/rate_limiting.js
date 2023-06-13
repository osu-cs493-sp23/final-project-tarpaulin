const express = require('express');
const redis = require("redis");
const morgan = require('morgan');
const { verifyAuthTokenExists } = require('./auth.js')

const app = express();
// const port = process.env.PORT || 8000;
// testing codespaces

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
// const redisClient = redis.createClient(redisPort, redisHost)
const rateLimitWindowMillis = 60000
const rateLimitUnauth = 10
const rateLimitAuth = 30

// const rateLimitMaxRequests = 2
// const rateLimitRefreshRate = rateLimitMaxRequests / rateLimitWindowMillis

/*
  For requests made without a valid authentication token, your API should permit 10 requests/minute.  These requests should be rate-limited on a per-IP address basis.
  For requests made with a valid authentication token, your API should permit 30 requests per minute.  These requests should be rate-limited on a per-user basis.
*/
// const rateLimitWindowMillis = 60000
// const invalidAuthLimit = 10
// const validAuthLimit = 30
// const invalidLimitRR = invalidAuthLimit / rateLimitWindowMillis
// const validLimitRR = validAuthLimit / rateLimitWindowMillis


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
  const rateLimitRefreshRate = maxRequests/ rateLimitWindowMillis


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

///////////////////// TESTING //////////////////////

// const rateLimiteMaxRequests2 = 4
// const rateLimitRefreshRate2 = rateLimiteMaxRequests2 / rateLimitWindowMillis

// exports.rateLimit2 = function (req, res, next) {
//   console.log("=========== REDIS 2 ==============")
//   let tokenBucket2
//   try {

//     tokenBucket2 = redisClient.hGetAll(req.ip)
//   } catch (e) {
//     next()
//     return
//   }

//   tokenBucket2 = {
//     tokens: parseFloat(tokenBucket2.tokens) || rateLimiteMaxRequests2,
//     last: parseInt(tokenBucket2.last) || Date.now()
//   }

//   const timestamp = Date.now()
//   const ellapsedMillis = timestamp - tokenBucket2.last
//   tokenBucket2.tokens += ellapsedMillis * rateLimitRefreshRate2
//   tokenBucket2.tokens = Math.min(tokenBucket2.tokens, rateLimiteMaxRequests2)
//   tokenBucket2.last = timestamp

//   if (tokenBucket2.tokens >= 1) {
//     tokenBucket2.tokens -= 1
//    redisClient.hSet(req.ip, [
//       [ "tokens", tokenBucket2.tokens ],
//       [ "last", tokenBucket2.last ]
//     ])
//     next()
//   } else {
//    redisClient.hSet(req.ip, [
//       [ "tokens", tokenBucket2.tokens ],
//       [ "last", tokenBucket2.last ]
//     ])
//     res.status(429).send({
//       error: "Too many requests per minute"
//     })
//   }
  
// }




////////////////////////////////////////////////////






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

redisClient.connect()
redisClient.on('connect', function () {
  console.log(`== REDIS CONNECTED: host: ${redisHost} port: ${redisPort}`)
})


