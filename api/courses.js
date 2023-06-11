const { Router } = require('express')
const { ValidationError } = require('sequelize')
const { User, UserClientFields, validateUser } = require('../models/user')

const { Assignment } = require('../models/assignment')
const { Course, fields, courseClientFields } = require('../models/course')
const { requireAuthentication, getRole } = require('../lib/auth')

const router = Router()

/*
 * Link for all endpoints:    https://gist.github.com/robwhess/ec734c97a98868dbc1776718cd73b203
 */

// Post a new course
// Only an authenticated User with 'admin' role can create a new Course.
router.post('/', getRole, requireAuthentication, async function (req, res, next) {
    try {
      if (req.userRole == "admin") {
        const course = await Course.create(req.body, courseClientFields)

        if (course) {
          res.status(201).send({
            id: course.id
          })
        } else {
          res.status(400).send({
            error: "Invalid instructor."
          })
        }
      } else {
        res.status(400).send({
          error: "Invalid admin authorization."
        })
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send({ error: e.message })
      } else {
        next(e)
      }
    }
})

// Patch an course
router.patch('/:courseId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      /*
       * Update course without allowing client to update businessId or userId.
       */
      const result = await Course.update(req.body, {
        where: { id: assignmentId },
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
router.delete('/:courseId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      const result = await Course.destroy({ where: { id: assignmentId }})
      if (result > 0) {
        res.status(204).send()
      } else {
        next()
      }
    } catch (e) {
      next(e)
    }
})


// Course roster download
// Download a CSV formatted roster for a specific course
// id,name,email
router.get('/:courseId/roster', async function (req, res, next) {

})

// Get all courses
router.get("/", async function (req, res, next){
    const coursePerPage = 10

    
})

// Get an course by ID
router.get('/:courseId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      const course = await Course.findByPk(assignmentId)
      if (course) {
        res.status(200).send(course)
      } else {
        next()
      }
    } catch (e) {
      next(e)
    }
})

// Get all studnets enrolled in a course
router.get('/:courseId/students', async function (req, res, next) {

})

// Get all assignments in a course
router.get('/:courseId/assignments', async function (req, res, next) {
  
})

module.exports = router
