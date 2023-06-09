const { Router } = require('express')
const { ValidationError } = require('sequelize')

const { User, UserClientFields, validateUser } = require('../models/user')
const router = Router()

const { generateAuthToken, requireAuthentication, isAdminLoggedIn } = require("../lib/auth")


// Post a new user
router.post('/', async function (req, res, next) {
    try {
      const user = await User.create(req.body, UserClientFields)
      res.status(201).send({ id: user.id })
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send({ error: e.message })
      } else {
        next(e)
      }
    }
})

/*
 * Route to registered user to log in by sending their email address and password
 */
router.post('/login', async function (req, res, next) {
  if (req.body && req.body.email && req.body.password) {
      try {
          const authenticated = await validateUser(
              req.body.email,
              req.body.password
          )
          if (authenticated) {
              const token = generateAuthToken(req.body.email)
              res.status(200).send({
                  token: token
              })
          } else {
              res.status(401).send({
                  error: "Invalid authentication credentials"
              })
          }
      } catch (e) {
          next(e)
      }
  } else {
      res.status(400).send({
          error: "Request body requires `email` and `password`."
      })
  }

})


// Patch an user
router.patch('/:userId', async function (req, res, next) {
    const userId = req.params.userId
    try {
      /*
       * Update user without allowing client to update businessId or userId.
       */
      const result = await User.update(req.body, {
        where: { id: userId },
        fields: AssignmentClientFields.filter(
          field => field !== 'coursesId' && field !== 'userId' && field !== 'submissionsId'
        )
      })
      if (result[0] > 0) {
        res.status(204).send()
      } else {
        next()
      }
    } catch (e) {
      next(e)
    }
})

// Delete endpoint
router.delete('/:userId', async function (req, res, next) {
    const userId = req.params.userId
    try {
      const result = await User.destroy({ where: { id: userId }})
      if (result > 0) {
        res.status(204).send()
      } else {
        next()
      }
    } catch (e) {
      next(e)
    }
})


// Get an user by ID
// Return user data and a list of classes the user is enrolled in
router.get('/:userId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      const user = await User.findByPk(assignmentId)
      if (user) {
        res.status(200).send(user)
      } else {
        next()
      }
    } catch (e) {
      next(e)
    }
})

module.exports = router
