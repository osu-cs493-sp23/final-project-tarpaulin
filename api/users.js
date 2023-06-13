const { Router, application } = require('express')
const { ValidationError } = require('sequelize')

const { Course, UserCourse } = require('../models/course')
const { User, UserClientFields, validateUser, getUserByEmail2 } = require('../models/user')
const router = Router()

const { generateAuthToken, requireAuthentication, getRole } = require("../lib/auth")
const { validateAgainstSchema } = require('../lib/validation')


EXCLUDE_ATTRIBUTES_LIST = ["createdAt", "updatedAt"]

// Create the first admin, debug only
router.post('/createAdmin', async function(req, res, next){
    try{
      const user = await User.create(req.body, UserClientFields)
      res.status(201).send({
        id: user.id
      })
    } catch (e){
      next(e)
    }
})



// Post a new user, only admins can create admin and instructors
// This route currently cant make 'student' accounts without a token
router.post('/', requireAuthentication, async function (req, res, next) {
    try {
      // const user = await User.create(req.body, UserClientFields)
      // res.status(201).send({ id: user.id })

      if (req.userRole === "admin") {
        const user = await User.create(req.body, UserClientFields)
        res.status(201).send({
          id: user.id
        })
      } else {
        if (req.body.role != "admin" && req.body.role != "instructor") {
          const user = await User.create(req.body)
          res.status(201).send({
            id: user.id
          })
        } else {
          res.status(403).send({
            error: "The request was not made by an authenticated User."
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
                error: "Invalid authentication credentials."
            })
          }
        }
          
      } catch (e) {
          next(e)
      }
  } else {
      res.status(400).send({
          error: "The request body was either not present or did not contain all of the required fields."
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

// app.use(limiter)


// Get an user by ID
// Return user data and a list of classes the user is enrolled in OR a list of classes an instructor is teaching
/*
 * If the User has the 'instructor' role, the response should include a list of the 
 * IDs of the Courses the User teaches (i.e. Courses whose `instructorId` field matches 
 * the ID of this User).
 * If the User has the 'student' role, the response should include a list of the IDs of 
 * the Courses the User is enrolled in.  Only an authenticated User whose ID matches the 
 * ID of the requested User can fetch this information.
 * Code 403: Request was not made by an authenticated User.
 * Code 404: Specified Course `id` not found.
 */
router.get('/:userId', async function (req, res, next) {
    const userId = parseInt(req.params.userId)

    try {
      const user = await User.findByPk(userId)
      if (user) {
        coursesList = getUserCourses(user, userId)
        console.log(coursesList)
        res.status(200).send({
          username: user.name,
          email: user.email,
          role: user.role,
          courses: coursesList
        })
      } else {
        console.log("User does not exist")
        next()
      }
    } catch (e) {
      next(e)
    }
})



async function getUserCourses(user, userId){                // findall parameters likely need to be adjusted
  role = user.role
  if(role === "student"){
    courses = await Course.findAll({
      include:{
        model: User,
        as: "users",
        where: ({id: userId}),
        through: {attributes: []},
        attributes: {exclude: EXCLUDE_ATTRIBUTES_LIST}
      }
    })
  } else if(role === "instructor"){
      courses = await Course.findAll({
        include: {
          model: User,
          as: "users",
          where: {id: instructorId},
          through: {attributes: []},
          attributes: {exclude: EXCLUDE_ATTRIBUTES_LIST}
        }
      })
  } else{
    courses = []
    return null
  }

  // console.log(courses)

  return courses
}


//////////// TESTING ///////////////

// router.get("/:userId", requireAuthentication, authLimiter, (req, res, next) => {
//   const userId = req.params.userId

//   try {
//     console.log(req.userRole)

//     if (req.userRole == "admin" || req.params.userId == req.userId) {
//       const user = User.findByPk(userId)
//       user.then(function(result) {
//         res.status(200).send(result)
//       })
//     } else {
//       res.status(404).send({
//         error: "Cannot access resource."
//       })
//     }
//   } catch (e) {
//     next(e)
//   }
// })

// router.use(limiter)




/////////////////////////////





module.exports = router
