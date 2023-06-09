const { Router } = require('express')
const { ValidationError } = require('sequelize')




const { Assignment } = require('../models/assignment')
const { Course, fields } = require('../models/course')

const router = Router()


/*
 * Link for all endpoints:    https://gist.github.com/robwhess/ec734c97a98868dbc1776718cd73b203
 */


// Get all courses
router.get("/", async function (req, res, next){
    const coursePerPage = 10

    
})




// Post a new course
router.post('/', async function (req, res, next) {
    try {
      const course = await Course.create(req.body, AssignmentClientFields)
      res.status(201).send({ id: course.id })
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send({ error: e.message })
      } else {
        next(e)
      }
    }
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


module.exports = router