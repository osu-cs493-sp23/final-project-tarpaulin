const { Router } = require('express')
const { ValidationError } = require('sequelize')

const { User } = require('../models/user')
const router = Router()


// Post a new user
router.post('/', async function (req, res, next) {
    try {
      const user = await User.create(req.body, AssignmentClientFields)
      res.status(201).send({ id: user.id })
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send({ error: e.message })
      } else {
        next(e)
      }
    }
})

// Get an user by ID
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

// Patch an user
router.patch('/:userId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      /*
       * Update user without allowing client to update businessId or userId.
       */
      const result = await User.update(req.body, {
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
router.delete('/:userId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
      const result = await User.destroy({ where: { id: assignmentId }})
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