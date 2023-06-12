const { Router } = require('express')
const { ValidationError } = require('sequelize')

const { Assignment, AssignmentClientFields } = require('../models/assignment')

const router = Router()


// Post a new assignment
router.post('/', async function (req, res, next) {
    try {
      const assignment = await Assignment.create(req.body, AssignmentClientFields)
      res.status(201).send({ id: assignment.id })
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send({ error: e.message })
      } else {
        next(e)
      }
    }
})

// Get an assignment by ID
router.get('/:assignmentId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      const assignment = await Assignment.findByPk(assignmentId)
      if (assignment) {
        res.status(200).send(assignment)
      } else {
        next()
      }
    } catch (e) {
      next(e)
    }
})

// Patch an assignment
router.patch('/:assignmentId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      /*
       * Update assignment without allowing client to update businessId or userId.
       */
      const result = await Assignment.update(req.body, {
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
router.delete('/:assignmentId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      const result = await Assignment.destroy({ where: { id: assignmentId }})
      if (result > 0) {
        res.status(204).send()
      } else {
        next()
      }
    } catch (e) {
      next(e)
    }
})

// Get all submissions for an assignment, paginated, authenticated via instructorId
// router.get('/:assignmentId/submissions', async function (req, res, next) {
// })

// Post a new submission to an assignment, adds data to database, only student with role in courseId can submit
// router.post('/:assignmentId/submissions', async function (req, res, next) {
// })



module.exports = router
