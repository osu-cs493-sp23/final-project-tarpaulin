const { Router, application } = require('express')
const { ValidationError } = require('sequelize')

const { User, UserClientFields, validateUser, getUserByEmail2 } = require('../models/user')
const router = Router()

const { generateAuthToken, requireAuthentication, getRole } = require("../lib/auth")
const { validateAgainstSchema } = require('../lib/validation')
const { rateLimit } = require('../lib/rate_limiting')


// Post a new user

//Implemented in main, not in endpoints
// Only an authenticated User with 'admin' role can create users with the 'admin' or 'instructor' roles.
// router.post('/', getRole, async function (req, res, next) {
//   if (validateAgainstSchema(req.body, UserClientFields)) {
///////////////////////////////////////


// Post a new user, only admins can create admin and instructors
router.post('/', async function (req, res, next) {
    try {
      // const user = await User.create(req.body, UserClientFields)
      // res.status(201).send({ id: user.id })


      if (req.userRole == "admin") {
        const user = await User.create(req.body, UserClientFields)
        res.status(201).send({
          _id: user.id
        })
      } else {
        if (req.body.role != "admin" && req.body.role != "instructor") {
          const user = await User.create(req.body)
          res.status(201).send({
            _id: user.id
          })
        } else {
          res.status(403).send({
            error: "The request was not made by an authenticated user."
          })
        }
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send({ error: e.message })
      } else {
        next(e)
      }
    }
  }
    
})

/*
 * Route to registered user to log in by sending their email address and password
 */
router.post('/login', async function (req, res, next) {
  if (req.body && req.body.email && req.body.password) {
      try {
        const user = await getUserByEmail2(req.body.email)
        // console.log("== user: ", user)
        if(user) {
          const authenticated = await validateUser(
            req.body.email,
            req.body.password
        )
        if (authenticated) {
            const token = generateAuthToken(user)
            res.status(200).send({
                token: token
            })
        } else {
            res.status(401).send({
                error: "Invalid authentication credentials"
            })
          }
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


// Patch a user, admin only
// router.patch('/:userId', async function (req, res, next) {
//     const userId = req.params.userId
//     try {
//       /*
//        * Update user without allowing client to update businessId or userId.
//        */
//       const result = await User.update(req.body, {
//         where: { id: userId },
//         fields: AssignmentClientFields.filter(
//           field => field !== 'coursesId' && field !== 'userId' && field !== 'submissionsId'
//         )
//       })
//       if (result[0] > 0) {
//         res.status(204).send()
//       } else {
//         next()
//       }
//     } catch (e) {
//       next(e)
//     }
// })

// Delete endpoint - admin only
// router.delete('/:userId', async function (req, res, next) {
//     const userId = req.params.userId
//     try {
//       const result = await User.destroy({ where: { id: userId }})
//       if (result > 0) {
//         res.status(204).send()
//       } else {
//         next()
//       }
//     } catch (e) {
//       next(e)
//     }
// })


// Get an user by ID
// Return user data and a list of classes the user is enrolled in
router.get('/:userId', requireAuthentication, async function (req, res, next) {
    const userId = req.params.userId
    try {
      console.log(req.userRole)
      if (req.userRole == "admin" || req.params.userId == req.userId) {
        const user = await User.findByPk(userId)

        if (user) {
          res.status(200).send(user)
        } else {
          res.status(404).send({
            error: "User does not exist."
          })
        }
// Return user data and a list of classes the user is enrolled in OR a list of classes an instructor is teaching
// router.get('/:userId', async function (req, res, next) {
//     const userId = req.params.assignmentId
//     try {
//       const user = await User.findByPk(userId)
//       if (user) {
//         res.status(200).send(user)
//       } else {
//         res.status(403).send({
//           error: "Unauthorized attempt."
//         })
      }
    } catch (e) {
      next(e)
    }
})

module.exports = router
