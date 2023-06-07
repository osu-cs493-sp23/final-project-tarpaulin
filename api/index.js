const { Router } = require('express')
const router = Router()

// const { ValidationError } = require('sequelize')
// const { Assignment } = require('../models/assignment')
// const { Course } = require('../models/course')
// const { Submission } = require('../models/submission')
// const { User } = require('../models/user')

router.use('/assignments', require('./assignments'))
router.use('/courses', require('./courses'))
router.use('/submissions', require('./submissions'))
router.use('/users', require('./users'))

module.exports = router
